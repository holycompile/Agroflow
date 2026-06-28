from geopy.geocoders import Nominatim
from flask import Flask, jsonify, request
from flask_cors import CORS
import ee

app = Flask(__name__)
CORS(app)

geolocator = Nominatim(user_agent="agroflow")

ee.Initialize(project='agroflow-500115')


@app.route("/api/location")
def get_data():

    location = request.args.get("location", "Indore")

    place = geolocator.geocode(location)

    if place is None:
        return jsonify({"error": "Location not found"})

    latitude = place.latitude
    longitude = place.longitude

    region = ee.Geometry.Point([longitude, latitude]).buffer(5000)

    image = (
        ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
        .filterBounds(region)
        .filterDate("2024-01-01", "2024-12-31")
        .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 20))
        .median()
    )

    # Vegetation indices
    ndvi = image.normalizedDifference(["B8", "B4"])
    ndwi = image.normalizedDifference(["B8", "B11"])

    # Derived indices
    stress = ndvi.subtract(ndwi)
    vci = ndvi.multiply(100)
    smi = ndwi.multiply(100)

    # Mean values
    ndviValue = ndvi.reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=region,
        scale=10
    )

    ndwiValue = ndwi.reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=region,
        scale=10
    )

    stressValue = stress.reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=region,
        scale=10
    )

    vciValue = vci.reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=region,
        scale=10
    )

    smiValue = smi.reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=region,
        scale=10
    )

    print(ndviValue.getInfo())
    print(ndwiValue.getInfo())
    print(stressValue.getInfo())
    print(vciValue.getInfo())
    print(smiValue.getInfo())

    eviValue = ndvi.multiply(1.1)
    eviResult = eviValue.reduceRegion(
    reducer=ee.Reducer.mean(),
    geometry=region,
    scale=10
    )
    result = {
    "lat": latitude,
    "lon": longitude,

    "ndvi": list(ndviValue.getInfo().values())[0],
    "ndwi": list(ndwiValue.getInfo().values())[0],
    "stress": list(stressValue.getInfo().values())[0],

    "vci": list(vciValue.getInfo().values())[0],
    "smi": list(smiValue.getInfo().values())[0],

    "evi": list(eviResult.getInfo().values())[0],
    "rainfall": 650,
    "temperature": 28
    }

    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True)