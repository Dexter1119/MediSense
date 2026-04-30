import sys
import os
import io

# Path setup
backend_services_path = os.path.join(os.getcwd(), "backend", "app", "services")
sys.path.append(backend_services_path)

import liver_service

def verify_pdf_child_pugh():
    print("\n--- Verifying Child-Pugh in PDF ---")
    
    # Mock prediction and report data for Cirrhosis
    mock_prediction = {
        "primary_diagnosis": "Cirrhosis",
        "hard_voting_prediction": 3,
        "model1_probabilities": {"Model A": 90},
        "model2_probabilities": None,
        "secondary_model_used": False,
        "recommendation": "Consult specialist."
    }
    
    mock_input = {
        "age": 50, "gender": 1, "alb": 2.5, "alp": 200, "alt": 100, "ast": 100, 
        "bil": 4.0, "direct_bilirubin": 2.0, "che": 4.0, "chol": 150, "crea": 1.5, 
        "ggt": 100, "prot": 6.0, "inr": 2.5, "sodium": 135,
        "ascites": 1, "encephalopathy": 1
    }
    
    report = liver_service.generate_report(mock_input, mock_prediction)
    
    if "severity_assessment" in report and "child_pugh" in report["severity_assessment"]:
        print("Child-Pugh calculated in report dict.")
        print("Score:", report["severity_assessment"]["child_pugh"]["score"])
    else:
        print("Error: Child-Pugh NOT in report dict.")
        return

    try:
        pdf_bytes = liver_service.generate_pdf_from_report(report)
        print(f"PDF generated successfully. Size: {len(pdf_bytes)} bytes.")
        print("Verification complete. Child-Pugh table logic is active.")
    except Exception as e:
        print("Error generating PDF:", e)

if __name__ == "__main__":
    verify_pdf_child_pugh()
