import express from "express";
import MataderoController from "../controllers/MataderoController.js";
import authenticate from "../middlewares/authenticate.js";

const mataderoRouter = express.Router();

mataderoRouter.get('/', authenticate, MataderoController.getAll);
mataderoRouter.get('/:id', authenticate, MataderoController.getById);
mataderoRouter.post('/', authenticate, MataderoController.create);
mataderoRouter.put('/:id', authenticate, MataderoController.update);
mataderoRouter.delete('/:id', authenticate, MataderoController.delete);

export default mataderoRouter;