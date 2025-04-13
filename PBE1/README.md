# BeAware App (Versione Semplificata)

BeAware è un'applicazione web interattiva che guida l'utente in un percorso di scoperta personale e orientamento professionale attraverso l'intelligenza artificiale.

## Funzionalità

- **Chat conoscitiva con IA**: Una conversazione guidata che aiuta a comprendere meglio le proprie inclinazioni
- **Generazione profilo**: Analisi delle risposte per creare un profilo personale dettagliato
- **Suggerimento percorsi**: Raccomandazione di percorsi professionali in base al profilo
- **Pianificazione**: Creazione di un piano settimanale con attività mirate
- **Esercizi pratici**: Sfide concrete per sviluppare competenze rilevanti

## Struttura del progetto

```
beaware/
├── public/
│   └── index.html                  # Interfaccia utente
├── src/
│   ├── style.css                   # Stili CSS
│   ├── script.js                   # Logica frontend
│   ├── backend/
│   │   ├── backend.py              # Server Flask + OpenAI
│   │   └── prompt_templates.py     # Template per le prompt IA
│   └── data/
│       └── careers.json            # Dataset professioni
├── .env                            # Variabili d'ambiente
└── requirements.txt                # Dipendenze Python
```

## Nota importante

Questa è una versione semplificata dell'app BeAware, progettata per sperimentazione locale senza richiedere configurazione di Firebase. I dati utente sono temporanei e vengono conservati solo nella sessione corrente.

## Configurazione

1. **Clona il repository**

```bash
git clone <repository-url>
cd beaware
```

2. **Configurazione delle variabili d'ambiente**

Modifica il file `.env` e inserisci la tua chiave API di OpenAI:

```
# OpenAI API
OPENAI_API_KEY=your_openai_api_key_here
```

## Installazione

1. **Backend (Python/Flask)**

```bash
# Crea un ambiente virtuale
python -m venv venv
source venv/bin/activate  # su Windows: venv\Scripts\activate

# Installa le dipendenze
pip install -r requirements.txt
```

2. **Frontend**

Il frontend non richiede installazione di pacchetti aggiuntivi poiché utilizza CDN per le librerie necessarie.

## Avvio dell'applicazione

1. **Avvia il backend**

```bash
cd src/backend
python backend.py
```

2. **Apri l'applicazione**

Apri il file `public/index.html` in un browser o utilizza un server web locale.

Per un server locale semplice:

```bash
# Con Python
cd public
python -m http.server 8000
```

L'applicazione sarà accessibile all'indirizzo `http://localhost:8000`.

## API Backend

Il backend espone le seguenti API:

- `/get-session` - Crea una sessione anonima
- `/chat` - Gestisce la conversazione conoscitiva
- `/generate-profile` - Genera il profilo in base alle risposte
- `/suggest-career` - Suggerisce percorsi professionali
- `/recommend-resources` - Raccomanda risorse di apprendimento
- `/generate-exercise` - Genera esercizi pratici

## Utilizzo con Replit

Per utilizzare quest'app su Replit:

1. Carica i file nel tuo progetto Replit
2. Configura il Secret `OPENAI_API_KEY` nelle impostazioni di Replit
3. Modifica la porta nel backend.py se necessario (Replit potrebbe richiedere una porta specifica)
4. Esegui il backend con `python src/backend/backend.py`
5. Accedi all'app tramite l'URL generato da Replit

## Tecnologie utilizzate

- **Frontend**: HTML, CSS (Tailwind), JavaScript
- **Backend**: Python, Flask
- **IA**: OpenAI GPT-4 Turbo

## Licenza

Questo progetto è proprietario e ad uso esclusivo. 