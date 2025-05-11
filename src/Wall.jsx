import {useEffect, useRef} from "react";
import {forest} from "./drawForest.js";

export function Wall({names}) {
  const wallRef = useRef(null);

  useEffect(() => {
    if (wallRef.current) {
      wallRef.current.innerHTML = "";
      const root = forest(names.map((d) => d.name));
      const node = root.render();
      wallRef.current.appendChild(node);
    }
  }, [names]);

  return (
    <div>
      <div ref={wallRef}></div>
    </div>
  );
}
