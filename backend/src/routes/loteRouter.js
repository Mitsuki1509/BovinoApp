import express from "express";
import LoteController from "../controllers/LoteController.js";
import authenticate from "../middlewares/authenticate.js";

const loteRouter = express.Router();

loteRouter.get('/', authenticate, LoteController.getAll);
loteRouter.get('/sin-potrero', authenticate, LoteController.getLotesSinPotrero);
loteRouter.get('/potrero/:potreroId', authenticate, LoteController.getByPotrero);
loteRouter.get('/search', authenticate, LoteController.search);
loteRouter.get('/:id', authenticate, LoteController.getById);

loteRouter.post('/', authenticate, LoteController.create);

loteRouter.put('/:id', authenticate, LoteController.update);

loteRouter.delete('/:id', authenticate, LoteController.delete);

export default loteRouter;