import express from "express";
import ProduccionLecheraController from "../controllers/ProduccionLecheraController.js";
import authenticate from "../middlewares/authenticate.js";

const produccionLecheraRouter = express.Router();

produccionLecheraRouter.get('/', authenticate, ProduccionLecheraController.getAll);
produccionLecheraRouter.get('/:id', authenticate, ProduccionLecheraController.getById);
produccionLecheraRouter.post('/', authenticate, ProduccionLecheraController.create);
produccionLecheraRouter.put('/:id', authenticate, ProduccionLecheraController.update);
produccionLecheraRouter.delete('/:id', authenticate, ProduccionLecheraController.delete);
produccionLecheraRouter.get('/animal/:animalId', authenticate, ProduccionLecheraController.getByAnimal);
produccionLecheraRouter.get('/unidades/list', authenticate, ProduccionLecheraController.getUnidades);

export default produccionLecheraRouter;