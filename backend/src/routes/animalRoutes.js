import express from "express";
import multer from "multer";
import AnimalController from "../controllers/AnimalController.js";
import authenticate from "../middlewares/authenticate.js";

const upload = multer({ storage: multer.memoryStorage() });
const animalRouter = express.Router();

animalRouter.use(authenticate);

animalRouter.get('/', AnimalController.getAnimales);
animalRouter.get('/search', AnimalController.searchAnimales);
animalRouter.get('/:id', AnimalController.getAnimalById);
animalRouter.post('/', upload.single('imagen'), AnimalController.createAnimal);
animalRouter.put('/:id', upload.single('imagen'), AnimalController.updateAnimal);
animalRouter.delete('/:id', AnimalController.deleteAnimal);

export default animalRouter;