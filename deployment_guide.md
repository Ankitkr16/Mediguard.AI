# Deployment Guide: MediGuard.AI Healthcare Operating System

This guide outlines how to deploy the frontend, backend, SQL database, and graph database of the MediGuard.AI platform to cloud hosting services (Vercel, Render/Railway, Neon, and Neo4j Aura).

---

## 1. Prerequisites & Environment Variables

Make sure to collect and configure the following credentials:

### Backend `.env` Variables
*   `SECRET_KEY`: A secure random string for JWT signing.
*   `DATABASE_URL`: Your remote **Neon PostgreSQL** database connection string (e.g. `postgresql://user:pass@ep-host.region.aws.neon.tech/dbname?sslmode=require`).
*   `GEMINI_API_KEY`: Your **Google Gemini API Key** for RAG chatbot answers, lab summaries, and triage assessments.
*   `NEO4J_URI`: Connection URL for your **Neo4j Aura** graph database (e.g., `neo4j+s://xxxxxx.databases.neo4j.io`).
*   `NEO4J_USER`: Your graph username (default: `neo4j`).
*   `NEO4J_PASSWORD`: Your graph password.

### Frontend `.env` Variables
*   `VITE_API_URL`: The URL of your deployed FastAPI backend (e.g., `https://mediguard-backend.onrender.com/api/v1`).

---

## 2. Backend Deployment (Render or Railway)

FastAPI can be deployed easily as a Web Service.

### Option A: Render.com
1.  Sign in to [Render](https://render.com) and click **New > Web Service**.
2.  Connect your GitHub repository.
3.  Configure the following settings:
    *   **Name**: `mediguard-backend`
    *   **Language**: `Python`
    *   **Build Command**: `pip install -r backend/requirements.txt`
    *   **Start Command**: `python -m uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
4.  Under **Advanced > Environment Variables**, add your database credentials, Gemini keys, and Neo4j settings.
5.  Click **Deploy Web Service**.

### Option B: Docker Deployment (Render/Railway)
If you prefer containerized deployment, the backend directory contains a `Dockerfile`:
1.  Connect your repository to Render or Railway.
2.  Choose **Docker** as the deployment builder.
3.  Deploy directly; the container will expose port `8000` automatically.

---

## 3. Database Deployment

### SQL Database (Neon PostgreSQL)
1.  Sign up at [Neon.tech](https://neon.tech) and create a free PostgreSQL project.
2.  Copy the connection string (with pooled or direct connection) and paste it into the backend environment variable `DATABASE_URL`.
3.  The backend's startup code will automatically run standard SQLAlchemy migrations (`Base.metadata.create_all`) to initialize the tables (`family_profiles`, `digital_twins`, `lab_reports`, `inventories`, `adherence_logs`, `wearable_logs`) on startup.

### Graph Database (Neo4j Aura Console)
1.  Create a free instance at [Neo4j Aura Console](https://neo4j.com/cloud/aura/).
2.  Download the generated `.txt` credentials file containing the URI, username, and password.
3.  Add the credentials to the backend environment variables (`NEO4J_URI`, `NEO4J_PASSWORD`).
4.  On startup, the backend will automatically seed the graph with the standard pharmacopeia nodes.

---

## 4. Frontend Deployment (Vercel)

The Vite-React frontend can be deployed in seconds to Vercel.

1.  Go to [Vercel](https://vercel.com) and click **Add New > Project**.
2.  Connect your GitHub repository.
3.  In the configuration menu:
    *   **Framework Preset**: `Vite`
    *   **Root Directory**: `frontend`
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist`
4.  Under **Environment Variables**, add:
    *   `VITE_API_URL`: (e.g., `https://mediguard-backend.onrender.com/api/v1`)
5.  Click **Deploy**.
