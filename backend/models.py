from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from datetime import datetime, timezone, timedelta
import re
import secrets


db = SQLAlchemy()  # connection between python and database
bcrypt = Bcrypt()  # used to hash and verify passwords

# Email validation regex
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

class User(db.Model):
    """User model with enhanced validation and security"""
    
    id = db.Column(db.Integer, primary_key=True)  
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(150), nullable=True)  # Allow null for OAuth users
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    email_verification_token = db.Column(db.String(64), nullable=True)
    oauth_provider = db.Column(db.String(50), nullable=True)  # 'google', 'github', etc.
    oauth_id = db.Column(db.String(100), nullable=True)  # Provider-specific ID
    profile_picture = db.Column(db.String(255), nullable=True)  # Profile picture URL

    def __init__(self, username, email, password=None, oauth_provider=None, oauth_id=None, profile_picture=None):
        """Initialize user with validation"""
        self.username = self.validate_username(username)
        self.email = self.validate_email(email)
        self.oauth_provider = oauth_provider
        self.oauth_id = oauth_id
        self.profile_picture = profile_picture
        
        if password is not None:
            self.set_password(password)
        elif oauth_provider is None:
            raise ValueError("Password is required for non-OAuth users")
        
        self.is_active = True  # Set default active status
        self.is_verified = True if oauth_provider else False  # OAuth users are pre-verified

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
        if not self.password_hash:
            return False  # OAuth users don't have passwords
        return bcrypt.check_password_hash(self.password_hash, password)
    
    def to_dict(self, include_sensitive=False):
        """Convert user to dictionary for JSON responses"""
        user_dict = {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'oauth_provider': self.oauth_provider,
            'profile_picture': self.profile_picture
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

    @classmethod
    def find_by_oauth(cls, provider, oauth_id):
        """Find user by OAuth provider and ID"""
        return cls.query.filter_by(oauth_provider=provider, oauth_id=oauth_id).first()
    
    @classmethod
    def create_oauth_user(cls, email, name, oauth_provider, oauth_id, profile_picture=None):
        """Create a new OAuth user"""
        # Generate username from name or email
        if name:
            base_username = name.lower().replace(' ', '_').replace('-', '_')
            # Remove non-alphanumeric characters except underscores
            base_username = ''.join(c for c in base_username if c.isalnum() or c == '_')
        else:
            base_username = email.split('@')[0]
        
        # Ensure username meets validation requirements
        if len(base_username) < 3:
            base_username = f"user_{base_username}"
        
        username = base_username
        
        # Ensure username is unique
        counter = 1
        while cls.find_by_username(username):
            username = f"{base_username}_{counter}"
            counter += 1
        
        return cls(
            username=username,
            email=email,
            oauth_provider=oauth_provider,
            oauth_id=oauth_id,
            profile_picture=profile_picture
        )

    def __repr__(self):
        return f'<User {self.username}>'
    
    def generate_email_verification_token(self):
        import secrets
        self.email_verification_token = secrets.token_urlsafe(32)
        return self.email_verification_token

class PasswordResetToken(db.Model):
    """Model for resetting password. Stores temporary tokens that allow users to reset their passwords
    securely. Tokens expire after 10 minutes and are single-use only.
    
    Attributes:
        id (int): Primary key for the token record
        user_id (int): Foreign key reference to the User model
        token (str): Secure random token string
        created_at (datetime): Timestamp when token was created
        expires_at (datetime): Timestamp when token expires
        used (bool): Shows if token has been used
        user (User): SQLAlchemy relationship to User model
    """
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    token = db.Column(db.String(100), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)
    
    # Relationship to User model with backref for easy access
    user = db.relationship('User', backref='reset_tokens')
    
    def __init__(self, user_id):
        """Initialize a new password reset token.
        Creates a secure token with 10-minute expiration time.
        Args:
            user_id (int): ID of the user requesting password reset
        """
        self.user_id = user_id
        # Generate secure URL-safe token (32 bytes = 43 chars)
        self.token = secrets.token_urlsafe(32)
        # Token expeires 10 mins from generation
        self.expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
        self.used = False
    
    def is_valid(self):
        """Check if the token is valid for use.
        Valid if token hasn't been used and hasn't expired.
        Returns:
            bool: True if token is valid, False otherwise.
        """
        # Ensure both datetimes are timezone-aware for comparison
        current_time = datetime.now(timezone.utc)
        expires_time = self.expires_at.replace(tzinfo=timezone.utc) if self.expires_at.tzinfo is None else self.expires_at
        return not self.used and current_time < expires_time
    
    def mark_as_used(self):
        """Mark  token as used to prevent reuse.
        Commits the change to the database immediately
        to ensure the token cannot be used again.
        """
        self.used = True
        db.session.commit()
    
    @classmethod
    def find_by_token(cls, token):
        """Find a password reset token by its token string.
        Args:
            token (str): The token string to search for.
        Returns:
            PasswordResetToken or None: The token object if found, None otherwise.
        """
        return cls.query.filter_by(token=token).first()
    
    @classmethod
    def cleanup_expired(cls):
        """Method to remove all expired tokens from the database.
        Returns:
            int: Number of expired tokens that were deleted.
        """
        # Find all expired tokens - handle timezone comparison
        current_time = datetime.now(timezone.utc)
        expired_tokens = cls.query.all()
        expired_tokens = [token for token in expired_tokens 
                         if (token.expires_at.replace(tzinfo=timezone.utc) if token.expires_at.tzinfo is None else token.expires_at) < current_time]
        
        # Delete each expired token
        for token in expired_tokens:
            db.session.delete(token)
        
        # Commit the deletions, return number of expired tokens
        db.session.commit()
        return len(expired_tokens)


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

class Follow(db.Model):
    """Model representing a follow relationship between users."""
    id = db.Column(db.Integer, primary_key=True)
    follower_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    followee_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (db.UniqueConstraint('follower_id', 'followee_id', name='unique_follow'),)

    def __repr__(self):
        return f"<Follow follower={self.follower_id} followee={self.followee_id}>"

class WaitlistEntry(db.Model):
    __tablename__ = 'waitlist_entries'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    referred_by = db.Column(db.String(120))
    referred_emails = db.Column(db.Text)  # Store as comma-separated string

    def __init__(self, name, email, referred_by, referred_emails):
        self.name = name
        self.email = email
        self.referred_by = referred_by
        # Store emails as comma-separated string
        self.referred_emails = ','.join([e for e in referred_emails if e.strip()])

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "referred_by": self.referred_by,
            "referred_emails": self.referred_emails.split(',') if self.referred_emails else [],
        }