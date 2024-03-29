import http from "http";
import express from "express";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import { applyRoutes } from "./routes/routes";

dotenv.config()

const app = express();

const INDEX_HTML_DIR = path.join(__dirname, "..", "..", "react-app", "build");
const PORT = (process.env.PORT || 3002) as unknown as number;
const HOST = process.env.HOST || "localhost";
const NODE_ENV = process.env.NODE_ENV || "production";

if (NODE_ENV === "development") {
  console.log("CORS enabled");
  app.use(cors());
} else {
  console.log("CORS disabled");
}
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(INDEX_HTML_DIR));

app.get("/", (req, res) => {
  res.sendFile(path.join(INDEX_HTML_DIR, "index.html"));
})

// Configure api routes
applyRoutes(app);

const server = http.createServer(app);

server.listen(PORT, HOST, () => {
  console.log(`Server started in mode ${NODE_ENV} on http://${HOST}:${PORT}`);
})