import {useRef, useEffect} from "react";
import {tree} from "./drawTree.js";
import {downloadPNG} from "./file.js";

export function Download({text}) {
  const treeRef = useRef(null);

  useEffect(() => {
    if (treeRef.current) {
      treeRef.current.innerHTML = "";
      const svg = tree(text, {grid: false}).render();
      svg.style.width = "100%";
      svg.style.height = "100%";
      svg.setAttribute("viewBox", "0 0 480 480");
      treeRef.current.appendChild(svg);
    }
  }, [text]);

  const handleDownloadPNG = () => {
    const svg = treeRef.current.querySelector("svg");
    downloadPNG(text, svg);
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div ref={treeRef} style={{maxWidth: "calc(100vw - 30px)", maxHeight: "calc(100vh - 30px)"}}></div>
      <div
        style={{
          display: "flex",
          gap: "10px",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <button className="button" onClick={handleDownloadPNG}>
          Download
        </button>
      </div>
    </div>
  );
}
