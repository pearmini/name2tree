import {useEffect, useRef, useState} from "react";
import {forest} from "./drawForest.js";
import {BACKGROUND_COLOR} from "./constants.js";

export function Viz({names}) {
  const [loading, setLoading] = useState(false);
  const forestRef = useRef(null);
  const headerHeight = 68;

  useEffect(() => {
    let timeout;
    if (forestRef.current) {
      setLoading(true);
      timeout = setTimeout(() => {
        forestRef.current.innerHTML = "";
        const root = forest(
          names.map((d) => d.name),
          {styleWidth: window.innerWidth, styleHeight: window.innerHeight - headerHeight},
        );
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
      <div
        style={{
          height: headerHeight,
          borderBottom: "1px solid #ccc",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 20px",
        }}
      >
        <h2 style={{marginBottom: 4}}>Tree Cloud: Place trees along a spiral path</h2>
        <p>Pan and zoom. Click to zoom to a specific tree.</p>
      </div>
      <div>
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
    </div>
  );
}
