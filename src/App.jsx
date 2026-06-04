import {useEffect, useState} from "react";
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
import {validateName} from "./lib/validateName.js";
import {addCommunityTree, isSupabaseConfigured} from "./lib/treesApi.js";

function initData() {
  return data.map((entry) => ({...entry, source: "archive"}));
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

  const [text, setTextState] = useState("");
  const [archiveNames, setArchiveNames] = useState(initData);
  const [communityTrees, setCommunityTrees] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [addError, setAddError] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const setText = (value) => {
    setTextState(value);
    setAddError("");
  };

  useEffect(() => {
    if (location.pathname !== "/") {
      setIsAdding(false);
    }
  }, [location.pathname]);

  const showMenu = location.pathname === "/";
  const showBack = location.pathname !== "/";
  const showBackMiddle = location.pathname !== "/viz";

  function onAdd(text) {
    const newName = {name: text, id: uid(), createdAt: new Date(), source: "archive"};
    const newNames = [newName, ...archiveNames];
    setArchiveNames(newNames);
    setSelectedIndex(0);
    navigate("/forest");
    saveToLocalStorage(newNames);
  }

  async function onAddCommunity(text) {
    setAddError("");
    const validation = validateName(text);
    if (!validation.ok) {
      setAddError(validation.error);
      return;
    }
    if (!isSupabaseConfigured()) {
      setAddError("Forest is not connected yet. Please try again later.");
      return;
    }
    setIsAdding(true);
    try {
      const tree = await addCommunityTree(validation.name);
      setCommunityTrees((prev) => [tree, ...prev]);
      setSelectedIndex(0);
      navigate("/forest");
    } catch (err) {
      setAddError(err.message ?? "Could not add your tree. Please try again.");
      setIsAdding(false);
    }
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
              onAddCommunity={onAddCommunity}
              addError={addError}
              isAdding={isAdding}
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
              archiveNames={archiveNames}
              setArchiveNames={setArchiveNames}
              communityTrees={communityTrees}
              setCommunityTrees={setCommunityTrees}
              selectedIndex={selectedIndex}
              setSelectedIndex={setSelectedIndex}
            />
          }
        />
        <Route path="/write" element={<Writing isAdmin={isAdmin} />} />
        <Route path="/about" element={<About isAdmin={isAdmin} />} />
        <Route path="/viz" element={<Viz names={archiveNames} />} />
      </Routes>
      {showMenu && (
        <div className="menu-container">
          <Link to="/forest" style={{textDecoration: "none"}}>
            <APack text="Forest" cellSize={50} />
          </Link>
          <a
            href="https://landscape.bairui.dev/"
            target="_blank"
            rel="noopener noreferrer"
            style={{textDecoration: "none"}}
          >
            <APack text="Landscape" cellSize={50} />
          </a>
          <Link to="/viz" style={{textDecoration: "none"}}>
            <APack text="Viz" cellSize={50} />
          </Link>
          <a
            href="https://music.bairui.dev/tree"
            target="_blank"
            rel="noopener noreferrer"
            style={{textDecoration: "none"}}
          >
            <APack text="Harmony" cellSize={50} />
          </a>
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
        <header className="home-header">
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
        </header>
      )}
    </div>
  );
}

export default App;
