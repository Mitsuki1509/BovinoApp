import express from "express";
import CompraInsumoController from "../controllers/CompraInsumoController.js";
import authenticate from "../middlewares/authenticate.js";

const compraInsumoRouter = express.Router();

compraInsumoRouter.get('/', authenticate, CompraInsumoController.getAll);
compraInsumoRouter.get('/:id', authenticate, CompraInsumoController.getById);
compraInsumoRouter.get('/numero/:numero', authenticate, CompraInsumoController.getByNumeroCompra);
compraInsumoRouter.get('/:id/total', authenticate, CompraInsumoController.getTotal);
compraInsumoRouter.post('/', authenticate, CompraInsumoController.create);
compraInsumoRouter.put('/:id', authenticate, CompraInsumoController.update);
compraInsumoRouter.delete('/:id', authenticate, CompraInsumoController.delete);

export default compraInsumoRouter;