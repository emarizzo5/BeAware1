from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import os
import json
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")

# Initialize Firebase
try:
    cred = credentials.Certificate(os.getenv("FIREBASE_SERVICE_ACCOUNT"))
    firebase_admin.initialize_app(cred)
    db = firestore.client()
except Exception as e:
    print(f"Firebase initialization error: {e}")

# Load prompt templates
from prompt_templates import (
    ANALYSIS_PROMPT,
    PROFILE_CREATION_PROMPT,
    CAREER_SUGGESTION_PROMPT,
    RESOURCE_RECOMMENDATION_PROMPT
)

# Load careers dataset
def load_careers_data():
    try:
        with open("data/careers.json", "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading careers data: {e}")
        return {}

careers_data = load_careers_data()

@app.route('/chat', methods=['POST'])
def chat():
    """
    Processes user responses and returns AI-generated questions
    """
    data = request.json
    user_id = data.get('userId')
    message = data.get('message')
    chat_history = data.get('chatHistory', [])
    
    # Update chat history
    chat_history.append({"role": "user", "content": message})
    
    # If this is the first question, generate an initial question
    if len(chat_history) <= 1:
        prompt = "You are a thoughtful career coach having a conversation with a user. Ask an insightful, socratic question to understand their interests, motivations, and personality. Make your question personal and thought-provoking."
    else:
        # Generate follow-up question based on history
        prompt = f"""You are a thoughtful career coach having a conversation with a user.
Based on their responses, ask the next thoughtful, socratic question to understand their:
- Personal motivations
- Values and priorities
- Skills and strengths
- Dreams and ambitions
- Challenges and obstacles

This is question {len(chat_history)//2 + 1} of 10. Make your question personal and thought-provoking.

Keep the question conversational and meaningful. DO NOT list multiple questions - ask only one focused question.
"""
    
    # Generate AI response
    chat_history.append({"role": "system", "content": prompt})
    
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4-turbo",
            messages=[{"role": msg["role"], "content": msg["content"]} for msg in chat_history],
            temperature=0.7,
            max_tokens=150
        )
        ai_message = response.choices[0].message.content
        
        # Update chat history with AI response
        chat_history.append({"role": "assistant", "content": ai_message})
        
        # Save chat history to database if user is authenticated
        if user_id:
            try:
                db.collection('users').document(user_id).set({
                    'chatHistory': chat_history
                }, merge=True)
            except Exception as e:
                print(f"Error saving chat history: {e}")
        
        # Return the AI message and updated chat history
        return jsonify({
            'message': ai_message,
            'chatHistory': chat_history,
            'questionNumber': len(chat_history) // 2,
            'completed': len(chat_history) // 2 >= 10
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/generate-profile', methods=['POST'])
def generate_profile():
    """
    Analyzes chat responses and generates a user profile
    """
    data = request.json
    user_id = data.get('userId')
    chat_history = data.get('chatHistory', [])
    
    # Extract just the conversation content
    conversation = []
    for msg in chat_history:
        if msg["role"] in ["user", "assistant"]:
            conversation.append(f"{msg['role'].capitalize()}: {msg['content']}")
    
    conversation_text = "\n".join(conversation)
    
    try:
        # Use the profile creation prompt to generate a profile
        response = openai.ChatCompletion.create(
            model="gpt-4-turbo",
            messages=[{
                "role": "system", 
                "content": PROFILE_CREATION_PROMPT
            }, {
                "role": "user",
                "content": f"Generate a profile based on this conversation:\n\n{conversation_text}"
            }],
            temperature=0.7,
            max_tokens=1000
        )
        
        profile_text = response.choices[0].message.content
        
        # Parse the profile into structured data
        try:
            profile_data = json.loads(profile_text)
        except json.JSONDecodeError:
            # If the response isn't valid JSON, try to extract structured data
            profile_data = {
                "traits": extract_section(profile_text, "Cognitive Traits"),
                "attitudes": extract_section(profile_text, "Attitudes"),
                "blocks": extract_section(profile_text, "Blocks"),
                "ambitions": extract_section(profile_text, "Ambitions"),
                "interests": extract_section(profile_text, "Interests")
            }
        
        # Save profile to database if user is authenticated
        if user_id:
            try:
                db.collection('users').document(user_id).set({
                    'profile': profile_data
                }, merge=True)
            except Exception as e:
                print(f"Error saving profile: {e}")
        
        return jsonify({
            'profile': profile_data
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def extract_section(text, section_name):
    """Helper function to extract sections from unstructured profile text"""
    lines = text.split('\n')
    section_data = []
    in_section = False
    
    for line in lines:
        if section_name in line:
            in_section = True
            continue
        elif in_section and any(s in line for s in ["Cognitive Traits", "Attitudes", "Blocks", "Ambitions", "Interests"]) and section_name not in line:
            in_section = False
        elif in_section and line.strip():
            # Remove bullet points and clean the line
            clean_line = line.strip().replace('- ', '').replace('• ', '')
            if clean_line:
                section_data.append(clean_line)
    
    return section_data

@app.route('/suggest-career', methods=['POST'])
def suggest_career():
    """
    Suggests career paths based on user profile
    """
    data = request.json
    user_id = data.get('userId')
    profile = data.get('profile', {})
    
    # Convert profile to text for the AI prompt
    profile_text = json.dumps(profile, indent=2)
    
    try:
        # Use career suggestion prompt to get recommended careers
        response = openai.ChatCompletion.create(
            model="gpt-4-turbo",
            messages=[{
                "role": "system", 
                "content": CAREER_SUGGESTION_PROMPT
            }, {
                "role": "user",
                "content": f"Suggest careers based on this profile:\n\n{profile_text}\n\nAvailable careers data: {json.dumps(careers_data)}"
            }],
            temperature=0.7,
            max_tokens=1500
        )
        
        suggestions_text = response.choices[0].message.content
        
        # Parse the suggestions
        try:
            suggestions = json.loads(suggestions_text)
        except json.JSONDecodeError:
            # Fallback to a simpler structure if the response isn't valid JSON
            suggestions = {
                "careers": [
                    {"name": "Career 1", "match": "High", "details": suggestions_text},
                    {"name": "Career 2", "match": "Medium", "details": "Unable to parse structured data"},
                    {"name": "Career 3", "match": "Medium", "details": "Please check the raw API response"}
                ]
            }
        
        # Save suggestions to database if user is authenticated
        if user_id:
            try:
                db.collection('users').document(user_id).set({
                    'careerSuggestions': suggestions
                }, merge=True)
            except Exception as e:
                print(f"Error saving career suggestions: {e}")
        
        return jsonify({
            'suggestions': suggestions
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/save-profile', methods=['POST'])
def save_profile():
    """
    Saves user profile to database
    """
    data = request.json
    user_id = data.get('userId')
    profile = data.get('profile', {})
    
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400
    
    try:
        db.collection('users').document(user_id).set({
            'profile': profile
        }, merge=True)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/load-profile', methods=['GET'])
def load_profile():
    """
    Loads existing user profile from database
    """
    user_id = request.args.get('userId')
    
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400
    
    try:
        doc = db.collection('users').document(user_id).get()
        if doc.exists:
            user_data = doc.to_dict()
            return jsonify({
                'profile': user_data.get('profile', {}),
                'chatHistory': user_data.get('chatHistory', []),
                'careerSuggestions': user_data.get('careerSuggestions', {})
            })
        else:
            return jsonify({'exists': False})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/recommend-resources', methods=['POST'])
def recommend_resources():
    """
    Recommends resources (books, courses, videos) based on chosen career path
    """
    data = request.json
    user_id = data.get('userId')
    career = data.get('career', '')
    profile = data.get('profile', {})
    
    # Convert inputs to text for the AI prompt
    input_text = f"Career: {career}\nProfile: {json.dumps(profile, indent=2)}"
    
    try:
        # Use resource recommendation prompt
        response = openai.ChatCompletion.create(
            model="gpt-4-turbo",
            messages=[{
                "role": "system", 
                "content": RESOURCE_RECOMMENDATION_PROMPT
            }, {
                "role": "user",
                "content": input_text
            }],
            temperature=0.7,
            max_tokens=1000
        )
        
        resources_text = response.choices[0].message.content
        
        # Parse the resources
        try:
            resources = json.loads(resources_text)
        except json.JSONDecodeError:
            # Fallback structure if the response isn't valid JSON
            resources = {
                "books": ["Book 1", "Book 2", "Book 3"],
                "courses": ["Course 1", "Course 2", "Course 3"],
                "videos": ["Video 1", "Video 2", "Video 3"],
                "mentors": ["Mentor 1", "Mentor 2", "Mentor 3"]
            }
        
        # Save resources to database if user is authenticated
        if user_id:
            try:
                db.collection('users').document(user_id).set({
                    'resources': resources
                }, merge=True)
            except Exception as e:
                print(f"Error saving resources: {e}")
        
        return jsonify({
            'resources': resources
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/save-plan', methods=['POST'])
def save_plan():
    """
    Saves user's weekly plan
    """
    data = request.json
    user_id = data.get('userId')
    plan = data.get('plan', {})
    
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400
    
    try:
        db.collection('users').document(user_id).set({
            'plan': plan
        }, merge=True)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/load-plan', methods=['GET'])
def load_plan():
    """
    Loads user's weekly plan
    """
    user_id = request.args.get('userId')
    
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400
    
    try:
        doc = db.collection('users').document(user_id).get()
        if doc.exists:
            user_data = doc.to_dict()
            return jsonify({
                'plan': user_data.get('plan', {})
            })
        else:
            return jsonify({'exists': False})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000) 