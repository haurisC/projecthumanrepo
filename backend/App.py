from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os
from dotenv import load_dotenv
from models import db, User, PasswordResetToken
from auth_utils import generate_jwt, decode_jwt, token_required
import traceback
import secrets


# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///projecthuman.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db.init_app(app)
cors = CORS(app, origins=os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(','))

# Create database tables
with app.app_context():
    db.create_all()
    PasswordResetToken.cleanup_expired()

# Routes
@app.route('/')
def home():
    return jsonify({
        'message': 'ProjectHuman API',
        'status': 'running',
        'version': '1.0.0'
    })

@app.route('/api/health')
def health_check():
    return jsonify({'status': 'healthy'})

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        # Validation
        if not username or not email or not password:
            return jsonify({
                'error': 'Missing required fields',
                'message': 'Username, email, and password are required'
            }), 400
        
        # Check if user already exists
        if User.find_by_email(email):
            return jsonify({
                'error': 'User already exists',
                'message': 'An account with this email already exists'
            }), 409
            
        if User.find_by_username(username):
            return jsonify({
                'error': 'Username taken',
                'message': 'This username is already taken'
            }), 409
        
        # Create new user
        try:
            user = User(username=username, email=email, password=password)

            #generates the secret token for the user to verify email.
            emailtoken = secrets.token_urlsafe(32)
            user.email_verification_token = emailtoken
            user.is_verified = False
            db.session.add(user)
            db.session.commit()
            
            # Generate JWT token
            token = generate_jwt({'user_id': user.id, 'username': user.username}, expires_in_minutes=60)
            
            #this is the code to verify the account
            print(f"[DEV] Verify this account: http://localhost:3000/verify-email?token={emailtoken}")
            
            return jsonify({
                'message': 'User registered successfully. Please verify your email',
                'token': token,
                'user': user.to_dict()
            }), 201
            
        except ValueError as e:
            return jsonify({
                'error': 'Validation error',
                'message': str(e)
            }), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': 'Registration failed',
            'message': 'An unexpected error occurred'
        }), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Authenticate user and return JWT token"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({
                'error': 'Missing credentials',
                'message': 'Email and password are required'
            }), 400
        
        # Find user
        user = User.find_by_email(email)
        if not user or not user.check_password(password):
            return jsonify({
                'error': 'Invalid credentials',
                'message': 'Email or password is incorrect'
            }), 401
        
        if not user.is_active:
            return jsonify({
                'error': 'Account disabled',
                'message': 'Your account has been disabled'
            }), 401
        
        # Generate JWT token
        token = generate_jwt({'user_id': user.id, 'username': user.username}, expires_in_minutes=60)
        
        # Check if email is verified and add warning if not
        response_data = {
            'message': 'Login successful',
            'token': token,
            'user': user.to_dict()
        }
        
        if not user.is_verified:
            response_data['warning'] = 'Please verify your email address'
            response_data['verification_required'] = True
        
        return jsonify(response_data)
        
    except Exception as e:
        return jsonify({
            'error': 'Login failed',
            'message': 'An unexpected error occurred'
        }), 500

@app.route('/api/auth/me', methods=['GET'])
@token_required
def get_current_user(current_user_id):
    """Get current user information"""
    try:
        user = User.find_by_id(current_user_id)
        if not user:
            return jsonify({
                'error': 'User not found',
                'message': 'User account no longer exists'
            }), 404
        
        return jsonify({
            'user': user.to_dict()
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to get user',
            'message': 'An unexpected error occurred'
        }), 500

@app.route('/api/auth/logout', methods=['POST'])
@token_required
def logout(current_user_id):
    """Logout user (client-side token removal)"""
    return jsonify({
        'message': 'Logged out successfully',
        'note': 'Please remove the token from client storage'
    })

@app.route('/api/protected', methods=['GET'])
@token_required
def protected_route(current_user_id):
    """Example protected route"""
    user = User.find_by_id(current_user_id)
    return jsonify({
        'message': 'This is a protected route',
        'user': user.to_dict() if user else None
    })


