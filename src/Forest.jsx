import {useState, useEffect, useRef} from "react";
import {forest} from "./drawForest.js";

export function Forest({isAdmin, names, setNames, selectedIndex, setSelectedIndex}) {
  const forestRef = useRef(null);
  const forestContainerRef = useRef(null);

  const onSaveToLocalStorage = (names) => {
    localStorage.setItem("names", JSON.stringify(names));
    alert("Saved to local storage.");
  };

  const onRemoveName = () => {
    setNames(names.slice(1));
    alert("Removed the first name.");
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
      if (e.metaKey && currentPageIndex() === 1) {
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
      }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [names]);

  useEffect(() => {
    if (forestRef.current) {
      forestRef.current.innerHTML = "";
      forestRef.current.appendChild(forest(names, {selectedIndex}).render());
      setSelectedIndex(-1);
    }
  }, [names]);

  useEffect(() => {
    const onclick = () => setSelectedIndex(-1);
    window.addEventListener("click", onclick);
    return () => window.removeEventListener("click", onclick);
  }, []);

  return (
    <div
      className="section"
      ref={forestContainerRef}
      style={{
        height: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div ref={forestRef}></div>
    </div>
  );
}
