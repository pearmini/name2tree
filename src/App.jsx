import {useState} from "react";
import {Tree} from "./Tree.jsx";
import {Forest} from "./Forest.jsx";
import {APack} from "./APack.jsx";
import {Writing} from "./Writing.jsx";
import {About} from "./About.jsx";
import {BACKGROUND_COLOR} from "./constants.js";
import {Download} from "./Download.jsx";
import {saveToLocalStorage} from "./file.js";
import data from "./names.json";
import "./App.css";

function initData() {
  const localNames = localStorage.getItem("names");
  return localNames ? JSON.parse(localNames) : data;
}

function uid() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
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
    setSelectedIndex(-1);
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
    const newName = {name: text, id: uid(), createdAt: new Date()};
    const newNames = [newName, ...names];
    setNames(newNames);
    setSelectedIndex(0);
    setPage("forest");
    saveToLocalStorage(newNames);
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
        {/* <APack text="Tree" cellSize={40} onClick={onHome} />
        <APack text="Forest" cellSize={40} onClick={onForest} />
        <APack text="Write" cellSize={40} onClick={onWriting} />
        <APack text="About" cellSize={40} onClick={onAbout} /> */}
        {page === "tree" ? (
          <>
            <APack text="Forest" cellSize={40} onClick={onForest} />
            <APack text="Write" cellSize={40} onClick={onWriting} />
            <APack text="About" cellSize={40} onClick={onAbout} />
          </>
        ) : (
          <APack text="Home" cellSize={40} onClick={onHome} />
        )}
      </div>
    </div>
  );
}

export default App;
