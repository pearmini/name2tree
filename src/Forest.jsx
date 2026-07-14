import {useEffect, useMemo, useState} from "react";
import {saveToLocalStorage} from "./file.js";
import {TreeItem} from "./TreeItem.jsx";
import QRCODE from "./qrcode.png";
import {AwesomeQRCode} from "@awesomeqr/react";
import {BACKGROUND_COLOR} from "./constants.js";
import {getBrowserId} from "./lib/browserId.js";
import {deleteCommunityTree, fetchCommunityTrees, isSupabaseConfigured} from "./lib/treesApi.js";

function TreeModal({name, onClose, isAdmin}) {
  const [showQRCode, setShowQRCode] = useState(false);
  const qrCodeUrl = "https://tree.bairui.dev/?text=" + encodeURIComponent(name);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: !isAdmin ? "60vmin" : "80vmin",
          height: !isAdmin ? "60vmin" : "80vmin",
          overflow: "hidden",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: BACKGROUND_COLOR,
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {showQRCode ? (
          <div style={{width: "60vmin", height: "60vmin"}}>
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
        ) : (
          <TreeItem name={name} />
        )}
        {isAdmin && (
          <button
            onMouseEnter={() => setShowQRCode(true)}
            onMouseLeave={() => setShowQRCode(false)}
            className="button primary-button"
            style={{position: "absolute", top: 0, right: 0}}
          >
            Download
          </button>
        )}
      </div>
    </div>
  );
}

function DeleteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
      />
    </svg>
  );
}

function ForestSection({title, description, count, children}) {
  return (
    <section className="forest-section">
      <header className="forest-section-header">
        <h2 className="forest-section-title">{title}</h2>
        <p className="forest-section-description">{description}</p>
        <p className="forest-section-count">
          {count} {count === 1 ? "tree" : "trees"}
        </p>
      </header>
      <div className="forest-grid">{children}</div>
    </section>
  );
}

function ForestTreeCell({entry, onClick, onDelete, animateEnter = false}) {
  const isOwn = entry.source === "community" && entry.browserId === getBrowserId();

  return (
    <div className="forest-cell" style={{position: "relative"}}>
      <TreeItem
        name={entry.name}
        onClick={onClick}
        options={{padding: 0, number: false}}
        style={{cursor: "pointer"}}
        animateEnter={animateEnter}
      />
      {isOwn && onDelete && (
        <button
          type="button"
          className="forest-own-control"
          title="Delete your tree"
          aria-label="Delete your tree"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <span className="forest-own-dot" aria-hidden="true">
            *
          </span>
          <span className="forest-own-delete" aria-hidden="true">
            <DeleteIcon />
          </span>
        </button>
      )}
    </div>
  );
}

