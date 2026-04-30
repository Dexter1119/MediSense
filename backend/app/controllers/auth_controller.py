####################################################################
#
# File Name :   auth_controller.py
# Description : Authentication-related API endpoints
# Author      : Pradhumnya Changdev Kalsait
# Date        : 17/01/26
#
####################################################################

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from app.extensions import mongo
from app.models.user_model import UserModel
from app.utils.constants import UserRole

auth_blueprint = Blueprint("auth", __name__)

"""
################################################################
#
# Function Name : login_user
# Description   : Authenticates user and returns JWT token
# Author        : Pradhumnya Changdev Kalsait
# Date          : 17/01/26
# Prototype     : Response login_user(void)
# Input Output  : (0 input, 1 output)
#
################################################################
"""
@auth_blueprint.route("/login", methods=["POST"])
def login_user():

    request_data = request.get_json()

    email = request_data.get("email")
    password = request_data.get("password")

    user = mongo.db.users.find_one({"email": email})

    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    if not UserModel.verify_password(user["password_hash"], password):
        return jsonify({"error": "Invalid credentials"}), 401

    access_token = create_access_token(
        identity=str(user["email"]),   # ✅ MUST BE STRING
        additional_claims={
            "role": user["role"]
        }
    )

    return jsonify({"access_token": access_token}), 200


"""
################################################################
#
# Function Name : register_user
# Description   : Registers a new doctor user
# Author        : Pradhumnya Changdev Kalsait
# Date          : 18/01/26
# Prototype     : Response register_user(void)
# Input Output  : (0 input, 1 output)
#
################################################################
"""
@auth_blueprint.route("/register", methods=["POST"])
def register_user():
    try:
        request_data = request.get_json()

        if not request_data:
            return jsonify({"error": "Invalid JSON"}), 400

        email = request_data.get("email")
        password = request_data.get("password")

        if not email or not password:
            return jsonify({"error": "Missing required fields"}), 400

        existing_user = mongo.db.users.find_one({"email": email})
        if existing_user:
            return jsonify({"error": "User already exists"}), 409

        user_doc = UserModel.create_user(
            email=email,
            password=password,
            role=UserRole.DOCTOR  # ✅ enum safe for MongoDB
        )

        mongo.db.users.insert_one(user_doc)

        return jsonify({"message": "User registered successfully"}), 201

    except Exception as e:
        print("Register error:", e)
        return jsonify({"error": "Internal server error"}), 500
