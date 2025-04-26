import {useState, useEffect, useRef} from "react";
import * as d3 from "d3";
import * as apack from "apackjs";
import {cm} from "./cm.js";
import "./App.css";

function random(seed, min, max) {
  return d3.randomUniform.source(d3.randomLcg(seed))(min, max)();
}

function toTree(codes) {
  const data = {
    children: [],
  };

  const visited = [data];
  let currentIndex = 0;

  while (currentIndex < codes.length && visited.length > 0) {
    const code = +codes[currentIndex];
    const current = visited.shift();
    const children = d3.range(code).map((i) => ({children: []}));
    current.children = children;
    visited.push(...children);
    currentIndex++;
  }

  return data;
}

function splitBy1And0(code) {
  const codes = [];
  let current = null;
  let i = 0;
  for (i = 0; i < code.length; i++) {
    const digit = +code[i];
    if (!current && digit !== 1) break;
    else if (!current && digit === 1) current = "" + digit;
    else if (digit === 0) current += "" + digit;
    else {
      codes.push(current);
      current = digit === 1 ? "" + digit : null;
      if (!current) break;
    }
  }
  if (current) codes.push(current);
  return [codes, code.slice(i)];
}

function tree(text) {
  const width = 480;
  const height = 480;

  text = text.trim();

  const ascii = text
    .split("")
    .map((code) => code.charCodeAt(0))
    .join("");

  const [flowers, tree] = splitBy1And0(ascii);

  const data = toTree(tree);
  const root = d3.hierarchy(data);

  const range = flowers.length * 10;
  const middle = tree ? width * 0.25 : width / 2;

  const flowerX = d3
    .scalePoint()
    .domain(flowers.map((_, i) => i))
    .range([middle - range, middle + range]);

  const paths = [];
  const context = cm.mat().translate(width / 2, height - 20);
  branch(root, 140, 0, 80);

  function branch(node, len, rotation, angle) {
    context.push();
    context.rotate(rotation);
    paths.push({d: `M0,0L0,${-len}`, transform: context.transform()});

    context.translate(0, -len);
    len *= 0.67;

    const children = node.children ?? [];

    const leaves = children.map((d) => d.descendants().length);
    const stacked = [];

    let sum = 0;
    for (const length of leaves) {
      sum += length;
      stacked.push(sum);
    }

    const scaleAngle = d3.scaleLinear().domain([0, sum]).range([-angle, angle]);

    for (let i = 0, n = children.length; i < n; i++) {
      const child = children[i];
      const childRotation = scaleAngle(stacked[i]);
      const prevRotation = stacked[i - 1] ? scaleAngle(stacked[i - 1]) : -angle;
      const diff = childRotation - prevRotation;
      const {depth, height} = node;
      const offsetRange = diff / 3;
      const offset = random(depth * 10 + height * 1, -offsetRange, offsetRange);
      branch(child, len, (childRotation + prevRotation) / 2 + offset, Math.min(80, diff));
    }

    context.pop();
  }

  const cellSize = 80;

  const svg = cm.svg("svg", {
    width,
    height,
    styleBackground: "#eee",
    children: [
      cm.svg("text", {
        textContent: ascii,
        x: "100%",
        y: "100%",
        dy: "-10",
        dx: "-10",
        textAnchor: "end",
        fill: "black",
        fontSize: 16,
      }),
      cm.svg("g", flowers, {
        transform: (d, i) => `translate(${flowerX(i)}, ${height - 20})`,
        children: (d) => [
          cm.svg("circle", {
            cx: 0,
            cy: -100,
            r: 10,
            fill: "back",
          }),
          cm.svg("line", {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: -100,
            stroke: "black",
            strokeWidth: 1,
          }),
        ],
      }),
      tree &&
        cm.svg("g", {
          stroke: "black",
          strokeWidth: 1.5,
          children: [
            cm.svg("path", paths, {
              d: (d) => d.d,
              transform: (d) => d.transform,
            }),
          ],
        }),
      cm.svg("g", {
        transform: `translate(${width - cellSize * text.split(" ").length - 10}, ${height - cellSize - 20})`,
        children: [apack.text(text, {})],
      }),
    ].filter(Boolean),
  });

  return svg;
}

