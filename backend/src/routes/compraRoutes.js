import express from "express";
import CompraController from "../controllers/CompraController.js";
import authenticate from "../middlewares/authenticate.js";

const compraRouter = express.Router();

compraRouter.get('/', authenticate, CompraController.getAll);
compraRouter.get('/:id', authenticate, CompraController.getById);
compraRouter.post('/', authenticate, CompraController.create);
compraRouter.put('/:id', authenticate, CompraController.update);
compraRouter.delete('/:id', authenticate, CompraController.delete);

export default compraRouter;