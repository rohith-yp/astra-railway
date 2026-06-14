import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

# Load env variables
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

# Vercel serverless has a read-only filesystem except /tmp. DATABASE_URL
# remains available for deployments that need durable external storage.
DATABASE_URL = os.getenv("DATABASE_URL")
is_vercel = bool(os.getenv("VERCEL") or os.getenv("VERCEL_ENV"))

if not DATABASE_URL and is_vercel:
    DATABASE_URL = "sqlite:////tmp/astra_rail.db"
elif not DATABASE_URL:
    # Local development: place inside backend/ folder or project directory
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_path = os.path.join(backend_dir, "astra_rail.db")
    DATABASE_URL = f"sqlite:///{db_path}"

# SQLite requires different arguments for multi-threading in FastAPI
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
