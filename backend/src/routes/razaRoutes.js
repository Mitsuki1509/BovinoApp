import express from "express";
import RazaController from "../controllers/RazaController.js";
import authenticate from "../middlewares/authenticate.js";
import validateFields from "../middlewares/validateFields.js";
import { check } from "express-validator";

const razaRouter = express.Router();

const createValidations = [
  check('nombre')
    .trim()
    .notEmpty().withMessage("El nombre de la raza es requerido")
    .isLength({ min: 1, max: 255 }).withMessage("El nombre debe tener entre 1 y 255 caracteres"),
  check('descripcion')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage("La descripción no puede exceder los 500 caracteres")
];

const updateValidations = [
  check('nombre')
    .optional()
    .trim()
    .notEmpty().withMessage("El nombre no puede estar vacío")
    .isLength({ min: 1, max: 255 }).withMessage("El nombre debe tener entre 1 y 255 caracteres"),
  check('descripcion')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage("La descripción no puede exceder los 500 caracteres")
];

razaRouter.use(authenticate);

razaRouter.get('/', RazaController.getRazas);

razaRouter.get('/search', RazaController.searchRazas);

razaRouter.get('/:id', RazaController.getRazaById);

razaRouter.post('/', createValidations, validateFields, RazaController.createRaza);

razaRouter.put('/:id', updateValidations, validateFields, RazaController.updateRaza);

razaRouter.delete('/:id', RazaController.deleteRaza);

export default razaRouter;