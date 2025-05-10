import {useState, useEffect, useRef} from "react";
import {APack} from "./APack.jsx";
import {tree} from "./drawTree.js";
import {measureText} from "./text.js";
import {BACKGROUND_COLOR} from "./constants.js";
import {AwesomeQRCode} from "@awesomeqr/react";
import QRCODE from "./qrcode.png";

export function Tree({isAdmin, onAdd, onWrite, text, setText}) {
  const PLACEHOLDER = "Type your name or nickname...";
  const DEFAULT_TEXT = "Name To Tree";
  const treeRef = useRef(null);
  const inputRef = useRef(null);
  const [tooltip, setTooltip] = useState("");
  const [showQRCode, setShowQRCode] = useState(false);

  const qrCodeUrl = "https://tree.bairui.dev/?text=" + encodeURIComponent(text);

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
      <div style={{width: 480, height: 480, display: "flex", alignItems: "center", justifyContent: "center"}}>
        <div ref={treeRef} style={{display: showQRCode ? "none" : "block"}}></div>
        <div style={{width: "400px", height: "400px", display: showQRCode ? "block" : "none"}}>
          <AwesomeQRCode
            options={{
              text: qrCodeUrl,
              size: 960,
              backgroundImage: QRCODE,
              backgroundImageSize: "cover",
              backgroundImagePosition: "center",
              margin: 0,
            }}
          />
        </div>
      </div>
      <div
        style={{display: "flex", gap: "10px", marginTop: "40px", visibility: isAdmin && text ? "visible" : "hidden"}}
      >
        {isAdmin && (
          <button
            onClick={handleAdd}
            onMouseEnter={() => setTooltip("Add to the Public Forest Archive")}
            onMouseLeave={() => setTooltip("")}
            className="button primary-button"
          >
            Add to Forest
          </button>
        )}
        <button
          onMouseEnter={() => {
            setTooltip("Scan the QR Code to Download");
            setShowQRCode(true);
          }}
          onMouseLeave={() => {
            setTooltip("");
            setShowQRCode(false);
          }}
          className="button"
        >
          Download
        </button>
      </div>
      <p style={{visibility: isAdmin && tooltip ? "visible" : "hidden", marginTop: "10px"}}>{tooltip || "W"}</p>
    </div>
  );
}
