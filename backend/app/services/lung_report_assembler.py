####################################################################
#
# File Name :   lung_report_assembler.py
# Description : Structured COPD Clinical Report Builder
# Author      : Pradhumnya Changdev Kalsait
# Date        : 27/02/26
#
####################################################################

from datetime import datetime


def assemble_copd_report(stage1, stage2, topography=None):

    report = {
        "generated_at": datetime.now().strftime("%d %B %Y, %H:%M"),
        "stage1": stage1,
        "stage2": stage2,
        "topography": None
    }

    # Add Topography Summary if available
    if topography:
        report["topography"] = {
            "statistics": topography.get("statistics"),
            "matrix": topography.get("matrix")
        }

    # Clinical Note Logic
    if stage2:
        gold = stage2.get("gold_stage")

        clinical_note_map = {
            1: "Mild COPD. Lifestyle modification and bronchodilator therapy recommended.",
            2: "Moderate COPD. Pulmonary rehabilitation advised.",
            3: "Severe COPD. Frequent monitoring required.",
            4: "Very Severe COPD. High risk — specialist care required."
        }

        report["clinical_note"] = clinical_note_map.get(
            gold,
            "Clinical evaluation recommended."
        )
    else:
        report["clinical_note"] = "Stage-2 severity not executed."

    return report