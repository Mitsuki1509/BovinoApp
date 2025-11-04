import express from "express";
import multer from "multer";
import AnimalController from "../controllers/AnimalController.js";
import authenticate from "../middlewares/authenticate.js";
import validateFields from "../middlewares/validateFields.js";
import { check } from "express-validator";

const upload = multer({ storage: multer.memoryStorage() });
const animalRouter = express.Router();

const optionalIdValidation = (fieldName) => 
  check(fieldName)
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value === null || value === '' || value === 'null' || value === undefined) return true;
      return Number.isInteger(Number(value)) && Number(value) > 0;
    }).withMessage(`El ${fieldName} debe ser un número válido o null`);

const createValidations = [
  check('arete')
    .trim()
    .notEmpty().withMessage("El arete del animal es requerido")
    .isLength({ max: 100 }).withMessage("El arete no puede exceder 100 caracteres"),
  
  check('sexo')
    .isIn(['M', 'H']).withMessage("El sexo debe ser 'M' (macho) o 'H' (hembra)"),
  
  check('fecha_nacimiento')
    .isDate().withMessage("La fecha de nacimiento debe ser válida"),

  optionalIdValidation('animal_madre_id'),
  optionalIdValidation('animal_padre_id'),
  optionalIdValidation('lote_id'),
  optionalIdValidation('raza_id'),
  
  check('fecha_destete')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value === null || value === '' || value === 'null' || value === undefined) return true;
      return !isNaN(Date.parse(value));
    }).withMessage("La fecha de destete debe ser válida o null")
];

const updateValidations = [
  check('arete')
    .optional()
    .trim()
    .notEmpty().withMessage("El arete no puede estar vacío")
    .isLength({ max: 100 }).withMessage("El arete no puede exceder 100 caracteres"),
  
  check('sexo')
    .optional()
    .isIn(['M', 'H']).withMessage("El sexo debe ser 'M' (macho) o 'H' (hembra)"),
  
  check('fecha_nacimiento')
    .optional()
    .isDate().withMessage("La fecha de nacimiento debe ser válida"),

  optionalIdValidation('animal_madre_id'),
  optionalIdValidation('animal_padre_id'),
  optionalIdValidation('lote_id'),
  optionalIdValidation('raza_id'),
  
  check('fecha_destete')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value === null || value === '' || value === 'null' || value === undefined) return true;
      return !isNaN(Date.parse(value));
    }).withMessage("La fecha de destete debe ser válida o null")
];

animalRouter.use(authenticate);

animalRouter.get('/', AnimalController.getAnimales);
animalRouter.get('/search', AnimalController.searchAnimales);
animalRouter.get('/:id', AnimalController.getAnimalById);
animalRouter.post('/', upload.single('imagen'), createValidations, validateFields, AnimalController.createAnimal);
animalRouter.put('/:id', upload.single('imagen'), updateValidations, validateFields, AnimalController.updateAnimal);
animalRouter.delete('/:id', AnimalController.deleteAnimal);

export default animalRouter;