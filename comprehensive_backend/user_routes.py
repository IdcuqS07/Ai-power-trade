"""
User-specific routes - Trades, Balances, Portfolio
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from datetime import datetime

from database import get_db, User, Trade, Balance
from auth import get_current_user

router = APIRouter(prefix="/api/user", tags=["User"])


@router.get("/profile")
async def get_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Get user profile information"""
    return {
        "data": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "created_at": current_user.created_at.isoformat(),
            "is_active": current_user.is_active,
            "risk_tolerance": "moderate",  # Default values
            "trading_strategy": "ai_multi_indicator"
        }
    }


@router.put("/profile")
async def update_user_profile(
    username: str = None,
    email: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    if username:
        current_user.username = username
    if email:
        current_user.email = email
    
    db.commit()
    db.refresh(current_user)
    
    return {
        "data": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "created_at": current_user.created_at.isoformat()
        }
    }


@router.get("/balance")
async def get_user_balance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's current balances"""
    balances = db.query(Balance).filter(Balance.user_id == current_user.id).all()
    
    total_value = sum(b.amount for b in balances if b.symbol == "USDT")
    
    return {
        "user_id": current_user.id,
        "balances": [
            {
                "symbol": b.symbol,
                "amount": b.amount,
                "locked": b.locked,
                "available": b.amount - b.locked
            }
            for b in balances
        ],
        "total_value": total_value
    }


@router.get("/trades")
async def get_user_trades(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's trade history"""
    trades = db.query(Trade).filter(
        Trade.user_id == current_user.id
    ).order_by(desc(Trade.timestamp)).limit(limit).all()
    
    return {
        "user_id": current_user.id,
        "total_trades": len(trades),
        "trades": [
            {
                "id": t.id,
                "symbol": t.symbol,
                "side": t.side,
                "amount": t.amount,
                "price": t.price,
                "total": t.total,
                "confidence": t.confidence,
                "prediction": t.prediction,
                "status": t.status,
                "pnl": t.pnl,
                "pnl_percentage": t.pnl_percentage,
                "timestamp": t.timestamp.isoformat()
            }
            for t in trades
        ]
    }


@router.get("/stats")
async def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's trading statistics"""
    trades = db.query(Trade).filter(Trade.user_id == current_user.id).all()
    
    total_trades = len(trades)
    winning_trades = len([t for t in trades if t.pnl and t.pnl > 0])
    losing_trades = len([t for t in trades if t.pnl and t.pnl < 0])
    
    total_pnl = sum(t.pnl for t in trades if t.pnl)
    win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0
    
    # Get balance
    balance = db.query(Balance).filter(
        Balance.user_id == current_user.id,
        Balance.symbol == "USDT"
    ).first()
    
    current_balance = balance.amount if balance else 10000.0
    initial_balance = 10000.0  # Default initial balance
    
    return {
        "data": {
            "user_id": current_user.id,
            "username": current_user.username,
            "total_trades": total_trades,
            "winning_trades": winning_trades,
            "losing_trades": losing_trades,
            "win_rate": round(win_rate, 2),
            "total_pnl": round(total_pnl, 2),
            "current_balance": round(current_balance, 2),
            "initial_balance": initial_balance,
            "roi": round((current_balance - initial_balance) / initial_balance * 100, 2) if initial_balance > 0 else 0
        }
    }


@router.get("/portfolio")
async def get_user_portfolio(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's portfolio overview"""
    balances = db.query(Balance).filter(Balance.user_id == current_user.id).all()
    recent_trades = db.query(Trade).filter(
        Trade.user_id == current_user.id
    ).order_by(desc(Trade.timestamp)).limit(10).all()
    
    # Calculate portfolio value
    usdt_balance = next((b.amount for b in balances if b.symbol == "USDT"), 0)
    
    # Get positions (non-USDT balances)
    positions = [
        {
            "symbol": b.symbol,
            "amount": b.amount,
            "locked": b.locked
        }
        for b in balances if b.symbol != "USDT" and b.amount > 0
    ]
    
    return {
        "user_id": current_user.id,
        "username": current_user.username,
        "cash_balance": round(usdt_balance, 2),
        "positions": positions,
        "recent_trades": [
            {
                "symbol": t.symbol,
                "side": t.side,
                "amount": t.amount,
                "price": t.price,
                "pnl": t.pnl,
                "timestamp": t.timestamp.isoformat()
            }
            for t in recent_trades
        ]
    }
