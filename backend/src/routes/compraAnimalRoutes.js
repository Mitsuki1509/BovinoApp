import express from "express";
import CompraAnimalController from "../controllers/CompraAnimalController.js";
import authenticate from "../middlewares/authenticate.js";

const compraAnimalRouter = express.Router();

compraAnimalRouter.get('/', authenticate, CompraAnimalController.getAll);
compraAnimalRouter.get('/:id', authenticate, CompraAnimalController.getById);
compraAnimalRouter.get('/numero/:numero', authenticate, CompraAnimalController.getByNumeroCompra);
compraAnimalRouter.get('/:id/total', authenticate, CompraAnimalController.getTotal);
compraAnimalRouter.post('/', authenticate, CompraAnimalController.create);
compraAnimalRouter.put('/:id', authenticate, CompraAnimalController.update);
compraAnimalRouter.delete('/:id', authenticate, CompraAnimalController.delete);

export default compraAnimalRouter;