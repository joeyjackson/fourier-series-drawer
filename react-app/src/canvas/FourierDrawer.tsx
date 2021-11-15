import React, { FunctionComponent, useState, useRef, useCallback, useEffect, useMemo } from 'react';
import P5 from "p5";
import axios from "axios";
import { REACT_APP_BACKEND_BASE_URL } from '../App';
import P5Canvas from './P5Canvas';
import Epicycle, { Point, ComplexNumber } from '../fourier/Epicycle';
import EpicycleChain from '../fourier/EpicycleChain';

interface Props {
  initWidth?: number;
  initHeight?: number;
}

const draw2DSignalFunc = (
  p5: P5,
  complexNumbers: ComplexNumber[], 
  epicyclesCenter: Point,
  maxEpicycles?: number,
  durationMs: number = 5000,
) => {
  const N = complexNumbers.length;

  const epicycles = new EpicycleChain()
    .extend(complexNumbers.map(Epicycle.FromComplex).filter((e => !e.isZero())))
    .sort()
    .truncate(maxEpicycles ?? N);

  let time = 0;
  const path: Point[] = [];
  const dt = 1 / N;

  return () => {
    p5.stroke(255);
    p5.noFill();

    const numIterations = Math.round(p5.deltaTime / durationMs * N) % N;
    for (let i = 0; i < numIterations; i++) {
      const show = (i === numIterations - 1);
      path.unshift(epicycles.Draw(p5, time, epicyclesCenter, show, show, show));
      time += dt;
      
      if (path.length >= N) path.pop();
    }

    for (let i = 0; i < path.length - 1; i++) {
      const prev = path[i];
      const curr = path[i + 1];
      p5.stroke(255, 255 * ((path.length - i) / path.length))
      p5.line(prev.x, prev.y, curr.x, curr.y);
    }
  }
}

interface windowTransform {
  minX: number;
  minY: number;
  width: number;
  height: number;
  centerInWindow?: boolean;
}

const fetchDft = async (
  object?: string,
  window?: windowTransform,
) => {
  try {
    const raw = await axios.post(`/api/signal`, {
      object: object,
      transform: { window },
      includeDFT: true,
    }, { baseURL: REACT_APP_BACKEND_BASE_URL });
    return raw.data;
  } catch (err) {
    throw err;
  }
}

const FourierCanvas: FunctionComponent<Props> = ({ initWidth = 600, initHeight = 600 }) => {
  const [height, ] = useState<number>(initHeight);
  const [width, ] = useState<number>(initWidth);
  const _p5 = useRef<P5 | null>(null);
  const [signal, setSignal] = useState<Point[]>([]);
  const [bins, setBins] = useState<ComplexNumber[]>([]);
  const [labelMsg, setLabelMsg] = useState<string>("");

  const defaultPathName = "random";
  const defaultDurationMs = 10000;
  const defaultNumEpicycles = 64;
  const epicycleOrigin = useMemo(() => new Point(300, 300), []);
  const windowX = -200;
  const windowY = -200;
  const windowWidth = 400;
  const windowHeight = 400;
  const centerInWindow = true;
  const showEpicycles = true;
  const showBoundingBox = false;
  const showTargetPath = false;

  const queryParams = new URLSearchParams(window.location.search);
  
  const qObject = queryParams.get('object');
  const pathName: string = qObject || defaultPathName;

  const qDuration = queryParams.get('duration_ms');
  if (qDuration) {
    if (!!!parseInt(qDuration)) {
      console.error("Invalid duration, requires int >0, using default", defaultDurationMs);
    }
  }
  const durationMs = (qDuration && parseInt(qDuration)) || defaultDurationMs;

  const qEpicycles = queryParams.get('epicycles');
  if (qEpicycles) {
    if (!!!parseInt(qEpicycles)) {
      console.error("Invalid epicycles, requires int >0, using default", defaultNumEpicycles);
    }
  }
  const numEpicycles = (qEpicycles && parseInt(qEpicycles)) || defaultNumEpicycles;

  useEffect(() => {
    if (_p5.current !== null) _p5.current.resizeCanvas(width, height);
  }, [width, height]);

  const getPath = useCallback(() => {
    fetchDft(
      pathName, 
      {
        minX: windowX,
        minY: windowY,
        width: windowWidth,
        height: windowHeight,
        centerInWindow: centerInWindow,
      }
    )
    .then(res => {
      const { name, path, bins } = res;
      setLabelMsg(name);
      setSignal(path.map(({ x, y }: { x: number, y: number }) => new Point(x, y)));
      setBins(bins.map(({ re, im }: { re: number, im: number }) => new ComplexNumber(re, im)));
    })
    .catch(err => {
      console.error(err, err.response?.data);
      let errMsg = "An Error Occurred";
      try {
        errMsg = (err.response?.data?.errors[0]?.msg)
      } catch {
        // Not an express-validator 400 error
      }
      setLabelMsg(errMsg);
      setBins([]);
      setSignal([]);
    })
  }, [pathName, windowX, windowY, windowWidth, windowHeight, centerInWindow])

  useEffect(() => {
    getPath();
  }, [getPath])

  const resetDrawFunction = useCallback((p5: P5, signal: Point[], bins: ComplexNumber[]) => {
    const draw2DSignal = draw2DSignalFunc(p5, bins, epicycleOrigin, numEpicycles, durationMs);

    p5.draw = () => {
      p5.background(0);
      
      if (showEpicycles) {
        draw2DSignal();
      }

      if (showTargetPath) {
        p5.stroke(255);
        p5.noFill();
        p5.beginShape();
        signal.forEach(pt => {
          p5.vertex(pt.x + epicycleOrigin.x, pt.y + epicycleOrigin.y);
        });
        p5.endShape("close");
      }

      if (showBoundingBox) {
        p5.stroke(255);
        p5.noFill();
        p5.rect(
          windowX + epicycleOrigin.x, 
          windowY + epicycleOrigin.y, 
          windowWidth, 
          windowHeight,
        );
      }
    }
  }, [durationMs, epicycleOrigin, numEpicycles, showBoundingBox, showEpicycles, showTargetPath, windowX, windowY]);

  useEffect(() => {
    if (_p5.current !== null) {
      resetDrawFunction(_p5.current, signal, bins)
    }
  }, [bins, signal, resetDrawFunction])

  const sketch = useCallback((p5: P5) => {
    p5.setup = () => {
      p5.createCanvas(width, height);
      _p5.current = p5;
    }
    
    const mouseInCanvas = () => {
      return p5.mouseX > 0 
        && p5.mouseX < p5.width 
        && p5.mouseY > 0
        && p5.mouseY < p5.height;
    }
    
    p5.doubleClicked = () => {
      if (mouseInCanvas()) {
        getPath();
      }
    }
  }, [getPath, width, height]);

  return <>{labelMsg}<P5Canvas sketch={sketch}/></>;
}

