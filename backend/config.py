####################################################################
#
# File Name :   config.py
# Description : Central configuration file for Flask backend
# Author      : Pradhumnya Changdev Kalsait
# Date        : 17/01/26
#
####################################################################

import os
from datetime import timedelta

"""
################################################################
#
# Class Name  : Config
# Description : Holds application-wide configuration values
#
################################################################
"""
class Config:

    SECRET_KEY = os.environ.get("SECRET_KEY", "gui-fyp-secret-key")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "gui-fyp-jwt-secret")

    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=30)

    
    MONGO_URI = os.environ.get(
        "MONGO_URI",
        "mongodb://localhost:27017/gui_fyp_db"
    )


    

