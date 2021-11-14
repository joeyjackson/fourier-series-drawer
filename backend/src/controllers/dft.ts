import { RequestHandler } from "express";
import { validationResult, Schema } from 'express-validator';
import { PI, ComplexNumber, Point } from "../math";


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
  const cns = samples.map(({ x, y }: { x: number, y: number }) => {
    return new Point(x, y).asComplexNumber();
  });

  const dft = DFT(cns);
  const data = { dft: dft }
  res.json(data);
}

function DFT(signal: ComplexNumber[]): ComplexNumber[] {
  const dft: ComplexNumber[] = [];
  const N = signal.length

  for (let k = 0; k < N; k++) {
    let Ck: ComplexNumber = new ComplexNumber(0, 0);

    // FT (Fourier Transform)
    // C(F) = integral(-INF, INF, f(t) * e^(-F * 2*pi*i*t) dt)
    // ~
    // F => k / N
    // t => n
    // ~
    // DFT (Discrete Fourier Transform)
    // C(k) = sum(n -> 0...N, f[n] * e^(-k/N * 2*pi*i*n))
    signal.forEach((xn, n) => {
      const theta = -k/N * 2*PI * n;
      Ck = Ck.add(xn.mult(new ComplexNumber(Math.cos(theta), Math.sin(theta))));
    });

    dft.push(Ck.scale(1/N));
  }

  return dft;
}
