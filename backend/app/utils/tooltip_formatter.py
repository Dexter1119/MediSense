####################################################################
#
# File Name :   tooltip_formatter.py
# Description : Tooltip Formatting Utilities
# Author      : Pradhumnya Changdev Kalsait
# Date        : 27/02/26
#
####################################################################

def format_confidence_tooltip(label, probability):

    percentage = round(probability * 100, 2)

    return {
        "label": label,
        "probability": probability,
        "tooltip": f"{label} → {percentage}% confidence"
    }