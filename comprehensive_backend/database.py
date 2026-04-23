"""
Database models and setup using SQLAlchemy + SQLite
"""
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

# Database URL - SQLite for now, easy to switch to PostgreSQL later
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./trading.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ============ Models ============

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Initial balance for new users
    initial_balance = Column(Float, default=10000.0)
    
    # Relationships
    trades = relationship("Trade", back_populates="user")
    balances = relationship("Balance", back_populates="user")


class Trade(Base):
    __tablename__ = "trades"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    symbol = Column(String, nullable=False)  # BTC, ETH, etc
    side = Column(String, nullable=False)  # BUY or SELL
    amount = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    total = Column(Float, nullable=False)
    
    confidence = Column(Float)  # AI confidence score
    prediction = Column(String)  # UP or DOWN
    
    status = Column(String, default="completed")  # completed, pending, failed
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # P&L tracking
    pnl = Column(Float, default=0.0)
    pnl_percentage = Column(Float, default=0.0)
    
    # Relationships
    user = relationship("User", back_populates="trades")


class Balance(Base):
    __tablename__ = "balances"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    symbol = Column(String, nullable=False)  # USDT, BTC, ETH, etc
    amount = Column(Float, default=0.0)
    locked = Column(Float, default=0.0)  # Amount in open orders
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="balances")


# ============ Database Functions ============

def get_db():
    """Dependency for FastAPI endpoints"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database - create all tables"""
    Base.metadata.create_all(bind=engine)
    print("✓ Database initialized")


def reset_db():
    """Reset database - drop and recreate all tables"""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("✓ Database reset")


if __name__ == "__main__":
    # Test database setup
    init_db()
    print("Database tables created successfully!")
