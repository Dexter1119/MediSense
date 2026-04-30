####################################################################
#
# File Name :   jwt_utils.py
# Description : JWT role-based authorization utilities
# Author      : Pradhumnya Changdev Kalsait
# Date        : 17/01/26
#
####################################################################

from functools import wraps
from flask import jsonify
from flask_jwt_extended import (
    verify_jwt_in_request,
    get_jwt,
)

"""
################################################################
#
# Function Name : role_required
# Description   : Restricts access based on user role
# Author        : Pradhumnya Changdev Kalsait
# Date          : 17/01/26
# Prototype     : function role_required(string)
# Input Output  : (1 input, 1 output)
#
################################################################
"""
def role_required(required_role):
    
    """
    ################################################################
    #
    # Function Name : decorator
    # Description   : Wraps protected route with role validation
    #
    ################################################################
    """
    def decorator(function):
        
        """
        ################################################################
        #
        # Function Name : wrapper
        # Description   : Validates JWT and checks role claim
        #
        ################################################################
        """
        @wraps(function)
        def wrapper(*args, **kwargs):
            

            verify_jwt_in_request()

            jwt_claims = get_jwt()
            user_role = jwt_claims.get("role")

            if user_role != required_role:
                return jsonify({"error": "Access forbidden"}), 403

            return function(*args, **kwargs)

        return wrapper

    return decorator
