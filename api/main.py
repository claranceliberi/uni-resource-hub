import sys
import os
from mangum import Mangum

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from backend.app.main import app as fastapi_app

# Vercel serverless handler using Mangum
handler = Mangum(fastapi_app)