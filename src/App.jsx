import {useState, useEffect, useRef} from "react";
import * as d3 from "d3";
import * as apack from "apackjs";
import {cm} from "./cm.js";
import "./App.css";
import {measureText} from "./text.js";
import {useFullPage} from "./fullpage.js";
import data from "./names.json";

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

function tree(text, {stroke = "black"} = {}) {
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

  const circlePath = (r) => {
    const path = d3.path();
    path.arc(0, 0, r, 0, Math.PI * 2);
    return path.toString();
  };

  let textNode = null;

  try {
    const wordLength = text.split(" ").length;
    if (wordLength > 4) {
      throw new Error("Too many words");
    }

    let cellSize = 80;
    let totalLength = wordLength * cellSize + 40;
    if (totalLength > width / 2) {
      cellSize = (width / 2 - 40) / wordLength;
      totalLength = wordLength * cellSize + 20;
    } else {
      totalLength -= 20;
    }

    textNode = cm.svg("g", {
      transform: `translate(${width - totalLength}, ${height - cellSize - 35})`,
      children: [apack.text(text, {cellSize})],
    });
  } catch (e) {
    textNode = cm.svg("text", {
      textContent: text,
      x: "100%",
      y: "100%",
      dy: "-40",
      dx: "-20",
      textAnchor: "end",
      fill: "black",
      fontSize: 16,
      fontFamily: "monospace",
    });
  }

  const svg = cm.svg("svg", {
    width,
    height,
    styleBackground: backgroundColor,
    children: [
      cm.svg("rect", {
        x: 5,
        y: 5,
        class: "tree-bg",
        width: width - 10,
        height: height - 10,
        stroke,
        strokeWidth: 1.5,
        fill: "transparent",
      }),
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
      textNode,
      cm.svg("text", {
        id: "ascii",
        textContent: ascii,
        x: "100%",
        y: "100%",
        dy: "-20",
        dx: "-20",
        textAnchor: "end",
        fill: "black",
        fontSize: 12,
        fontFamily: "monospace",
      }),
    ].filter(Boolean),
  });

  return svg;
}

function forest(names, {selectedIndex} = {}) {
  const canvasWidth = window.innerWidth;
  const canvasHeight = window.innerHeight;
  const canvasAspect = canvasWidth / canvasHeight;
  const n = names.length;
  const cols = Math.ceil(Math.sqrt(canvasAspect * n)); // cols / rows = canvasAspect
  const rows = Math.ceil(n / cols);
  const cells = [];

  for (let i = 0; i < n; i++) {
    const x = i % cols;
    const y = Math.floor(i / cols);
    cells.push({x, y, name: names[i]});
  }

  const width = cols * 480;
  const height = rows * 480;
  let styleWidth;
  let styleHeight;

  const padding = 80;
  if (width / height > canvasAspect) {
    styleWidth = canvasWidth - padding;
    styleHeight = (styleWidth / width) * height;
  } else {
    styleHeight = canvasHeight - padding;
    styleWidth = (styleHeight / height) * width;
  }

  const center = [width / 2, height / 2, width];
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
      const translate = [width / 2 - view[0] * k, height / 2 - view[1] * k]; // translate
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
    d3.selectAll(".tree-bg").style("stroke", "black");
  }

  function handleViewportClick(_, d, index) {
    to(current === center ? viewports[index] : current === viewports[index] ? center : viewports[index]);
  }

  const viewports = cells.map((d) => [d.x * 480 + 240, d.y * 480 + 240, ((480 * width) / height) * 1.2]);

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
            children: (d, index) => tree(d.name, {stroke: index === selectedIndex ? "red" : "black"}),
          }),
          cm.svg("rect", cells, {
            width: 480 - 10 * 2,
            height: 480 - 10 * 2,
            x: (d) => d.x * 480 + 10,
            y: (d) => d.y * 480 + 10,
            fill: "transparent",
            styleCursor: "pointer",
            strokeWidth: 2,
            onclick: handleViewportClick,
          }),
        ],
      }),
    ],
  });
}

