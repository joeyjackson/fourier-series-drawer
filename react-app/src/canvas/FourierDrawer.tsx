import React, { FunctionComponent, useState, useRef, useCallback, useEffect } from 'react';
import P5 from "p5";
import P5Canvas from './P5Canvas';
import Epicycle, { ComplexNumber, Point } from '../fourier/Epicycle';
import EpicycleChain from '../fourier/EpicycleChain';
import { DFT } from '../fourier/FourierTransform';

interface Props {
  initWidth?: number;
  initHeight?: number;
}

const draw1DSignal = (
  p5: P5, 
  signal: number[], 
  epicyclesCenter: Point,
  waveOffsetX: number, 
  waveMaxLen: number,
  maxEpicycles?: number,
) => {
  const N = signal.length;
  const signalComplex = signal.map(pt => new ComplexNumber(0, pt));
  const dft = DFT(signalComplex);

  const epicycles = new EpicycleChain()
    .extend(dft.map(Epicycle.FromComplex).filter((e => !e.isZero())))
    .sort()
    .truncate(maxEpicycles ?? N);

  let time = 0;
  const wave: number[] = [];
  const dt = 1 / N;

  return () => {
    console.log("time = ", time.toFixed(2));
    p5.background(0);

    const endpoint = epicycles.Draw(p5, time, epicyclesCenter, true, true, true);
    wave.unshift(endpoint.y);

    p5.stroke(0, 0, 255);
    p5.line(endpoint.x, endpoint.y, waveOffsetX, endpoint.y);

    p5.stroke(255);
    p5.noFill();
    p5.beginShape();
    wave.forEach((y, i) => p5.vertex(waveOffsetX + i, y));
    p5.endShape();

    time += dt;

    if (wave.length >= waveMaxLen) wave.pop();
  }
}

const draw2DSignalSeparate = (
  p5: P5, 
  signal: Point[], 
  epicyclesCenterX: Point,
  epicyclesCenterY: Point,
  maxEpicyclesX?: number,
  maxEpicyclesY?: number,
) => {
  const N = signal.length;
  const signalX = signal.map(pt => new ComplexNumber(pt.x, 0));
  const signalY = signal.map(pt => new ComplexNumber(0, pt.y));
  const dftX = DFT(signalX);
  const dftY = DFT(signalY);

  const epicyclesX = new EpicycleChain()
    .extend(dftX.map(Epicycle.FromComplex).filter((e => !e.isZero())))
    .sort()
    .truncate(maxEpicyclesX ?? N);
  const epicyclesY = new EpicycleChain()
    .extend(dftY.map(Epicycle.FromComplex).filter((e => !e.isZero())))
    .sort()
    .truncate(maxEpicyclesY ?? N);

  let time = 0;
  const path: Point[] = [];
  const dt = 1 / N;

  return () => {
    console.log("time = ", time.toFixed(2));
    p5.background(0);

    const endpointX = epicyclesX.Draw(p5, time, epicyclesCenterX, true, true, true);
    const endpointY = epicyclesY.Draw(p5, time, epicyclesCenterY, true, true, true);
    const latest = new Point(endpointX.x, endpointY.y);
    path.unshift(latest);

    p5.stroke(0, 0, 255);
    p5.line(endpointX.x, endpointX.y, latest.x, latest.y);
    p5.line(endpointY.x, endpointY.y, latest.x, latest.y);

    p5.stroke(255);
    p5.noFill();

    for (let i = 0; i < path.length - 1; i++) {
      const prev = path[i];
      const curr = path[i + 1];
      p5.stroke(255, 255 * ((path.length - i) / path.length))
      p5.line(prev.x, prev.y, curr.x, curr.y);
    }

    time += dt;

    if (path.length >= N) path.pop();
  }
}

const draw2DSignal = (
  p5: P5, 
  signal: Point[], 
  epicyclesCenter: Point,
  maxEpicycles?: number,
) => {
  const N = signal.length;
  const signalComplex = signal.map(pt => pt.asComplexNumber());
  const dft = DFT(signalComplex);

  const epicycles = new EpicycleChain()
    .extend(dft.map(Epicycle.FromComplex).filter((e => !e.isZero())))
    .sort()
    .truncate(maxEpicycles ?? N);

  let time = 0;
  const path: Point[] = [];
  const dt = 1 / N;

  return () => {
    console.log("time = ", time.toFixed(2));
    p5.background(0);

    path.unshift(epicycles.Draw(p5, time, epicyclesCenter, true, true, true));

    p5.stroke(255);
    p5.noFill();

    for (let i = 0; i < path.length - 1; i++) {
      const prev = path[i];
      const curr = path[i + 1];
      p5.stroke(255, 255 * ((path.length - i) / path.length))
      p5.line(prev.x, prev.y, curr.x, curr.y);
    }

    time += dt;

    if (path.length >= N) path.pop();
  }
}

const FourierCanvas: FunctionComponent<Props> = ({ initWidth = 600, initHeight = 600 }) => {
  const [height, setHeight] = useState<number>(initHeight);
  const [width, setWidth] = useState<number>(initWidth);
  const _p5 = useRef<P5 | null>(null);

  useEffect(() => {
    if (_p5.current !== null) _p5.current.resizeCanvas(width, height);
  }, [width, height]);

  // 1D Square Wave
  const signal1D: number[] = [];
  for (let i = 0; i < 100; i++) signal1D.push(-50);
  for (let i = 0; i < 100; i++) signal1D.push(50); 

  // 2D Diamond
  const signal2D: Point[] = [];
  for (let x = -100; x <= 100; x++) signal2D.push(new Point(x, 100 - Math.abs(x)));
  for (let x = 100; x >= -100; x--) signal2D.push(new Point(x, Math.abs(x) - 100));

  const sketch = useCallback((p5: P5) => {
    p5.setup = () => {
      p5.createCanvas(width, height);
      _p5.current = p5;
    }

    // Default
    p5.draw = draw1DSignal(p5, signal1D, new Point(100, 300), 300, 300, 50);

    let state: number = 0;

    const mouseInCanvas = () => {
      return p5.mouseX > 0 
        && p5.mouseX < p5.width 
        && p5.mouseY > 0
        && p5.mouseY < p5.height;
    }

    p5.doubleClicked = () => {
      if (mouseInCanvas()) {
        state = (state + 1) % 3;
        if (state === 0) {
          p5.draw = draw1DSignal(p5, signal1D, new Point(100, 300), 300, 300, 50);
        } else if (state === 1) {
          p5.draw = draw2DSignalSeparate(p5, signal2D, new Point(300, 100), new Point(100, 300), 50, 50);
        } else {
          p5.draw = draw2DSignal(p5, signal2D, new Point(300, 300), 50);
        }
      }
    }
  }, []);

  return <P5Canvas sketch={sketch}/>;
}

export default FourierCanvas;