function forest(names) {
  const n = names.length;
  const sq = Math.ceil(Math.sqrt(n));
  const cells = [];
  for (let i = 0; i < n; i++) {
    const x = i % sq;
    const y = Math.floor(i / sq);
    cells.push({x, y, name: names[i]});
  }

  const minX = Math.min(...cells.map((c) => c.x));
  const minY = Math.min(...cells.map((c) => c.y));
  const maxX = Math.max(...cells.map((c) => c.x));
  const maxY = Math.max(...cells.map((c) => c.y));

  const width = (maxX - minX + 1) * 480;
  const height = (maxY - minY + 1) * 480;

  const center = [width / 2, width / 2, width];
  const to = (end) => move(current, end);

  let current = center;
  let zooming = false;

  function move(start, end) {
    if (zooming) return;
    zooming = true;

    // Make sure the center grid zoomable, for example: [720, 720, 360] -> [720, 720, 1440].
    start = [start[0] - 0.1, start[1] - 0.1, start[2]];

    const interpolator = d3.interpolateZoom(start, end);
    const duration = interpolator.duration * 1.2;
    const selection = d3.select("#forest");
    const transform = (t) => {
      const view = interpolator(t);
      const k = width / view[2]; // scale
      const translate = [width / 2 - view[0] * k, width / 2 - view[1] * k]; // translate
      return `translate(${translate}) scale(${k})`;
    };

    selection
      .transition()
      .duration(duration)
      .attrTween("transform", () => transform)
      .end()
      .then(() => ((zooming = false), (current = end)));
  }

  const max = Math.max(width, height);
  const size = Number.isFinite(max) ? max : 800;

  const forest = cm.svg("svg", {
    viewBox: `0 0 ${size} ${size}`,
    styleWidth: 800,
    styleHeight: 800,
    styleBackground: "#eee",
    children: [
      cm.svg("g", {
        id: "forest",
        transform: "translate(0, 0) scale(1)",
        children: [
          cm.svg("g", cells, {
            transform: (d) => `translate(${d.x * 480}, ${d.y * 480})`,
            children: (d) => tree(d.name),
          }),
          cm.svg("rect", cells, {
            width: 480,
            height: 480,
            x: (d) => d.x * 480,
            y: (d) => d.y * 480,
            fill: "transparent",
            styleCursor: "pointer",
            onclick: (e, d) => to(current === center ? [d.x * 480 + 240, d.y * 480 + 240, 480] : center),
          }),
        ],
      }),
    ],
  });

  return cm.svg("svg", {
    styleWidth: 800,
    styleHeight: 800,
    styleBackground: "#eee",
    children: [
      cm.svg("text", {
        textContent: "The Nature of Code",
        x: "50%",
        dy: "1.5em",
        fontSize: 20,
        textAnchor: "middle",
        fontFamily: "Impact",
        fill: "black",
      }),
      forest,
    ],
  });
}

function App() {
  const [text, setText] = useState("Bairui SU");
  const [names, setNames] = useState(JSON.parse(localStorage.getItem("names")) ?? []);
  const treeRef = useRef(null);
  const forestRef = useRef(null);

  useEffect(() => {
    if (treeRef.current) {
      treeRef.current.innerHTML = "";
      treeRef.current.appendChild(tree(text).render());
    }
  }, [text]);

  useEffect(() => {
    if (forestRef.current) {
      forestRef.current.innerHTML = "";
      forestRef.current.appendChild(forest(names).render());
    }
  }, [names]);

  const onSaveToLocalStorage = () => {
    localStorage.setItem("names", JSON.stringify(names));
  };

  const onDownloadToFile = () => {
    const string = JSON.stringify(names);
    const blob = new Blob([string], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "names.json";
    a.click();
  };

  const onClearLocalStorage = () => {
    localStorage.removeItem("names");
    setNames([]);
  };

  return (
    <div style={{display: "flex", flexDirection: "row", justifyContent: "center"}}>
      <div style={{marginRight: "20px"}}>
        <div>Convert your name to a tree:</div>
        <input value={text} onChange={(e) => setText(e.target.value)} />
        <button onClick={() => setNames([...names, text])}>Add to forest</button>
        <div ref={treeRef}></div>
      </div>
      <div>
        <div>Digital Twin Forest:</div>
        <button onClick={onClearLocalStorage}>Clear</button>
        <button onClick={onSaveToLocalStorage}>Save</button>
        <button onClick={onDownloadToFile}>Download</button>
        <div ref={forestRef}></div>
      </div>
    </div>
  );
}

export default App;
