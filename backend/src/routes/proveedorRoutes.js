import express from "express";
import ProveedorController from "../controllers/ProveedorController.js";
import authenticate from "../middlewares/authenticate.js";

const proveedorRouter = express.Router();

proveedorRouter.use(authenticate);

proveedorRouter.get('/', ProveedorController.getProveedores);
proveedorRouter.get('/search', ProveedorController.searchProveedor);
proveedorRouter.get('/:id', ProveedorController.getProveedorById);
proveedorRouter.post('/', ProveedorController.createProveedor);
proveedorRouter.put('/:id', ProveedorController.updateProveedor);
proveedorRouter.delete('/:id', ProveedorController.deleteProveedor);

export default proveedorRouter;