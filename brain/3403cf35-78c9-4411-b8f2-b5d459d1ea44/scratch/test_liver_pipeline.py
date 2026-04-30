import sys
import os
import joblib
import numpy as np
import pandas as pd
import logging

# Path setup: add backend/app/services to path so we can import liver_service directly
backend_services_path = os.path.join(os.getcwd(), "backend", "app", "services")
sys.path.append(backend_services_path)

# Mocking the logger
logging.basicConfig(level=logging.INFO)

# Import directly from the file (without 'app.' prefix)
import liver_service

# Test Data 1: Healthy Case
test_data_healthy = {
    "age": 35.0,
    "gender": 1,
    "alb": 4.0,
    "alp": 80.0,
    "alt": 25.0,
    "ast": 25.0,
    "bil": 0.8,
    "direct_bilirubin": 0.2,
    "che": 8.0,
    "chol": 180.0,
    "crea": 0.9,
    "ggt": 30.0,
    "prot": 7.0
}

# Test Data 2: Cirrhosis Case
test_data_cirrhosis = {
    "age": 55.0,
    "gender": 1,
    "alb": 2.5,
    "alp": 250.0,
    "alt": 150.0,
    "ast": 180.0,
    "bil": 4.5,
    "direct_bilirubin": 2.0,
    "che": 3.0,
    "chol": 120.0,
    "crea": 1.8,
    "ggt": 120.0,
    "prot": 5.5,
    "inr": 2.1,
    "sodium": 132.0,
    "ascites": 0,
    "encephalopathy": 0
}

def run_test(name, data):
    print(f"\n--- Running Test: {name} ---")
    try:
        # 1. Prediction
        result = liver_service.predict_liver_disease(data)
        print("Diagnosis:", result.get("primary_diagnosis"))
        print("Recommendation:", result.get("recommendation"))
        print("Secondary Model Used:", result.get("secondary_model_used"))
        
        # 2. Report Generation
        print("\n--- Generating Report Dict ---")
        report = liver_service.generate_report(data, result)
        print("Report AI Diagnosis:", report["ai_diagnosis"]["primary_diagnosis"])
        
        # 3. PDF Generation
        print("\n--- Generating PDF Bytes ---")
        pdf_bytes = liver_service.generate_pdf_from_report(report)
        print(f"PDF Size: {len(pdf_bytes)} bytes")
        
    except Exception as e:
        print("Error during test:", e)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_test("Healthy/Early Case", test_data_healthy)
    run_test("Cirrhosis Case", test_data_cirrhosis)
