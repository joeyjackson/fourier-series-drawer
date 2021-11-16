import React, { FunctionComponent, useState, useRef, useCallback, useEffect, useMemo } from 'react';
import P5 from "p5";
import axios from "axios";
import { REACT_APP_BACKEND_BASE_URL } from '../App';
import P5Canvas from './P5Canvas';
import Epicycle, { Point, ComplexNumber } from '../fourier/Epicycle';
import EpicycleChain from '../fourier/EpicycleChain';

interface Props {
  maxWidth?: number;
  maxHeight?: number;
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

let resizeDebounceTimer: any;

const resizeDebounce = (callback: () => void) => {
  window.clearTimeout(resizeDebounceTimer);
  resizeDebounceTimer = window.setTimeout(callback, 1000)
}

const FourierCanvas: FunctionComponent<Props> = ({ maxWidth = 600, maxHeight = 600 }) => {
  const [width, setWidth] = useState<number>(maxWidth);
  const [height, setHeight] = useState<number>(maxHeight);
  const _p5 = useRef<P5 | null>(null);
  const [signal, setSignal] = useState<Point[]>([]);
  const [bins, setBins] = useState<ComplexNumber[]>([]);
  const [labelMsg, setLabelMsg] = useState<string>("");

  const handleResize = useCallback(() => {
    resizeDebounce(() => {
      const _width = window.visualViewport.width - 20;
      const _height = window.visualViewport.height;
      const newWidth = Math.floor(_width > maxWidth ? maxWidth : _width);
      const newHeight = Math.floor(_height > maxHeight ? maxHeight : _height);
      setWidth(newWidth);
      setHeight(newHeight);
    });
  }, []);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [maxWidth, maxHeight]);

  // Static options
  const defaultPathName = "random";
  const defaultDurationMs = 10000;
  const defaultNumEpicycles = 64;
  const centerInWindow = true;
  const showEpicycles = true;
  const showBoundingBox = false;
  const showTargetPath = false;

  // Window sizing
  const paddingX = useMemo(() => Math.floor(width / 3), [width]);
  const paddingY = useMemo(() => Math.floor(height / 3), [height]);
  const originX = useMemo(() => Math.floor(width / 2), [width]);
  const originY = useMemo(() => Math.floor(height / 2), [height]);
  const epicycleOrigin = useMemo(() => new Point(originX, originY), [originX, originY]);
  const windowX = useMemo(() => paddingX - originX, [paddingX, originX]);
  const windowY = useMemo(() => paddingY - originY, [paddingY, originY]);
  const windowWidth = useMemo(() => width - 2*paddingX, [width, paddingX]);
  const windowHeight = useMemo(() => height - 2*paddingY, [height, paddingY]);

  // URL Params
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

  const cachedPathName = useRef<string>(pathName);

  // Resize P5
  useEffect(() => {
    if (_p5.current !== null) {
      _p5.current.resizeCanvas(width, height);
    }
  }, [width, height]);

  const fetchPath = useCallback((pathName) => {
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
      cachedPathName.current = name;
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
  }, [windowX, windowY, windowWidth, windowHeight, centerInWindow]);

  useEffect(() => {
    fetchPath(cachedPathName.current);
  }, [fetchPath])

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
  }, [durationMs, epicycleOrigin, numEpicycles, showBoundingBox, showEpicycles, showTargetPath, windowX, windowY, windowHeight, windowWidth]);

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
        setLabelMsg("Loading...");
        fetchPath(pathName);
      }
    }
  }, [width, height, fetchPath, handleResize]);

  return <>
    <h6>{labelMsg}</h6>
    <P5Canvas sketch={sketch}/>
  </>;
}

export default FourierCanvas;