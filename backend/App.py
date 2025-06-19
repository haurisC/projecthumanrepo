from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os
from dotenv import load_dotenv
from models import db, User
from auth_utils import generate_jwt, decode_jwt, token_required
import traceback

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
            db.session.add(user)
            db.session.commit()
            
            # Generate JWT token
            token = generate_jwt({'user_id': user.id, 'username': user.username}, expires_in_minutes=60)
            
            return jsonify({
                'message': 'User registered successfully',
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
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': user.to_dict()
        })
        
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
