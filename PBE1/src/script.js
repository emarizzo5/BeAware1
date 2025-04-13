// BeAware App - Main JavaScript (Simplified Version without Firebase)

// API endpoint (modify if deployed elsewhere)
const API_BASE_URL = 'http://localhost:5000';

// State Management
const appState = {
    sessionId: null,
    chatHistory: [],
    profile: null,
    careerSuggestions: null,
    selectedCareer: null,
    weeklyPlan: null,
    currentExercise: null,
    questionNumber: 0
};

// DOM Elements
const elements = {
    // Sections
    splashScreen: document.getElementById('splash-screen'),
    authSection: document.getElementById('auth-section'),
    app: document.getElementById('app'),
    chatSection: document.getElementById('chat-section'),
    profileSection: document.getElementById('profile-section'),
    careersSection: document.getElementById('careers-section'),
    planningSection: document.getElementById('planning-section'),
    exercisesSection: document.getElementById('exercises-section'),
    loadingOverlay: document.getElementById('loading-overlay'),
    
    // Auth elements are not used in simplified version
    
    // Chat elements
    chatMessages: document.getElementById('chat-messages'),
    chatForm: document.getElementById('chat-form'),
    chatInput: document.getElementById('chat-input'),
    questionCounter: document.getElementById('question-counter'),
    
    // Content areas
    profileContent: document.getElementById('profile-content'),
    careersContent: document.getElementById('careers-content'),
    planningContent: document.getElementById('planning-content'),
    exerciseContent: document.getElementById('exercise-content'),
    
    // Buttons
    startJourneyBtn: document.getElementById('start-journey'),
    getSuggestionsBtn: document.getElementById('get-suggestions-btn'),
    viewPlanBtn: document.getElementById('view-plan-btn'),
    exercisesBtn: document.getElementById('exercises-btn'),
    
    // Loading
    loadingText: document.getElementById('loading-text')
};

// Event Listeners
function setupEventListeners() {
    // Splash screen
    elements.startJourneyBtn.addEventListener('click', startJourney);
    
    // App navigation
    elements.getSuggestionsBtn.addEventListener('click', getCareerSuggestions);
    elements.viewPlanBtn.addEventListener('click', generateWeeklyPlan);
    elements.exercisesBtn.addEventListener('click', getExercises);
    
    // Chat interaction
    elements.chatForm.addEventListener('submit', handleChatSubmit);
}

// Initialize the app
async function initApp() {
    setupEventListeners();
    
    // Start the journey automatically
    setTimeout(() => {
        startJourney();
    }, 1500);
}

// Splash Screen
function startJourney() {
    elements.splashScreen.classList.add('opacity-0');
    setTimeout(() => {
        elements.splashScreen.classList.add('hidden');
        // Skip auth and show app directly
        showApp();
    }, 1000);
}

function showApp() {
    elements.app.classList.remove('hidden');
    startChat();
}

// Get a session ID for anonymous usage
async function getSessionId() {
    try {
        const response = await fetch(`${API_BASE_URL}/get-session`);
        const data = await response.json();
        appState.sessionId = data.sessionId;
        return data.sessionId;
    } catch (error) {
        console.error('Error getting session ID:', error);
        // Fallback to a random ID if server fails
        const fallbackId = 'local-' + Math.random().toString(36).substring(2, 15);
        appState.sessionId = fallbackId;
        return fallbackId;
    }
}

// Chat functionality
async function startChat() {
    // Get a session ID if we don't have one
    if (!appState.sessionId) {
        await getSessionId();
    }
    
    // Add a welcome message
    addMessageToChat('AI', 'Ciao! Sono qui per conoscerti meglio e aiutarti a trovare il tuo percorso. Iniziamo con una breve conversazione.');
    
    // Start the first question
    getNextQuestion();
}

