import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Popup,
  GeoJSON
} from "react-leaflet";



import "leaflet/dist/leaflet.css";
import StressLayer from "./StressLayer";
import IrrigationLayer from "./IrrigationLayer";

interface SatelliteMapProps {
  location?: string;
}













const createBoundary = (
  lat: number,
  lon: number
) => ({
  type: "Feature",
  properties: {
    name: "Farm Boundary"
  },
  geometry: {
    type: "Polygon",
    coordinates: [[
      [lon - 0.02, lat - 0.02],
      [lon + 0.02, lat - 0.02],
      [lon + 0.02, lat + 0.02],
      [lon - 0.02, lat + 0.02],
      [lon - 0.02, lat - 0.02]
    ]]
  }
});







const SatelliteMap: React.FC<SatelliteMapProps> = ({ location }) => {
  
  console.log("LOCATION RECEIVED:", location);
  
  const [satelliteData, setSatelliteData] = useState({
    ndvi: 0,
    ndwi: 0,
    stress: 0,
    smi: 0
  });



    const [center, setCenter] =
    useState<[number, number]>([
      22.5726,
      88.3639
    ]);




  useEffect(() => {
  if (!location) return;

        fetch(
          `http://127.0.0.1:5000/api/location?location=${location}`
        )
          .then((res) => res.json())
          .then((data) => {
            console.log("API DATA:", JSON.stringify(data));
            setSatelliteData({
              ndvi: data.ndvi,
              ndwi: data.ndwi,
              stress: data.stress,
              smi: data.stress
            });

            setCenter([data.lat, data.lon]); // Update center based on fetched data
          })
          .catch((err) => {
            console.error(err);
          });
      }, [location]);

 


 
  

  console.log("Center:", center);

  console.log(center[0], center[1]);

  


  const boundary = createBoundary(
    center[0],
    center[1]
  );
  

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <h2 className="text-xl font-bold mb-4">
        Satellite Crop Monitoring
      </h2>



    {satelliteData && (
        <div className="mb-4 p-3 bg-green-50 rounded-lg">
          <p>
            <strong>NDVI:</strong>{" "}
            {satelliteData.ndvi?.toFixed(3)}
          </p>

          <p>
            <strong>NDWI:</strong>{" "}
            {satelliteData.ndwi?.toFixed(3)}
          </p>

          <p>
            <strong>Stress Index:</strong>{" "}
            {satelliteData.stress?.toFixed(3)}
          </p>
        </div>
      )}



       


      <MapContainer
        key={center.join(",")} // Force re-render when center changes 
        center={center}
        zoom={14}
        style={{
          height: "500px",
          width: "100%"
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

                    <GeoJSON data={boundary as any} />

        
        <StressLayer
          center={center}
          stress={satelliteData.stress}
          ndvi={satelliteData.ndvi}
          ndwi={satelliteData.ndwi}
          smi={satelliteData.smi}
        />
        <IrrigationLayer />
      </MapContainer>
    </div>
  );
};

export default SatelliteMap;