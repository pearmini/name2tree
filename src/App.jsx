import {useState, useEffect, useRef} from "react";
import * as d3 from "d3";
import * as apack from "apackjs";
import {cm} from "./cm.js";
import "./App.css";

const backgroundColor = "#FEFAF1";

function reduceDenominator(numerator, denominator) {
  const rec = (a, b) => (b ? rec(b, a % b) : a);
  return denominator / rec(numerator, denominator);
}

function rose(r, n, d, options = {}) {
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
    ...options,
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
    styleBackground: backgroundColor,
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
            children: [
              rose(12, 1, i + 2, {
                fill: backgroundColor,
                stroke: "black",
              }),
            ],
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
          children: (d) => [
            rose(d.r, d.n, d.d, {
              fill: backgroundColor,
              stroke: "black",
            }),
          ],
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

function forest(names, {selectedIndex} = {}) {
  const n = names.length;
  const count = 4;
  const cells = [];

  for (let i = 0; i < n; i++) {
    const x = i % count;
    const y = Math.floor(i / count);
    cells.push({x, y, name: names[i]});
  }

  const width = count * 480;
  const height = width;
  const styleWidth = window.innerHeight * (720 / 856);
  const styleHeight = styleWidth;

  const center = [width / 2, width / 2, width];
  const to = (end) => move(current, end);

  let current = center;
  let zooming = false;

  function move(start, end) {
    hideCellStroke();

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

  function hideCellStroke() {
    d3.selectAll(".forest-cell").style("stroke", "none");
  }

  return cm.svg("svg", {
    viewBox: `0 0 ${width} ${height}`,
    styleWidth,
    styleHeight,
    styleBackground: backgroundColor,
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
            class: "forest-cell",
            width: 480 - 10 * 2,
            height: 480 - 10 * 2,
            x: (d) => d.x * 480 + 10,
            y: (d) => d.y * 480 + 10,
            fill: "transparent",
            styleCursor: "pointer",
            strokeWidth: 2,
            stroke: (d, index) => (index === selectedIndex ? "black" : "none"),
            onclick: (_, d) => to(current === center ? [d.x * 480 + 240, d.y * 480 + 240, 480] : center),
          }),
        ],
      }),
    ],
  });
}

function App() {
  const count = 16;
  const [text, setText] = useState("Your Name");
  const [names, setNames] = useState(JSON.parse(localStorage.getItem("names")) ?? []);
  const treeRef = useRef(null);
  const forestRef = useRef(null);
  const forestContainerRef = useRef(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [currentNames, setCurrentNames] = useState(getCurrentNames(names, currentPageIndex));
  const pageCount = Math.ceil(names.length / count);
  const [addIndex, setAddIndex] = useState(-1);

  const buttonStyle = {
    fontFamily: "monospace",
    backgroundColor: backgroundColor,
    border: "1px solid black",
    padding: "5px",
    cursor: "pointer",
  };

  useEffect(() => {
    if (treeRef.current) {
      treeRef.current.innerHTML = "";
      treeRef.current.appendChild(tree(text).render());
    }
  }, [text]);

  useEffect(() => {
    if (forestRef.current) {
      forestRef.current.innerHTML = "";
      forestRef.current.appendChild(forest(currentNames, {selectedIndex: addIndex}).render());
      setAddIndex(-1);
    }
  }, [currentNames]);

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
    setNames([]);
    setCurrentPageIndex(0);
    setCurrentNames([]);
  };

  const handleAddToForest = () => {
    const newNames = [text, ...names];
    setNames(newNames);
    setCurrentPageIndex(0);
    setCurrentNames(getCurrentNames(newNames, 0));
    setAddIndex(0);
    forestContainerRef.current?.scrollIntoView({behavior: "smooth"});
  };

  const handlePrev = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
      setCurrentNames(getCurrentNames(names, currentPageIndex - 1));
    }
  };

  const handleNext = () => {
    if (currentPageIndex < pageCount - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
      setCurrentNames(getCurrentNames(names, currentPageIndex + 1));
    }
  };

  function getCurrentNames(names, index) {
    return names.slice(index * count, (index + 1) * count);
  }

  return (
    <div style={{backgroundColor}}>
      <div
        style={{
          height: "100vh",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          // marginTop: "40px",
        }}
      >
        <div style={{fontFamily: "monospace", fontSize: "20px"}}>String2Tree</div>
        <p style={{fontFamily: "monospace", marginTop: "15px"}}>
          Procedurally converting a string to a tree. Bairui SU 2025
        </p>
        <p style={{marginTop: "15px", marginBottom: "40px"}}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{
              fontFamily: "monospace",
              backgroundColor: backgroundColor,
              border: "1px solid black",
              borderRight: "none",
              padding: "5px",
            }}
          />
          <button onClick={handleAddToForest} style={buttonStyle}>
            Add to forest
          </button>
        </p>
        <div ref={treeRef} style={{border: "1px solid black"}}></div>
      </div>
      <div
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
        {new URLSearchParams(window.location.search).get("debug") === "true" && (
          <div>
            <button onClick={onClearLocalStorage} style={{...buttonStyle, marginRight: "10px"}}>
              Clear
            </button>
            <button onClick={onSaveToLocalStorage} style={{...buttonStyle, marginRight: "10px"}}>
              Save
            </button>
            <button onClick={onDownloadToFile} style={{...buttonStyle, marginRight: "10px"}}>
              Download
            </button>
          </div>
        )}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div ref={forestRef}></div>
          <div style={{display: "flex", flexDirection: "row", alignItems: "center", marginTop: "15px"}}>
            {pageCount > 1 && (
              <>
                <div
                  onClick={handlePrev}
                  style={{...buttonStyle, marginRight: "10px", opacity: currentPageIndex === 0 ? 0.5 : 1}}
                >
                  Prev
                </div>
                <div
                  onClick={handleNext}
                  style={{...buttonStyle, opacity: currentPageIndex === pageCount - 1 ? 0.5 : 1}}
                >
                  Next
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