export default FourierCanvas;


// const draw1DSignalFunc = (
//   p5: P5, 
//   signal: number[], 
//   epicyclesCenter: Point,
//   waveOffsetX: number, 
//   waveMaxLen: number,
//   maxEpicycles?: number,
// ) => {
//   const N = signal.length;
//   const signalComplex = signal.map(pt => new ComplexNumber(0, pt));
//   const dft = DFT(signalComplex);

//   const epicycles = new EpicycleChain()
//     .extend(dft.map(Epicycle.FromComplex).filter((e => !e.isZero())))
//     .sort()
//     .truncate(maxEpicycles ?? N);

//   let time = 0;
//   const wave: number[] = [];
//   const dt = 1 / N;

//   return () => {
//     const endpoint = epicycles.Draw(p5, time, epicyclesCenter, true, true, true);
//     wave.unshift(endpoint.y);

//     p5.stroke(0, 0, 255);
//     p5.line(endpoint.x, endpoint.y, waveOffsetX, endpoint.y);

//     p5.stroke(255);
//     p5.noFill();
//     p5.beginShape();
//     wave.forEach((y, i) => p5.vertex(waveOffsetX + i, y));
//     p5.endShape();

//     time += dt;

//     if (wave.length >= waveMaxLen) wave.pop();
//   }
// }

// const draw2DSignalSeparateFunc = (
//   p5: P5, 
//   signal: Point[], 
//   epicyclesCenterX: Point,
//   epicyclesCenterY: Point,
//   maxEpicyclesX?: number,
//   maxEpicyclesY?: number,
// ) => {
//   const N = signal.length;
//   const signalX = signal.map(pt => new ComplexNumber(pt.x, 0));
//   const signalY = signal.map(pt => new ComplexNumber(0, pt.y));
//   const dftX = DFT(signalX);
//   const dftY = DFT(signalY);

//   const epicyclesX = new EpicycleChain()
//     .extend(dftX.map(Epicycle.FromComplex).filter((e => !e.isZero())))
//     .sort()
//     .truncate(maxEpicyclesX ?? N);
//   const epicyclesY = new EpicycleChain()
//     .extend(dftY.map(Epicycle.FromComplex).filter((e => !e.isZero())))
//     .sort()
//     .truncate(maxEpicyclesY ?? N);

//   let time = 0;
//   const path: Point[] = [];
//   const dt = 1 / N;

//   return () => {
//     const endpointX = epicyclesX.Draw(p5, time, epicyclesCenterX, true, true, true);
//     const endpointY = epicyclesY.Draw(p5, time, epicyclesCenterY, true, true, true);
//     const latest = new Point(endpointX.x, endpointY.y);
//     path.unshift(latest);

//     p5.stroke(0, 0, 255);
//     p5.line(endpointX.x, endpointX.y, latest.x, latest.y);
//     p5.line(endpointY.x, endpointY.y, latest.x, latest.y);

//     p5.stroke(255);
//     p5.noFill();

//     for (let i = 0; i < path.length - 1; i++) {
//       const prev = path[i];
//       const curr = path[i + 1];
//       p5.stroke(255, 255 * ((path.length - i) / path.length))
//       p5.line(prev.x, prev.y, curr.x, curr.y);
//     }

//     time += dt;

//     if (path.length >= N) path.pop();
//   }
// }