function addMessageToChat(sender, message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-bubble chat-bubble-${sender.toLowerCase()} fade-in`;
    messageDiv.innerHTML = `<p>${message}</p>`;
    
    elements.chatMessages.appendChild(messageDiv);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

async function handleChatSubmit(e) {
    e.preventDefault();
    
    const message = elements.chatInput.value.trim();
    if (!message) return;
    
    // Add user message to chat
    addMessageToChat('user', message);
    
    // Clear input
    elements.chatInput.value = '';
    
    // Process response
    await getNextQuestion(message);
}

async function getNextQuestion(userMessage = null) {
    if (userMessage) {
        showLoading('Elaborazione della risposta...');
        
        try {
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: appState.sessionId,
                    message: userMessage,
                    chatHistory: appState.chatHistory
                })
            });
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Update app state
            appState.chatHistory = data.chatHistory;
            appState.questionNumber = data.questionNumber;
            if (data.sessionId) appState.sessionId = data.sessionId;
            
            // Add AI response to chat
            addMessageToChat('AI', data.message);
            
            // Update question counter
            updateQuestionCounter();
            
            // Check if chat is complete
            if (data.completed) {
                setTimeout(generateProfile, 1000);
            }
        } catch (error) {
            console.error('Error getting next question:', error);
            addMessageToChat('AI', 'Mi dispiace, c\'è stato un errore. Riprova per favore.');
        }
        
        hideLoading();
    } else {
        // First question
        try {
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: appState.sessionId,
                    message: 'Iniziamo la conversazione',
                    chatHistory: []
                })
            });
            
            const data = await response.json();
            
            // Update app state
            appState.chatHistory = data.chatHistory;
            appState.questionNumber = data.questionNumber;
            if (data.sessionId) appState.sessionId = data.sessionId;
            
            // Add AI response to chat
            addMessageToChat('AI', data.message);
            
            // Update question counter
            updateQuestionCounter();
        } catch (error) {
            console.error('Error getting first question:', error);
            addMessageToChat('AI', 'Mi dispiace, c\'è stato un errore nell\'avviare la conversazione. Ricarica la pagina per riprovare.');
        }
    }
}

function updateQuestionCounter() {
    elements.questionCounter.textContent = `Domanda ${appState.questionNumber} di 10`;
}

// Profile generation
async function generateProfile() {
    showLoading('Generazione del tuo profilo...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/generate-profile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sessionId: appState.sessionId,
                chatHistory: appState.chatHistory
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Update app state
        appState.profile = data.profile;
        if (data.sessionId) appState.sessionId = data.sessionId;
        
        // Display profile
        displayProfile();
    } catch (error) {
        console.error('Error generating profile:', error);
        alert('Si è verificato un errore nella generazione del profilo. Riprova.');
    }
    
    hideLoading();
}

function displayProfile() {
    // Hide chat section
    elements.chatSection.classList.add('hidden');
    
    // Show profile section
    elements.profileSection.classList.remove('hidden');
    
    // Render profile content
    const profile = appState.profile;
    elements.profileContent.innerHTML = '';
    
    if (profile) {
        // Cognitive Traits
        if (profile.traits && profile.traits.length) {
            const traitsSection = createProfileSection('Tratti Cognitivi', profile.traits);
            elements.profileContent.appendChild(traitsSection);
        }
        
        // Attitudes
        if (profile.attitudes && profile.attitudes.length) {
            const attitudesSection = createProfileSection('Attitudini', profile.attitudes);
            elements.profileContent.appendChild(attitudesSection);
        }
        
        // Blocks
        if (profile.blocks && profile.blocks.length) {
            const blocksSection = createProfileSection('Potenziali Blocchi', profile.blocks);
            elements.profileContent.appendChild(blocksSection);
        }
        
        // Ambitions
        if (profile.ambitions && profile.ambitions.length) {
            const ambitionsSection = createProfileSection('Ambizioni', profile.ambitions);
            elements.profileContent.appendChild(ambitionsSection);
        }
        
        // Interests
        if (profile.interests && profile.interests.length) {
            const interestsSection = createProfileSection('Interessi', profile.interests);
            elements.profileContent.appendChild(interestsSection);
        }
    } else {
        elements.profileContent.innerHTML = `
            <div class="text-center py-8">
                <p class="text-gray-600">Non è stato possibile generare il profilo. Riprova.</p>
            </div>
        `;
    }
}

function createProfileSection(title, items) {
    const section = document.createElement('div');
    section.className = 'profile-category';
    
    const heading = document.createElement('h3');
    heading.textContent = title;
    section.appendChild(heading);
    
    const list = document.createElement('div');
    items.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'profile-item';
        
        const bullet = document.createElement('div');
        bullet.className = 'profile-item-bullet';
        bullet.textContent = index + 1;
        
        const text = document.createElement('div');
        text.textContent = item;
        
        itemElement.appendChild(bullet);
        itemElement.appendChild(text);
        list.appendChild(itemElement);
    });
    
    section.appendChild(list);
    return section;
}

// Career suggestions
async function getCareerSuggestions() {
    showLoading('Analisi dei percorsi più adatti a te...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/suggest-career`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sessionId: appState.sessionId,
                profile: appState.profile
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Update app state
        appState.careerSuggestions = data.suggestions;
        if (data.sessionId) appState.sessionId = data.sessionId;
        
        // Display careers
        displayCareers();
    } catch (error) {
        console.error('Error getting career suggestions:', error);
        alert('Si è verificato un errore nell\'analisi dei percorsi. Riprova.');
    }
    
    hideLoading();
}

