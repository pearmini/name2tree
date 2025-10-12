import {useEffect, useRef, useState, useMemo} from "react";
import {forest} from "./drawForest.js";
import {BACKGROUND_COLOR} from "./constants.js";

export function Viz({names}) {
  const [loading, setLoading] = useState(false);
  const forestRef = useRef(null);
  const layoutRef = useRef(null);
  const [selectedLayout, setSelectedLayout] = useState("swarm");
  const [sortBy, setSortBy] = useState("time-asc");
  const headerHeight = 68;
  const [horizontal, setHorizontal] = useState(true);

  const description = useMemo(() => {
    if (selectedLayout === "cloud") {
      return {
        title: "Tree Cloud: Natural Forest",
        description: "Trees arranged organically, simulating a real forest. Pan, zoom, and click to explore.",
      };
    } else if (selectedLayout === "grid") {
      return {
        title: "Tree Grid: Structured Overview",
        description: "Organized matrix view. Pan, zoom, and click to explore individual trees.",
      };
    } else if (selectedLayout === "swarm") {
      return {
        title: "Tree Swarm: Timeline View",
        description: "Watch our forest grow chronologically throughout ITP Spring Show 2025.",
      };
    }
  }, [selectedLayout]);

  useEffect(() => {
    if (forestRef.current) {
      const filteredNames = names.filter((d) => d.createdAt && d.id);

      layoutRef.current = forest(forestRef.current, {
        styleWidth: window.innerWidth,
        styleHeight: window.innerHeight - headerHeight,
        names: filteredNames,
      });

      layoutRef.current.on("start", () => setLoading(true));
      layoutRef.current.on("end", () => setLoading(false));

      layoutRef.current.update({layout: selectedLayout, sortBy});
    }
    return () => {
      layoutRef.current.stop();
    };
  }, [names, forestRef]);

  useEffect(() => {
    if (layoutRef.current) {
      layoutRef.current.update({layout: selectedLayout, sortBy});
    }
  }, [selectedLayout]);

  useEffect(() => {
    if (layoutRef.current) {
      layoutRef.current.update({layout: selectedLayout, sortBy});
    }
  }, [sortBy]);

  useEffect(() => {
    console.log("horizontal", horizontal);
    if (layoutRef.current) {
      layoutRef.current.update({layout: selectedLayout, horizontal});
    }
  }, [horizontal]);

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
          <h2 style={{marginBottom: 4}}>{description.title}</h2>
          <p>{description.description}</p>
        </div>
        <div style={{display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 20}}>
          {selectedLayout === "grid" && (
            <div className="select-container">
              <select className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="time-asc">Sort by Time (Asc)</option>
                <option value="time-desc">Sort by Time (Desc)</option>
                <option value="name-asc">Sort by Name (Asc)</option>
                <option value="name-desc">Sort by Name (Desc)</option>
                <option value="number-asc">Sort by Digits (Asc)</option>
                <option value="number-desc">Sort by Digits (Desc)</option>
              </select>
            </div>
          )}
          {selectedLayout === "swarm" && (
            <div className="select-container">
              <select
                className="select"
                value={horizontal ? "horizontal" : "vertical"}
                onChange={(e) => setHorizontal(e.target.value === "horizontal")}
              >
                <option value="horizontal">Horizontal</option>
                <option value="vertical">Vertical</option>
              </select>
            </div>
          )}
          <div className="select-container">
            <select className="select" value={selectedLayout} onChange={(e) => setSelectedLayout(e.target.value)}>
              <option value="swarm">Swarm</option>
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
            <div
              style={{
                transform: "translate(-50%, -50%)",
                background: BACKGROUND_COLOR,
                padding: 10,
                border: "1px solid black",
              }}
            >
              Rendering...
            </div>
          </div>
        )}
        <div ref={forestRef}></div>
      </div>
    </div>
  );
}
