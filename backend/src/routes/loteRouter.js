import express from "express";
import LoteController from "../controllers/LoteController.js";
import authenticate from "../middlewares/authenticate.js";
import validateFields from "../middlewares/validateFields.js";
import { check } from "express-validator";

const loteRouter = express.Router();

const createValidations = [
  check('descripcion')
    .trim()
    .notEmpty().withMessage("La descripción es requerida")
    .isLength({ min: 1, max: 1000 }).withMessage("La descripción debe tener entre 1 y 1000 caracteres"),
  check('potrero_id')
    .optional()
    .isInt({ min: 1 }).withMessage("El ID del potrero debe ser un número entero válido")
];

const updateValidations = [
  check('descripcion')
    .optional()
    .trim()
    .notEmpty().withMessage("La descripción no puede estar vacía")
    .isLength({ min: 1, max: 1000 }).withMessage("La descripción debe tener entre 1 y 1000 caracteres"),
  check('potrero_id')
    .optional()
    .isInt({ min: 1 }).withMessage("El ID del potrero debe ser un número entero válido")
];

loteRouter.get('/', authenticate, LoteController.getAll);
loteRouter.get('/sin-potrero', authenticate, LoteController.getLotesSinPotrero);
loteRouter.get('/potrero/:potreroId', authenticate, LoteController.getByPotrero);
loteRouter.get('/search', authenticate, LoteController.search);
loteRouter.get('/:id', authenticate, LoteController.getById);

loteRouter.post(
  '/', 
  authenticate, 
  createValidations, 
  validateFields, 
  LoteController.create
);

loteRouter.put(
  '/:id', 
  authenticate, 
  updateValidations, 
  validateFields, 
  LoteController.update
);

loteRouter.delete('/:id', authenticate, LoteController.delete);

export default loteRouter;