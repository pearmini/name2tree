import * as d3 from "d3";
import * as apack from "apackjs";
import fonts from "./hersheytext.json";
import {cm} from "./cm.js";
import {BACKGROUND_COLOR} from "./constants.js";
import {hachureLines} from "hachure-fill";
import {pointsOnPath} from "points-on-path";

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

function ellipsis(text, maxLength) {
  const chars = Array.from(text);
  if (chars.length <= maxLength) return text;
  return chars.slice(0, maxLength).join("") + "...";
}

function circlePath(r) {
  const path = d3.path();
  path.arc(0, 0, r, 0, Math.PI * 2);
  return path.toString();
}

function hachureCirclePath(r, options = {}) {
  const path = circlePath(r);
  const points = pointsOnPath(path);
  const hachures = hachureLines(points, 2, 45);
  const d = hachures.map(([p1, p2]) => `M${p1[0]},${p1[1]}L${p2[0]},${p2[1]}`).join("");
  return d;
}

function points(path) {
  const plines = [];
  let current = [];
  let mode = "";
  for (let t of path.split(" ")) {
    if (t[0] === "M" || t[0] === "L") (mode = t[0]), (t = t.slice(1));
    const coords = t.split(",").map(Number);
    if (mode === "M" && current.length > 0) {
      plines.push(current);
      current = [];
    }
    current.push(coords);
  }
  plines.push(current);
  return plines;
}

function pathWidth(number, points) {
  const minX = Math.min(...points.flatMap((line) => line.map(([x]) => x)));
  const maxX = Math.max(...points.flatMap((line) => line.map(([x]) => x)));
  const offset = number === "1" ? 7 : 3;
  return maxX - minX + offset;
}

