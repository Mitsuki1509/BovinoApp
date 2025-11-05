import express from "express";
import TypeController from "../controllers/TypeController.js";
import authenticate from "../middlewares/authenticate.js";

const typeRouter = express.Router();

typeRouter.get('/', authenticate, TypeController.getType);
typeRouter.get('/padres', authenticate, TypeController.getTypeFather);
typeRouter.get('/:id', authenticate, TypeController.getTypeById);
typeRouter.get('/:id/hijos', authenticate, TypeController.getChildType);

typeRouter.post('/', authenticate, TypeController.createType);
typeRouter.put('/:id', authenticate, TypeController.updateType);
typeRouter.delete('/:id', authenticate, TypeController.deleteType);

export default typeRouter;