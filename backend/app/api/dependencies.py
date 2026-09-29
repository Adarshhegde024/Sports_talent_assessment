from typing import Dict, Any
from fastapi import Depends
from backend.app.core.security import verify_jwt_token

def get_current_user(token_payload: Dict[str, Any] = Depends(verify_jwt_token)) -> Dict[str, Any]:
    """
    Dependency injection for authenticated endpoints.
    Returns dictionary containing authenticated user_id and claims.
    """
    user_id = token_payload.get("sub") or "anonymous-athlete"
    email = token_payload.get("email") or ""
    return {"user_id": user_id, "email": email, "payload": token_payload}
