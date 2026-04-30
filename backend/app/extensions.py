####################################################################
#
# File Name :   extensions.py
# Description : Initializes Flask extensions (MongoDB, JWT)
# Author      : Pradhumnya Changdev Kalsait
# Date        : 17/01/26
#
####################################################################

from flask_pymongo import PyMongo
from flask_jwt_extended import JWTManager

mongo = PyMongo()
jwt = JWTManager()
