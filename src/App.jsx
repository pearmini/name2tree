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
import {Routes, Route, useLocation, useNavigate, Link} from "react-router-dom";

function initData() {
  // const localNames = localStorage.getItem("names");
  // const names = localNames && JSON.parse(localNames);
  return data;
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

  const [text, setText] = useState("");
  const [names, setNames] = useState(initData());
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const location = useLocation();
  const navigate = useNavigate();

  // Show menu only on tree page
  const showMenu = location.pathname === "/";
  const showBack = location.pathname !== "/";
  const showBackMiddle = location.pathname !== "/viz";

  function onAdd(text) {
    const newName = {name: text, id: uid(), createdAt: new Date()};
    const newNames = [newName, ...names];
    setNames(newNames);
    setSelectedIndex(0);
    navigate("/forest");
    saveToLocalStorage(newNames);
  }

  return (
    <div
      style={{
        backgroundColor: BACKGROUND_COLOR,
        fontFamily: "monospace",
      }}
    >
      <Routes>
        <Route
          path="/"
          element={
            <Tree
              isAdmin={isAdmin}
              onAdd={onAdd}
              text={text}
              setText={setText}
              onWrite={() => navigate("/write")}
              onForest={() => navigate("/forest")}
              isMobile={isMobile}
            />
          }
        />
        <Route
          path="/forest"
          element={
            <Forest
              isAdmin={isAdmin}
              onAdd={onAdd}
              names={names}
              setNames={setNames}
              selectedIndex={selectedIndex}
              setSelectedIndex={setSelectedIndex}
            />
          }
        />
        <Route path="/write" element={<Writing isAdmin={isAdmin} />} />
        <Route path="/about" element={<About isAdmin={isAdmin} />} />
        <Route path="/viz" element={<Viz names={names} />} />
      </Routes>
      {showMenu && (
        <div className="menu-container">
          <Link to="/forest" style={{textDecoration: "none"}}>
            <APack text="Forest" cellSize={50} />
          </Link>
          <Link to="/viz" style={{textDecoration: "none"}}>
            <APack text="Viz" cellSize={50} />
          </Link>
          {isAdmin && (
            <Link to="/write" style={{textDecoration: "none"}}>
              <APack text="Write" cellSize={50} />
            </Link>
          )}
          <Link to="/about" style={{textDecoration: "none"}}>
            <APack text="About" cellSize={50} />
          </Link>
          {!isAdmin && (
            <a
              href="https://github.com/pearmini/string2tree"
              target="_blank"
              rel="noopener noreferrer"
              style={{textDecoration: "none"}}
            >
              <APack text="Github" cellSize={50} />
            </a>
          )}
        </div>
      )}
      {showBack && (
        <div
          className="home-button-container"
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
          <button onClick={() => navigate("/")} className="button">
            Home
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
