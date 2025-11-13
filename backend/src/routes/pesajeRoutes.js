import express from "express";
import PesajeController from "../controllers/PesajeController.js";
import authenticate from "../middlewares/authenticate.js";

const pesajeRouter = express.Router();

pesajeRouter.get('/', authenticate, PesajeController.getAll);
pesajeRouter.get('/:id', authenticate, PesajeController.getById);
pesajeRouter.post('/', authenticate, PesajeController.create);
pesajeRouter.put('/:id', authenticate, PesajeController.update);
pesajeRouter.delete('/:id', authenticate, PesajeController.delete);
pesajeRouter.get('/animal/:animalId', authenticate, PesajeController.getByAnimal);
pesajeRouter.get('/unidades/list', authenticate, PesajeController.getUnidades);

export default pesajeRouter;