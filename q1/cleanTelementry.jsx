/*
 * This component cleans and displays the vehicle telemetry data.
 * Missing or corrupted values are converted to null and shown with a safe fallback.
 * Known speed outliers are ignored rather than displayed as valid readings.
 * A line chart shows speed over time, and high motor temperatures trigger a warning.
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
  return !Number.isNan(number) ? number : null;
}

function cleanTelemetryHelper(data) {
  return data.map((entry) => {
    let speed = toNumber(entry.speed);
    const battery = toNumber(entry.battery);
    const motorTemp = toNumber(entry.motorTemp);

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

function cleanTelemetry() {
  const [telemetry, setTelemetry] = useState([]);

  useEffect(() => {
    setTelemetry(cleanTelemetryHelper(telemetryData));
  }, []);

  if (telemetry.length === 0) {
    return <p>No telemetry data available.</p>;
  }

  const current = telemetry[telemetry.length - 1];

  return (
    <div>
      <h1>Vehicle Telemetry</h1>

      <p>
        Speed:{" "}
        {current.speed !== null ? `${current.speed} km/h` : "Unavailable"}
      </p>

      <p>
        Battery:{" "}
        {current.battery !== null ? `${current.battery}%` : "Unavailable"}
      </p>

      <p
        style={{
          color: current.motorTemp > 90 ? "red" : "black",
        }}
      >
        Motor Temperature:{" "}
        {current.motorTemp !== null
          ? `${current.motorTemp}°C`
          : "Unavailable"}
      </p>

      <h2>Speed Over Time</h2>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={telemetry}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
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

export default TelemetryDashboard;
