import jwt
import datetime as dt
from flask import current_app

def generate_jwt(payload: dict) -> str:
    """
    Generate a JWT token that expires in 15 minutes. 
    """
    payload_copy = payload.copy()
    payload_copy["exp"] = dt.datetime.utcnow() + dt.timedelta(minutes=15)
    token = jwt.encode(payload_copy, current_app.config["SECRET_KEY"], algorithm = "HS256")
    return token


def decode_jwt(token: str) -> dict | None:
    """
    Decode a JWT token. Returns None if invalid.
    
    """
    try: 
        decoded = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
        return decoded
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None 


