####################################################################
#
# File Name :   app.py
# Description : Entry point for Flask backend application
# Author      : Pradhumnya Changdev Kalsait
# Date        : 17/01/26
#
####################################################################

from app import create_app

"""
################################################################
#
# Function Name : main
# Description   : Starts the Flask backend server
# Author        : Pradhumnya Changdev Kalsait
# Date          : 17/01/26
# Prototype     : void main(void)
# Input Output  : (0 input, 0 output)
#
################################################################
"""
def main():
    application = create_app()
    application.run(host="127.0.0.1", port=5000, debug=True)


if __name__ == "__main__":
    main()
