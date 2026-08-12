/*
 * This component cleans the telemetry data and displays the latest vehicle information.
 * Missing or corrupted values are converted to null and handled with fallback text.
 * The known speed outliers (40 and 300 km/h) are treated as invalid and ignored.
 * Recharts is used to display the vehicle speed over time.
 */

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import telemetryData from "./telemetry_sample.json";

function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function cleanTelemetry(data) {
  return data.map((entry) => {
    let speed = toNumber(entry.speed);
    const battery = toNumber(entry.battery);
    const motorTemp = toNumber(entry.motorTemp);

    // Treat known speed outliers as invalid.
    if (speed === 40 || speed === 300) {
      speed = null;
    }

    let gps = null;

    if (entry.gps) {
      const lat = toNumber(entry.gps.lat);
      const lng = toNumber(entry.gps.lng);

      if (lat !== null && lng !== null) {
        gps = { lat, lng };
      }
    }

    return {
      timestamp: toNumber(entry.timestamp),
      speed,
      battery,
      motorTemp,
      gps,
    };
  });
}

function App() {
  const [telemetry, setTelemetry] = useState([]);

  useEffect(() => {
    setTelemetry(cleanTelemetry(telemetryData));
  }, []);

  if (telemetry.length === 0) {
    return <p>No telemetry data available.</p>;
  }

  const latest = telemetry[telemetry.length - 1];

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Vehicle Telemetry</h1>

      <div style={{ display: "flex", gap: "40px" }}>
        <div>
          <h3>Speed</h3>
          <p>
            {latest.speed !== null
              ? `${latest.speed} km/h`
              : "Unavailable"}
          </p>
        </div>

        <div>
          <h3>Battery</h3>
          <p>
            {latest.battery !== null
              ? `${latest.battery}%`
              : "Unavailable"}
          </p>
        </div>

        <div>
          <h3>Motor Temperature</h3>
          <p
            style={{
              color:
                latest.motorTemp > 90 ? "red" : "black",
            }}
          >
            {latest.motorTemp !== null
              ? `${latest.motorTemp}°C`
              : "Unavailable"}
          </p>

          {latest.motorTemp > 90 && (
            <strong>⚠️ High temperature!</strong>
          )}
        </div>
      </div>

      <h2>Speed Over Time</h2>

      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={telemetry}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="timestamp"
            tickFormatter={(timestamp) =>
              new Date(timestamp).toLocaleTimeString()
            }
          />

          <YAxis />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="speed"
            connectNulls
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default App;
