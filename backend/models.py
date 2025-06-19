from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt

db = SQLAlchemy() #connection between python and database
bcrypt = Bcrypt() #used to hash and verify passwords


#creates a database table called user
class User(db.Model):
    id = db.Column(db.Integer, primary_key = True)  
    email = db.Column(db.String(150), unique = True, nullable = False)
    password_hash = db.Column(db.String(150), nullable = False)

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode("utf-8")
    
    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)
    



