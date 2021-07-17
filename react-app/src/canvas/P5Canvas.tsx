import React, { FunctionComponent, useEffect, useRef } from 'react';
import P5 from "p5";

interface Props {
  sketch: (p5: P5) => void;
}

const P5Canvas: FunctionComponent<Props> = ({ sketch }) => {
  const domRef = useRef<HTMLDivElement | null>(null);
  const p5Ref = useRef<P5 | null>(null);

  useEffect(() => {
    if (domRef.current !== null) {
      if (p5Ref.current === null) {
        p5Ref.current = new P5(sketch, domRef.current);
      }
    }
  }, []);

  return (
    <div>
      <div ref={domRef}></div>
    </div>
  );
}

export default P5Canvas;
