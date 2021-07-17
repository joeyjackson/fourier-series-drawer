import P5 from "p5";

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

export const PI = 3.14159265358979323846;

export default class Epicycle {
  radius: number;
  rate: number;
  phase: number;

  constructor(
    radius: number,
    rate: number,
    phase: number,
  ) {
    this.radius = radius;
    this.rate = rate;
    this.phase = phase;
  }

  static FromComplex(cn: ComplexNumber, rate: number): Epicycle {
    // e^(i*t) = cos(t) + i*sin(t)
    // C * e^(i*r*t) = C * cos(t * r) + i*sin(t * r)
    // C(n) * e^(2*pi*i*n*t) = C(n) * cos(t * 2*pi*n) + i*sin(t * 2*pi*n)

    return new Epicycle(
      Math.sqrt(cn.re * cn.re + cn.im * cn.im),
      rate,
      Math.atan2(cn.im, cn.re)
    );
  }

  at(time: number): Point {
    const x = this.radius * Math.cos((this.rate * 2 * PI * time) + this.phase);
    const y = this.radius * Math.sin((this.rate * 2 * PI * time) + this.phase);
    return new Point(x, y);
  }

  atOffset(time: number, offset: Point): Point {
    return this.at(time).add(offset);
  }

  isZero(epsilon: number = 0.00001): boolean {
    return Math.abs(this.radius) < epsilon;
  }

  static Draw(
    p5: P5,
    epicycle: Epicycle, 
    time: number, 
    offset: Point = new Point(),
    includeRing: boolean = false,
    includeLine: boolean = false,
    boldPoint: boolean = false,
  ): Point {
    const center = offset
    const point = epicycle.atOffset(time, offset)
    if (includeRing) {
      p5.noFill();
      p5.stroke(255, 100);
      p5.circle(center.x, center.y, epicycle.radius * 2);
    }
    if (includeLine) {
      p5.stroke(255, 0, 0);
      p5.line(center.x, center.y, point.x, point.y);
    }
    if (boldPoint) {
      p5.stroke(255);
      p5.fill(255);
      p5.circle(point.x, point.y, 4);
    }

    return point
  }
}