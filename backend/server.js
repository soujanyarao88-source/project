require("dotenv").config();
const path = require("node:path");
const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const issuesRouter = require("./routes/issues");
const adminRouter = require("./routes/admin");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === "production";

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.startsWith("replace_with_")) {
  console.warn("WARNING: Set a strong SESSION_SECRET in backend/.env before using this application.");
}
if (isProduction) app.set("trust proxy", 1);

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());
app.use(session({
  name: "civic.sid",
  secret: process.env.SESSION_SECRET || "unsafe-development-secret-change-me",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 2 * 60 * 60 * 1000,
    path: "/"
  }
}));

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "CivicTrack API" }));
app.use("/api/issues", issuesRouter);
app.use("/api/admin", adminRouter);
app.use(express.static(path.join(__dirname, "..", "frontend")));

app.use("/api", (req, res) => res.status(404).json({ error: "API endpoint not found." }));
app.use((err, req, res, next) => {
  // Detailed errors stay in the server log; clients receive a safe message.
  console.error("Request failed:", err.message || err);
  if (res.headersSent) return next(err);
  const message = err && err.code === "PGRST116" ? "The requested record was not found." : "The server could not complete the request. Check the server configuration and try again.";
  res.status(500).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`CivicTrack is running at http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
