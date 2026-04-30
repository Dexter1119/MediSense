####################################################################
#
# File Name :   __init__.py
# Description : Flask application factory
# Author      : Pradhumnya Changdev Kalsait
# Date        : 17/01/26
#
####################################################################

from flask import Flask
from config import Config
from app.extensions import mongo, jwt
from flask_cors import CORS

"""
################################################################
#
# Function Name : create_app
# Description   : Creates and configures the Flask application
# Author        : Pradhumnya Changdev Kalsait
# Date          : 17/01/26
# Prototype     : Flask create_app(void)
# Input Output  : (0 input, 1 output)
#
################################################################


create_app()
 ├─ load config
 ├─ init Mongo
 ├─ init JWT
 ├─ register blueprints
 ├─ register error handlers
 └─ return app

"""


def create_app():

    application = Flask(__name__)
    application.config.from_object(Config)

    # ================= INITIALIZE EXTENSIONS =================
    mongo.init_app(application)
    jwt.init_app(application)

    # ================= REGISTER CORE BLUEPRINTS =================
    from app.controllers.auth_controller import auth_blueprint
    application.register_blueprint(auth_blueprint, url_prefix="/api/auth")

    from app.controllers.user_controller import user_blueprint
    application.register_blueprint(user_blueprint, url_prefix="/api/users")

    from app.controllers.doctor_controller import doctor_blueprint
    application.register_blueprint(doctor_blueprint, url_prefix="/api/doctor")

    # ================= REGISTER ORGAN BLUEPRINTS =================
    from app.controllers.lung_controller import lung_blueprint
    from app.controllers.liver_controller import liver_blueprint
    from app.controllers.kidney_controller import kidney_blueprint
    from app.controllers.heart_controller import heart_blueprint

    application.register_blueprint(lung_blueprint, url_prefix="/api/lung")
    application.register_blueprint(liver_blueprint, url_prefix="/api/liver")
    application.register_blueprint(kidney_blueprint, url_prefix="/api/kidney")
    application.register_blueprint(heart_blueprint, url_prefix="/api/heart")

    # ================= HEALTH CHECK ROUTE =================
    """
    ################################################################
    #
    # Function Name : health_check
    # Description   : Health check endpoint for backend validation
    # Author        : Pradhumnya Changdev Kalsait
    # Date          : 17/01/26
    # Prototype     : dict health_check(void)
    # Input Output  : (0 input, 1 output)
    #
    ################################################################
    """
    @application.route("/api/health", methods=["GET"])
    def health_check():
        return {"status": "Backend running successfully"}, 200

    # ================= ENABLE CORS =================
    CORS(
        application,
        resources={r"/api/*": {"origins": "http://localhost:5173"}},
        supports_credentials=True
    )

    # ================= REGISTER ERROR HANDLERS =================
    from app.utils.error_handler import register_error_handlers
    register_error_handlers(application)

    return application