import express from "express";
import PartoController from "../controllers/PartoController.js";
import authenticate from "../middlewares/authenticate.js";

const partoRouter = express.Router();

partoRouter.get('/', authenticate, PartoController.getAll);
partoRouter.get('/:id', authenticate, PartoController.getById);
partoRouter.post('/', authenticate, PartoController.create);
partoRouter.put('/:id', authenticate, PartoController.update);
partoRouter.delete('/:id', authenticate, PartoController.delete);

export default partoRouter;