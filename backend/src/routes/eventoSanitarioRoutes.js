import express from "express";
import EventoSanitarioController from "../controllers/EventoSanitarioController.js";
import authenticate from "../middlewares/authenticate.js";

const eventoSanitarioRouter = express.Router();

eventoSanitarioRouter.get('/', authenticate, EventoSanitarioController.getAll);
eventoSanitarioRouter.get('/:id', authenticate, EventoSanitarioController.getById);
eventoSanitarioRouter.get('/animal/:animalId', authenticate, EventoSanitarioController.getByAnimalId);
eventoSanitarioRouter.get('/check/duplicado', authenticate, EventoSanitarioController.checkDuplicado);
eventoSanitarioRouter.post('/', authenticate, EventoSanitarioController.create);
eventoSanitarioRouter.put('/:id', authenticate, EventoSanitarioController.update);
eventoSanitarioRouter.delete('/:id', authenticate, EventoSanitarioController.delete);

export default eventoSanitarioRouter;