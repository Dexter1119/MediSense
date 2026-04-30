from app.services.lung_stage1_service import predict_stage1
from app.services.lung_stage2_service import predict_stage2

def full_copd_pipeline(breath_file, clinical_data=None):

    stage1_result = predict_stage1(breath_file)

    response = {
        "stage1": stage1_result,
        "stage2": None
    }

    # Only proceed if COPD detected with confidence
    if (
        stage1_result["prediction"] == "COPD" and
        stage1_result["meets_threshold"]
    ):

        if clinical_data is None:
            response["stage2"] = "Clinical data required for severity prediction."
        else:
            stage2_result = predict_stage2(clinical_data)
            response["stage2"] = stage2_result

    return response