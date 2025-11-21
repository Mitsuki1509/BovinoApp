import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";

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
import montaRouter from "./routes/montaRoutes.js";
import diagnosticoRouter from "./routes/diagnosticoRoutes.js";
import partoRouter from './routes/partoRoutes.js';
import eventoSanitarioRouter from "./routes/eventoSanitarioRoutes.js";
import alimentacionRouter from "./routes/alimentacionRoutes.js";
import pesajeRouter from "./routes/pesajeRoutes.js";
import produccionLecheraRouter from "./routes/produccionLecheraRoutes.js";
import mataderoRouter from "./routes/mataderoRoutes.js";
import produccionCarneRouter from "./routes/produccionCarneRoutes.js";
import notificacionesRouter from "./routes/notificacionesRoutes.js";
import dashboardRouter from "./routes/dashboardRoutes.js";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }
});

export const usuariosConectados = new Map();

io.on("connection", (socket) => {
  socket.on("registrar-usuario", (usuarioId) => {
    usuariosConectados.set(usuarioId.toString(), socket.id);
  });

  socket.on("disconnect", () => {
    for (let [usuarioId, socketId] of usuariosConectados.entries()) {
      if (socketId === socket.id) {
        usuariosConectados.delete(usuarioId);
        break;
      }
    }
  });
});

export { io };

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
      animales: "/api/animales",
      proveedores: "/api/proveedores",
      compras: "/api/compras",
      tiposInsumo:"/api/tipoInsumo",
      insumos:"/api/insumos",
      detalleCompra:"/api/detalleCompra",
      montas: "/api/montas",
      diagnosticos: "/api/diagnosticos",
      partos: "/api/partos",
      eventoSanitario: "/api/eventosSanitario",
      alimentaciones: "/api/alimentaciones",
      pesajes: "/api/pesajes",
      produccionLechera:"/api/produccionLechera",
      mataderos: "/api/mataderos",
      produccionCarne:"/api/produccionCarne",
      notificaciones: "/api/notificaciones",
      dashboard: "/api/dashboard",
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
app.use("/api/compras", compraRouter);
app.use("/api/tipoInsumo", tipoInsumoRouter);
app.use("/api/insumos", insumoRouter);
app.use("/api/detalleCompra", detalleCompraRouter);
app.use("/api/montas", montaRouter);
app.use("/api/diagnosticos", diagnosticoRouter);
app.use("/api/partos", partoRouter);
app.use("/api/eventosSanitario", eventoSanitarioRouter);
app.use("/api/alimentaciones", alimentacionRouter);
app.use("/api/pesajes", pesajeRouter);
app.use("/api/produccionLechera", produccionLecheraRouter);
app.use("/api/mataderos", mataderoRouter);
app.use("/api/produccionCarne", produccionCarneRouter);
app.use("/api/notificaciones", notificacionesRouter);
app.use("/api/dashboard", dashboardRouter)

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: "Ruta no encontrada",
    path: req.originalUrl,
    method: req.method,
  });
});

app.use((error, req, res, next) => {
  res.status(500).json({
    ok: false,
    message: "Error interno del servidor",
  });
});

export default server;