import * as apack from "apackjs";
import {useEffect, useRef} from "react";
import {BACKGROUND_COLOR} from "./constants.js";

export function APack({text, cellSize, onClick, onMouseEnter, onMouseLeave, style={}}) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = "";
      const svg = apack.text(text, {cellSize, word: {strokeWidth: 1.5}}).render();
      svg.style.backgroundColor = BACKGROUND_COLOR;
      ref.current.appendChild(svg);
    }
  }, [text]);

  return (
    <div
      className={"apack-button"}
      style={{
        padding: "2px",
        cursor: "pointer",
        border: "1.5px solid black",
        ...style,
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <span ref={ref}></span>
    </div>
  );
}
