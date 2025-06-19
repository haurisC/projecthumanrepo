import unittest
import os
import tempfile
from datetime import datetime, timedelta
from flask import Flask
from models import db, User
from auth_utils import generate_jwt, decode_jwt, token_required, JWTManager
import jwt

class TestJWTAuth(unittest.TestCase):
    """Test JWT authentication utilities"""

    def setUp(self):
        """Set up test fixtures"""
        self.app = Flask(__name__)
        self.app.config['SECRET_KEY'] = 'test-secret-key'
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        self.app.config['TESTING'] = True
        
        db.init_app(self.app)
        
        with self.app.app_context():
            db.create_all()
            
        self.app_context = self.app.app_context()
        self.app_context.push()
        
        self.client = self.app.test_client()

    def tearDown(self):
        """Clean up after tests"""
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_generate_jwt_valid_payload(self):
        """Test JWT generation with valid payload"""
        payload = {'user_id': 1, 'username': 'testuser'}
        token = generate_jwt(payload, expires_in_minutes=15)
        
        self.assertIsInstance(token, str)
        self.assertTrue(len(token) > 20)  # JWT tokens are typically longer
        
        # Decode to verify structure
        decoded = decode_jwt(token)
        self.assertIsNotNone(decoded)
        self.assertEqual(decoded['user_id'], 1)
        self.assertEqual(decoded['username'], 'testuser')
        self.assertIn('exp', decoded)
        self.assertIn('iat', decoded)
        self.assertIn('nbf', decoded)

    def test_generate_jwt_custom_expiration(self):
        """Test JWT generation with custom expiration"""
        payload = {'user_id': 1}
        token = generate_jwt(payload, expires_in_minutes=30)
        
        decoded = decode_jwt(token)
        self.assertIsNotNone(decoded)
        
        # Check expiration is approximately 30 minutes from now
        exp_time = datetime.utcfromtimestamp(decoded['exp'])
        expected_time = datetime.utcnow() + timedelta(minutes=30)
        time_diff = abs((exp_time - expected_time).total_seconds())
        
        # Allow 5 seconds tolerance for test execution time
        self.assertLess(time_diff, 5)

    def test_decode_jwt_valid_token(self):
        """Test decoding valid JWT token"""
        payload = {'user_id': 42, 'role': 'admin'}
        token = generate_jwt(payload)
        
        decoded = decode_jwt(token)
        self.assertIsNotNone(decoded)
        self.assertEqual(decoded['user_id'], 42)
        self.assertEqual(decoded['role'], 'admin')

    def test_decode_jwt_expired_token(self):
        """Test decoding expired JWT token"""
        # Create token that expires immediately
        payload = {'user_id': 1}
        token = generate_jwt(payload, expires_in_minutes=-1)  # Already expired
        
        decoded = decode_jwt(token)
        self.assertIsNone(decoded)

    def test_decode_jwt_invalid_token(self):
        """Test decoding invalid JWT token"""
        invalid_tokens = [
            'invalid.token.here',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.payload',
            'completely-invalid-token',
            '',
            None
        ]
        
        for invalid_token in invalid_tokens:
            if invalid_token is not None:
                decoded = decode_jwt(invalid_token)
                self.assertIsNone(decoded, f"Token {invalid_token} should be invalid")

    def test_decode_jwt_tampered_token(self):
        """Test decoding tampered JWT token"""
        payload = {'user_id': 1}
        token = generate_jwt(payload)
        
        # Tamper with the token
        tampered_token = token[:-5] + 'xxxxx'
        
        decoded = decode_jwt(tampered_token)
        self.assertIsNone(decoded)

    def test_jwt_manager_secret_key(self):
        """Test JWT manager secret key retrieval"""
        # Test with environment variable
        os.environ['JWT_SECRET_KEY'] = 'env-secret-key'
        secret = JWTManager.get_secret_key()
        self.assertEqual(secret, 'env-secret-key')
        
        # Clean up
        del os.environ['JWT_SECRET_KEY']
        
        # Test fallback to Flask config
        secret = JWTManager.get_secret_key()
        self.assertEqual(secret, 'test-secret-key')

    def test_token_required_decorator_valid_token(self):
        """Test token_required decorator with valid token"""
        @token_required
        def protected_route(current_user_id):
            return {'user_id': current_user_id}
        
        # Create a valid token
        token = generate_jwt({'user_id': 123})
        
        with self.app.test_request_context(
            '/protected',
            headers={'Authorization': f'Bearer {token}'}
        ):
            result = protected_route()
            self.assertEqual(result['user_id'], 123)

    def test_token_required_decorator_missing_token(self):
        """Test token_required decorator with missing token"""
        @token_required
        def protected_route(current_user_id):
            return {'user_id': current_user_id}
        
        with self.app.test_request_context('/protected'):
            result = protected_route()
            self.assertIsInstance(result, tuple)
            self.assertEqual(result[1], 401)  # Status code

    def test_token_required_decorator_invalid_format(self):
        """Test token_required decorator with invalid token format"""
        @token_required
        def protected_route(current_user_id):
            return {'user_id': current_user_id}
        
        with self.app.test_request_context(
            '/protected',
            headers={'Authorization': 'InvalidFormat token'}
        ):
            result = protected_route()
            self.assertIsInstance(result, tuple)
            self.assertEqual(result[1], 401)  # Status code

    def test_token_required_decorator_expired_token(self):
        """Test token_required decorator with expired token"""
        @token_required
        def protected_route(current_user_id):
            return {'user_id': current_user_id}
        
        # Create expired token
        expired_token = generate_jwt({'user_id': 123}, expires_in_minutes=-1)
        
        with self.app.test_request_context(
            '/protected',
            headers={'Authorization': f'Bearer {expired_token}'}
        ):
            result = protected_route()
            self.assertIsInstance(result, tuple)
            self.assertEqual(result[1], 401)  # Status code

