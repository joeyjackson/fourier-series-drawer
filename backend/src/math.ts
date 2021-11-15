export const PI = 3.14159265358979323846;

export class Point {
  x: number;
  y: number;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  static add(p1: Point, p2: Point): Point {
    return new Point(
      p1.x + p2.x,
      p1.y + p2.y,
    );
  }

  add(point: Point): Point {
    this.x += point.x;
    this.y += point.y;
    return this;
  }

  asComplexNumber(): ComplexNumber {
    return new ComplexNumber(this.x, this.y);
  }
}

export class ComplexNumber {
  re: number;
  im: number;

  constructor(re: number, im: number) {
    this.re = re;
    this.im = im;
  }

  add(other: ComplexNumber): ComplexNumber {
    return new ComplexNumber(this.re + other.re, this.im + other.im)
  }

  sub(other: ComplexNumber): ComplexNumber {
    return new ComplexNumber(this.re - other.re, this.im - other.im)
  }

  mult(other: ComplexNumber): ComplexNumber {
    // (a + bi)(c + di) = (ac - bd) + i(ad + bc)
    return new ComplexNumber(
      this.re * other.re - this.im * other.im, 
      this.re * other.im + this.im * other.re,
    )
  }

  scale(other: number): ComplexNumber {
    return new ComplexNumber(this.re * other, this.im * other)
  }

  asPoint(): Point {
    return new Point(this.re, this.im);
  }

  isZero(epsilon: number = 0.00001): boolean {
    return Math.abs(this.re) < epsilon && Math.abs(this.im) < epsilon;
  }
}


// Discrete Fourier Tranform
// Return N bins for the complex scalars for the fourier
// series for rates [0, ..., N-1]
export function DFT(signal: ComplexNumber[]): ComplexNumber[] {
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
