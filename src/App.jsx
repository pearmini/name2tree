import {useState} from "react";
import {Tree} from "./Tree.jsx";
import {Forest} from "./Forest.jsx";
import {APack} from "./APack.jsx";
import {Viz} from "./Viz.jsx";
import {Writing} from "./Writing.jsx";
import {About} from "./About.jsx";
import {BACKGROUND_COLOR} from "./constants.js";
import {Download} from "./Download.jsx";
import {saveToLocalStorage} from "./file.js";
import data from "./names.json";
import "./App.css";

function initData() {
  const localNames = localStorage.getItem("names");
  const names = localNames && JSON.parse(localNames);
  return names && names.length !== 0 ? names : data;
}

function uid() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function App() {
  const isAdmin = new URLSearchParams(window.location.search).get("admin") === "true";
  const qrCodeText = new URLSearchParams(window.location.search).get("text");
  const isMobile = window.innerWidth < 768;

  if (qrCodeText) {
    return <Download text={qrCodeText} />;
  }

  const [page, setPage] = useState("tree");
  const [text, setText] = useState("");
  const [names, setNames] = useState(initData());
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const showMenu = !isMobile && page === "tree";
  const showBack = !isMobile && page !== "tree";
  const showBackMiddle = page !== "visualize";

  function onHome() {
    setPage("tree");
    setSelectedIndex(-1);
  }

  function onForest() {
    setPage("forest");
  }

  function onVisualize() {
    setPage("visualize");
  }

  function onWriting() {
    if (isAdmin) {
      setPage("write");
    } else {
      window.open("https://apack.bairui.dev/", "_blank");
    }
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

  function onGithub() {
    window.open("https://github.com/pearmini/string2tree", "_blank");
  }

  return (
    <div
      style={{
        backgroundColor: BACKGROUND_COLOR,
        fontFamily: "monospace",
      }}
    >
      {page === "tree" && (
        <Tree
          isAdmin={isAdmin}
          onAdd={onAdd}
          text={text}
          setText={setText}
          onWrite={onWrite}
          onForest={onForest}
          isMobile={isMobile}
        />
      )}
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
      {page === "visualize" && <Viz names={names} />}
      {showMenu && (
        <div
          style={{
            position: "fixed",
            right: "20px",
            borderRadius: "10px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
            bottom: "50%",
            transform: "translateY(50%)",
          }}
        >
          <APack text="Forest" cellSize={50} onClick={onForest} />
          <APack text="Viz" cellSize={50} onClick={onVisualize} />
          {isAdmin && <APack text="Write" cellSize={50} onClick={onWriting} />}
          <APack text="About" cellSize={50} onClick={onAbout} />
          {!isAdmin && <APack text="Github" cellSize={50} onClick={onGithub} />}
        </div>
      )}
      {showBack && (
        <div
          style={
            showBackMiddle
              ? {
                  position: "fixed",
                  right: "20px",
                  top: "50%",
                  transform: "translateY(-50%)",
                }
              : {position: "fixed", right: "20px", top: "20px"}
          }
        >
          <button onClick={onHome} className="button primary-button">
            Back
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
