import { Router } from "express";
import { requireRestAuth } from "../common/middleware/auth.js";
import { catchAsync } from "../common/utils/catchAsync.js";
import * as authController from "./auth.controller.js";

/** Creates REST auth routes. */
export function createRestAuthRouter(): Router {
  const router = Router();

  router.post("/register", catchAsync(authController.register));
  router.post("/login", catchAsync(authController.login));
  router.get("/me", requireRestAuth, catchAsync(authController.getMe));

  return router;
}
