from flask import Flask, request, jsonify
import json
import os
import openai
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Set your OpenAI API key
# In a real application, store this in an environment variable
openai.api_key = os.getenv("OPENAI_API_KEY", "your-api-key-here")  # Replace with environment variable or your key

# Load data from JSON file
def load_data():
    with open('data.json', 'r', encoding='utf-8') as file:
        return json.load(file)

# Route to get questions
@app.route('/api/questions', methods=['GET'])
def get_questions():
    data = load_data()
    return jsonify(data['questions'])

# Route to analyze user responses and generate profile
@app.route('/api/analyze', methods=['POST'])
def analyze_responses():
    # Get chat history from request
    chat_history = request.json.get('chat_history', [])
    
    if not chat_history:
        return jsonify({"error": "No chat history provided"}), 400
    
    try:
        # Extract user responses
        user_responses = [msg['text'] for msg in chat_history if msg['sender'] == 'user']
        
        # In a real application, send to OpenAI for analysis
        # Here's a mock implementation for now
        
        # Attempt to use OpenAI if API key is set
        if openai.api_key != "your-api-key":
            try:
                # Create a prompt for the OpenAI API
                prompt = "Analyze the following user responses to generate a personality profile:\n\n"
                for i, response in enumerate(user_responses):
                    prompt += f"Question {i+1}: {chat_history[i*2]['text']}\n"
                    prompt += f"Response {i+1}: {response}\n\n"
                
                prompt += "Based on these responses, generate:\n"
                prompt += "1. Three strengths\n"
                prompt += "2. Three areas to improve\n"
                prompt += "3. Three dominant cognitive traits\n"
                prompt += "4. Current state (motivation, clarity, readiness)\n"
                prompt += "5. Four key interests\n"
                prompt += "Format the response as a JSON object."
                
                # Call OpenAI API
                response = openai.Completion.create(
                    model="gpt-3.5-turbo-instruct",
                    prompt=prompt,
                    max_tokens=500,
                    temperature=0.7
                )
                
                # Parse the response
                try:
                    result = json.loads(response.choices[0].text.strip())
                    return jsonify(result)
                except json.JSONDecodeError:
                    # If parsing fails, use mock data
                    pass
            except Exception as e:
                print(f"OpenAI API error: {e}")
                # Continue to use mock data on error
        
        # Mock data if OpenAI is not available or fails
        mock_profile = {
            "strengths": [
                "Creatività e pensiero divergente",
                "Empatia e intelligenza emotiva",
                "Capacità di analisi e problem solving"
            ],
            "areasToImprove": [
                "Gestione del tempo e organizzazione",
                "Comunicazione assertiva",
                "Costanza e disciplina nei progetti"
            ],
            "cognitiveTraits": [
                "Pensiero visivo",
                "Orientamento ai dettagli",
                "Apprendimento esperienziale"
            ],
            "currentState": {
                "motivation": "Media-alta",
                "clarity": "In fase di esplorazione",
                "readiness": "Pronto per nuove sfide"
            },
            "interests": [
                "Tecnologia e innovazione",
                "Arte e design",
                "Psicologia e scienze comportamentali",
                "Sostenibilità ambientale"
            ]
        }
        
        return jsonify(mock_profile)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Route to generate career paths based on user profile
@app.route('/api/career-paths', methods=['POST'])
def generate_career_paths():
    # Get user profile from request
    user_profile = request.json.get('profile', {})
    
    if not user_profile:
        return jsonify({"error": "No user profile provided"}), 400
    
    try:
        # Load predefined career paths
        data = load_data()
        
        # In a real application, implement logic to match user profile with career paths
        # For now, just return the predefined paths
        return jsonify(data['careerPaths'])
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Route to get exercises for a specific career
@app.route('/api/exercises/<profession>', methods=['GET'])
def get_exercises(profession):
    try:
        data = load_data()
        
        # Filter exercises for the requested profession
        exercises = [ex for ex in data['exercises'] if ex['profession'] == profession]
        
        if not exercises:
            return jsonify({"message": "No exercises found for this profession"}), 404
            
        return jsonify(exercises)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True) 