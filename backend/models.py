from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from datetime import datetime, timezone
import re


db = SQLAlchemy()  # connection between python and database
bcrypt = Bcrypt()  # used to hash and verify passwords

# Email validation regex
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

# Follow Relationship Many to Many 
# Implemented using an association table
follows = db.Table(
    'follows',
    db.Column('follower_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('following_id', db.Integer, db.ForeignKey('user.id'), primary_key=True)
)
class User(db.Model):
    """User model with enhanced validation and security"""
    
    id = db.Column(db.Integer, primary_key=True)  
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(150), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    is_active = db.Column(db.Boolean, default=True)
    

    def __init__(self, username, email, password):
        """Initialize user with validation"""
        self.username = self.validate_username(username)
        self.email = self.validate_email(email)
        self.set_password(password)
        self.is_active = True  # Set default active status

    @staticmethod
    def validate_username(username):
        """Validate username format"""
        if not username or len(username) < 3:
            raise ValueError("Username must be at least 3 characters long")
        if len(username) > 80:
            raise ValueError("Username must be less than 80 characters")
        if not username.replace('_', '').replace('-', '').isalnum():
            raise ValueError("Username can only contain letters, numbers, hyphens, and underscores")
        return username.lower()

    @staticmethod
    def validate_email(email):
        """Validate email format"""
        if not email:
            raise ValueError("Email is required")
        if not EMAIL_REGEX.match(email):
            raise ValueError("Invalid email format")
        return email.lower()

    def set_password(self, password):
        """Hash and set password with validation"""
        if not password:
            raise ValueError("Password is required")
        if len(password) < 6:
            raise ValueError("Password must be at least 6 characters long")
        self.password_hash = bcrypt.generate_password_hash(password).decode("utf-8")
    
    def check_password(self, password):
        """Verify password against hash"""
        return bcrypt.check_password_hash(self.password_hash, password)
    
    def to_dict(self, include_sensitive=False):
        """Convert user to dictionary for JSON responses"""
        user_dict = {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'is_active': self.is_active
        }
        
        if include_sensitive:
            # Only include sensitive data when explicitly requested
            user_dict['password_hash'] = self.password_hash
            
        return user_dict

    @classmethod
    def find_by_email(cls, email):
        """Find user by email"""
        return cls.query.filter_by(email=email.lower()).first()
    
    @classmethod
    def find_by_username(cls, username):
        """Find user by username"""
        return cls.query.filter_by(username=username.lower()).first()
    
    @classmethod
    def find_by_id(cls, user_id):
        """Find user by ID"""
        return db.session.get(cls, user_id)

    def __repr__(self):
        return f'<User {self.username}>'
    

# Profile model for user profiles
class Profile(db.Model):
    """Profile model with fields for display_name, bio, profile_picture_url, cover_photo_url."""
    id = db.Column(db.Integer, primary_key = True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), unique=True, nullable=False)
    display_name = db.Column(db.String(120), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    profile_picture_url = db.Column(db.String(300), nullable=True)
    cover_photo_url = db.Column(db.String(300), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))


    def to_dict(self):
        """Convert profile to dictionary for JSON responses"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'display_name': self.display_name,
            'bio': self.bio,
            'profile_picture_url': self.profile_picture_url,
            'cover_photo_url': self.cover_photo_url,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f"<Profile of User {self.user_id}>"
    
# Post Model for user posts
class Post(db.Model):
    """Post model with fields for title, content, image_url, created_at, and user_id."""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), unique=True, nullable=False)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    content_photo_url = db.Column(db.String(300), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        """Convert post to dictionary for JSON responses"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'content': self.content,
            'content_photo_url': self.content_photo_url,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f"<Post {self.title} by User {self.user_id}>"
    
#