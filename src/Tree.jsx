import {useState, useEffect, useRef} from "react";
import {tree} from "./drawTree.js";
import {measureText} from "./text.js";
import {BACKGROUND_COLOR} from "./constants.js";
import {AwesomeQRCode} from "@awesomeqr/react";
import QRCODE from "./qrcode.png";
import {downloadPNG, downloadSVG} from "./file.js";

export function Tree({isAdmin, onAdd, text, setText, onForest, isMobile}) {
  const PLACEHOLDER = "Type your name or nickname...";
  const DEFAULT_TEXT = "Name To Tree";
  const treeRef = useRef(null);
  const inputRef = useRef(null);
  const [tooltip, setTooltip] = useState("");
  const [showQRCode, setShowQRCode] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const inputStyle = {
    fontSize: isAdmin ? "24px" : "16px",
    fontFamily: "monospace",
  };

  const qrCodeUrl = "https://tree.bairui.dev/?text=" + encodeURIComponent(text);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setText(value);
    updateInputWidth(e.target, value);

    // Set typing state to true when user types
    setIsTyping(true);

    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set a new timeout to hide the hint after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
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
      const treeText = text || DEFAULT_TEXT;
      const node = tree(treeText, {grid: false}).render();
      node.setAttribute("viewBox", "0 0 480 480");
      node.style.width = "100%";
      node.style.height = "100%";
      treeRef.current.appendChild(node);
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

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Download modal state
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [modalShowNumbers, setModalShowNumbers] = useState(true);
  const [modalShowSignature, setModalShowSignature] = useState(true);
  const [modalShowPlotter, setModalShowPlotter] = useState(false);
  const modalTreeRef = useRef(null);
  // Render tree in modal when open or when number switch changes
  useEffect(() => {
    if (showDownloadModal && modalTreeRef.current) {
      modalTreeRef.current.innerHTML = "";
      const svg = tree(text, {
        grid: false,
        number: modalShowNumbers,
        stamp: modalShowSignature,
        plot: modalShowPlotter,
      }).render();
      svg.style.width = "100%";
      svg.style.height = "100%";
      svg.setAttribute("viewBox", "0 0 480 480");
      modalTreeRef.current.appendChild(svg);
    }
  }, [showDownloadModal, text, modalShowNumbers, modalShowSignature, modalShowPlotter]);

  // Helper to generate filename with timestamp
  function getDownloadFilename(base) {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, "0");
    const y = now.getFullYear();
    const m = pad(now.getMonth() + 1);
    const d = pad(now.getDate());
    const h = pad(now.getHours());
    const min = pad(now.getMinutes());
    const s = pad(now.getSeconds());
    return `${base}-${y}${m}${d}-${h}${min}${s}`;
  }

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
        className="input-container"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
          <input
            id="input"
            ref={inputRef}
            className="input"
            placeholder={PLACEHOLDER}
            value={text}
            onChange={handleInputChange}
            style={{
              backgroundColor: BACKGROUND_COLOR,
              border: "none",
              borderBottom: "1.5px solid #ddd",
              padding: "5px",
              width: "auto",
              ...inputStyle,
            }}
          />
          <p
            style={{
              marginTop: "10px",
              fontStyle: "italic",
              textAlign: "center",
              visibility: isTyping && text ? "visible" : "hidden",
            }}
          >
            {text ? "Try changing cases, or adding/removing spaces between the words!" : "W"}
          </p>
        </div>
      </div>
      <div
        style={{
          width: 480,
          height: 480,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          maxWidth: "80%",
        }}
      >
        <div
          ref={treeRef}
          style={{
            display: showQRCode ? "none" : "block",
            width: "100%",
            height: "100%",
          }}
        ></div>
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
        className="action-buttons"
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "20px",
          visibility: text ? "visible" : "hidden",
        }}
      >
        {isAdmin ? (
          <>
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
            <button
              onMouseEnter={() => {
                setTooltip("Scan the QR code to download your tree as image!");
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
              Download or Print
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => {
                window.open("https://github.com/pearmini/name2tree/edit/main/src/names.json", "_blank");
              }}
              onMouseEnter={() => setTooltip("Create a Pull Request to add your name to the Forest!")}
              onMouseLeave={() => setTooltip("")}
              className="button primary-button"
              style={{
                fontSize: "14px",
              }}
            >
              Add to Forest
            </button>
            <button className="button" style={{fontSize: "14px"}} onClick={() => onForest()}>
              Explore Forest
            </button>
            <button className="button" style={{fontSize: "14px"}} onClick={() => setShowDownloadModal(true)}>
              Download
            </button>
          </>
        )}
      </div>
      {/* Download Modal Overlay */}
      {showDownloadModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowDownloadModal(false)}
        >
          <div
            style={{
              minWidth: 600,
              minHeight: 600,
              maxWidth: "90vw",
              maxHeight: "90vw",
              backgroundColor: BACKGROUND_COLOR,
              borderRadius: "16px",
              boxShadow: "0 4px 32px rgba(0,0,0,0.18)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
              boxSizing: "border-box",
              aspectRatio: "1/1",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={{
                position: "absolute",
                top: 16,
                right: 24,
                fontSize: 20,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
              onClick={() => setShowDownloadModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div ref={modalTreeRef} style={{width: 480, height: 480, marginBottom: 16}}></div>
            <div style={{display: "flex", flexDirection: "row", gap: 24, marginBottom: 16}}>
              <label style={{display: "flex", alignItems: "center", gap: 8}}>
                <input
                  type="checkbox"
                  checked={modalShowNumbers}
                  onChange={(e) => setModalShowNumbers(e.target.checked)}
                  style={{width: 16, height: 16}}
                />
                Add number
              </label>
              <label style={{display: "flex", alignItems: "center", gap: 8}}>
                <input
                  type="checkbox"
                  checked={modalShowSignature}
                  onChange={(e) => setModalShowSignature(e.target.checked)}
                  style={{width: 16, height: 16}}
                />
                Add Signature
              </label>
              <label style={{display: "flex", alignItems: "center", gap: 8}}>
                <input
                  type="checkbox"
                  checked={modalShowPlotter}
                  onChange={(e) => setModalShowPlotter(e.target.checked)}
                  style={{width: 16, height: 16}}
                />
                Plotter
              </label>
            </div>
            <div style={{display: "flex", gap: 12}}>
              <button
                className="button"
                style={{fontSize: "14px"}}
                onClick={() => downloadPNG(getDownloadFilename(text), modalTreeRef.current.querySelector("svg"))}
              >
                ↓ PNG
              </button>
              <button
                className="button"
                style={{fontSize: "14px"}}
                onClick={() => downloadSVG(getDownloadFilename(text), modalTreeRef.current.querySelector("svg"))}
              >
                ↓ SVG
              </button>
            </div>
          </div>
        </div>
      )}
      <p
        style={{
          visibility: tooltip ? "visible" : "hidden",
          marginTop: "24px",
          fontSize: isAdmin ? "18px" : "14px",
        }}
      >
        {tooltip || "W"}
      </p>
    </div>
  );
}
