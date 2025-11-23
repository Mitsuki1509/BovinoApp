import express from "express";
import ReportController from "../controllers/ReportController.js";
import authenticate from "../middlewares/authenticate.js";

const reportRouter = express.Router();

reportRouter.post('/enviar-reporte', authenticate, ReportController.enviarReporteCorreo);
reportRouter.get('/tipos-reporte', authenticate, ReportController.getTiposReporte);

export default reportRouter;