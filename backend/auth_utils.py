import jwt
import datetime as dt
from functools import wraps
from flask import current_app, request, jsonify
import os

class JWTManager:
    """JWT Token management with security best practices"""
    
    @staticmethod
    def get_secret_key():
        """Get secret key from environment with fallback"""
        secret_key = os.getenv('JWT_SECRET_KEY')
        if not secret_key:
            # In production, this should always come from environment
            secret_key = current_app.config.get('SECRET_KEY', 'your-secret-key-change-in-production')
        return secret_key

def generate_jwt(payload: dict, expires_in_minutes: int = 15) -> str:
    """
    Generate a JWT token with custom expiration time.
    
    Args:
        payload (dict): User data to encode in token
        expires_in_minutes (int): Token expiration time in minutes (default: 15)
    
    Returns:
        str: Encoded JWT token
    """
    payload_copy = payload.copy()
    now = dt.datetime.utcnow()
    payload_copy.update({
        "iat": now,  # Issued at
        "exp": now + dt.timedelta(minutes=expires_in_minutes),  # Expiration
        "nbf": now   # Not before
    })
    
    secret_key = JWTManager.get_secret_key()
    token = jwt.encode(payload_copy, secret_key, algorithm="HS256")
    return token

def decode_jwt(token: str) -> dict | None:
    """
    Decode a JWT token. Returns None if invalid.
    
    Args:
        token (str): JWT token to decode
        
    Returns:
        dict: Decoded payload or None if invalid
    """
    try: 
        secret_key = JWTManager.get_secret_key()
        decoded = jwt.decode(token, secret_key, algorithms=["HS256"])
        return decoded
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None 
    except Exception:
        return None

def get_current_user_from_token(token: str):
    """Extract user info from JWT token"""
    payload = decode_jwt(token)
    if payload:
        return payload.get('user_id')
    return None

def token_required(f):
    """
    Decorator to require JWT token for protected routes.
    Passes current_user_id to the decorated function.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({
                'error': 'Authorization header is missing',
                'message': 'Token is required'
            }), 401
        
        try:
            # Extract token from "Bearer <token>" format
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
            else:
                return jsonify({
                    'error': 'Invalid authorization header format',
                    'message': 'Use Bearer <token> format'
                }), 401
            
            # Decode and validate token
            payload = decode_jwt(token)
            if payload is None:
                return jsonify({
                    'error': 'Invalid or expired token',
                    'message': 'Please login again'
                }), 401
                
            current_user_id = payload.get('user_id')
            if not current_user_id:
                return jsonify({
                    'error': 'Invalid token payload',
                    'message': 'Token does not contain user information'
                }), 401
                
        except Exception as e:
            return jsonify({
                'error': 'Token processing error',
                'message': 'Invalid token format'
            }), 401
            
        return f(current_user_id, *args, **kwargs)
    return decorated_function


