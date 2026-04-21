import { Router } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { requireAuth } from "../../middleware/auth.js";
import * as authController from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/register", catchAsync(authController.register));
authRouter.post("/login", catchAsync(authController.login));
authRouter.get("/me", requireAuth, catchAsync(authController.getMe));
