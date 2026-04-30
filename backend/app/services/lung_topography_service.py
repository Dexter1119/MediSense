####################################################################
#
# File Name :   lung_topography_service.py
# Description : Lung Topography Processing & Tooltip Formatting
# Author      : Pradhumnya Changdev Kalsait
# Date        : 27/02/26
#
####################################################################

import pandas as pd
import numpy as np


def process_topography(file):

    df = pd.read_csv(file)

    matrix = df.values.tolist()

    stats = {
        "max": float(np.max(df.values)),
        "min": float(np.min(df.values)),
        "mean": float(np.mean(df.values)),
        "std": float(np.std(df.values))
    }

    # Prepare tooltip-ready structure
    tooltip_matrix = []

    for row_index, row in enumerate(matrix):
        tooltip_row = []
        for col_index, value in enumerate(row):
            tooltip_row.append({
                "x": col_index,
                "y": row_index,
                "value": float(value),
                "tooltip": f"Sensor ({row_index}, {col_index}) → {value:.4f}"
            })
        tooltip_matrix.append(tooltip_row)

    return {
        "matrix": matrix,
        "tooltip_matrix": tooltip_matrix,
        "statistics": stats
    }