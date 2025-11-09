import express from "express";
import multer from "multer";
import InsumoController from "../controllers/InsumoController.js";
import authenticate from "../middlewares/authenticate.js";

const upload = multer({ storage: multer.memoryStorage() });
const insumoRouter = express.Router();

insumoRouter.use(authenticate);
insumoRouter.get('/', InsumoController.getAll);
insumoRouter.get('/search', InsumoController.search);
insumoRouter.get('/unidades', InsumoController.getUnidades); 
insumoRouter.get('/:id', InsumoController.getById);
insumoRouter.post('/', upload.single('imagen'), InsumoController.create);
insumoRouter.put('/:id', upload.single('imagen'), InsumoController.update);
insumoRouter.delete('/:id', InsumoController.delete);

export default insumoRouter;