const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const routes = require("./routes");
const uploadRoutes = require("./routes/upload.routes");
const { notFound, errorHandler } = require("./middleware/error.middleware");

const app = express();

const parseCsvEnv = (value) =>
  String(value || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const normalizeOrigin = (origin) => {
  if (!origin) {
    return "";
  }

  try {
    return new URL(origin).origin;
  } catch {
    return origin.replace(/\/+$/, "");
  }
};

const allowedOrigins = new Set(
  [
    "https://docuthinker-pi.vercel.app",
    ...parseCsvEnv(process.env.CLIENT_URLS),
    ...parseCsvEnv(process.env.CLIENT_URL),
  ].map(normalizeOrigin)
);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      const allowDevelopmentOrigin = process.env.NODE_ENV !== "production" && allowedOrigins.size === 0;

      const normalizedOrigin = normalizeOrigin(origin);

      if (!origin || allowedOrigins.has(normalizedOrigin) || allowDevelopmentOrigin) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
    exposedHeaders: ["Content-Disposition"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "DocuThinker backend API is running",
  });
});

app.use("/api/upload", uploadRoutes);
app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
