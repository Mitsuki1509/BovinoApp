import express from "express";
import DetalleCompraController from "../controllers/DetalleCompraController.js";
import authenticate from "../middlewares/authenticate.js";

const detalleCompraRouter = express.Router();

detalleCompraRouter.get('/', authenticate, DetalleCompraController.getAll);
detalleCompraRouter.get('/numero/:numeroCompra', authenticate, DetalleCompraController.getByNumeroCompra);
detalleCompraRouter.get('/:id', authenticate, DetalleCompraController.getById);
detalleCompraRouter.post('/', authenticate, DetalleCompraController.create);
detalleCompraRouter.delete('/:id', authenticate, DetalleCompraController.delete);

export default detalleCompraRouter;