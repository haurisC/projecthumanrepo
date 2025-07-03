from flask import Blueprint, jsonify
from models import User
from auth_utils import token_required


dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.route("/api/dashboard", methods=["GET"])
@token_required
def get_dashboard(current_user_id):
    """Return dashboard data for the authenticated user.
    Args: current_user_id (int): The user ID extracted from the JWT.
    Returns: JSON response with dashboard data.
    """
    # Fetch the current user
    user = User.find_by_id(current_user_id)
    if not user:
        return jsonify({
            "error": "User not found",
            "message": "The user account no longer exists."
        }), 404

    # Fetch recent posts from users the current user follows
    posts = []
    if hasattr(user, "following"):
        for followed_user in user.following:
            recent_posts = (
                Post.query
                .filter_by(user_id=followed_user.id)
                .order_by(Post.created_at.desc())
                .limit(5)
                .all()
            )
            posts.extend(recent_posts)

    # Sort all posts by creation date descending
    posts.sort(key=lambda p: p.created_at, reverse=True)

    return jsonify({
        "user": user.to_dict(),
        "feed": [post.to_dict() for post in posts]
    }), 200
