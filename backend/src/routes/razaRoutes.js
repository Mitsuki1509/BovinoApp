import express from "express";
import RazaController from "../controllers/RazaController.js";
import authenticate from "../middlewares/authenticate.js";

const razaRouter = express.Router();

razaRouter.use(authenticate);

razaRouter.get('/', RazaController.getRazas);
razaRouter.get('/search', RazaController.searchRazas);
razaRouter.get('/:id', RazaController.getRazaById);
razaRouter.post('/', RazaController.createRaza);
razaRouter.put('/:id', RazaController.updateRaza);
razaRouter.delete('/:id', RazaController.deleteRaza);

export default razaRouter;