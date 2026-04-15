import os, sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Check /server/.env AND /root/.env
env_paths = [Path(__file__).parent / ".env", Path(__file__).parent.parent / ".env"]
for p in env_paths:
    if p.exists():
        load_dotenv(dotenv_path=p)

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("❌ ERROR: .env keys missing. Add them to /server/.env now!")
    sys.exit(1)

supabase: Client = create_client(url, key)