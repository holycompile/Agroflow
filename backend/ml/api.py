from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd

app = Flask(__name__)
CORS(app)

model = joblib.load("crop_model.pkl")

@app.route("/")
def home():
    return "AgroFlow AI API Running"

@app.route("/predict", methods=["POST"])
def predict():

    data = request.json

    sample = pd.DataFrame([{
        "N": data["N"],
        "P": data["P"],
        "K": data["K"],
        "temperature": data["temperature"],
        "humidity": data["humidity"],
        "ph": data["ph"],
        "rainfall": data["rainfall"]
    }])

    prediction = model.predict(sample)

    return jsonify({
        "crop": prediction[0],
        "temperature": data["temperature"],
        "humidity": data["humidity"],
        "rainfall": data["rainfall"],
        "accuracy": 90.4
    })

if __name__ == "__main__":
    app.run(debug=True, port=5001)