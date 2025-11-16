import express from "express";
import ProduccionCarneController from "../controllers/ProduccionCarneController.js";
import authenticate from "../middlewares/authenticate.js";

const produccionCarneRouter = express.Router();

produccionCarneRouter.get('/', authenticate, ProduccionCarneController.getAll);
produccionCarneRouter.get('/:id', authenticate, ProduccionCarneController.getById);
produccionCarneRouter.post('/', authenticate, ProduccionCarneController.create);
produccionCarneRouter.put('/:id', authenticate, ProduccionCarneController.update);
produccionCarneRouter.delete('/:id', authenticate, ProduccionCarneController.delete);
produccionCarneRouter.get('/animal/:animalId', authenticate, ProduccionCarneController.getByAnimal);
produccionCarneRouter.get('/unidades/list', authenticate, ProduccionCarneController.getUnidades);
produccionCarneRouter.get('/mataderos/list', authenticate, ProduccionCarneController.getMataderos);

export default produccionCarneRouter;