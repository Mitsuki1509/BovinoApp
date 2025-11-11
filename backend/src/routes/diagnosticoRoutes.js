import express from "express";
import DiagnosticoController from "../controllers/DiagnosticoController.js";
import authenticate from "../middlewares/authenticate.js";

const diagnosticoRouter = express.Router();

diagnosticoRouter.get('/', authenticate, DiagnosticoController.getAll);
diagnosticoRouter.get('/:id', authenticate, DiagnosticoController.getById);
diagnosticoRouter.post('/', authenticate, DiagnosticoController.create);
diagnosticoRouter.put('/:id', authenticate, DiagnosticoController.update);
diagnosticoRouter.delete('/:id', authenticate, DiagnosticoController.delete);


export default diagnosticoRouter;