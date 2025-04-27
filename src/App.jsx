import {useState, useEffect, useRef} from "react";
import * as d3 from "d3";
import * as apack from "apackjs";
import {cm} from "./cm.js";
import "./App.css";

function reduceDenominator(numerator, denominator) {
  const rec = (a, b) => (b ? rec(b, a % b) : a);
  return denominator / rec(numerator, denominator);
}

function rose(r, n, d) {
  const k = n / d;
  const m = reduceDenominator(n, d);
  const points = [];
  for (let a = 0; a < Math.PI * 2 * m + 0.02; a += 0.02) {
    const r1 = r * Math.cos(k * a);
    const x = r1 * Math.cos(a);
    const y = r1 * Math.sin(a);
    points.push([x, y]);
  }
  return cm.svg("path", {
    d: d3.line().curve(d3.curveCatmullRom)(points),
    stroke: "black",
    fill: "#eee",
  });
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

  const randomLcg = d3.randomUniform.source(d3.randomLcg(+ascii))();

  function random(min, max) {
    return min + (max - min) * randomLcg();
  }

  function randomInt(min, max) {
    return Math.floor(random(min, max));
  }

  const [flowers, tree] = splitBy1And0(ascii);

  const data = toTree(tree);
  const root = d3.hierarchy(data);

  const range = flowers.length * 10;
  const middle = tree ? width * 0.25 : width / 2;

  const flowerX = d3
    .scalePoint()
    .domain(flowers.map((_, i) => i))
    .range([middle - range, middle + range]);

  const roses = [];
  const paths = [];
  const circles = [];
  const initLen = 140;
  const baselineY = height * 0.618 + initLen;
  const context = cm.mat().translate(width / 2, baselineY);
  branch(root, initLen, 0, 80);

  function branch(node, len, rotation, angle, roseCount = 0) {
    context.push();
    context.rotate(rotation);
    paths.push({d: `M0,0L0,${-len}`, transform: context.transform()});

    if (node.children) {
      context.translate(0, -len);
      len *= 0.618;
      const children = node.children;

      const leaves = children.map((d) => d.leaves().length);
      const stacked = [];

      let sum = 0;
      for (const length of leaves) {
        sum += length;
        stacked.push(sum);
      }

      const scaleAngle = d3.scaleLinear().domain([0, sum]).range([-angle, angle]);
      const n = children.length;

      let mergeCount = -1;
      let startIndex = -1;
      let endIndex = -1;
      if (n > 2 && node.children.every((d) => !d.children)) mergeCount = randomInt(3, Math.min(n, 10));

      if (mergeCount > 0) {
        startIndex = randomInt(0, n - mergeCount);
        endIndex = startIndex + mergeCount - 1;
      }

      for (let i = 0; i < n; i++) {
        if (i >= startIndex && i < endIndex) continue;
        const isMerge = i === endIndex;
        let prevIndex = isMerge ? startIndex : i - 1;
        const child = children[i];
        const childRotation = scaleAngle(stacked[i]);
        const prevRotation = stacked[prevIndex] ? scaleAngle(stacked[prevIndex]) : -angle;
        const diff = childRotation - prevRotation;
        branch(child, len, (childRotation + prevRotation) / 2, Math.min(80, diff), isMerge ? mergeCount : 0);
      }
    } else {
      // [n, d]
      const roseByCount = {
        3: [3, 1],
        4: [4, 2],
        5: [5, 3],
        6: [3, 2],
        7: [7, 3],
        8: [4, 2],
        9: [3, 2],
      };

      if (roseCount > 0) {
        const [n, d] = roseByCount[roseCount];
        const r = Math.sqrt(roseCount * len);
        context.translate(0, -len);
        roses.push({r, n, d, transform: context.transform()});
      } else {
        const r = len / 12;
        context.translate(0, -len - r);
        len *= 0.67;
        circles.push({
          cx: 0,
          cy: 0,
          r,
          transform: context.transform(),
        });
      }
    }

    context.pop();
  }

  const cellSize = 80;

  const circlePath = (r) => {
    const path = d3.path();
    path.arc(0, 0, r, 0, Math.PI * 2);
    return path.toString();
  };

  const svg = cm.svg("svg", {
    width,
    height,
    styleBackground: "#eee",
    children: [
      cm.svg("g", flowers, {
        transform: (d, i) => `translate(${flowerX(i)}, ${baselineY})`,
        children: (d, i) => [
          cm.svg("path", {
            d: `M0,0L0,${-initLen * 0.618}`,
            stroke: "black",
            strokeWidth: 1.5,
          }),
          cm.svg("g", {
            strokeWidth: 1.5,
            transform: `translate(0, ${-initLen * 0.618})`,
            children: [rose(12, 1, i + 2)],
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
      tree &&
        cm.svg("g", circles, {
          transform: (d) => d.transform,
          children: (d) => [
            cm.svg("path", {
              d: circlePath(d.r),
              fill: "black",
              stroke: "black",
            }),
          ],
        }),
      tree &&
        cm.svg("g", roses, {
          transform: (d) => d.transform,
          children: (d) => [rose(d.r, d.n, d.d)],
        }),
      cm.svg("g", {
        transform: `translate(${width - cellSize * text.split(" ").length - 20}, ${height - cellSize - 40})`,
        children: [apack.text(text, {})],
      }),
      cm.svg("text", {
        textContent: ascii,
        x: "100%",
        y: "100%",
        dy: "-25",
        dx: "-20",
        textAnchor: "end",
        fill: "black",
        fontSize: 16,
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
      // cm.svg("text", {
      //   textContent: "The Nature of Code",
      //   x: "50%",
      //   dy: "1.5em",
      //   fontSize: 20,
      //   textAnchor: "middle",
      //   fontFamily: "Impact",
      //   fill: "black",
      // }),
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
