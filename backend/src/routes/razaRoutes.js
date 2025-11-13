import express from "express";
import RazaController from "../controllers/RazaController.js";
import authenticate from "../middlewares/authenticate.js";

const razaRouter = express.Router();

razaRouter.use(authenticate);

razaRouter.get('/', RazaController.getAll);
razaRouter.get('/:id', RazaController.getById);
razaRouter.post('/', RazaController.create);
razaRouter.put('/:id', RazaController.update);
razaRouter.delete('/:id', RazaController.delete);

export default razaRouter;