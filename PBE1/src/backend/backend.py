from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import os
import json
from dotenv import load_dotenv
import uuid
import time

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")

# In-memory storage (replaces Firebase)
memory_storage = {
    "users": {},  # Will store user data by session ID
    "sessions": {}  # Will track active sessions
}

# Load prompt templates
from prompt_templates import (
    ANALYSIS_PROMPT,
    PROFILE_CREATION_PROMPT,
    CAREER_SUGGESTION_PROMPT,
    RESOURCE_RECOMMENDATION_PROMPT,
    WEEKLY_PLAN_PROMPT,
    EXERCISE_PROMPT
)

# Load careers dataset
def load_careers_data():
    try:
        with open("../data/careers.json", "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading careers data: {e}")
        try:
            # Try alternative path
            with open("src/data/careers.json", "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e2:
            print(f"Error loading careers data (alternative path): {e2}")
            return {}

careers_data = load_careers_data()

@app.route('/get-session', methods=['GET'])
def get_session():
    """
    Creates or returns a session ID for anonymous usage
    """
    session_id = str(uuid.uuid4())
    memory_storage["sessions"][session_id] = {
        "created_at": time.time(),
        "last_active": time.time()
    }
    
    # Initialize user data
    memory_storage["users"][session_id] = {
        "chatHistory": [],
        "profile": {},
        "careerSuggestions": {},
        "resources": {},
        "plan": {}
    }
    
    return jsonify({
        "sessionId": session_id
    })

@app.route('/chat', methods=['POST'])
def chat():
    """
    Processes user responses and returns AI-generated questions
    """
    data = request.json
    session_id = data.get('sessionId')
    message = data.get('message')
    chat_history = data.get('chatHistory', [])
    
    # If no session, create placeholder
    if not session_id or session_id not in memory_storage["users"]:
        session_id = str(uuid.uuid4())
        memory_storage["users"][session_id] = {
            "chatHistory": chat_history,
            "profile": {},
            "careerSuggestions": {},
            "resources": {},
            "plan": {}
        }
    
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
        
        # Save chat history to memory storage
        memory_storage["users"][session_id]["chatHistory"] = chat_history
        
        # Return the AI message and updated chat history
        return jsonify({
            'message': ai_message,
            'chatHistory': chat_history,
            'questionNumber': len(chat_history) // 2,
            'completed': len(chat_history) // 2 >= 10,
            'sessionId': session_id
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/generate-profile', methods=['POST'])
def generate_profile():
    """
    Analyzes chat responses and generates a user profile
    """
    data = request.json
    session_id = data.get('sessionId')
    chat_history = data.get('chatHistory', [])
    
    # Check if session exists
    if not session_id or session_id not in memory_storage["users"]:
        return jsonify({'error': 'Invalid session ID'}), 400
    
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
        
        # Save profile to memory storage
        memory_storage["users"][session_id]["profile"] = profile_data
        
        return jsonify({
            'profile': profile_data,
            'sessionId': session_id
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
    session_id = data.get('sessionId')
    profile = data.get('profile', {})
    
    # Check if session exists
    if not session_id or session_id not in memory_storage["users"]:
        return jsonify({'error': 'Invalid session ID'}), 400
    
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
                    {"title": "Career 1", "match": "High", "details": suggestions_text},
                    {"title": "Career 2", "match": "Medium", "details": "Unable to parse structured data"},
                    {"title": "Career 3", "match": "Medium", "details": "Please check the raw API response"}
                ]
            }
        
        # Save suggestions to memory storage
        memory_storage["users"][session_id]["careerSuggestions"] = suggestions
        
        return jsonify({
            'suggestions': suggestions,
            'sessionId': session_id
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/recommend-resources', methods=['POST'])
def recommend_resources():
    """
    Recommends resources (books, courses, videos) based on chosen career path
    """
    data = request.json
    session_id = data.get('sessionId')
    career = data.get('career', '')
    profile = data.get('profile', {})
    
    # Check if session exists
    if not session_id or session_id not in memory_storage["users"]:
        return jsonify({'error': 'Invalid session ID'}), 400
    
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
                "books": [
                    {"title": "Book 1", "author": "Author 1", "why": "Relevant to your career path"},
                    {"title": "Book 2", "author": "Author 2", "why": "Builds fundamental skills"},
                    {"title": "Book 3", "author": "Author 3", "why": "Industry standard reference"}
                ],
                "courses": [
                    {"title": "Course 1", "platform": "Coursera", "level": "Beginner", "why": "Great introduction"},
                    {"title": "Course 2", "platform": "Udemy", "level": "Intermediate", "why": "Practical skills"},
                    {"title": "Course 3", "platform": "edX", "level": "Advanced", "why": "Advanced techniques"}
                ],
                "videos": [
                    {"title": "Video 1", "platform": "YouTube", "focus": "Overview", "why": "Clear explanation"},
                    {"title": "Video 2", "platform": "LinkedIn Learning", "focus": "Skills", "why": "Step-by-step tutorial"},
                    {"title": "Video 3", "platform": "TED Talks", "focus": "Inspiration", "why": "Motivation and vision"}
                ],
                "mentors": [
                    {"name": "Mentor 1", "field": career, "platform": "LinkedIn", "why": "Industry leader"},
                    {"name": "Mentor 2", "field": career, "platform": "Twitter", "why": "Educational content"},
                    {"name": "Mentor 3", "field": career, "platform": "Medium", "why": "Insightful articles"}
                ]
            }
        
        # Save resources to memory storage
        memory_storage["users"][session_id]["resources"] = resources
        
        return jsonify({
            'resources': resources,
            'sessionId': session_id
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/generate-exercise', methods=['POST'])
def generate_exercise():
    """
    Generates a practical exercise for skill development
    """
    data = request.json
    session_id = data.get('sessionId')
    career = data.get('career', '')
    profile = data.get('profile', {})
    
    # Check if session exists
    if not session_id or session_id not in memory_storage["users"]:
        return jsonify({'error': 'Invalid session ID'}), 400
    
    # Convert inputs to text for the AI prompt
    input_text = f"Career: {career}\nProfile: {json.dumps(profile, indent=2)}"
    
    try:
        # Use exercise prompt
        response = openai.ChatCompletion.create(
            model="gpt-4-turbo",
            messages=[{
                "role": "system", 
                "content": EXERCISE_PROMPT
            }, {
                "role": "user",
                "content": input_text
            }],
            temperature=0.7,
            max_tokens=1000
        )
        
        exercise_text = response.choices[0].message.content
        
        # Parse the exercise
        try:
            exercise = json.loads(exercise_text)
        except json.JSONDecodeError:
            # Fallback exercise if the response isn't valid JSON
            exercise = {
                "title": "Skill Development Exercise",
                "skill_focus": "Critical thinking and problem-solving",
                "description": f"A practical exercise to develop key skills for {career}",
                "steps": [
                    "Identify a specific problem in your field of interest",
                    "Research and gather relevant information",
                    "Analyze the problem from multiple perspectives",
                    "Develop 3 potential solutions",
                    "Evaluate each solution and select the best approach"
                ],
                "resources_needed": ["Internet access", "Note-taking tool", "1 hour of focused time"],
                "estimated_time": "1 hour",
                "difficulty": "Intermediate",
                "success_criteria": ["Thorough analysis", "Creative solutions", "Logical decision-making"],
                "reflection_questions": [
                    "What was most challenging about this exercise?",
                    "How can you apply these skills in a real-world scenario?",
                    "What additional knowledge would help you improve in this area?"
                ]
            }
        
        return jsonify({
            'exercise': exercise,
            'sessionId': session_id
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/load-session', methods=['GET'])
def load_session():
    """
    Loads session data
    """
    session_id = request.args.get('sessionId')
    
    if not session_id or session_id not in memory_storage["users"]:
        return jsonify({'exists': False})
    
    try:
        user_data = memory_storage["users"][session_id]
        return jsonify({
            'profile': user_data.get('profile', {}),
            'chatHistory': user_data.get('chatHistory', []),
            'careerSuggestions': user_data.get('careerSuggestions', {}),
            'resources': user_data.get('resources', {}),
            'plan': user_data.get('plan', {}),
            'sessionId': session_id,
            'exists': True
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000) 