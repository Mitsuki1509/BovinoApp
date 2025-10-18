import { validationResult } from "express-validator";

const validateFields = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      ok: false,
      msg: "Error en la validación de campos",
      errors: errors.array().map(error => ({
        field: error.param,
        message: error.msg
      }))
    });
  }
  
  next();
};

export default validateFields;