from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import json

from app.db.database import get_db
from app.db import models
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

class AIExplanationResponse(BaseModel):
    id: str
    signal_id: str
    decision: str
    reason: str
    confidence: float
    factors: dict
    timestamp: datetime

@router.get("/ai-explanation/{signal_id}/latest", response_model=AIExplanationResponse)
async def get_latest_explanation(
    signal_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get latest AI explanation for a signal"""
    # Find signal
    signal = db.query(models.Signal).filter(models.Signal.id == signal_id).first()
    if not signal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Signal not found"
        )
    
    # Check permissions
    if current_user.role == models.UserRole.OPERATOR:
        if signal.zone_id != current_user.zone_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this signal"
            )
    
    # Get latest explanation
    explanation = db.query(models.AIExplanation).filter(
        models.AIExplanation.signal_id == signal_id
    ).order_by(models.AIExplanation.timestamp.desc()).first()
    
    if not explanation:
        # Generate a simulated explanation
        decision = "EXTEND_GREEN" if signal.current_phase == models.SignalPhase.NORTH else "NORMAL_CYCLE"
        factors = {
            "queue_length": 25,
            "vehicle_count": 45,
            "pedestrian_count": 12,
            "time_of_day": datetime.now().hour,
            "historical_pattern": "rush_hour",
        }
        
        return AIExplanationResponse(
            id="simulated",
            signal_id=signal_id,
            decision=decision,
            reason=f"High traffic detected on {signal.current_phase.value} approach. Extending green phase to clear queue.",
            confidence=0.85,
            factors=factors,
            timestamp=datetime.utcnow(),
        )
    
    # Parse factors if it's a string
    factors = explanation.factors
    if isinstance(factors, str):
        try:
            factors = json.loads(factors)
        except:
            factors = {}
    
    return AIExplanationResponse(
        id=explanation.id,
        signal_id=explanation.signal_id,
        decision=explanation.decision,
        reason=explanation.reason,
        confidence=explanation.confidence,
        factors=factors,
        timestamp=explanation.timestamp,
    )

@router.get("/ai-explanation/{signal_id}/history", response_model=List[AIExplanationResponse])
async def get_explanation_history(
    signal_id: str,
    limit: int = 10,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get AI explanation history for a signal"""
    # Find signal
    signal = db.query(models.Signal).filter(models.Signal.id == signal_id).first()
    if not signal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Signal not found"
        )
    
    # Check permissions
    if current_user.role == models.UserRole.OPERATOR:
        if signal.zone_id != current_user.zone_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this signal"
            )
    
    # Get history
    explanations = db.query(models.AIExplanation).filter(
        models.AIExplanation.signal_id == signal_id
    ).order_by(models.AIExplanation.timestamp.desc()).limit(limit).all()
    
    result = []
    for exp in explanations:
        factors = exp.factors
        if isinstance(factors, str):
            try:
                factors = json.loads(factors)
            except:
                factors = {}
        
        result.append(AIExplanationResponse(
            id=exp.id,
            signal_id=exp.signal_id,
            decision=exp.decision,
            reason=exp.reason,
            confidence=exp.confidence,
            factors=factors,
            timestamp=exp.timestamp,
        ))
    
    return result



