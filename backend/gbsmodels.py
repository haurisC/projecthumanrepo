from datetime import datetime, date

class Goal(db.Model):
    """Represents a user's goal."""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    target_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationship: one Goal has many Milestones
    milestones = db.relationship("Milestone", backref="goal", lazy=True)

    def __repr__(self):
        return f"<Goal {self.id} - {self.title}>"

    def to_dict(self):
        """Convert Goal to dictionary for JSON responses."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "description": self.description,
            "target_date": self.target_date.isoformat() if self.target_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Milestone(db.Model):
    """Represents a milestone belonging to a goal."""
    id = db.Column(db.Integer, primary_key=True)
    goal_id = db.Column(db.Integer, db.ForeignKey("goal.id"), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    is_completed = db.Column(db.Boolean, default=False)
    due_date = db.Column(db.Date, nullable=True)

    def __repr__(self):
        return f"<Milestone {self.id} - {self.title}>"

    def to_dict(self):
        """Convert Milestone to dictionary for JSON responses."""
        return {
            "id": self.id,
            "goal_id": self.goal_id,
            "title": self.title,
            "description": self.description,
            "is_completed": self.is_completed,
            "due_date": self.due_date.isoformat() if self.due_date else None,
        }


class Badge(db.Model):
    """Represents a badge awarded to a user."""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    awarded_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<Badge {self.id} - {self.name}>"

    def to_dict(self):
        """Convert Badge to dictionary for JSON responses."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "description": self.description,
            "awarded_date": self.awarded_date.isoformat() if self.awarded_date else None,
        }


class Streak(db.Model):
    """Represents a user's activity streak."""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    current_count = db.Column(db.Integer, default=0)
    longest_count = db.Column(db.Integer, default=0)
    last_active_date = db.Column(db.Date, nullable=True)

    def __repr__(self):
        return f"<Streak {self.id} - User {self.user_id}>"

    def to_dict(self):
        """Convert Streak to dictionary for JSON responses."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "current_count": self.current_count,
            "longest_count": self.longest_count,
            "last_active_date": self.last_active_date.isoformat() if self.last_active_date else None,
        }
