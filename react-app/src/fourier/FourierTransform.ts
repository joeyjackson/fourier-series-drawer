import { ComplexNumber, PI } from "./Epicycle";

// Discrete Fourier Tranform
// Return N + 1 bins for the complex scalars for the fourier
// series for rates [0, ..., N]
export function DFT(signal: ComplexNumber[]): ComplexNumber[] {
  const dft: ComplexNumber[] = [];
  const N = signal.length

  for (let k = 0; k <= N; k++) {
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