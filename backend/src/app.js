import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import userRouter from "./routes/userRoutes.js";
import typeRouter from "./routes/typeRoutes.js"; 
import potreroRouter from "./routes/potreroRoutes.js";
import loteRouter from "./routes/loteRoutes.js";
import razaRouter from "./routes/razaRoutes.js";
import animalRouter from "./routes/animalRoutes.js";
import proveedorRouter from "./routes/proveedorRoutes.js";
import compraRouter from "./routes/compraRoutes.js";
import insumoRouter from "./routes/insumoRoutes.js";
import tipoInsumoRouter from "./routes/tipoInsumoRoutes.js";
import detalleCompraRouter from "./routes/detalleCompraRoutes.js";

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
      razas: "/api/razas",
      animal: "/api/animales",
      proveedor: "/api/proveedores",
      compraRouter: "/api/compras",
      tipoInsumoRouter:"/api/tipoInsumo",
      insumoRouter:"/api/insumos",
      detalleCompraRouter:"/api/detalleCompra", 
      health: "/health",
    },
  });
});

app.use("/api/users", userRouter);
app.use("/api/types", typeRouter); 
app.use("/api/potreros", potreroRouter);
app.use("/api/lotes", loteRouter);
app.use("/api/razas", razaRouter);
app.use("/api/animales", animalRouter);
app.use("/api/proveedores", proveedorRouter); 
app.use("/api/compras", compraRouter)
app.use("/api/tipoInsumo", tipoInsumoRouter)
app.use("/api/insumos", insumoRouter)
app.use("/api/detalleCompra", detalleCompraRouter) 

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