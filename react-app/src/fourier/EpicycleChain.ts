import P5 from "p5";
import Epicycle, { Point } from "./Epicycle";

export default class EpicycleChain {
  epicycles: Epicycle[];

  constructor(
    epicycles: Epicycle[] = [],
  ) {
    this.epicycles = epicycles;
  }

  add(epicycle: Epicycle) {
    this.epicycles.push(epicycle);
  }

  length(): number {
    return this.epicycles.length
  }

  extend(epicycles: Epicycle[]): EpicycleChain {
    epicycles.forEach(e => this.epicycles.push(e));
    return this;
  }

  sort(descending: boolean = true): EpicycleChain {
    this.epicycles.sort((a, b) => {
      if (descending) {
        return b.radius - a.radius;
      } else {
        return a.radius - b.radius;
      }
    });
    return this;
  }

  truncate(maxLength: number): EpicycleChain {
    if (this.epicycles.length > maxLength) {
      this.epicycles = this.epicycles.slice(0, maxLength);
    }
    return this;
  }

  Draw(
    p5: P5,
    time: number, 
    offset: Point = new Point(),
    includeRings: boolean = false,
    includeLines: boolean = false,
    boldEndPoint: boolean = false,
  ): Point {
    let curr = offset;
    this.epicycles.forEach((epicycle, i) => {
      curr = Epicycle.Draw(
        p5, 
        epicycle, 
        time, 
        curr, 
        includeRings, 
        includeLines, 
        boldEndPoint && i === this.length() - 1,
      )
    });
    return curr;
  }
}