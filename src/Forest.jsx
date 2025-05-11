import {useEffect, useState} from "react";
import {saveToLocalStorage} from "./file.js";
import {TreeItem} from "./TreeItem.jsx";

function TreeModal({name, onClose}) {
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
          width: "80vmin",
          height: "80vmin",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <TreeItem name={name} />
      </div>
    </div>
  );
}

export function Forest({isAdmin, names, setNames, selectedIndex, setSelectedIndex}) {
  const [selectedId, setSelectedId] = useState(null);
  const selectedName = names.find((name) => name.id === selectedId);

  function onClickTree(id) {
    setSelectedId(id);
  }

  const onSaveToLocalStorage = (names) => {
    saveToLocalStorage(names);
    alert("Saved to local storage.");
  };

  const onRemoveName = () => {
    if (confirm("Are you sure you want to remove this tree?")) {
      const index = selectedId !== null ? names.findIndex((name) => name.id === selectedId) : 0;
      const newNames = [...names];
      newNames.splice(index, 1);
      setNames(newNames);
      saveToLocalStorage(newNames);
      setSelectedId(null);
      setSelectedIndex(-1);
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
    setNames([]);
    saveToLocalStorage([]);
    alert("Cleared local storage.");
  };

  const onUploadFile = () => {
    const file = document.createElement("input");
    file.type = "file";
    file.onchange = (e) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const names = JSON.parse(e.target.result);
        console.log(names);
        setNames(names);
      };
      reader.readAsText(e.target.files[0]);
    };
    file.click();
  };

  useEffect(() => {
    // cmd + s: save to local storage
    // cmd + d: download to file
    // cmd + c: clear local storage
    // cmd + z: remove the first name
    // cmd + u: upload file
    const keydown = (e) => {
      if (!isAdmin) return;
      if (e.key === "s") {
        e.preventDefault();
        onSaveToLocalStorage(names);
      } else if (e.key === "d") {
        e.preventDefault();
        onDownloadToFile(names);
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
  }, [names, selectedId]);

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
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "0px",
          padding: "0px 100px 100px 100px",
          width: "100vw",
          height: "100vh",
          overflow: "auto",
        }}
      >
        {names.map((name, index) => (
          <TreeItem
            key={name.id}
            name={name.name}
            onClick={() => onClickTree(name.id)}
            options={{padding: 0, number: false}}
            style={{cursor: "pointer"}}
            isSelected={index === selectedIndex}
          />
        ))}
      </div>
      {selectedName && <TreeModal name={selectedName.name} onClose={() => setSelectedId(null)} />}
    </>
  );
}
