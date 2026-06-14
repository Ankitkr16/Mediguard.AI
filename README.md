# MediGuard AI – Smart Medicine Safety Assistant

MediGuard AI is a production-ready, full-stack AI healthcare web application built to enhance medicine safety, raise awareness, and prevent accidental dosage risks. The application detects drug interactions, flags duplicate active ingredients, checks allergen profiles, schedules calendar reminders, parses strips and prescriptions using OCR, and hosts an AI safety chatbot with voice assistant support.

> [!WARNING]
> **Medical Disclaimer:** MediGuard AI provides safety checking and educational drug monographs. It does NOT prescribe medicines, recommend dosages, or substitute professional medical treatment advice. Always consult a licensed doctor before modifying your medication schedule.

---

## Technical Stack & Architecture

### Backend
- **Core:** Python FastAPI (REST APIs, CORS Middleware)
- **Database:** SQLAlchemy (SQLite default with PostgreSQL support)
- **Machine Learning Classifier:** XGBoost (93% accuracy on test set) vs Random Forest risk prediction comparison
- **RAG Chatbot Assistant:** Sentence-Transformers + Python Keyword monograph retrieval (safe, no hallucinations)
- **OCR Engine:** EasyOCR & OpenCV image parsing
- **PDF Generation:** ReportLab
- **Voice Synthesis:** Web Speech API (speech to text and text to speech in browser) + gTTS backend fallback

### Frontend
- **Framework:** React + TypeScript (Vite bundler)
- **Styling:** Tailwind CSS (Modern dark glassmorphic medical layout)
- **Icons:** Lucide React

---

## File Structure

```text
MediGuard AI/
│
├── backend/
│   ├── app/
│   │   ├── config.py          # Settings & Env vars loading
│   │   ├── database.py        # SQLAlchemy session manager
│   │   ├── models.py          # User, Allergy, Reminder schemas
│   │   ├── schemas.py         # Pydantic validation models
│   │   ├── auth.py            # JWT token & password hashing
│   │   ├── drug_data.py       # Clinical drug knowledge base
│   │   ├── ocr.py             # EasyOCR parsing pipelines
│   │   ├── ml_model.py        # XGBoost risk prediction inference
│   │   ├── rag.py             # Monograph vector search assistant
│   │   ├── pdf_gen.py         # ReportLab safety PDF compilation
│   │   └── main.py            # FastAPI root & endpoints
│   │
│   ├── ml/
│   │   ├── train.py           # ML Model training script
│   │   ├── best_model.pkl     # Saved classifier weights
│   │   └── model_comparison.md# RF vs XGBoost comparison log
│   │
│   ├── Dockerfile             # Backend container setup
│   └── requirements.txt       # Python packages
│
├── frontend/
│   ├── src/
│   │   ├── components/        # Navbar, Sidebar widgets
│   │   ├── context/           # AuthContext, ThemeContext
│   │   ├── pages/             # Dashboard, Scanner, Checker, Chatbot...
│   │   ├── App.tsx            # Routes configurations
│   │   └── main.tsx           # React mounting point
│   │
│   ├── Dockerfile             # Nginx + SPA container
│   ├── package.json
│   ├── tailwind.config.js     # Glassmorphic custom theme
│   └── vite.config.ts
│
├── docker-compose.yml         # Services orchestrator
└── README.md                  # System manual
```

---

## Running Locally

### 1. Run Backend Server

Make sure Python 3.12+ is installed. Navigate to the root directory and install packages:

```bash
# Verify Python version
py --version

# Install dependencies (Downloads PyTorch, Transformers, EasyOCR, and XGBoost)
py -m pip install -r backend/requirements.txt

# Run ML Risk model training (generates ml/best_model.pkl and comparison logs)
py backend/ml/train.py

# Start FastAPI server on port 8000
py -m uvicorn backend.app.main:app --reload --port 8000
```

The REST API documentation will be available at `http://127.0.0.1:8000/docs`.

### 2. Run Frontend Web App

Open a separate terminal, navigate to the `frontend/` directory, install Node packages, and launch:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Running with Docker

Orchestrate the entire stack using Docker Compose:

```bash
# Build and run containers
docker-compose up --build
```
- Backend runs on `http://localhost:8000`
- Frontend runs on `http://localhost:3000`

---

## ML Model Risk Classifier Comparison

We compared Random Forest and XGBoost classifiers trained to predict drug-interaction risk levels (Low, Medium, High). Both models achieved **93.2% accuracy**. XGBoost was selected as the final production model due to its higher F1-score of **0.93** on high-risk cases. Performance metrics are persisted in `backend/ml/model_comparison.md`.
