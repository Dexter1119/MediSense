import os
import joblib
import pandas as pd
import numpy as np

_ML = r"c:\Users\Admin\Desktop\GUI-Final-Year-Project\backend\ml_models\liver_models"

def test_load():
    try:
        model1 = joblib.load(os.path.join(_ML, "cirhosis", "VotingClfCirh.pkl"))
        print("Model 1 loaded.")
        model2 = joblib.load(os.path.join(_ML, "yesno", "yesnoClfCirh.pkl"))
        print("Model 2 loaded.")
        scaler1 = joblib.load(os.path.join(_ML, "scalers", "scaler1.pkl"))
        print("Scaler 1 loaded.")
        scaler2 = joblib.load(os.path.join(_ML, "scalers", "scaler_stage2.pkl"))
        print("Scaler 2 loaded.")
        
        # Test Scaler 1 transform
        dummy1 = pd.DataFrame([[40, 1, 40, 100, 30, 30, 15, 7, 5, 80, 40, 70]], columns=[
            "Age", "Sex", "ALB", "ALP", "ALT", "AST", "BIL", "CHE", "CHOL", "CREA", "GGT", "PROT"
        ])
        scaled1 = scaler1.transform(dummy1)
        print("Scaler 1 transform success. Shape:", scaled1.shape)
        
        # Test Scaler 2 transform
        dummy2 = np.array([[40, 1, 1.0, 0.3, 100, 30, 30, 7.0, 4.0, 1.2]])
        scaled2 = scaler2.transform(dummy2)
        print("Scaler 2 transform success. Shape:", scaled2.shape)
        
        return True
    except Exception as e:
        print("Test failed:", e)
        return False

if __name__ == "__main__":
    test_load()
