####################################################################
#
# File Name :   user_controller.py
# Description : User-related protected API routes
# Author      : Pradhumnya Changdev Kalsait
# Date        : 17/01/26
#
####################################################################

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.utils.jwt_utils import role_required
from app.utils.constants import UserRole

user_blueprint = Blueprint("users", __name__)

"""
################################################################
#
# Function Name : admin_only_endpoint
# Description   : Example endpoint accessible only to ADMIN users
# Author        : Pradhumnya Changdev Kalsait
# Date          : 17/01/26
# Prototype     : Response admin_only_endpoint(void)
# Input Output  : (0 input, 1 output)
#
################################################################
"""
@user_blueprint.route("/admin-only", methods=["GET"])
@jwt_required()
@role_required(UserRole.ADMIN)
def admin_only_endpoint():
    
    return jsonify({"message": "Admin access granted"}), 200