function displayCareers() {
    // Hide profile section
    elements.profileSection.classList.add('hidden');
    
    // Show careers section
    elements.careersSection.classList.remove('hidden');
    
    // Render career content
    const suggestions = appState.careerSuggestions;
    elements.careersContent.innerHTML = '';
    
    if (suggestions && suggestions.careers && suggestions.careers.length) {
        suggestions.careers.forEach(career => {
            const careerCard = createCareerCard(career);
            elements.careersContent.appendChild(careerCard);
        });
    } else {
        elements.careersContent.innerHTML = `
            <div class="col-span-3 text-center py-8">
                <p class="text-gray-600">Non sono stati trovati percorsi consigliati. Riprova.</p>
            </div>
        `;
    }
}

function createCareerCard(career) {
    const card = document.createElement('div');
    card.className = 'career-card slide-in';
    
    // Match class
    let matchClass = 'match-medium';
    if (career.match === 'High') {
        matchClass = 'match-high';
    } else if (career.match === 'Low') {
        matchClass = 'match-low';
    }
    
    card.innerHTML = `
        <div class="career-card-header">
            <h3 class="career-card-title">${career.title}</h3>
            <p class="text-sm">${career.field}</p>
            <span class="career-card-match ${matchClass}">${career.match} Match</span>
        </div>
        <div class="career-card-body space-y-3">
            <div>
                <h4 class="font-semibold text-sm">Perché è adatto a te:</h4>
                <ul class="text-sm list-disc list-inside">
                    ${career.match_reasons.map(reason => `<li>${reason}</li>`).join('')}
                </ul>
            </div>
            <div>
                <h4 class="font-semibold text-sm">Educazione consigliata:</h4>
                <p class="text-sm">${career.education.universities[0]}</p>
            </div>
            <div>
                <h4 class="font-semibold text-sm">Ruoli possibili:</h4>
                <p class="text-sm">${career.roles.join(', ')}</p>
            </div>
            <div class="mt-4">
                <button class="select-career-btn bg-indigo-100 text-indigo-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-200 transition-colors w-full" data-career="${career.title}">
                    Seleziona questo percorso
                </button>
            </div>
        </div>
    `;
    
    // Add event listener for career selection
    card.querySelector('.select-career-btn').addEventListener('click', (e) => {
        const careerTitle = e.target.getAttribute('data-career');
        selectCareer(careerTitle);
    });
    
    return card;
}

