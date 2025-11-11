import express from "express";
import MontaController from "../controllers/MontaController.js";
import authenticate from "../middlewares/authenticate.js";

const montaRouter = express.Router();

montaRouter.get('/', authenticate, MontaController.getAll);
montaRouter.get('/:id', authenticate, MontaController.getById);
montaRouter.post('/', authenticate, MontaController.create);
montaRouter.put('/:id', authenticate, MontaController.update);
montaRouter.delete('/:id', authenticate, MontaController.delete);

export default montaRouter;