class TestUserModel(unittest.TestCase):
    """Test User model functionality"""

    def setUp(self):
        """Set up test fixtures"""
        self.app = Flask(__name__)
        self.app.config['SECRET_KEY'] = 'test-secret-key'
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        self.app.config['TESTING'] = True
        
        db.init_app(self.app)
        
        with self.app.app_context():
            db.create_all()
            
        self.app_context = self.app.app_context()
        self.app_context.push()

    def tearDown(self):
        """Clean up after tests"""
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_user_creation_valid(self):
        """Test creating user with valid data"""
        user = User(
            username='testuser',
            email='test@example.com',
            password='password123'
        )
        
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.email, 'test@example.com')
        self.assertTrue(user.check_password('password123'))
        self.assertTrue(user.is_active)

    def test_user_creation_invalid_username(self):
        """Test creating user with invalid username"""
        with self.assertRaises(ValueError):
            User(username='ab', email='test@example.com', password='password123')
        
        with self.assertRaises(ValueError):
            User(username='', email='test@example.com', password='password123')

    def test_user_creation_invalid_email(self):
        """Test creating user with invalid email"""
        with self.assertRaises(ValueError):
            User(username='testuser', email='invalid-email', password='password123')
        
        with self.assertRaises(ValueError):
            User(username='testuser', email='', password='password123')

    def test_user_creation_invalid_password(self):
        """Test creating user with invalid password"""
        with self.assertRaises(ValueError):
            User(username='testuser', email='test@example.com', password='123')
        
        with self.assertRaises(ValueError):
            User(username='testuser', email='test@example.com', password='')

    def test_user_password_hashing(self):
        """Test password hashing and verification"""
        user = User(
            username='testuser',
            email='test@example.com',
            password='mypassword'
        )
        
        # Password should be hashed
        self.assertNotEqual(user.password_hash, 'mypassword')
        
        # Should verify correct password
        self.assertTrue(user.check_password('mypassword'))
        
        # Should reject incorrect password
        self.assertFalse(user.check_password('wrongpassword'))

    def test_user_find_methods(self):
        """Test user finding methods"""
        user = User(
            username='findme',
            email='findme@example.com',
            password='password123'
        )
        db.session.add(user)
        db.session.commit()
        
        # Find by email
        found_user = User.find_by_email('findme@example.com')
        self.assertIsNotNone(found_user)
        self.assertEqual(found_user.username, 'findme')
        
        # Find by username
        found_user = User.find_by_username('findme')
        self.assertIsNotNone(found_user)
        self.assertEqual(found_user.email, 'findme@example.com')
        
        # Find by ID
        found_user = User.find_by_id(user.id)
        self.assertIsNotNone(found_user)
        self.assertEqual(found_user.username, 'findme')

    def test_user_to_dict(self):
        """Test user serialization to dictionary"""
        user = User(
            username='dictuser',
            email='dict@example.com',
            password='password123'
        )
        
        user_dict = user.to_dict()
        
        self.assertIn('id', user_dict)
        self.assertIn('username', user_dict)
        self.assertIn('email', user_dict)
        self.assertIn('is_active', user_dict)
        self.assertNotIn('password_hash', user_dict)  # Should not include sensitive data
        
        # Test with sensitive data
        user_dict_sensitive = user.to_dict(include_sensitive=True)
        self.assertIn('password_hash', user_dict_sensitive)

if __name__ == '__main__':
    unittest.main()
