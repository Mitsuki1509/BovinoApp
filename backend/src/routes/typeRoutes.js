import express from "express";
import TypeController from "../controllers/TypeController.js";
import authenticate from "../middlewares/authenticate.js";
import validateFields from "../middlewares/validateFields.js";
import { check } from "express-validator";

const typeRouter = express.Router();

const createValidations = [
  check('nombre')
    .trim()
    .notEmpty().withMessage("El nombre es requerido")
    .isLength({ min: 1, max: 255 }).withMessage("El nombre debe tener entre 1 y 255 caracteres"),
  check('padre_id')
    .optional({ nullable: true, checkFalsy: true }) 
    .isInt({ min: 1 }).withMessage("El padre_id debe ser un número entero válido")
    .toInt()
];

const updateValidations = [
  check('nombre')
    .optional()
    .trim()
    .notEmpty().withMessage("El nombre no puede estar vacío")
    .isLength({ min: 1, max: 255 }).withMessage("El nombre debe tener entre 1 y 255 caracteres"),
  check('padre_id')
    .optional({ nullable: true, checkFalsy: true }) 
    .isInt({ min: 1 }).withMessage("El padre_id debe ser un número entero válido")
    .toInt()
];

typeRouter.get('/', authenticate, TypeController.getType);
typeRouter.get('/padres', authenticate, TypeController.getTypeFather);
typeRouter.get('/:id', authenticate, TypeController.getTypeById);
typeRouter.get('/:id/hijos', authenticate, TypeController.getChildType);

typeRouter.post('/', authenticate, createValidations, validateFields, TypeController.createType);
typeRouter.put('/:id', authenticate, updateValidations, validateFields, TypeController.updateType);
typeRouter.delete('/:id', authenticate, TypeController.deleteType);

export default typeRouter;