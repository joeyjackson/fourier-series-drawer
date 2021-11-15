import { RequestHandler } from "express";
import { validationResult, Schema } from 'express-validator';
import signals from "../paths";
import { DFT, Point } from "../math";

const signalNames = Array.from(signals.keys());

export const signalRequestSchema: Schema = {
  object: {
    optional: true,
    isIn: {
      options: [["random", ...signalNames]],
      errorMessage: "Invalid object name",
    },
  },
  includeDFT: {
    optional: true,
    isBoolean: {
      errorMessage: "includeDFT must be a boolean",
    },
  },
  transform: {
    optional: true,
    custom: {
      options: (transform, { }) => {
        if (transform.window) {
          const existsAndIsInt = (value: any, name: string) => {
            if (value === undefined) {
              throw new Error(`Must specify ${name} in transform.window`);
            }
            if (!Number.isInteger(value)) {
              throw new Error(`transform.window.${name} must be an int`);
            }
          }
          existsAndIsInt(transform.window.minX, "minX");
          existsAndIsInt(transform.window.minY, "minY");
          existsAndIsInt(transform.window.width, "width");
          existsAndIsInt(transform.window.height, "height");
          const centerInWindow = transform.window.centerInWindow;
          if (centerInWindow && typeof centerInWindow !== "boolean") {
            throw new Error("transform.window.centerInWindow must be a boolean")
          }
        }
        return true;
      },
    },
  },
}

export const signalController: RequestHandler = (req, res) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    return res.status(400).json({ errors: validationErrors.array() });
  }

  const objectName = req.body.object;
  let pathName = objectName || "random";
  if (pathName === "random") {
    pathName = signalNames[Math.floor(Math.random() * signalNames.length)];
  }
  let path = signals.get(pathName) || [];
  
  if (req.body.transform.window) {
    path = tranformPathToWindow(
      path, 
      req.body.transform.window.minX,
      req.body.transform.window.minY,
      req.body.transform.window.width,
      req.body.transform.window.height,
      req.body.transform.window.centerInWindow || false,
    );
  }

  const bins = req.body.includeDFT ? DFT(path.map(
    ({ x, y }) => new Point(x, y).asComplexNumber()
  )) : undefined;

  const data = {
    name: pathName,
    path: path,
    bins: bins,
  }
  res.json(data);
}

const tranformPathToWindow = (
  path: { x: number, y: number}[], 
  windowMinX: number, 
  windowMinY: number, 
  windowWidth: number, 
  windowHeight: number, 
  centerInWindow: boolean = false,
) => {
  const minX = Math.min(...path.map(p => p.x));
  const maxX = Math.max(...path.map(p => p.x));
  const minY = Math.min(...path.map(p => p.y));
  const maxY = Math.max(...path.map(p => p.y));
  const pathWidth = maxX - minX;
  const pathHeight = maxY - minY;

  const ratio = Math.min(windowWidth / pathWidth, windowHeight / pathHeight);

  let offsetX = windowMinX;
  let offsetY = windowMinY;
  if (centerInWindow) {
    offsetX += (windowWidth - (pathWidth * ratio)) / 2;
    offsetY += (windowHeight - (pathHeight * ratio)) / 2;
  }

  const transformX = (x: number) => ((x - minX) * ratio) + offsetX;
  const transformY = (y: number) => ((y - minY) * ratio) + offsetY;

  return path.map(pt => ({x: transformX(pt.x), y: transformY(pt.y)}));
}