import express from "express";
import TipoInsumoController from "../controllers/TipoInsumoController.js";
import authenticate from "../middlewares/authenticate.js";

const tipoInsumoRouter = express.Router();

tipoInsumoRouter.get('/', authenticate, TipoInsumoController.getAll);
tipoInsumoRouter.get('/search', authenticate, TipoInsumoController.search);
tipoInsumoRouter.get('/:id', authenticate, TipoInsumoController.getById);
tipoInsumoRouter.post('/', authenticate, TipoInsumoController.create);
tipoInsumoRouter.put('/:id', authenticate, TipoInsumoController.update);
tipoInsumoRouter.delete('/:id', authenticate, TipoInsumoController.delete);

export default tipoInsumoRouter;