function selectCareer(careerTitle) {
    const career = appState.careerSuggestions.careers.find(c => c.title === careerTitle);
    if (career) {
        appState.selectedCareer = career;
        generateWeeklyPlan();
    }
}

// Weekly planning
async function generateWeeklyPlan() {
    showLoading('Creazione del tuo piano settimanale...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/recommend-resources`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sessionId: appState.sessionId,
                career: appState.selectedCareer ? appState.selectedCareer.title : '',
                profile: appState.profile
            })
        });
        
        const data = await response.json();
        
        displayPlan(data.resources);
    } catch (error) {
        console.error('Error generating weekly plan:', error);
        alert('Si è verificato un errore nella creazione del piano. Riprova.');
    }
    
    hideLoading();
}

function displayPlan(resources) {
    // Hide careers section
    elements.careersSection.classList.add('hidden');
    
    // Show planning section
    elements.planningSection.classList.remove('hidden');
    
    // Render plan content
    elements.planningContent.innerHTML = `
        <div class="mb-6">
            <h3 class="text-xl font-semibold text-indigo-700">Risorse Consigliate</h3>
            <p class="text-sm text-gray-600 mb-4">Queste risorse ti aiuteranno nel tuo percorso verso ${appState.selectedCareer ? appState.selectedCareer.title : 'la tua carriera'}</p>
            
            <div class="grid md:grid-cols-2 gap-4">
                <!-- Books -->
                <div class="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 class="font-semibold mb-2">Libri</h4>
                    <ul class="space-y-2">
                        ${resources.books.map(book => `
                            <li class="text-sm">
                                <span class="font-medium">${book.title}</span> di ${book.author}
                                <p class="text-xs text-gray-600">${book.why}</p>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                
                <!-- Courses -->
                <div class="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 class="font-semibold mb-2">Corsi</h4>
                    <ul class="space-y-2">
                        ${resources.courses.map(course => `
                            <li class="text-sm">
                                <span class="font-medium">${course.title}</span> (${course.platform})
                                <span class="text-xs inline-block bg-gray-100 px-2 rounded">${course.level}</span>
                                <p class="text-xs text-gray-600">${course.why}</p>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                
                <!-- Videos -->
                <div class="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 class="font-semibold mb-2">Video</h4>
                    <ul class="space-y-2">
                        ${resources.videos.map(video => `
                            <li class="text-sm">
                                <span class="font-medium">${video.title}</span> (${video.platform})
                                <p class="text-xs text-gray-600">${video.why}</p>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                
                <!-- Mentors -->
                <div class="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 class="font-semibold mb-2">Mentori da seguire</h4>
                    <ul class="space-y-2">
                        ${resources.mentors.map(mentor => `
                            <li class="text-sm">
                                <span class="font-medium">${mentor.name}</span> - ${mentor.field}
                                <p class="text-xs text-gray-600">Segui su: ${mentor.platform}</p>
                                <p class="text-xs text-gray-600">${mentor.why}</p>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        </div>
    `;
}

// Exercises
async function getExercises() {
    showLoading('Preparazione degli esercizi pratici...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/generate-exercise`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sessionId: appState.sessionId,
                career: appState.selectedCareer ? appState.selectedCareer.title : '',
                profile: appState.profile
            })
        });
        
        const data = await response.json();
        displayExercise(data.exercise);
    } catch (error) {
        console.error('Error getting exercises:', error);
        
        // Fallback to sample exercise
        const exercise = {
            title: "Analisi di Scenario Professionale",
            skill_focus: "Pensiero critico e problem-solving",
            description: `Un esercizio pratico per sviluppare competenze rilevanti per una carriera come ${appState.selectedCareer ? appState.selectedCareer.title : 'professionista'}`,
            steps: [
                "Identifica un problema reale nel tuo campo di interesse",
                "Ricerca e raccogli informazioni rilevanti",
                "Analizza il problema da diverse prospettive",
                "Proponi 3 possibili soluzioni con pro e contro",
                "Scegli la soluzione ottimale e giustifica la tua scelta"
            ],
            resources_needed: ["Accesso a internet", "Strumento per prendere appunti", "30-60 minuti di tempo"],
            estimated_time: "1 ora",
            difficulty: "Intermedio",
            success_criteria: ["Analisi completa del problema", "Soluzioni creative e realizzabili", "Giustificazione logica della scelta finale"],
            reflection_questions: [
                "Quale aspetto dell'esercizio hai trovato più difficile?",
                "Come potresti applicare questa competenza nel tuo percorso professionale?",
                "Quali altre risorse ti servirebbero per migliorare in quest'area?"
            ]
        };
        
        displayExercise(exercise);
    }
    
    hideLoading();
}

