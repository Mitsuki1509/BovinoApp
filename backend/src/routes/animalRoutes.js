import express from "express";
import multer from "multer";
import AnimalController from "../controllers/AnimalController.js";
import authenticate from "../middlewares/authenticate.js";

const upload = multer({ storage: multer.memoryStorage() });
const animalRouter = express.Router();

animalRouter.use(authenticate);

animalRouter.get('/', AnimalController.getAll);
animalRouter.get('/:id', AnimalController.getById);
animalRouter.post('/', upload.single('imagen'), AnimalController.create);
animalRouter.put('/:id', upload.single('imagen'), AnimalController.update);
animalRouter.delete('/:id', AnimalController.delete);

export default animalRouter;