import { Express } from "express";
import { dftController, dftRequestSchema } from "../controllers/dft";
import { signalController, signalRequestSchema } from "../controllers/signals";
import { checkSchema } from 'express-validator';

export const applyRoutes = (app: Express, baseApiPath: string = "/api") => {
  app.route(baseApiPath + "/dft")
    .post(
      checkSchema(dftRequestSchema),
      dftController,
    )

  app.route(baseApiPath + "/signal")
    .post(
      checkSchema(signalRequestSchema),
      signalController,
    )
}