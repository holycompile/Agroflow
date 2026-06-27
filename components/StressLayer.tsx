import React from "react";
import { Polygon, Popup } from "react-leaflet";

interface StressLayerProps {
  center: [number, number];
  stress: number;
  ndvi: number;
  ndwi: number;
  smi: number;
}

const StressLayer: React.FC<StressLayerProps> = ({
  center,
  stress,
  ndvi,
  ndwi,
  smi
}) => {

  const [lat, lng] = center;

  const size = 0.01;

  const cells = [];

  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {

      const value = Math.random();

      let color = "#2ecc71";
      let level = "No Stress";

      if (value > 0.8) {
        color = "#d63031";
        level = "Severe Stress";
      }
      else if (value > 0.6) {
        color = "#e17055";
        level = "High Stress";
      }
      else if (value > 0.4) {
        color = "#f1c40f";
        level = "Moderate Stress";
      }
      else if (value > 0.2) {
        color = "#81c784";
        level = "Low Stress";
      }

      const x = lat + (i - 2) * size;
      const y = lng + (j - 2) * size;

      cells.push({
        color,
        level,
        coords: [
          [x, y],
          [x + size, y],
          [x + size, y + size],
          [x, y + size]
        ]
      });
    }
  }

  return (
    <>
      {cells.map((cell, index) => (
        <Polygon
          key={index}
          positions={cell.coords as any}
          pathOptions={{
            color: "#222",
            weight: 1,
            fillColor: cell.color,
            fillOpacity: 0.65
          }}
        >
          <Popup>
            <h3>Stress Analysis</h3>

            <p>
              <strong>Status:</strong> {cell.level}
            </p>

            <p>
              <strong>NDVI:</strong> {ndvi.toFixed(2)}
            </p>

            <p>
              <strong>NDWI:</strong> {ndwi.toFixed(2)}
            </p>

            <p>
              <strong>SMI:</strong> {smi.toFixed(2)}
            </p>
          </Popup>
        </Polygon>
      ))}
    </>
  );
};

export default StressLayer;