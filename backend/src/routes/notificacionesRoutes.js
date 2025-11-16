import express from "express";
import NotificacionController from "../controllers/NotificacionController.js";
import authenticate from "../middlewares/authenticate.js";

const notificacionesRouter = express.Router();

notificacionesRouter.get('/usuario/:usuarioId', authenticate, NotificacionController.getByUsuario);
notificacionesRouter.put('/:id/leer', authenticate, NotificacionController.marcarComoLeida);
notificacionesRouter.put('/usuario/:usuarioId/leer-todas', authenticate, NotificacionController.marcarTodasComoLeidas);
notificacionesRouter.delete('/usuario/:usuarioId/limpiar', authenticate, NotificacionController.limpiarLeidas);

export default notificacionesRouter;