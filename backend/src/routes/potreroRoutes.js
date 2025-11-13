import express from "express";
import PotreroController from "../controllers/PotreroController.js";
import authenticate from "../middlewares/authenticate.js";

const potreroRouter = express.Router();

potreroRouter.get('/', authenticate, PotreroController.getAll);
potreroRouter.get('/:id', authenticate, PotreroController.getById);
potreroRouter.post('/', authenticate, PotreroController.create);
potreroRouter.put('/:id', authenticate, PotreroController.update);
potreroRouter.delete('/:id', authenticate, PotreroController.delete);

export default potreroRouter;