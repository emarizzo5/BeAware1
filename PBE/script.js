document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const startJourneyBtn = document.getElementById('start-journey');
    const sendResponseBtn = document.getElementById('send-response');
    const userResponseInput = document.getElementById('user-response');
    const chatMessages = document.getElementById('chat-messages');
    const proceedToOrientationBtn = document.getElementById('proceed-to-orientation');
    const proceedToToolsBtn = document.getElementById('proceed-to-tools');
    const sections = document.querySelectorAll('.screen');
    
    // App State
    const appState = {
        currentScreen: 'splash-screen',
        chatHistory: [],
        currentQuestionIndex: 0,
        userProfile: {
            strengths: [],
            areasToImprove: [],
            cognitiveTraits: [],
            currentState: {},
            interests: []
        },
        careerPaths: []
    };
    
    // Questions for the socratic chat
    const questions = [
        "Per iniziare, parlami un po' di te. Quali sono tre parole che useresti per descriverti?",
        "Qual è stata l'ultima cosa che ti ha entusiasmato veramente e perché?",
        "Quando ti senti più realizzato? In quali attività perdi completamente la cognizione del tempo?",
        "Cosa ti blocca più spesso nel raggiungere i tuoi obiettivi?",
        "Se potessi acquisire una nuova abilità in un istante, quale sceglieresti e perché?",
        "Come reagisci solitamente di fronte alle difficoltà o ai fallimenti?",
        "Quali sono i tuoi valori più importanti? Cosa ti guida nelle decisioni?",
        "Quali competenze vorresti sviluppare nei prossimi anni?",
        "Se potessi cambiare qualcosa del tuo percorso formativo passato, cosa cambieresti?",
        "Come immagini la tua vita ideale tra 5 anni? Cosa stai facendo, dove sei, come ti senti?"
    ];
    
    // Navigation Functions
    function navigateTo(screenId) {
        sections.forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
        appState.currentScreen = screenId;
    }
    
    // Chat Functions
    function addMessageToChat(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Save to chat history
        appState.chatHistory.push({ sender, text });
    }
    
    function askNextQuestion() {
        if (appState.currentQuestionIndex < questions.length) {
            setTimeout(() => {
                addMessageToChat(questions[appState.currentQuestionIndex], 'ai');
                userResponseInput.focus();
            }, 500);
        } else {
            // All questions answered, finalize chat
            setTimeout(() => {
                addMessageToChat("Grazie. Abbiamo raccolto abbastanza per iniziare a costruire il tuo profilo.", 'ai');
                setTimeout(() => {
                    generateUserProfile();
                    navigateTo('profile-section');
                }, 1500);
            }, 1000);
        }
    }
    
    // Profile Generation
    function generateUserProfile() {
        // In a real application, this would use AI to analyze the chat responses
        // For now, we'll use mock data
        
        // Mock strengths
        appState.userProfile.strengths = [
            "Creatività e pensiero divergente",
            "Empatia e intelligenza emotiva",
            "Capacità di analisi e problem solving"
        ];
        
        // Mock areas to improve
        appState.userProfile.areasToImprove = [
            "Gestione del tempo e organizzazione",
            "Comunicazione assertiva",
            "Costanza e disciplina nei progetti"
        ];
        
        // Mock cognitive traits
        appState.userProfile.cognitiveTraits = [
            "Pensiero visivo",
            "Orientamento ai dettagli",
            "Apprendimento esperienziale"
        ];
        
        // Mock current state
        appState.userProfile.currentState = {
            motivation: "Media-alta",
            clarity: "In fase di esplorazione",
            readiness: "Pronto per nuove sfide"
        };
        
        // Mock interests
        appState.userProfile.interests = [
            "Tecnologia e innovazione",
            "Arte e design",
            "Psicologia e scienze comportamentali",
            "Sostenibilità ambientale"
        ];
        
        // Populate the profile section
        displayUserProfile();
        
        // Generate career paths based on profile
        generateCareerPaths();
    }
    
    function displayUserProfile() {
        // Populate strengths
        const strengthsList = document.getElementById('strengths-list');
        appState.userProfile.strengths.forEach(strength => {
            const li = document.createElement('li');
            li.textContent = strength;
            strengthsList.appendChild(li);
        });
        
        // Populate areas to improve
        const areasList = document.getElementById('areas-list');
        appState.userProfile.areasToImprove.forEach(area => {
            const li = document.createElement('li');
            li.textContent = area;
            areasList.appendChild(li);
        });
        
        // Populate cognitive traits
        const traitsList = document.getElementById('traits-list');
        appState.userProfile.cognitiveTraits.forEach(trait => {
            const li = document.createElement('li');
            li.textContent = trait;
            traitsList.appendChild(li);
        });
        
        // Populate current state
        const stateContent = document.getElementById('state-content');
        const stateHtml = `
            <div class="state-item">
                <strong>Motivazione:</strong> ${appState.userProfile.currentState.motivation}
            </div>
            <div class="state-item">
                <strong>Chiarezza:</strong> ${appState.userProfile.currentState.clarity}
            </div>
            <div class="state-item">
                <strong>Prontezza:</strong> ${appState.userProfile.currentState.readiness}
            </div>
        `;
        stateContent.innerHTML = stateHtml;
        
        // Populate interests map (simple list for now)
        const interestsMap = document.getElementById('interests-map');
        interestsMap.innerHTML = `
            <div class="interests-list">
                ${appState.userProfile.interests.map(interest => `<div class="interest-tag">${interest}</div>`).join('')}
            </div>
        `;
    }
    
    // Career Path Generation
    function generateCareerPaths() {
        // In a real application, this would use AI to generate personalized paths
        // For now, we'll use mock data for three career paths
        
        appState.careerPaths = [
            {
                title: "User Experience Designer",
                university: "Politecnico di Milano",
                alternatives: ["IUAV Venezia", "ISIA Roma"],
                courses: ["Design della Comunicazione", "Interaction Design", "Human-Computer Interaction"],
                subjects: ["UI/UX Design", "Psicologia Cognitiva", "Prototipazione"],
                jobOpportunities: ["UX Designer", "Product Designer", "Interaction Designer"],
                masters: ["Master in Service Design", "Master in Digital Experience Design"],
                lifestyle: "Lavoro creativo in studi di design o aziende tech, possibilità di remote working, ambiente dinamico e collaborativo",
                inspirationalFigure: {
                    name: "Don Norman",
                    description: "Pioniere del design centrato sull'utente e autore di 'La caffettiera del masochista'"
                },
                virtualMentor: {
                    name: "Mike Monteiro",
                    platform: "Twitter/Medium",
                    focus: "Design ethics and professional practices"
                }
            },
            {
                title: "Data Scientist",
                university: "Università di Bologna",
                alternatives: ["Università di Padova", "Università di Milano Bicocca"],
                courses: ["Informatica", "Data Science", "Statistica"],
                subjects: ["Machine Learning", "Analisi dei Dati", "Programmazione Python/R"],
                jobOpportunities: ["Data Scientist", "Data Analyst", "Machine Learning Engineer"],
                masters: ["Master in Big Data Analytics", "Master in Artificial Intelligence"],
                lifestyle: "Lavoro analitico in aziende tech o consulenza, possibilità di smart working, focus sulla risoluzione di problemi complessi",
                inspirationalFigure: {
                    name: "Hilary Mason",
                    description: "Data scientist, fondatrice di Fast Forward Labs e pioniera nell'applicazione pratica della data science"
                },
                virtualMentor: {
                    name: "Andrew Ng",
                    platform: "Coursera",
                    focus: "Machine learning and AI fundamentals"
                }
            },
            {
                title: "Environmental Sustainability Consultant",
                university: "Università di Trento",
                alternatives: ["Università Ca' Foscari Venezia", "Università di Torino"],
                courses: ["Scienze Ambientali", "Economia e Gestione dell'Ambiente", "Ingegneria Ambientale"],
                subjects: ["Economia Circolare", "Politiche Ambientali", "Gestione Risorse Naturali"],
                jobOpportunities: ["Sustainability Consultant", "Environmental Manager", "CSR Specialist"],
                masters: ["Master in Circular Economy", "Master in Sustainable Development"],
                lifestyle: "Consulenza per aziende e organizzazioni, possibilità di lavoro sul campo, contributo a progetti con impatto positivo sull'ambiente",
                inspirationalFigure: {
                    name: "Janine Benyus",
                    description: "Biologa e innovatrice, pioniera della biomimetica come approccio alla sostenibilità"
                },
                virtualMentor: {
                    name: "Kate Raworth",
                    platform: "TED/Publications",
                    focus: "Doughnut Economics and sustainable business models"
                }
            }
        ];
        
        // Populate the paths section
        displayCareerPaths();
    }
    
    function displayCareerPaths() {
        const pathsList = document.getElementById('paths-list');
        pathsList.innerHTML = ''; // Clear existing content
        
        appState.careerPaths.forEach(path => {
            const pathCard = document.createElement('div');
            pathCard.classList.add('path-card');
            
            // Path header
            const pathHeader = document.createElement('div');
            pathHeader.classList.add('path-header');
            pathHeader.innerHTML = `
                <h3>${path.title}</h3>
                <span class="match-percentage">85% match</span>
            `;
            
            // Path content
            const pathContent = document.createElement('div');
            pathContent.classList.add('path-content');
            
            // University section
            const uniSection = document.createElement('div');
            uniSection.classList.add('path-section');
            uniSection.innerHTML = `
                <h4>Università target</h4>
                <p>${path.university}</p>
                <p><small>Alternative: ${path.alternatives.join(', ')}</small></p>
            `;
            
            // Courses section
            const coursesSection = document.createElement('div');
            coursesSection.classList.add('path-section');
            coursesSection.innerHTML = `
                <h4>Corsi consigliati</h4>
                <ul>
                    ${path.courses.map(course => `<li>${course}</li>`).join('')}
                </ul>
            `;
            
            // Subjects section
            const subjectsSection = document.createElement('div');
            subjectsSection.classList.add('path-section');
            subjectsSection.innerHTML = `
                <h4>Materie principali</h4>
                <ul>
                    ${path.subjects.map(subject => `<li>${subject}</li>`).join('')}
                </ul>
            `;
            
            // Job opportunities section
            const jobsSection = document.createElement('div');
            jobsSection.classList.add('path-section');
            jobsSection.innerHTML = `
                <h4>Sbocchi lavorativi</h4>
                <ul>
                    ${path.jobOpportunities.map(job => `<li>${job}</li>`).join('')}
                </ul>
            `;
            
            // Masters section
            const mastersSection = document.createElement('div');
            mastersSection.classList.add('path-section');
            mastersSection.innerHTML = `
                <h4>Possibili master futuri</h4>
                <ul>
                    ${path.masters.map(master => `<li>${master}</li>`).join('')}
                </ul>
            `;
            
            // Lifestyle section
            const lifestyleSection = document.createElement('div');
            lifestyleSection.classList.add('path-section');
            lifestyleSection.innerHTML = `
                <h4>Lifestyle del professionista</h4>
                <p>${path.lifestyle}</p>
            `;
            
            // Inspirational figure section
            const inspirationSection = document.createElement('div');
            inspirationSection.classList.add('inspiration');
            inspirationSection.innerHTML = `
                <div class="inspiration-img">
                    <img src="https://via.placeholder.com/60" alt="${path.inspirationalFigure.name}">
                </div>
                <div class="inspiration-content">
                    <h4>Figura ispirazionale: ${path.inspirationalFigure.name}</h4>
                    <p>${path.inspirationalFigure.description}</p>
                </div>
            `;
            
            // Virtual mentor section
            const mentorSection = document.createElement('div');
            mentorSection.classList.add('path-section');
            mentorSection.innerHTML = `
                <h4>Mentor virtuale consigliato</h4>
                <p><strong>${path.virtualMentor.name}</strong> su ${path.virtualMentor.platform}</p>
                <p><small>Focus: ${path.virtualMentor.focus}</small></p>
            `;
            
            // Append all sections to path content
            pathContent.appendChild(uniSection);
            pathContent.appendChild(coursesSection);
            pathContent.appendChild(subjectsSection);
            pathContent.appendChild(jobsSection);
            pathContent.appendChild(mastersSection);
            pathContent.appendChild(lifestyleSection);
            pathContent.appendChild(inspirationSection);
            pathContent.appendChild(mentorSection);
            
            // Append header and content to path card
            pathCard.appendChild(pathHeader);
            pathCard.appendChild(pathContent);
            
            // Append path card to paths list
            pathsList.appendChild(pathCard);
        });
    }
    
    // Event Listeners
    
    // Start journey button
    startJourneyBtn.addEventListener('click', function() {
        navigateTo('chat-section');
        // Start the chat
        askNextQuestion();
    });
    
    // Send response button
    sendResponseBtn.addEventListener('click', function() {
        handleUserResponse();
    });
    
    // User input enter key
    userResponseInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            handleUserResponse();
        }
    });
    
    // Proceed to orientation button
    proceedToOrientationBtn.addEventListener('click', function() {
        navigateTo('orientation-section');
    });
    
    // Proceed to tools button
    proceedToToolsBtn.addEventListener('click', function() {
        navigateTo('action-tools-section');
    });
    
    function handleUserResponse() {
        const userResponse = userResponseInput.value.trim();
        
        if (userResponse) {
            // Add user message to chat
            addMessageToChat(userResponse, 'user');
            
            // Clear input
            userResponseInput.value = '';
            
            // Move to next question
            appState.currentQuestionIndex++;
            askNextQuestion();
        }
    }
    
    // Tool cards event listeners
    document.querySelectorAll('.tool-card .secondary-button').forEach(button => {
        button.addEventListener('click', function() {
            const toolId = this.parentElement.id;
            // In a real app, this would activate the specific tool
            alert(`Il tool "${toolId}" sarà disponibile nella prossima versione dell'app!`);
        });
    });
}); 