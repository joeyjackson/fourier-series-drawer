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
