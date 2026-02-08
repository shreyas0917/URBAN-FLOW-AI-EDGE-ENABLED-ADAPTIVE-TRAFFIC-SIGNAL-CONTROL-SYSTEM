from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import os

# Use SQLite if DATABASE_URL is not set or if it's a SQLite URL
database_url = settings.DATABASE_URL

# Check if we should use SQLite
if database_url.startswith("sqlite://") or not database_url.startswith("postgresql://"):
    # Use SQLite for easier setup
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "urbanflow.db")
    database_url = f"sqlite:///{db_path}"
    print(f"Using SQLite database at: {db_path}")

# Create engine with appropriate settings
if database_url.startswith("sqlite://"):
    engine = create_engine(
        database_url,
        connect_args={"check_same_thread": False},  # SQLite specific
        echo=False
    )
else:
    # PostgreSQL
    engine = create_engine(database_url, echo=False)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


