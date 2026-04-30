####################################################################
#
# File Name :   error_handler.py
# Description : Centralized error handling for Flask application
# Author      : Pradhumnya Changdev Kalsait
# Date        : 17/01/26
#
####################################################################

from flask import jsonify
from flask_jwt_extended.exceptions import (
    NoAuthorizationError,
    InvalidHeaderError,
    JWTDecodeError,
)
from werkzeug.exceptions import BadRequest, NotFound, MethodNotAllowed

"""
################################################################
#
# Function Name : register_error_handlers
# Description   : Registers all global error handlers
# Author        : Pradhumnya Changdev Kalsait
# Date          : 17/01/26
# Prototype     : void register_error_handlers(Flask)
# Input Output  : (1 input, 0 output)
#
################################################################
"""
def register_error_handlers(application):

    """
    ################################################################
    #
    # Function Name : handle_missing_authorization
    # Description   : Handles missing JWT authorization header
    #
    ################################################################
    """
    @application.errorhandler(NoAuthorizationError)
    def handle_missing_authorization(error):

        return jsonify({"error": "Authorization token is missing"}), 401
    
    """
    ################################################################
    #
    # Function Name : handle_invalid_header
    # Description   : Handles malformed authorization headers
    #
    ################################################################
    """

    @application.errorhandler(InvalidHeaderError)
    def handle_invalid_header(error):
        
        return jsonify({"error": "Invalid authorization header"}), 422
    
    """
    ################################################################
    #
    # Function Name : handle_jwt_decode_error
    # Description   : Handles JWT decoding errors
    #
    ################################################################
    """
    @application.errorhandler(JWTDecodeError)
    def handle_jwt_decode_error(error):

        return jsonify({"error": "Invalid or expired token"}), 401
    """
    ################################################################
    #
    # Function Name : handle_bad_request
    # Description   : Handles malformed request payloads
    #
    ################################################################
    """
    @application.errorhandler(BadRequest)
    def handle_bad_request(error):
        
        return jsonify({"error": "Bad request"}), 400

    """
    ################################################################
    #
    # Function Name : handle_not_found
    # Description   : Handles unknown routes
    #
    ################################################################
    """
    @application.errorhandler(NotFound)
    def handle_not_found(error):

        return jsonify({"error": "Resource not found"}), 404
    """
    ################################################################
    #
    # Function Name : handle_method_not_allowed
    # Description   : Handles unsupported HTTP methods
    #
    ################################################################
    """
    @application.errorhandler(MethodNotAllowed)
    def handle_method_not_allowed(error):
        
        return jsonify({"error": "Method not allowed"}), 405
    
    """
    ################################################################
    #
    # Function Name : handle_internal_server_error
    # Description   : Handles unexpected server errors
    #
    ################################################################
    """
    @application.errorhandler(Exception)
    def handle_internal_server_error(error):
       
        return jsonify({"error": "Internal server error"}), 500
