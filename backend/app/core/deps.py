from typing import Optional
from uuid import UUID
from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.models.cafe import UserCafeRole

async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """Get the current authenticated user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not authorization:
        raise credentials_exception
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise credentials_exception
    except ValueError:
        raise credentials_exception
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == UUID(user_id)).first()
    if user is None:
        raise credentials_exception
    
    return user

async def verify_cafe_access(
    cafe_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    required_role: Optional[str] = None
) -> bool:
    """Verify that the current user has access to the specified cafe"""
    user_role = db.query(UserCafeRole).filter(
        UserCafeRole.user_id == current_user.id,
        UserCafeRole.cafe_id == cafe_id
    ).first()
    
    if not user_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this cafe"
        )
    
    if required_role:
        role_hierarchy = {"owner": 3, "manager": 2, "server": 1}
        if role_hierarchy.get(user_role.role, 0) < role_hierarchy.get(required_role, 0):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You need {required_role} role to perform this action"
            )
    
    return True
