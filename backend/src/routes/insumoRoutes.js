import express from "express";
import multer from "multer";
import InsumoController from "../controllers/InsumoController.js";
import authenticate from "../middlewares/authenticate.js";

const upload = multer({ storage: multer.memoryStorage() });
const insumoRouter = express.Router();

insumoRouter.get('/', authenticate, InsumoController.getAll);
insumoRouter.get('/unidades',authenticate, InsumoController.getUnidades); 
insumoRouter.get('/:id', authenticate, InsumoController.getById);
insumoRouter.post('/', authenticate, upload.single('imagen'), InsumoController.create);
insumoRouter.put('/:id', authenticate, upload.single('imagen'), InsumoController.update);
insumoRouter.delete('/:id',authenticate, InsumoController.delete);

export default insumoRouter;