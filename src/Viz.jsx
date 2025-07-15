import {useEffect, useRef, useState} from "react";
import {forest} from "./drawForest.js";
import {BACKGROUND_COLOR} from "./constants.js";

export function Viz({names}) {
  const [loading, setLoading] = useState(false);
  const forestRef = useRef(null);

  useEffect(() => {
    let timeout;
    if (forestRef.current) {
      setLoading(true);
      timeout = setTimeout(() => {
        forestRef.current.innerHTML = "";
        const root = forest(names.map((d) => d.name));
        const node = root.render();
        forestRef.current.appendChild(node);
        setLoading(false);
      }, 100);
    }
    return () => {
      clearTimeout(timeout);
    };
  }, [names, forestRef]);

  return (
    <div style={{width: "100vw", height: "100vh", background: BACKGROUND_COLOR, overflow: "hidden"}}>
      {loading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
          }}
        >
          <div style={{transform: "translate(-50%, -50%)"}}>Rendering...</div>
        </div>
      )}
      <div ref={forestRef}></div>
    </div>
  );
}
