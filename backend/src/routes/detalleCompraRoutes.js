import express from "express";
import DetalleCompraController from "../controllers/DetalleCompraController.js";
import authenticate from "../middlewares/authenticate.js";

const detalleCompraRouter = express.Router();

detalleCompraRouter.get('/', authenticate, DetalleCompraController.getAll);
detalleCompraRouter.get('/compra/:compraId', authenticate, DetalleCompraController.getByCompraId);
detalleCompraRouter.get('/numero/:numeroCompra', authenticate, DetalleCompraController.getByNumeroCompra);
detalleCompraRouter.get('/:id', authenticate, DetalleCompraController.getById);
detalleCompraRouter.get('/compra/:compraId/total', authenticate, DetalleCompraController.getTotalByCompra);
detalleCompraRouter.get('/numero/:numeroCompra/total', authenticate, DetalleCompraController.getTotalByNumeroCompra);
detalleCompraRouter.post('/', authenticate, DetalleCompraController.create);
detalleCompraRouter.delete('/:id', authenticate, DetalleCompraController.delete);

export default detalleCompraRouter;