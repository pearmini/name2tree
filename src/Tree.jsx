import {useState, useEffect, useRef} from "react";
import {tree} from "./drawTree.js";
import {measureText} from "./text.js";
import {BACKGROUND_COLOR} from "./constants.js";
import {AwesomeQRCode} from "@awesomeqr/react";
import QRCODE from "./qrcode.png";

function capitalizeFirstLetter(str) {
  // return str
  //   .split(" ")
  //   .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  //   .join(" ");
  return str;
}

export function Tree({isAdmin, onAdd, text, setText}) {
  const PLACEHOLDER = "Type your name or nickname...";
  const DEFAULT_TEXT = "Name To Tree";
  const treeRef = useRef(null);
  const inputRef = useRef(null);
  const [tooltip, setTooltip] = useState("");
  const [showQRCode, setShowQRCode] = useState(false);
  const inputStyle = {
    fontSize: "24px",
    fontFamily: "monospace",
  };

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
    const MAX_WIDTH = Math.min(500, window.innerWidth * 0.8);
    const text = value.length ? value : PLACEHOLDER;
    const {width} = measureText(text, inputStyle);
    input.style.width = `${Math.min(width + 20, MAX_WIDTH)}px`;
  };

  useEffect(() => {
    const onclick = (e) => {
      if (inputRef.current) inputRef.current.focus();
    };
    window.addEventListener("click", onclick);
    return () => window.removeEventListener("click", onclick);
  }, []);

  useEffect(() => {
    if (treeRef.current) {
      treeRef.current.innerHTML = "";
      const treeText = capitalizeFirstLetter(text || DEFAULT_TEXT);
      treeRef.current.appendChild(tree(treeText, {grid: false}).render());
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
              backgroundColor: BACKGROUND_COLOR,
              border: "none",
              padding: "5px",
              width: "auto",
              ...inputStyle,
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
        style={{display: "flex", gap: "10px", marginTop: "20px", visibility: isAdmin && text ? "visible" : "hidden"}}
      >
        {isAdmin && (
          <button
            onClick={handleAdd}
            onMouseEnter={() => setTooltip("Let's create a forest together with your signature!")}
            onMouseLeave={() => setTooltip("")}
            className="button primary-button"
            style={{
              fontSize: "18px",
            }}
          >
            Add to Forest
          </button>
        )}
        <button
          onMouseEnter={() => {
            setTooltip("Scan the QR code to download or share your tree!");
            setShowQRCode(true);
          }}
          onMouseLeave={() => {
            setTooltip("");
            setShowQRCode(false);
          }}
          className="button"
          style={{
            fontSize: "18px",
          }}
        >
          Download
        </button>
      </div>
      <p
        style={{
          visibility: isAdmin && tooltip ? "visible" : "hidden",
          marginTop: "24px",
          fontSize: "18px",
        }}
      >
        {tooltip || "W"}
      </p>
    </div>
  );
}