function pathNumber(number) {
  const idx = (ch) => ch.charCodeAt(0) - 33;
  const font = fonts.futural["chars"];
  const scale = 0.5;
  const pathPLines = (n) => {
    const raw = font[idx(n + "")]["d"];
    const plines = points(raw);
    const scaledPlines = plines.map((line) => line.map(([x, y]) => [x * scale, y * scale]));
    return scaledPlines;
  };
  const path = (n) => {
    const plines = pathPLines(n);
    let d = "";
    for (const line of plines) {
      d += `M${line[0][0]},${line[0][1]}`;
      for (const [x, y] of line.slice(1)) {
        d += `L${x},${y}`;
      }
    }
    return d;
  };
  const numbers = String(number).split("");
  const translateX = new Array(numbers.length).fill(0);
  for (let i = 1; i < numbers.length; i++) {
    const n = numbers[i - 1];
    translateX[i] = translateX[i - 1] + pathWidth(n, pathPLines(n));
  }
  const totalWidth = translateX[numbers.length - 1];
  return cm.svg("g", {
    transform: `translate(${-totalWidth}, 0)`,
    children: [
      cm.svg("path", String(number).split(""), {
        d: (n) => path(n),
        transform: (_, i) => `translate(${translateX[i]}, 0)`,
      }),
    ],
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

// example: 101103111 -> [['10', '1', '10'], '3111']
// example: 2030 -> ['20', '30']
// example: 1103045 -> ['1', '10', '30', '45']
function trimDegenerateSegments(code) {
  const codes = [];
  let current = null;
  let i = 0;

  const isValid = (current) => {
    const isStartWith1 = current.startsWith("1");
    const enoughZeros = +current[0] <= current.slice(1).length;
    return isStartWith1 || enoughZeros;
  };

  for (i = 0; i < code.length; i++) {
    const digit = +code[i];
    const next = +code[i + 1];

    // A degenerate segment is a segment starting with 1 or
    // with trailing 0 which 0 count is getter than or equal to the first digit.
    const isDegenerateSegment = digit === 1 || next === 0;

    if (!current && !isDegenerateSegment) break;
    else if (!current && isDegenerateSegment) current = "" + digit;
    else if (digit === 0) current += "" + digit;
    else {
      if (isValid(current)) {
        codes.push(current);
        current = isDegenerateSegment ? "" + digit : null;
        if (!current) break;
      } else {
        i = i - current.length;
        current = null;
        break;
      }
    }
  }

  if (current) {
    if (isValid(current)) codes.push(current);
    else i = i - current.length;
  }

  return [codes, code.slice(i)];
}

export function tree(
  text,
  {
    stroke = "black",
    grid = false,
    padding = 20,
    number = true,
    stamp = true,
    count = false,
    line = true,
    end = true,
    plot = false,
    strokeWidth = 1.5,
  } = {},
) {
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

  const [flowers, tree] = trimDegenerateSegments(ascii);

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
  const numbers = [];
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

      if (count) {
        numbers.push({
          count: node.children.length,
          transform: context.transform(),
        });
      }

      const scaleAngle = d3.scaleLinear().domain([0, sum]).range([-angle, angle]);
      const n = children.length;

      let mergeCount = -1;
      let startIndex = -1;
      let endIndex = -1;
      if (n > 2 && node.children.every((d) => !d.children) && !count) mergeCount = randomInt(3, Math.min(n, 10));

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

  let textNode = null;
  let longMessage = false;

  try {
    const wordLength = text.split(" ").length;
    if (wordLength > 4) {
      throw new Error("Too many words");
    }

    let cellSize = 80;
    const padding = 20;
    let totalLength = wordLength * cellSize + padding * 2;
    if (totalLength > width / 2) {
      cellSize = (width / 2 - padding * 2) / wordLength;
      totalLength = wordLength * cellSize + padding;
    } else {
      totalLength -= padding;
    }

    const start = end ? width - totalLength : width / 2 + padding;
    textNode = cm.svg("g", {
      transform: `translate(${start}, ${baselineY - cellSize - 5})`,
      children: [apack.text(text, {cellSize, word: {strokeWidth: 1.5}})],
    });
  } catch (e) {
    longMessage = true;
    textNode = cm.svg("text", {
      textContent: ellipsis(text, 18),
      x: "100%",
      y: "100%",
      dy: "-55",
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
    styleBackground: BACKGROUND_COLOR,
    children: [
      grid &&
        cm.svg("rect", {
          x: 0,
          y: 0,
          class: "tree-bg",
          width: width,
          height: height,
          stroke,
          strokeWidth,
          fill: "transparent",
        }),
      cm.svg("g", flowers, {
        transform: (d, i) => `translate(${flowerX(i)}, ${baselineY})`,
        children: (d, i) => [
          cm.svg("path", {
            d: `M0,0L0,${-initLen * 0.618}`,
            stroke: "black",
            strokeWidth,
          }),
          cm.svg("g", {
            strokeWidth,
            transform: `translate(0, ${-initLen * 0.618})`,
            children: [
              rose(12, 1, i + 2, {
                fill: BACKGROUND_COLOR,
                stroke: "black",
              }),
            ],
          }),
        ],
      }),
      tree &&
        cm.svg("g", {
          stroke: "black",
          strokeWidth,
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
          children: (d) =>
            [
              plot &&
                cm.svg("path", {
                  d: hachureCirclePath(d.r),
                  strokeWidth,
                  fill: "transparent",
                  stroke: "black",
                }),
              cm.svg("path", {
                d: circlePath(d.r),
                fill: plot ? "transparent" : "black",
                stroke: "black",
              }),
            ].filter(Boolean),
        }),
      tree &&
        cm.svg("g", roses, {
          transform: (d) => d.transform,
          children: (d) => [
            rose(d.r, d.n, d.d, {
              fill: BACKGROUND_COLOR,
              stroke: "black",
            }),
          ],
        }),
      stamp && (plot ? (longMessage ? null : textNode) : textNode),
      count &&
        cm.svg("g", numbers, {
          transform: (d) => d.transform,
          children: (d) => [
            cm.svg("circle", {
              cx: 0,
              cy: 0,
              r: 14,
              fill: "black",
            }),
            cm.svg("text", {
              textContent: d.count,
              fill: "white",
              fontSize: 20,
              textAnchor: "middle",
              dy: "0.4em",
            }),
          ],
        }),
      line &&
        cm.svg("path", {
          d: `M${padding},${baselineY}L${width - padding},${baselineY}`,
          stroke: "black",
          strokeWidth,
        }),
      number &&
        (plot
          ? cm.svg("g", {
              transform: "translate(448, 448)",
              stroke: "black",
              strokeWidth,
              fill: "transparent",
              children: [pathNumber(ellipsis(ascii, 40))],
            })
          : cm.svg("text", {
              id: "ascii",
              textContent: ellipsis(ascii, 58),
              x: "100%",
              y: "100%",
              dy: "-26",
              dx: "-20",
              textAnchor: "end",
              fill: "black",
              fontSize: 12,
              fontFamily: "monospace",
            })),
    ].filter(Boolean),
  });

  return svg;
}
