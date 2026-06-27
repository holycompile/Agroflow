import React from "react";
import { Polygon, Popup } from "react-leaflet";

const irrigationZones = [
  {
    id: 1,
    coords: [
      [22.5740, 88.3670],
      [22.5750, 88.3680],
      [22.5735, 88.3690]
    ],
    deficit: 32,
    recommendation: "Apply 30 mm irrigation within 24 hours",
    priority: "High",
    color: "#2563eb"
  },
  {
    id: 2,
    coords: [
      [22.5710, 88.3620],
      [22.5720, 88.3630],
      [22.5705, 88.3645]
    ],
    deficit: 15,
    recommendation: "Apply 15 mm irrigation within 3 days",
    priority: "Medium",
    color: "#3b82f6"
  }
];

const IrrigationLayer: React.FC = () => {
  return (
    <>
      {irrigationZones.map((zone) => (
        <Polygon
          key={zone.id}
          positions={zone.coords as any}
          pathOptions={{
            color: zone.color,
            fillOpacity: 0.25
          }}
        >
          <Popup>
            <div>
              <h3>
                <strong>Irrigation Advisory</strong>
              </h3>

              <strong>Water Deficit:</strong> {zone.deficit}%
              <br />

              <strong>Recommendation:</strong>
              <br />
              {zone.recommendation}

              <br />
              <br />

              <strong>Priority:</strong> {zone.priority}
            </div>
          </Popup>
        </Polygon>
      ))}
    </>
  );
};

export default IrrigationLayer;