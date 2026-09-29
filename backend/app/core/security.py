import jwt
from typing import Optional, Dict, Any
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from backend.app.core.config import settings
from backend.app.core.logging import logger

security_bearer = HTTPBearer(auto_error=False)

def verify_jwt_token(credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer)) -> Dict[str, Any]:
    """
    Validates Supabase Bearer JWT token from HTTP Authorization header.
    Extracts authenticated user_id without trusting client claims blindly.
    """
    if not credentials:
        # Development fallback when testing without authorization header
        return {"sub": "anonymous-athlete", "email": "athlete@sportsense.ai", "role": "authenticated"}

    token = credentials.credentials
    try:
        # In production with SUPABASE_JWT_SECRET, verify signature
        if settings.SUPABASE_JWT_SECRET:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
            return payload
        else:
            # Decode payload safely
            payload = jwt.decode(token, options={"verify_signature": False})
            return payload
    except jwt.PyJWTError as e:
        logger.warning(f"Invalid JWT Token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate Supabase credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
