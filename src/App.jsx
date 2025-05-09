import {useState} from "react";
import {Tree} from "./Tree.jsx";
import {Forest} from "./Forest.jsx";
import {APack} from "./APack.jsx";
import {Writing} from "./Writing.jsx";
import {About} from "./About.jsx";
import {BACKGROUND_COLOR} from "./constants.js";
import {Download} from "./Download.jsx";

import data from "./names.json";
import "./App.css";

function initData() {
  return Array.from(new Set([...JSON.parse(localStorage.getItem("names") || "[]"), ...data]));
}

function App() {
  const isAdmin = new URLSearchParams(window.location.search).get("admin") === "true";
  const qrCodeText = new URLSearchParams(window.location.search).get("text");

  if (qrCodeText) {
    return <Download text={qrCodeText} />;
  }

  const [page, setPage] = useState("tree");
  const [text, setText] = useState("");
  const [names, setNames] = useState(initData());
  const [selectedIndex, setSelectedIndex] = useState(-1);

  function onHome() {
    setPage("tree");
  }

  function onForest() {
    setPage("forest");
  }

  function onWriting() {
    setPage("write");
  }

  function onAbout() {
    setPage("about");
  }

  function onAdd(text) {
    const newNames = [text, ...names];
    setNames(newNames);
    setSelectedIndex(0);
    setPage("forest");
  }

  function onWrite() {
    setPage("write");
  }

  return (
    <div
      style={{
        backgroundColor: BACKGROUND_COLOR,
        fontFamily: "monospace",
      }}
    >
      {page === "tree" && <Tree isAdmin={isAdmin} onAdd={onAdd} text={text} setText={setText} onWrite={onWrite} />}
      {page === "forest" && (
        <Forest
          isAdmin={isAdmin}
          onAdd={onAdd}
          names={names}
          setNames={setNames}
          selectedIndex={selectedIndex}
          setSelectedIndex={setSelectedIndex}
        />
      )}
      {page === "write" && <Writing isAdmin={isAdmin} />}
      {page === "about" && <About isAdmin={isAdmin} />}
      <div
        style={{
          position: "fixed",
          bottom: "12px",
          right: "12px",
          borderRadius: "10px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
        }}
      >
        {page === "tree" ? (
          <>
            <APack text="Forest" cellSize={50} onClick={onForest} />
            <APack text="Write" cellSize={50} onClick={onWriting} />
            <APack text="About" cellSize={50} onClick={onAbout} />
          </>
        ) : (
          <APack text="Home" cellSize={50} onClick={onHome} />
        )}
      </div>
    </div>
  );
}

export default App;
