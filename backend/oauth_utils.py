"""OAuth utility functions for Google authentication"""

import os
import requests
import secrets
from urllib.parse import urlencode
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
import json

class GoogleOAuth:
    """Google OAuth handler using simple HTTP requests"""
    
    def __init__(self):
        self.client_id = os.getenv('GOOGLE_CLIENT_ID')
        self.client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
        self.redirect_uri = os.getenv('GOOGLE_REDIRECT_URI', 'http://localhost:5000/api/auth/google/callback')
        
        if not self.client_id or not self.client_secret:
            print("Warning: Google OAuth credentials not configured")
    
    def get_authorization_url(self):
        """Generate Google OAuth authorization URL"""
        if not self.client_id:
            raise ValueError("Google OAuth client ID not configured")
            
        # Generate state for CSRF protection
        state = secrets.token_urlsafe(32)
        
        # OAuth parameters
        params = {
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'scope': 'openid profile email',
            'response_type': 'code',
            'access_type': 'offline',
            'prompt': 'select_account',
            'state': state
        }
        
        base_url = 'https://accounts.google.com/o/oauth2/v2/auth'
        authorization_url = f"{base_url}?{urlencode(params)}"
        
        return authorization_url, state
    
    def exchange_code_for_token(self, code):
        """Exchange authorization code for access token and user info"""
        if not self.client_id or not self.client_secret:
            raise ValueError("Google OAuth credentials not configured")
            
        try:
            # Step 1: Exchange code for access token
            token_url = 'https://oauth2.googleapis.com/token'
            token_data = {
                'client_id': self.client_id,
                'client_secret': self.client_secret,
                'code': code,
                'grant_type': 'authorization_code',
                'redirect_uri': self.redirect_uri
            }
            
            token_response = requests.post(token_url, data=token_data)
            token_json = token_response.json()
            
            if token_response.status_code != 200 or 'access_token' not in token_json:
                print(f"Token exchange failed: {token_json}")
                raise Exception(f"Failed to get access token: {token_json.get('error', 'Unknown error')}")
            
            # Step 2: Get user info using access token
            user_info_url = 'https://www.googleapis.com/oauth2/v2/userinfo'
            headers = {'Authorization': f"Bearer {token_json['access_token']}"}
            user_response = requests.get(user_info_url, headers=headers)
            
            if user_response.status_code != 200:
                raise Exception("Failed to get user information from Google")
            
            user_info = user_response.json()
            
            # Return structured user information
            return {
                'google_id': user_info.get('id'),
                'email': user_info.get('email'),
                'name': user_info.get('name'),
                'given_name': user_info.get('given_name'),
                'family_name': user_info.get('family_name'),
                'picture': user_info.get('picture'),
                'email_verified': user_info.get('verified_email', False)
            }
            
        except requests.RequestException as e:
            print(f"Network error during OAuth: {e}")
            raise Exception("Network error during authentication")
        except Exception as e:
            print(f"OAuth exchange error: {e}")
            raise
    
    def verify_google_token(self, token):
        """Verify Google ID token (for client-side verification)"""
        try:
            if not self.client_id:
                raise ValueError("Google OAuth client ID not configured")
                
            request = google_requests.Request()
            id_info = id_token.verify_oauth2_token(token, request, self.client_id)
            
            # Check if the token is for our application
            if id_info['aud'] != self.client_id:
                raise ValueError('Token audience mismatch')
            
            return {
                'google_id': id_info.get('sub'),
                'email': id_info.get('email'),
                'name': id_info.get('name'),
                'given_name': id_info.get('given_name'),
                'family_name': id_info.get('family_name'),
                'picture': id_info.get('picture'),
                'email_verified': id_info.get('email_verified', False)
            }
        except Exception as e:
            print(f"Error verifying Google token: {e}")
            return None

# Initialize Google OAuth handler
google_oauth = GoogleOAuth()
