####################################################################
#
# File Name :   user_model.py
# Description : User model helper functions for MongoDB
# Author      : Pradhumnya Changdev Kalsait
# Date        : 17/01/26
#
####################################################################

from werkzeug.security import generate_password_hash, check_password_hash

"""
################################################################
#
# Class Name  : UserModel
# Description : Handles user-related database operations
#
################################################################
"""
class UserModel:
    
    """
    ################################################################
    #
    # Function Name : create_user
    # Description   : Creates a user document for MongoDB
    # Author        : Pradhumnya Changdev Kalsait
    # Date          : 17/01/26
    # Prototype     : dict create_user(string, string, string)
    # Input Output  : (3 input, 1 output)
    #
    ################################################################
    """
    @staticmethod
    def create_user(email, password, role):
        return {
            "email": email,
            "password_hash": generate_password_hash(password),
            "role": role
        }
    
    """
    ################################################################
    #
    # Function Name : verify_password
    # Description   : Verifies a plaintext password against hash
    # Author        : Pradhumnya Changdev Kalsait
    # Date          : 17/01/26
    # Prototype     : bool verify_password(string, string)
    # Input Output  : (2 input, 1 output)
    #
    ################################################################
    """
    @staticmethod
    def verify_password(password_hash, password):
        
        return check_password_hash(password_hash, password)
