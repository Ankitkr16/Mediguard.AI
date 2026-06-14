from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from backend.app.config import settings

# Adjust sqlite connection parameters if needed
connect_args = {}
database_url = settings.DATABASE_URL

# Test PostgreSQL connection; fallback to local SQLite if unreachable
if not database_url.startswith("sqlite"):
    try:
        # Set connect_timeout in connection arguments to avoid hanging
        test_engine = create_engine(database_url, connect_args={"connect_timeout": 5})
        with test_engine.connect() as conn:
            pass
        print("Connected to remote PostgreSQL database successfully!")
    except Exception as e:
        print(f"Warning: Failed to connect to remote PostgreSQL database ({e}).")
        print("Falling back to local SQLite database (./mediguard.db).")
        database_url = "sqlite:///./mediguard.db"

if database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    database_url,
    connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
