# ProjectHuman Authentication System Documentation

## Overview

This document provides a comprehensive overview of the JWT-based authentication system implemented for ProjectHuman, including both backend (Flask) and frontend (React) components.

## Architecture

### Backend (Flask)
- **Language**: Python
- **Framework**: Flask
- **Database**: SQLite (SQLAlchemy ORM)
- **Authentication**: JWT tokens
- **Password Hashing**: bcrypt

### Frontend (React)
- **Language**: JavaScript
- **Framework**: React
- **State Management**: Context API
- **HTTP Client**: Axios
- **Storage**: localStorage

## Implementation Details

### 1. Backend Implementation

#### 1.1 JWT Utilities (`auth_utils.py`)

**Key Features:**
- Secure JWT token generation and validation
- Environment-based secret key management
- Token expiration handling
- Robust error handling
- Decorator for protecting routes

**Core Functions:**
```python
def generate_jwt(payload: dict, expires_in_minutes: int = 15) -> str
def decode_jwt(token: str) -> dict | None
def token_required(f)  # Decorator for protected routes
```

**Security Features:**
- Uses HS256 algorithm
- Includes standard JWT claims (iat, exp, nbf)
- Environment variable for secret key
- Comprehensive error handling

#### 1.2 User Model (`models.py`)

**Features:**
- Enhanced user validation
- Password hashing with bcrypt
- User lookup methods
- Data serialization for API responses

**User Fields:**
- `id`: Primary key
- `username`: Unique username (3+ characters)
- `email`: Unique email address (validated)
- `password_hash`: Securely hashed password
- `created_at`: Account creation timestamp
- `is_active`: Account status
  `is_verified` : This is the database column for email verification.
  `email_verification_token`: This is the token database storage 

**Validation Rules:**
- Username: 3-80 characters, alphanumeric + hyphens/underscores
- Email: Valid email format
- Password: Minimum 6 characters

#### 1.3 API Endpoints (`App.py`)

**Authentication Endpoints:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify-email` - User email verification

**Protected Endpoints:**
- `GET /api/protected` - Example protected route

**Response Format:**
```json
{
  "message": "Success message",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "created_at": "2024-01-01T00:00:00",
    "is_active": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 1.4 Unit Tests (`test_auth.py`)

**Test Coverage:**
- JWT token generation and validation
- Token expiration handling
- User model validation
- Authentication endpoints
- Error handling scenarios

**Test Classes:**
- `TestJWTAuth`: JWT utility testing
- `TestUserModel`: User model testing

#### 1.5 Password Reset System (`models.py, App.py`)

Overview:
Secure token-based password reset functionality allowing users to reset forgotten passwords via email verification.

PasswordResetToken Model:
-id: Primary key
-user_id: Foreign key to User model
-token: Cryptographically secure URL-safe token (32 bytes)
-created_at: Token creation timestamp
-expires_at: Token expiration timestamp (expires after 10 minutes)
-used: Boolean to ensure tokens are single-use
-user: SQLAlchemy relationship to User model

Security Features:
-10-minute token expiration
-Single-use tokens (marked as used after password reset)
-Secure token generation using secrets.token_urlsafe(32)
-Email enumeration prevention (same response for valid/invalid emails)
-Timezone-aware datetime comparisons
-Automatic cleanup of expired tokens


### Password Reset Endpoints ###
POST /api/auth/request-password-reset - Generate and send reset token
POST /api/auth/reset-password - Reset password using valid token

### Token Management ###
-Automatic cleanup of expired tokens on server startup (exists in App.py)
-Single active token per user (previous tokens are invalidated)
-Comprehensive validation (expiration, usage, user status)
-Error handling and logging

### 2. Frontend Implementation

#### 2.1 AuthContext (`contexts/AuthContext.js`)

**Key Features:**
- Centralized authentication state management
- JWT token management with localStorage
- Automatic token validation and refresh
- Axios interceptors for API requests
- Auto-logout on token expiration

**TokenManager Class:**
- Secure token storage and retrieval
- Token expiration validation
- User data caching
- JWT payload decoding

**AuthProvider Features:**
- Session persistence across browser sessions
- Automatic token validation on app load
- Error handling and user feedback
- Background token refresh

#### 2.2 Login Component (`components/Login.js`)

**Features:**
- Unified login/register form
- Form validation and error handling
- Password visibility toggle
- Demo account support
- Responsive design

**Validation Rules:**
- Email format validation
- Password strength requirements
- Username validation for registration
- Password confirmation matching

#### 2.3 Logout Component (`components/Logout.js`)
**Features:**
- Clean logout functionality
- User info display
- Loading states
- Error handling

#### 2.4 Main App Component (`App.js`)

**Features:**
- Authentication-aware routing
- Protected content display
- User dashboard
- API integration examples

#### 2.5 Profile Page Component (`components/ProfilePage.js`)

**Features:**
- Static user profile page
- Route: `/profile/:userId`
- Protected by authentication (`isAuthenticated`)
- Uses `useParams()` to get user ID from URL
- Displays placeholder sections:
  - Cover photo
  - Profile picture (avatar)
  - Display name
  - Bio
  - Followers and following count
- Styled using Tailwind CSS

## Session Management

### Token Lifecycle
1. **Generation**: 15-minute expiration by default
2. **Storage**: Stored in localStorage with user data
3. **Validation**: Checked on every API request
4. **Refresh**: Automatic validation on app load
5. **Expiration**: Auto-logout when token expires

### Security Considerations
- Tokens are validated on both client and server
- Automatic cleanup of expired tokens
- Secure storage practices
- HTTPS recommended for production

## API Documentation

### Registration
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}
```



### Password Reset Request
```
POST /api/auth/request-password-reset
Content-Type: application/json

