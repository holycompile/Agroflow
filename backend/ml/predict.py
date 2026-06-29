import joblib
import pandas as pd

model = joblib.load("crop_model.pkl")

sample = pd.DataFrame([{
    "N": 90,
    "P": 42,
    "K": 43,
    "temperature": 21,
    "humidity": 82,
    "ph": 6.5,
    "rainfall": 202
}])

prediction = model.predict(sample)

print("Recommended Crop:", prediction[0])