function initData() {
  return Array.from(new Set([...JSON.parse(localStorage.getItem("names") || "[]"), ...data]));
}

function App() {
  const [text, setText] = useState("");
  const [names, setNames] = useState(initData());
  const treeRef = useRef(null);
  const forestRef = useRef(null);
  const forestContainerRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const isAdmin = new URLSearchParams(window.location.search).get("admin") === "true";

  const buttonStyle = {
    fontFamily: "monospace",
    backgroundColor: backgroundColor,
    border: "1px solid black",
    padding: "5px",
    cursor: "pointer",
  };

  const [currentPageIndex, setCurrentPageIndex] = useFullPage();

  useEffect(() => {
    if (treeRef.current) {
      treeRef.current.innerHTML = "";
      treeRef.current.appendChild(tree(text || "Your Name").render());
    }
  }, [text]);

  useEffect(() => {
    if (forestRef.current) {
      forestRef.current.innerHTML = "";
      forestRef.current.appendChild(forest(names, {selectedIndex}).render());
      setSelectedIndex(-1);
    }
  }, [names]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (inputRef.current) {
      updateInputWidth(inputRef.current, text);
    }
  }, [text]);

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
    const onclick = (e) => {
      if (e.target.tagName === "BUTTON") return;
      if (currentPageIndex() === 0) inputRef.current.focus();
    };
    window.addEventListener("click", onclick);
    return () => window.removeEventListener("click", onclick);
  }, []);

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

  const handleAddToForest = () => {
    if (!text) {
      setErrorMessage("Name can't be empty.");
    } else {
      const newNames = [text, ...names];
      setNames(newNames);
      setSelectedIndex(0);
      setCurrentPageIndex(1);
      forestContainerRef.current?.scrollIntoView({behavior: "smooth"});
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setText(value);
    setErrorMessage("");
    updateInputWidth(e.target, value);
  };

  const updateInputWidth = (input, value) => {
    const text = value.length ? value : "Names, Words, Sentences...";
    const {width} = measureText(text, {fontSize: "14px", fontFamily: "monospace"});
    input.style.width = `${width + 20}px`;
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

  return (
    <div style={{backgroundColor, fontFamily: "monospace"}}>
      <div
        className="section"
        style={{
          height: "100vh",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <nav
          style={{
            width: "100%",
            padding: "20px",
            borderBottom: "1px solid black",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div style={{fontFamily: "monospace", fontSize: "20px"}}>String2Tree</div>
          <p style={{fontFamily: "monospace", margin: 0}}>Procedurally converting a string to a tree. Bairui SU 2025</p>
        </nav>
        <div
          style={{
            height: "calc(100vh - 100px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            paddingBottom: "100px",
          }}
        >
          <div
            style={{
              marginTop: "25px",
              marginBottom: "10px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div>
              <input
                ref={inputRef}
                className="input"
                placeholder="Names, Words, Sentences..."
                value={text}
                onChange={handleInputChange}
                style={{
                  fontFamily: "monospace",
                  backgroundColor: backgroundColor,
                  border: "none",
                  padding: "5px",
                  width: "auto",
                  fontSize: "14px",
                }}
              />
              {isAdmin && text && (
                <button onClick={handleAddToForest} style={{...buttonStyle}}>
                  Share to forest
                </button>
              )}
            </div>
            <p
              style={{
                marginTop: "10px",
                fontFamily: "monospace",
                fontStyle: "italic",
                opacity: errorMessage ? 1 : 0,
              }}
            >
              {errorMessage || "W"}
            </p>
          </div>
          <div ref={treeRef}></div>
        </div>
      </div>
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
        <div ref={forestRef} onClick={() => forestRef.current.scrollIntoView({behavior: "smooth"})}></div>
      </div>
    </div>
  );
}

export default App;
