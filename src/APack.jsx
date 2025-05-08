import * as apack from "apackjs";
import {useEffect, useRef} from "react";
import {BACKGROUND_COLOR} from "./constants.js";

export function APack({text, cellSize, onClick, onMouseEnter, onMouseLeave}) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = "";
      const svg = apack.text(text, {cellSize}).render();
      svg.style.backgroundColor = BACKGROUND_COLOR;
      ref.current.appendChild(svg);
    }
  }, [text]);

  return (
    <div
      className={"apack-button"}
      style={{
        padding: "5px",
        borderRadius: "5px",
        cursor: "pointer",
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <span ref={ref}></span>
    </div>
  );
}
