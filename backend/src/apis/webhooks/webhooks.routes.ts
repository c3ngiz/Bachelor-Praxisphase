import { Router } from "express";
import { StatusCodes } from "http-status-codes";

export function createWebhooksRouter(): Router {
  const router = Router();

  router.get("/health", (_request, response) => {
    return response.status(StatusCodes.OK).json({ status: "ok", service: "webhooks" });
  });

  router.post("/test", (_request, response) => {
    return response.status(StatusCodes.ACCEPTED).json({
      status: "accepted",
      message: "Webhook test endpoint is available.",
    });
  });

  return router;
}
