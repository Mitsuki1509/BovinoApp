import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import userRouter from "./routes/userRoutes.js";
import typeRouter from "./routes/typeRoutes.js"; 
import potreroRouter from "./routes/potreroRouter.js";
import loteRouter from "./routes/loteRouter.js";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.static("public"));
app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    message: "API Bovino funcionando correctamente",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (_req, res) => {
  res.json({
    message: "Bienvenido al Sistema de Gestión Bovino",
    version: "1.0.0",
    endpoints: {
      users: "/api/users",
      types: "/api/types", 
      potreros: "/api/potreros",
      lotes: "/api/lotes",
      health: "/health",
    },
  });
});

app.use("/api/users", userRouter);
app.use("/api/types", typeRouter); 
app.use("/api/potreros", potreroRouter)
app.use("/api/lotes", loteRouter)


app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: "Ruta no encontrada",
    path: req.originalUrl,
    method: req.method,
  });
});

app.use((error, req, res, next) => {
  console.error("Error global:", error);
  res.status(500).json({
    ok: false,
    message: "Error interno del servidor",
  });
});

export default app;