function displayExercise(exercise) {
    // Hide planning section
    elements.planningSection.classList.add('hidden');
    
    // Show exercises section
    elements.exercisesSection.classList.remove('hidden');
    
    // Render exercise content
    elements.exerciseContent.innerHTML = `
        <div class="mb-6">
            <h3 class="text-xl font-semibold text-indigo-700">${exercise.title}</h3>
            <div class="flex items-center mt-1 mb-4">
                <span class="text-sm font-medium bg-indigo-100 text-indigo-700 px-2 py-1 rounded">${exercise.skill_focus}</span>
                <span class="text-sm ml-2 text-gray-600">· Difficoltà: ${exercise.difficulty}</span>
                <span class="text-sm ml-2 text-gray-600">· Tempo: ${exercise.estimated_time}</span>
            </div>
            
            <p class="text-gray-700 mb-4">${exercise.description}</p>
            
            <div class="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                <h4 class="font-semibold mb-2">Passi da seguire</h4>
                <ol class="space-y-2">
                    ${exercise.steps.map((step, index) => `
                        <li class="exercise-step text-sm" data-step="${index + 1}">
                            ${step}
                        </li>
                    `).join('')}
                </ol>
            </div>
            
            <div class="grid md:grid-cols-2 gap-4">
                <div class="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 class="font-semibold mb-2">Risorse necessarie</h4>
                    <ul class="text-sm space-y-1">
                        ${exercise.resources_needed.map(resource => `<li>• ${resource}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 class="font-semibold mb-2">Criteri di successo</h4>
                    <ul class="text-sm space-y-1">
                        ${exercise.success_criteria.map(criterion => `<li>• ${criterion}</li>`).join('')}
                    </ul>
                </div>
            </div>
            
            <div class="mt-6 bg-indigo-50 p-4 rounded-lg">
                <h4 class="font-semibold mb-2">Domande di riflessione</h4>
                <p class="text-sm text-gray-600 mb-2">Dopo aver completato l'esercizio, rifletti su queste domande:</p>
                <ul class="text-sm space-y-2">
                    ${exercise.reflection_questions.map(question => `<li>• ${question}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
}

// Utility Functions
function showLoading(message) {
    elements.loadingText.textContent = message || 'Caricamento in corso...';
    elements.loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    elements.loadingOverlay.classList.add('hidden');
}

function resetAppState() {
    appState.chatHistory = [];
    appState.profile = null;
    appState.careerSuggestions = null;
    appState.selectedCareer = null;
    appState.weeklyPlan = null;
    appState.currentExercise = null;
    appState.questionNumber = 0;
    
    // Reset UI
    elements.chatMessages.innerHTML = '';
    elements.profileContent.innerHTML = '';
    elements.careersContent.innerHTML = '';
    elements.planningContent.innerHTML = '';
    elements.exerciseContent.innerHTML = '';
    elements.questionCounter.textContent = 'Domanda 0 di 10';
    
    // Show only chat section
    elements.profileSection.classList.add('hidden');
    elements.careersSection.classList.add('hidden');
    elements.planningSection.classList.add('hidden');
    elements.exercisesSection.classList.add('hidden');
    elements.chatSection.classList.remove('hidden');
}

// Start the app
document.addEventListener('DOMContentLoaded', initApp); 