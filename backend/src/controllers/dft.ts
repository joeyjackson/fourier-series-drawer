import { RequestHandler } from "express";
import { validationResult, Schema } from 'express-validator';
import { DFT, Point } from "../math";

export const dftRequestSchema: Schema = {
  samples: {
    isArray: true,
    errorMessage: "samples should be an array"
  },
  "samples.*.x": {
    isNumeric: true,
  },
  "samples.*.y": {
    isNumeric: true,
  },
}

export const dftController: RequestHandler = (req, res) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    return res.status(400).json({ errors: validationErrors.array() });
  }

  const { samples } = req.body;
  const cns = samples.map(
    ({ x, y }: { x: number, y: number }) => new Point(x, y).asComplexNumber()
  );

  const dft = DFT(cns);
  const data = { dft: dft }
  res.json(data);
}
