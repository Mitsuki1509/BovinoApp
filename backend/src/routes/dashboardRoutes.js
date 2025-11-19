// routes/dashboard.js
import express from "express";
import DashboardController from "../controllers/DashboardController.js";
import authenticate from "../middlewares/authenticate.js";

const dashboardRouter = express.Router();

// Rutas individuales
dashboardRouter.get('/kpis-principales', authenticate, DashboardController.getKPIsPrincipales);
dashboardRouter.get('/tendencia-produccion', authenticate, DashboardController.getTendenciaProduccion);
dashboardRouter.get('/distribucion-animales', authenticate, DashboardController.getDistribucionAnimales);
dashboardRouter.get('/metricas-reproduccion', authenticate, DashboardController.getMetricasReproduccion);
dashboardRouter.get('/alertas-sistema', authenticate, DashboardController.getAlertasSistema);

// Ruta completa del dashboard
dashboardRouter.get('/completo', authenticate, DashboardController.getDashboardCompleto);

export default dashboardRouter;