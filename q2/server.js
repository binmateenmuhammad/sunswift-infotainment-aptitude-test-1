const express = require("express");
const app = express();
app.use(express.json());

const ALLOWED_COMPONENTS = ["battery", "motor", "gps"];

let logs = [];

function validateLogEntry(entry) {
  const errors = [];

  if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
    return { valid: false, errors: ["Entry must be a JSON object"] };
  }

  const { timestamp, component, value } = entry;

  if (timestamp === undefined) {
    errors.push("Missing field: timestamp");
  } else if (typeof timestamp !== "number" || Number.isNaN(timestamp)) {
    errors.push("timestamp must be a number (ms since epoch)");
  }

  if (component === undefined) {
    errors.push("Missing field: component");
  } else if (!ALLOWED_COMPONENTS.includes(component)) {
    errors.push(`component must be one of: ${ALLOWED_COMPONENTS.join(", ")}`);
  }

  if (value === undefined) {
    errors.push("Missing field: value");
  } else if (typeof value !== "number" || Number.isNaN(value)) {
    errors.push("value must be a valid number");
  }

  return { valid: errors.length === 0, errors };
}

app.post("/logs/upload", (req, res) => {
  const body = req.body;

  if (!Array.isArray(body)) {
    return res.status(400).json({
      error: "Request body must be a JSON array of telemetry log entries",
    });
  }

  if (body.length === 0) {
    return res.status(400).json({
      error: "Request body array must not be empty",
    });
  }

  const accepted = [];
  const rejected = [];

  body.forEach((entry, index) => {
    const { valid, errors } = validateLogEntry(entry);
    if (valid) {
      accepted.push(entry);
    } else {
      rejected.push({ index, entry, errors });
    }
  });

  logs.push(...accepted);

  const responseBody = {
    acceptedCount: accepted.length,
    rejectedCount: rejected.length,
    rejected,
  };

  const status = accepted.length > 0 ? 201 : 400;
  res.status(status).json(responseBody);
});

app.get("/logs/summary", (req, res) => {
  if (logs.length === 0) {
    return res.status(200).json({
      count: 0,
      components: {},
      latest: null,
    });
  }

  const components = {};

  for (const log of logs) {
    if (!components[log.component]) {
      components[log.component] = {
        count: 0,
        min: log.value,
        max: log.value,
        sum: 0,
      };
    }
    const stats = components[log.component];
    stats.count += 1;
    stats.min = Math.min(stats.min, log.value);
    stats.max = Math.max(stats.max, log.value);
    stats.sum += log.value;
  }

  for (const key of Object.keys(components)) {
    const stats = components[key];
    stats.avg = stats.sum / stats.count;
    delete stats.sum;
  }

  const latest = logs.reduce((latestSoFar, log) =>
    log.timestamp > latestSoFar.timestamp ? log : latestSoFar
  );

  res.status(200).json({
    count: logs.length,
    components,
    latest,
  });
});

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Malformed JSON in request body" });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Telemetry API listening on port ${PORT}`);
});

module.exports = app;
