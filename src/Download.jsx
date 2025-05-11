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
        justifyContent: "flex-start",
        overflow: "auto",
        fontFamily: "monospace",
      }}
    >
      <p style={{marginTop: "60px", fontSize: "20px", marginBottom: "20px"}}>Thanks for loving the tree!</p>
      <div style={{display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"}}>
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
      <ul style={{fontSize: "18px", marginTop: "60px"}}>
        <li style={{paddingBottom: "10px"}}>
          <span>
            Name2Tree: <a href="https://tree.bairui.dev">tree.bairui.dev</a>
          </span>
        </li>
        <li style={{paddingBottom: "10px"}}>
          <span>
            APack: <a href="https://apack.bairui.dev">apack.bairui.dev</a>
          </span>
        </li>
        <li style={{paddingBottom: "10px"}}>
          <span>
            Charming.js: <a href="https://charmingjs.org">charmingjs.org</a>
          </span>
        </li>
        <li style={{paddingBottom: "10px"}}>
          <span>
            GitHub: <a href="https://github.com/pearmini">@pearmini</a>
          </span>
        </li>
        <li style={{paddingBottom: "10px"}}>
          <span>
            Instagram: <a href="https://www.instagram.com/subairui24">@subairui24</a>
          </span>
        </li>
      </ul>
    </div>
  );
}