export function Forest({
  isAdmin,
  archiveNames,
  setArchiveNames,
  communityTrees,
  setCommunityTrees,
  justAddedId,
  setJustAddedId,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [loadState, setLoadState] = useState("idle");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!justAddedId) return;
    const timer = setTimeout(() => setJustAddedId(null), 1500);
    return () => clearTimeout(timer);
  }, [justAddedId, setJustAddedId]);

  const displayNames = useMemo(
    () => [...communityTrees, ...archiveNames],
    [communityTrees, archiveNames],
  );

  const selectedName =
    typeof selectedId === "number"
      ? displayNames[selectedId]
      : displayNames.find((name) => name.id === selectedId);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    setLoadState("loading");
    setLoadError("");
    fetchCommunityTrees()
      .then((trees) => {
        if (!cancelled) {
          setCommunityTrees(trees);
          setLoadState("done");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err.message ?? "Could not load community trees.");
          setLoadState("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [setCommunityTrees]);

  function onClickTree(id, index) {
    setSelectedId(id ?? index);
  }

  async function onDeleteCommunityTree(id) {
    if (!confirm("Remove your tree from the forest?")) return;
    try {
      await deleteCommunityTree(id);
      setCommunityTrees((prev) => prev.filter((t) => t.id !== id));
      setSelectedId(null);
    } catch (err) {
      alert(err.message ?? "Could not delete your tree.");
    }
  }

  const onSaveToLocalStorage = (names) => {
    saveToLocalStorage(names);
    alert("Saved to local storage.");
  };

  const onRemoveName = () => {
    const entry = selectedName;
    if (!entry || entry.source === "community") return;
    if (confirm("Are you sure you want to remove this tree?")) {
      const archiveIndex =
        typeof selectedId === "number"
          ? selectedId - communityTrees.length
          : archiveNames.findIndex((name) => name.id === selectedId);
      if (archiveIndex < 0) return;
      const newNames = [...archiveNames];
      newNames.splice(archiveIndex, 1);
      setArchiveNames(newNames);
      saveToLocalStorage(newNames);
      setSelectedId(null);
    }
  };

  const onDownloadToFile = (names) => {
    const string = JSON.stringify(names);
    const blob = new Blob([string], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "names.json";
    a.click();
  };

  const onClearLocalStorage = () => {
    setArchiveNames([]);
    saveToLocalStorage([]);
    alert("Cleared local storage.");
  };

  function renderTreeCells(entries, indexOffset) {
    return entries.map((entry, index) => {
      const globalIndex = indexOffset + index;
      return (
        <ForestTreeCell
          key={entry.source === "community" ? entry.id : entry.id || entry.name || globalIndex}
          entry={entry}
          animateEnter={justAddedId != null && entry.id === justAddedId}
          onClick={() => onClickTree(entry.id, globalIndex)}
          onDelete={
            entry.source === "community" && entry.browserId === getBrowserId()
              ? () => onDeleteCommunityTree(entry.id)
              : undefined
          }
        />
      );
    });
  }

  const onUploadFile = () => {
    const file = document.createElement("input");
    file.type = "file";
    file.onchange = (e) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const names = JSON.parse(e.target.result).map((entry) => ({
          ...entry,
          source: "archive",
        }));
        setArchiveNames(names);
      };
      reader.readAsText(e.target.files[0]);
    };
    file.click();
  };

  useEffect(() => {
    const keydown = (e) => {
      if (!isAdmin) return;
      if (e.key === "s") {
        e.preventDefault();
        onSaveToLocalStorage(archiveNames);
      } else if (e.key === "d") {
        e.preventDefault();
        onDownloadToFile(archiveNames);
      } else if (e.key === "c") {
        e.preventDefault();
        onClearLocalStorage();
      } else if (e.key === "z") {
        e.preventDefault();
        onRemoveName();
      } else if (e.key === "u") {
        e.preventDefault();
        onUploadFile();
      }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [archiveNames, communityTrees, selectedId, selectedName]);

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            0% {
              opacity: 0.5;
              transform: scale(0.1);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}
      </style>
      {loadState === "loading" && (
        <p className="forest-status" style={{padding: "12px 100px 0", margin: 0}}>
          Loading community trees…
        </p>
      )}
      {loadState === "error" && (
        <p className="forest-status forest-status-error" style={{padding: "12px 100px 0", margin: 0}}>
          {loadError}
        </p>
      )}
      <div className="forest-page">
        {communityTrees.length > 0 && (
          <ForestSection
            title="Community Forest"
            description="Trees added online by visitors. Type your name on the home page and press Add to Forest. Hover your tree (marked with *) to delete it."
            count={communityTrees.length}
          >
            {renderTreeCells(communityTrees, 0)}
          </ForestSection>
        )}
        <ForestSection
          title="ITP Spring Show 2025"
          description="Trees from Find Trees in Names at NYU ITP — names typed at the show and kept in the installation archive."
          count={archiveNames.length}
        >
          {renderTreeCells(archiveNames, communityTrees.length)}
        </ForestSection>
      </div>
      {selectedName && (
        <TreeModal name={selectedName.name} onClose={() => setSelectedId(null)} isAdmin={isAdmin} />
      )}
    </>
  );
}
