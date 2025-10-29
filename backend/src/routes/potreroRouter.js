import express from "express";
import PotreroController from "../controllers/PotreroController.js";
import authenticate from "../middlewares/authenticate.js";
import validateFields from "../middlewares/validateFields.js";
import { check } from "express-validator";

const potreroRouter = express.Router();

const createValidations = [
  check('ubicacion')
    .trim()
    .notEmpty().withMessage("La ubicación es requerida")
    .isLength({ min: 1, max: 255 }).withMessage("La ubicación debe tener entre 1 y 255 caracteres")
];

const updateValidations = [
  check('ubicacion')
    .optional()
    .trim()
    .notEmpty().withMessage("La ubicación no puede estar vacía")
    .isLength({ min: 1, max: 255 }).withMessage("La ubicación debe tener entre 1 y 255 caracteres")
];

potreroRouter.get('/', authenticate, PotreroController.getAll);
potreroRouter.get('/search', authenticate, PotreroController.search);
potreroRouter.get('/:id', authenticate, PotreroController.getById);

potreroRouter.post(
  '/', 
  authenticate, 
  createValidations, 
  validateFields, 
  PotreroController.create
);

potreroRouter.put(
  '/:id', 
  authenticate, 
  updateValidations, 
  validateFields, 
  PotreroController.update
);

potreroRouter.delete('/:id', authenticate, PotreroController.delete);

export default potreroRouter;