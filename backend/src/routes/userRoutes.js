import express from "express";
import UserController from "../controllers/UserController.js";
import authenticate from "../middlewares/authenticate.js";

const userRouter = express.Router();

userRouter.get('/auth/google', UserController.oauthGoogle);
userRouter.get('/auth/google/callback', UserController.oauthCallback);
userRouter.post('/login', UserController.login);

userRouter.get('/is_auth', authenticate, UserController.isAuth);
userRouter.get('/profile', authenticate, UserController.getProfile);
userRouter.post('/logout', authenticate, UserController.logout);

userRouter.get('/admin/users', authenticate, UserController.getUsers);
userRouter.get('/admin/roles', authenticate, UserController.getRoles);
userRouter.post('/admin/users', authenticate, UserController.createUser);

userRouter.put('/:id', authenticate, UserController.updateUser);

userRouter.post('/:id/reset-password', authenticate, UserController.resetPassword);

userRouter.delete('/:id', authenticate, UserController.deleteUser);

export default userRouter;