import {useState, useEffect, useRef} from "react";
import {APack} from "./APack.jsx";
import {tree} from "./drawTree.js";
import {measureText} from "./text.js";
import {BACKGROUND_COLOR} from "./constants.js";

export function Tree({isAdmin, onAdd, onWrite, text, setText}) {
  const PLACEHOLDER = "Type your name or nickname...";
  const DEFAULT_TEXT = "Name To Tree";
  const treeRef = useRef(null);
  const inputRef = useRef(null);
  const [tooltip, setTooltip] = useState("");

  const handleInputChange = (e) => {
    const value = e.target.value;
    setText(value);
    updateInputWidth(e.target, value);
  };

  const handleAdd = () => {
    onAdd(text);
  };

  const updateInputWidth = (input, value) => {
    const text = value.length ? value : PLACEHOLDER;
    const {width} = measureText(text, {fontSize: "16px", fontFamily: "monospace"});
    input.style.width = `${width + 20}px`;
  };

  const handleDownload = () => {
    // const string = JSON.stringify(names);
    // const blob = new Blob([string], {type: "application/json"});
    // const url = URL.createObjectURL(blob);
    // const a = document.createElement("a");
    // a.href = url;
  };

  useEffect(() => {
    const onclick = (e) => {
      if (e.target.className.includes("apack-button")) return;
      if (inputRef.current) inputRef.current.focus();
    };
    window.addEventListener("click", onclick);
    return () => window.removeEventListener("click", onclick);
  }, []);

  useEffect(() => {
    if (treeRef.current) {
      treeRef.current.innerHTML = "";
      treeRef.current.appendChild(tree(text || DEFAULT_TEXT, {grid: false}).render());
    }
  }, [text]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (inputRef.current) {
      updateInputWidth(inputRef.current, text);
    }
  }, [text]);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div>
          <input
            ref={inputRef}
            className="input"
            placeholder={PLACEHOLDER}
            value={text}
            onChange={handleInputChange}
            style={{
              fontFamily: "monospace",
              backgroundColor: BACKGROUND_COLOR,
              border: "none",
              padding: "5px",
              width: "auto",
              fontSize: "16px",
            }}
          />
        </div>
      </div>
      <div ref={treeRef}></div>
      <div
        style={{display: "flex", gap: "10px", marginTop: "20px", visibility: isAdmin && text ? "visible" : "hidden"}}
      >
        {isAdmin && (
          <APack
            text="+"
            cellSize={20}
            onClick={handleAdd}
            onMouseEnter={() => setTooltip("Add to the Public Forest Archive")}
            onMouseLeave={() => setTooltip("")}
          />
        )}
        <APack
          text="Iv"
          cellSize={20}
          onClick={handleDownload}
          onMouseEnter={() => setTooltip("Scan the QR Code to Download")}
          onMouseLeave={() => setTooltip("")}
        />
        <APack
          text="A"
          cellSize={20}
          onClick={onWrite}
          onMouseEnter={() => setTooltip("Write in the Signature Style Above")}
          onMouseLeave={() => setTooltip("")}
        />
      </div>
      <p style={{visibility: isAdmin && tooltip ? "visible" : "hidden", marginTop: "10px"}}>{tooltip || "W"}</p>
    </div>
  );
}
