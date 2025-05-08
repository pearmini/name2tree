import {useRef, useEffect} from "react";
import {tree} from "./drawTree.js";

export function Download({text}) {
  const treeRef = useRef(null);
  const buttonStyle = {
    backgroundColor: "transparent",
    color: "black",
    padding: "10px",
    borderRadius: "5px",
    border: "1.5px solid black",
  };

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

  const handleDownloadSVG = () => {
    const svg = treeRef.current.querySelector("svg");
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], {type: "image/svg+xml"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${text}.svg`;
    a.click();
  };

  const handleDownloadPNG = () => {
    const svg = treeRef.current.querySelector("svg");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onerror = (e) => {
      console.error("Error loading image:", e);
    };
    
    // Convert SVG to data URL
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], {type: "image/svg+xml;charset=utf-8"});
    const reader = new FileReader();
    
    reader.onload = (e) => {
      img.src = e.target.result;
    };
    
    reader.readAsDataURL(svgBlob);
    
    img.onload = () => {
      console.log("Image loaded successfully");
      // Get device pixel ratio
      const dpr = window.devicePixelRatio || 1;
      
      // Set canvas dimensions accounting for pixel ratio
      canvas.width = img.width * dpr;
      canvas.height = img.height * dpr;
      
      // Scale context to account for pixel ratio
      ctx.scale(dpr, dpr);
      
      // Draw image at original size
      ctx.drawImage(img, 0, 0, img.width, img.height);
      
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `${text}.png`;
      a.click();
    };
  };

  return (
    <div
      style={{
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
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
        <button style={buttonStyle} onClick={handleDownloadPNG}>
          Download PNG
        </button>
        <button style={buttonStyle} onClick={handleDownloadSVG}>
          Download SVG
        </button>
      </div>
    </div>
  );
}
