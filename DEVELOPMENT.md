# UniResource Hub - Development Setup

## Quick Start

### 1. Initial Setup (Run once)

```bash
# Install dependencies for both frontend and backend
npm run install:all
```

### 2. Development Mode

```bash
# Start both frontend and backend servers
npm run dev
```

This will start:

- **Backend**: FastAPI server on http://localhost:8000
- **Frontend**: React development server on http://localhost:3001

### 3. Production Mode

```bash
# Build and start production servers
npm run build
npm start
```

## Individual Commands

### Frontend Only

```bash
cd frontend
npm start       # Development server on port 3001
npm run build   # Build for production
```

### Backend Only

```bash
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Project Structure

```
https://liberiste.vercel.app//
├── backend/           # FastAPI Python backend
│   ├── app/
│   │   ├── main.py   # FastAPI application entry point
│   │   ├── api/      # API routes
│   │   ├── core/     # Core configuration
│   │   ├── db/       # Database models and connections
│   │   └── schemas/  # Pydantic schemas
│   ├── venv/         # Python virtual environment
│   └── requirements.txt
├── frontend/         # React TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── styles.css
│   └── package.json
└── package.json      # Root package.json for running both servers
```

## URLs

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## Development Notes

- Frontend runs on port 3001 to avoid conflicts
- Backend runs on port 8000
- Both servers support hot reload during development
- The `concurrently` package runs both servers simultaneously

## Troubleshooting

- Make sure Python virtual environment is activated for backend
- Ensure all dependencies are installed: `npm run install:all`
- Check that ports 3001 and 8000 are available
- Verify database connection in backend/.env file
