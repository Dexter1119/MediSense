import numpy as np
from scipy.stats import skew, kurtosis


def extract_sensor_features(signal: np.ndarray):
    return [
        np.mean(signal),
        np.std(signal),
        np.min(signal),
        np.max(signal),
        np.median(signal),
        np.sqrt(np.mean(signal ** 2)),  # RMS
        np.sum(signal ** 2),            # Energy
        skew(signal),
        kurtosis(signal)
    ]


def extract_enose_features(df):
    """
    Expecting:
    - Rows = time samples (~4000)
    - Columns = 8 sensors
    """

    if df.shape[1] != 8:
        raise ValueError("Stage-1 requires exactly 8 sensor columns.")

    feature_vector = []

    for sensor_idx in range(8):
        sensor_signal = df.iloc[:, sensor_idx].values
        sensor_features = extract_sensor_features(sensor_signal)
        feature_vector.extend(sensor_features)

    return np.array(feature_vector).reshape(1, -1)