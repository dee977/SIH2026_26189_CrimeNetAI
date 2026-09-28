# CrimeNet AI - Local Development Setup Guide

Welcome to the CrimeNet AI project. This guide will help you set up the project locally on your Windows machine.

## Prerequisites
- **Python**: 3.11 or higher
- **Node.js**: 18 or 20 (for Vite frontend)
- **Docker** (Optional, but highly recommended if you want to run Redis/Celery locally)

## Backend Setup (FastAPI)

1. **Navigate to the backend directory**:
   ```powershell
   cd member2_backend
   ```

2. **Create and activate a virtual environment**:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. **Install Python dependencies**:
   ```powershell
   pip install -r requirements.txt
   ```

4. **Environment Variables**:
   Copy the example environment file to create your own local `.env`:
   ```powershell
   copy .env.example .env
   ```
   *Note: Obtain the actual Supabase `DATABASE_URL`, `SUPABASE_URL`, and `SUPABASE_KEY` from a team member. Do not commit your `.env` file.*

5. **Database Setup**:
   The backend defaults to using SQLite (`sqlite:///./crimenet.db`) if no `DATABASE_URL` is provided. If you want to use the team's remote PostgreSQL (Supabase), ensure your `.env` is configured with the correct `DATABASE_URL`. The tables are automatically created on startup.

6. **Start the Backend**:
   ```powershell
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

## Frontend Setup (React / Vite)

1. **Navigate to the frontend directory** (in a new terminal):
   ```powershell
   cd member1_frontend
   ```

2. **Install Node dependencies**:
   ```powershell
   npm install
   ```

3. **Environment Variables**:
   Copy the example environment file:
   ```powershell
   copy .env.example .env
   ```
   *Note: Vite defaults to `http://localhost:8000/api/v1` automatically for local development.*

4. **Start the Frontend**:
   ```powershell
   npm run dev
   ```

## URLs & Connectivity Verification

- **Frontend URL**: [http://localhost:5173](http://localhost:5173) (or whichever port Vite outputs)
- **Backend URL**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Backend API Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Backend Health Check**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

**How to verify connectivity:**
1. Open the **Backend Health Check** in your browser. It should return a JSON response with `"status": "healthy"`.
2. Open the **Frontend URL**. You should see the CrimeNet AI login screen. Attempting to log in will test the connection between the frontend, the FastAPI backend, and Supabase.

## Services & External Dependencies

- **Supabase / PostgreSQL**: You can use the existing remote Supabase database for development by providing the secrets in your `.env`. Otherwise, you can develop locally using the default SQLite fallback.
- **Neo4j**: There is no remote Neo4j connection configured by default. If you need full graph functionality, you must run Neo4j locally (e.g., `docker run -p 7687:7687 -e NEO4J_AUTH=neo4j/password neo4j:latest`) and set `NEO4J_URI` and `NEO4J_PASSWORD` in your `.env`. Alternatively, set `DOWNSTREAM_FALLBACK_MODE=True` in your backend `.env` to safely mock missing downstream components.
- **Redis & Celery**: The project includes a `docker-compose.yml` in `member2_backend` for Redis and Celery. You only need to run this (`docker-compose up -d`) if you are actively working on background jobs.

## Stopping Services

- In your terminals, press `CTRL+C` to stop `uvicorn` and `npm run dev`.
- If you started Docker containers, run `docker-compose down` inside `member2_backend`.

## Common Errors and Fixes

- **"ModuleNotFoundError: No module named 'app'"**: Ensure you are running `uvicorn` from inside the `member2_backend` directory, not the root of the repository.
- **"Execution of scripts is disabled on this system"**: If you cannot activate your python virtual environment, run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` in PowerShell.
- **API CORS errors or 404s**: Ensure the backend is running on port 8000 and that the frontend `.env` points to `http://localhost:8000/api/v1` (which is the default). Make sure you didn't accidentally include production URLs locally.
