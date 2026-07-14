import {useEffect, useRef} from "react";
import {tree} from "./drawTree.js";

export function TreeItem({name, onClick, options = {}, style = {}, animateEnter = false}) {
  const treeRef = useRef(null);

  useEffect(() => {
    if (treeRef.current) {
      treeRef.current.innerHTML = "";
      const svg = tree(name, options).render();
      svg.style.width = "100%";
      svg.style.height = "100%";
      svg.setAttribute("viewBox", "0 0 480 480");
      treeRef.current.appendChild(svg);
    }
  }, [name]);

  return (
    <div
      ref={treeRef}
      style={{
        ...style,
        animation: animateEnter ? "fadeIn 1.5s ease-in-out" : undefined,
      }}
      onClick={onClick}
    />
  );
}
