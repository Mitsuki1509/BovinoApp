import express from "express";
import AlimentacionController from "../controllers/AlimentacionController.js";
import authenticate from "../middlewares/authenticate.js";

const alimentacionRouter = express.Router();

alimentacionRouter.get('/', authenticate, AlimentacionController.getAll);
alimentacionRouter.get('/:id', authenticate, AlimentacionController.getById);
alimentacionRouter.get('/animal/:animalId', authenticate, AlimentacionController.getByAnimalId);
alimentacionRouter.get('/insumo/:insumoId', authenticate, AlimentacionController.getByInsumoId);
alimentacionRouter.post('/', authenticate, AlimentacionController.create);
alimentacionRouter.delete('/:id', authenticate, AlimentacionController.delete);

export default alimentacionRouter;