####################################################################
#
# File Name :   doctor_controller.py
# Description : Doctor-specific protected API routes
# Author      : Pradhumnya Changdev Kalsait
# Date        : 17/01/26
#
####################################################################

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.utils.jwt_utils import role_required
from app.utils.constants import UserRole

doctor_blueprint = Blueprint("doctor", __name__)

"""
################################################################
#
# Function Name : doctor_dashboard
# Description   : Doctor dashboard protected endpoint
# Author        : Pradhumnya Changdev Kalsait
# Date          : 17/01/26
# Prototype     : Response doctor_dashboard(void)
# Input Output  : (0 input, 1 output)
#
################################################################
"""

@doctor_blueprint.route("/dashboard", methods=["GET"])
@jwt_required()
@role_required(UserRole.DOCTOR)
def doctor_dashboard():
    
    return jsonify({"message": "Doctor access granted"}), 200
