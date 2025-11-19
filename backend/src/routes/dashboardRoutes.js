import express from "express";
import DashboardController from "../controllers/DashboardController.js";
import authenticate from "../middlewares/authenticate.js";

const dashboardRouter = express.Router();

dashboardRouter.get('/kpis-principales', authenticate, DashboardController.getKPIsPrincipales);
dashboardRouter.get('/tendencia-produccion', authenticate, DashboardController.getTendenciaProduccion);
dashboardRouter.get('/distribucion-animales', authenticate, DashboardController.getDistribucionAnimales);
dashboardRouter.get('/metricas-reproduccion', authenticate, DashboardController.getMetricasReproduccion);
dashboardRouter.get('/alertas-sistema', authenticate, DashboardController.getAlertasSistema);

export default dashboardRouter;