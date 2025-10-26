import express from "express";
import UserController from "../controllers/UserController.js";
import authenticate from "../middlewares/authenticate.js";
import validateFields from "../middlewares/validateFields.js";
import { check } from "express-validator";

const userRouter = express.Router();

userRouter.get('/auth/google', UserController.oauthGoogle);
userRouter.get('/auth/google/callback', UserController.oauthCallback);
userRouter.post('/login', [
  check('email', "Ingresa tu correo").trim().notEmpty().isEmail(),
  check('password', "Ingresa tu contraseña").trim().notEmpty(),
  validateFields
], UserController.login);

userRouter.get('/is_auth', authenticate, UserController.isAuth);
userRouter.get('/profile', authenticate, UserController.getProfile);
userRouter.post('/logout', authenticate, UserController.logout);

userRouter.get('/admin/users', authenticate, UserController.getUsers);
userRouter.get('/admin/roles', authenticate, UserController.getRoles);
userRouter.post('/admin/users', authenticate, [
  check('nombre', "El nombre es requerido").trim().notEmpty(),
  check('correo', "Ingresa un correo válido").trim().isEmail(),
  check('password', "La contraseña debe tener al menos 6 caracteres").isLength({ min: 6 }),
  check('rol_id', "El rol es requerido").isInt(),
  check('finca_id', "La finca es requerida").isInt(),
  validateFields
], UserController.createUser);

userRouter.put('/:id', authenticate, [
  check('nombre', "El nombre es requerido").trim().notEmpty(),
  check('rol_id', "El rol debe ser un número válido").optional().isInt(),
  check('finca_id', "La finca debe ser un número válido").optional().isInt(),
  validateFields
], UserController.updateUser);

userRouter.post('/:id/reset-password', authenticate, [
  check('nueva_password', "La nueva contraseña debe tener al menos 6 caracteres").isLength({ min: 6 }),
  validateFields
], UserController.resetPassword);

userRouter.delete('/:id', authenticate, UserController.deleteUser);

export default userRouter;