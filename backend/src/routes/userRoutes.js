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

export default userRouter;