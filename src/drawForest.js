import * as d3 from "d3";
import {cm} from "./cm.js";
import {tree} from "./drawTree.js";
import {BACKGROUND_COLOR} from "./constants.js";

export function forest(names, {selectedIndex} = {}) {
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
    d3.selectAll(".tree-bg").style("stroke", "none");
  }

  function handleViewportClick(_, d, index) {
    to(current === center ? viewports[index] : current === viewports[index] ? center : viewports[index]);
  }

  const viewports = cells.map((d) => [d.x * 480 + 240, d.y * 480 + 240, ((480 * width) / height) * 1.2]);

  return cm.svg("svg", {
    viewBox: `0 0 ${width} ${height}`,
    styleWidth,
    styleHeight,
    styleBackground: BACKGROUND_COLOR,
    children: [
      cm.svg("g", {
        id: "forest",
        transform: "translate(0, 0) scale(1)",
        children: [
          cm.svg("g", cells, {
            transform: (d) => `translate(${d.x * 480}, ${d.y * 480})`,
            children: (d, index) =>
              tree(d.name, {
                stroke: index === selectedIndex ? "red" : "black",
                grid: index === selectedIndex,
                padding: 0,
              }),
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