@app.route('/api/auth/request-password-reset', methods=['POST'])
def request_password_reset():
    """Request a password reset token for a user account.
    
    Expected JSON args: {"email": "user@example.com"}
    Returns: JSON response with success message (200) or error (400/500)
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        email = data.get('email', '').strip()
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        # Find user by email
        user = User.find_by_email(email)
        if not user or not user.is_active:
            # Return generic message to prevent email enumeration
            return jsonify({'message': 'If an account with that email exists, a password reset link has been sent.'}), 200
        
        # Clean up existing unused tokens for this user
        existing_tokens = PasswordResetToken.query.filter_by(user_id=user.id, used=False).all()
        for token in existing_tokens:
            db.session.delete(token)
        
        # Create new password reset token
        reset_token = PasswordResetToken(user_id=user.id)
        db.session.add(reset_token)
        db.session.commit()
        
        # TODO: Replace with actual email sending in production
        # For development: token is logged (remove in production)
        if app.debug:
            print(f"[DEV] Reset token for {email}: {reset_token.token}")
        # In production, this would send an email instead
        
        return jsonify({'message': 'If an account with that email exists, a password reset link has been sent.'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Request failed'}), 500

@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    """Reset a user's password using a valid reset token.
    
    Expected JSON payload: {"token": "reset_token", "password": "new_password"}
    Returns: JSON response with success message (200) or error (400/500)
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        token = data.get('token', '').strip()
        new_password = data.get('password', '')
        
        if not token or not new_password:
            return jsonify({'error': 'Token and password are required'}), 400
        
        # Find and validate the reset token
        reset_token = PasswordResetToken.find_by_token(token)
        if not reset_token or not reset_token.is_valid():
            return jsonify({'error': 'Invalid or expired token'}), 400
        
        # Verify the user account is still valid
        user = User.find_by_id(reset_token.user_id)
        if not user or not user.is_active:
            return jsonify({'error': 'Invalid token'}), 400
        
        try:
            # Update user password and mark token as used
            user.set_password(new_password)
            reset_token.mark_as_used()
            db.session.commit()
            return jsonify({'message': 'Password reset successfully'}), 200
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        
    except Exception as e:
        db.session.rollback()
        print(f"Password reset error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Password reset failed'}), 500
#this is the code to verify the email token
@app.route('/api/auth/verify-email', methods=['GET'])
def verify_email():
    token = request.args.get('token', '')
    if not token:
        return jsonify({'error': 'Missing token'}), 400

    user = User.query.filter_by(email_verification_token=token).first()
    if not user:
        return jsonify({'error': 'Invalid or expired token'}), 400

    user.is_verified = True
    user.email_verification_token = None
    db.session.commit()
    return jsonify({'message': 'Email verified successfully!'}), 200

@app.route('/api/auth/resend-verification', methods=['POST'])
@token_required
def resend_verification(current_user_id):
    """Resend email verification token for current user"""
    try:
        user = User.find_by_id(current_user_id)
        if not user:
            return jsonify({
                'error': 'User not found',
                'message': 'User account no longer exists'
            }), 404
        
        if user.is_verified:
            return jsonify({
                'message': 'Email already verified',
                'verified': True
            }), 200
        
        # Generate new verification token
        emailtoken = secrets.token_urlsafe(32)
        user.email_verification_token = emailtoken
        db.session.commit()
        
        # For development: print verification link
        print(f"[DEV] Verify this account: http://localhost:3000/verify-email?token={emailtoken}")
        
        return jsonify({
            'message': 'Verification email sent. Please check your email.',
            'verification_required': True
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': 'Failed to resend verification',
            'message': 'An unexpected error occurred'
        }), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found', 'message': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error', 'message': 'An unexpected error occurred'}), 500

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('PORT', 5000)),
        debug=os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    )