{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

### Password Reset
```
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "secure_reset_token_string",
  "password": "newpassword123"
}
```

**Response:**
```json
{
  "message": "Password reset successfully"
}
```

### Protected Routes
```
GET /api/auth/me
Authorization: Bearer <jwt_token>
```

## Environment Configuration

### Backend (.env)
```env
# Flask Configuration
SECRET_KEY=your-secret-key-change-this-in-production-12345
FLASK_DEBUG=true
PORT=5000

# JWT Configuration
JWT_SECRET_KEY=your-jwt-secret-key-change-this-in-production-67890
JWT_ACCESS_TOKEN_EXPIRES=3600

# Database Configuration
DATABASE_URL=sqlite:///projecthuman.db

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Frontend
```env
REACT_APP_API_URL=http://localhost:5000
```

## Running the Application

### Backend
```bash
cd backend
.\venv\Scripts\Activate.ps1  # Windows PowerShell
python App.py
```

### Frontend
```bash
cd react-frontend
npm start
```

### Testing
```bash
cd backend
.\venv\Scripts\Activate.ps1
python -m pytest test_auth.py -v
```

## Security Best Practices Implemented

1. **Password Security**
   - bcrypt hashing with salt
   - Minimum password requirements
   - No plaintext password storage

2. **JWT Security**
   - Short token expiration (15 minutes)
   - Secure secret key management
   - Standard JWT claims
   - Server-side validation

3. **Input Validation**
   - Email format validation
   - Username requirements
   - Password strength validation
   - SQL injection prevention (SQLAlchemy ORM)

4. **Error Handling**
   - Secure error messages
   - No sensitive data exposure
   - Comprehensive logging
   - Graceful failure handling

5. **CORS Configuration**
   - Restricted origins
   - Proper headers
   - Environment-based configuration

## Production Deployment Checklist

### Backend
- [ ] Change default secret keys
- [ ] Use environment variables for all secrets
- [ ] Configure production database
- [ ] Enable HTTPS
- [ ] Set up proper logging
- [ ] Configure CORS for production domains
- [ ] Set up monitoring and health checks

### Frontend
- [ ] Build optimized production bundle
- [ ] Configure production API endpoints
- [ ] Enable HTTPS
- [ ] Set up proper error tracking
- [ ] Configure content security policies
- [ ] Optimize bundle size

## Future Enhancements

1. **Refresh Tokens**: Implement refresh token mechanism
2. **Rate Limiting**: Add request rate limiting
3. **Email Verification**: Add email verification for registration
4. **Password Reset**: Implement password reset functionality
5. **Multi-Factor Authentication**: Add 2FA support
6. **Role-Based Access**: Implement user roles and permissions
7. **Session Management**: Add session invalidation
8. **Audit Logging**: Add comprehensive audit logs

## Troubleshooting

### Common Issues

1. **Token Expiration**
   - Tokens expire after 15 minutes by default
   - Users are automatically logged out
   - Check browser console for expiration messages

2. **CORS Issues**
   - Ensure backend CORS_ORIGINS includes frontend URL
   - Check browser network tab for CORS errors

3. **Database Issues**
   - Database is created automatically on first run
   - Check file permissions for SQLite database

4. **Import Errors**
   - Ensure all dependencies are installed
   - Check virtual environment activation

### Debug Mode
- Enable Flask debug mode in development
- Check browser console for frontend errors
- Review backend logs for API errors

## Testing Strategy

### Backend Testing
- Unit tests for all utility functions
- Integration tests for API endpoints
- Database model validation tests
- Authentication flow tests

### Frontend Testing
- Component unit tests
- Context provider tests
- Authentication flow tests
- Error handling tests


## Conclusion

This authentication system provides a robust, secure foundation for ProjectHuman with proper JWT implementation, comprehensive error handling, and production-ready features. The modular architecture allows for easy extension and maintenance while following security best practices.
