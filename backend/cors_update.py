# After deployment, replace the CORS origins in app/main.py with:
origins = [
    "http://localhost:3000",  # Development
    "http://localhost:3001",  # Development  
    "https://your-actual-vercel-url.vercel.app",  # Replace with actual Vercel URL
]