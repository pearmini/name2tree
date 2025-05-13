import * as d3 from "d3";
import {cm} from "./cm.js";
import {tree} from "./drawTree.js";
import {BACKGROUND_COLOR} from "./constants.js";

function extend(nodes) {
  const minX = Math.min(...nodes.map((d) => d.x - 240));
  const minY = Math.min(...nodes.map((d) => d.y - 240));
  const maxX = Math.max(...nodes.map((d) => d.x + 240));
  const maxY = Math.max(...nodes.map((d) => d.y + 240));
  return {minX, minY, maxX, maxY};
}

function scaleY(nodes, aspect) {
  const {minX, minY, maxX, maxY} = extend(nodes);
  const width = maxX - minX;
  const expectedHeight = width / aspect;
  const y = d3.scaleLinear().domain([minY, maxY]).range([0, expectedHeight]);
  nodes.forEach((d) => (d.y = y(d.y)));
}

function randomize(nodes) {
  nodes.forEach((d) => {
    const seed = d.name
      .split("")
      .map((c) => c.charCodeAt(0))
      .join("");
    const random = d3.randomUniform.source(d3.randomLcg(+seed));
    const r = random(-240, 240);
    d.x += r();
    d.y += r();
  });
}

const positionByIndex = new Map();

function wordCloud(nodes, {increase = 10, padding = 20} = {}) {
  const widthOf = (page) => page.width + padding * 2;
  const heightOf = (page) => page.height + padding * 2;
  const xOf = (page) => page.x - padding;
  const yOf = (page) => page.y - padding;
  const setX = (page, x) => (page.x = x + padding);
  const setY = (page, y) => (page.y = y + padding);

  nodes.forEach(allocate);

  function isOverLap(wordA, wordB) {
    const xA = xOf(wordA) + widthOf(wordA);
    const yA = yOf(wordA) + heightOf(wordA);
    const xB = xOf(wordB) + widthOf(wordB);
    const yB = yOf(wordB) + heightOf(wordB);
    return !(xA < xOf(wordB) || yA < yOf(wordB) || xB < xOf(wordA) || yB < yOf(wordA));
  }

  function hasOverLap(word, index, array) {
    return array.filter((_, i) => i < index).some((d) => isOverLap(d, word));
  }

  function allocate(word, index, array) {
    if (positionByIndex.has(index)) {
      setX(word, positionByIndex.get(index).x);
      setY(word, positionByIndex.get(index).y);
      return;
    }
    if (index === 0) {
      setX(word, 0);
      setY(word, 0);
      return;
    }
    let r = 10;
    let degree = 0;
    do {
      const x = Math.round(r * Math.sin((degree * Math.PI) / 180));
      const y = Math.round(r * Math.cos((degree * Math.PI) / 180));
      setX(word, x);
      setY(word, y);
      positionByIndex.set(index, {x, y});
      degree += 1;
      degree >= 360 && ((r += increase), (degree = 0));
    } while (hasOverLap(word, index, array));
  }

  return nodes;
}

function layout(cells, {width, height}) {
  wordCloud(cells);
  randomize(cells);
  scaleY(cells, width / height);
}

export function forest(names, {selectedIndex} = {}) {
  const cells = names.map((d) => ({width: 480, height: 480, x: 0, y: 0, name: d}));
  const styleWidth = window.innerWidth;
  const styleHeight = window.innerHeight;
  layout(cells, {width: styleWidth, height: styleHeight});

  const {minX, minY, maxX, maxY} = extend(cells);
  const width = maxX - minX;
  const height = maxY - minY;

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
    d3.selectAll(".tree-bg").style("stroke", "none");
  }

  function handleViewportClick(_, d, index) {
    to(current === center ? viewports[index] : current === viewports[index] ? center : viewports[index]);
  }

  const viewports = cells.map((d) => [d.x + 240, d.y + 240, 480]);

  return cm.svg("svg", {
    viewBox: `${minX} ${minY} ${width} ${height}`,
    styleWidth,
    styleHeight,
    styleBackground: BACKGROUND_COLOR,
    children: [
      cm.svg("g", {
        id: "forest",
        transform: "translate(0, 0) scale(1)",
        children: [
          cm.svg("g", cells, {
            transform: (d) => `translate(${d.x - 240}, ${d.y - 240})`,
            children: (d, index) =>
              tree(d.name, {
                stroke: index === selectedIndex ? "red" : "black",
                grid: index === selectedIndex,
                padding: 0,
                number: false,
                line: false,
                end: false,
                // stamp: false,
              }),
          }),
          cm.svg("rect", cells, {
            width: 480,
            height: 480,
            x: (d) => d.x - 240,
            y: (d) => d.y - 240,
            fill: "transparent",
            // styleCursor: "pointer",
            strokeWidth: 2,
            // onclick: handleViewportClick,
          }),
        ],
      }),
    ],
  });
}
