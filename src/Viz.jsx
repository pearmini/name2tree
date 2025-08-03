import {useEffect, useRef, useState} from "react";
import {forest} from "./drawForest.js";
import {BACKGROUND_COLOR} from "./constants.js";

export function Viz({names}) {
  const [loading, setLoading] = useState(false);
  const forestRef = useRef(null);
  const layoutRef = useRef(null);
  const [selectedLayout, setSelectedLayout] = useState("cloud");
  const headerHeight = 68;

  useEffect(() => {
    let timeout;
    if (forestRef.current) {
      setLoading(true);
      timeout = setTimeout(() => {
        layoutRef.current = forest(forestRef.current, {
          styleWidth: window.innerWidth,
          styleHeight: window.innerHeight - headerHeight,
          names: names.map((d) => d.name),
        });
        layoutRef.current.update(selectedLayout);
        setLoading(false);
      }, 100);
    }
    return () => {
      clearTimeout(timeout);
    };
  }, [names, forestRef]);

  useEffect(() => {
    if (layoutRef.current) {
      layoutRef.current.update(selectedLayout);
    }
  }, [selectedLayout]);

  return (
    <div style={{width: "100vw", height: "100vh", background: BACKGROUND_COLOR, overflow: "hidden"}}>
      <div
        style={{
          height: headerHeight,
          borderBottom: "1px solid #ccc",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          padding: "0 20px",
          paddingRight: 100,
        }}
      >
        <div style={{display: "flex", flexDirection: "column", justifyContent: "center"}}>
          <h2 style={{marginBottom: 4}}>Tree Cloud: Placing trees along a spiral path</h2>
          <p>Pan and zoom. Click to zoom to a specific tree.</p>
        </div>
        <div style={{display: "flex", flexDirection: "column", justifyContent: "center"}}>
          <div className="select-container">
            <select className="select" value={selectedLayout} onChange={(e) => setSelectedLayout(e.target.value)}>
              <option value="cloud">Cloud</option>
              <option value="grid">Grid</option>
            </select>
          </div>
        </div>
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
