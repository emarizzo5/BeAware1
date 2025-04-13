# BeAware

BeAware è un'app web che aiuta gli utenti in un percorso di crescita personale e professionale attraverso domande socratiche e intelligenza artificiale. L'obiettivo è facilitare la conoscenza di sé, migliorare la consapevolezza delle proprie inclinazioni e orientare le scelte future.

![BeAware Logo](assets/logo.png)

## Funzionalità principali

- **Chat conoscitiva**: Interazione guidata con domande riflessive per scoprire attitudini, emozioni e ambizioni
- **Profilo personale**: Visualizzazione dei punti di forza, aree da migliorare, tratti cognitivi e interessi
- **Orientamento professionale**: Proposte di percorsi formativi e lavorativi personalizzati
- **Strumenti di pianificazione**: Creazione di piani settimanali con micro-obiettivi
- **Esercizi pratici**: Attività concrete per testare l'interesse verso le direzioni suggerite

## Struttura dell'applicazione

L'app è divisa in due blocchi principali:

1. **Blocco 1 (Lineare)**: Conoscenza → Consapevolezza → Orientamento
2. **Blocco 2 (Strumenti)**: Moduli indipendenti di pianificazione ed esercizi pratici

## Tecnologie utilizzate

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Python, Flask
- **AI**: OpenAI API

## Installazione

1. Clona il repository:
   ```
   git clone https://github.com/tuousername/beaware.git
   cd beaware
   ```

2. Installa le dipendenze Python:
   ```
   pip install -r requirements.txt
   ```

3. Configura la tua API key di OpenAI:
   - Modifica il file `backend.py` inserendo la tua API key o
   - Imposta la variabile d'ambiente `OPENAI_API_KEY`

## Avvio dell'applicazione

1. Avvia il server Flask:
   ```
   python backend.py
   ```

2. Apri `index.html` nel tuo browser o usa un server locale:
   ```
   python -m http.server
   ```
   Poi visita `http://localhost:8000`

## Struttura del progetto

```
beaware/
├── index.html              # Layout principale dell'app
├── style.css               # Stili CSS 
├── script.js               # Logica frontend
├── backend.py              # Server Flask e integrazione OpenAI
├── data.json               # Dati per domande, percorsi, esercizi
├── requirements.txt        # Dipendenze Python
└── assets/                 # Immagini e risorse
    └── logo.png            # Logo dell'app
```

## Contribuire

Questo progetto è open-source. Sentiti libero di fare fork, apportare modifiche e inviare pull request. 