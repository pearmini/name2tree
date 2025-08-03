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

export function forest(names, {styleWidth = window.innerWidth, styleHeight = window.innerHeight} = {}) {
  const cells = names.map((d) => ({width: 480, height: 480, x: 0, y: 0, name: d}));

  layout(cells, {width: styleWidth, height: styleHeight});

  const {minX, minY, maxX, maxY} = extend(cells);
  const viewports = cells.map((d) => [d.x, d.y, 480]);

  const width = maxX - minX;
  const height = maxY - minY;
  const size = Math.min(height, width);
  const centerX = (maxX + minX) / 2;
  const centerY = (maxY + minY) / 2;

  let zooming = false;

  const zoom = d3
    .zoom()
    .on("zoom", (e) => {
      const transform = e.transform;
      const selection = d3.select("#forest");
      selection.attr("transform", transform);
    })
    .scaleExtent([1, size / 480])
    .translateExtent([
      [minX, minY],
      [maxX, maxY],
    ]);

  // Can't call on #forest, it's not smooth
  setTimeout(() => {
    d3.select("#forest-container").call(zoom);
  }, 100);

  function clicked(event, _, index) {
    if (zooming) return;
    zooming = true;

    const end = viewports[index];
    const currentTransform = d3.select("#forest-container").property("__zoom");
    const view2 = size / currentTransform.k;
    const view0 = (centerX - currentTransform.x) / currentTransform.k;
    const view1 = (centerY - currentTransform.y) / currentTransform.k;
    const start = [view0, view1, view2];

    const interpolator = d3.interpolateZoom(start, end);
    const duration = interpolator.duration * 1.2;
    const selection = d3.select("#forest");
    const transform = (t) => {
      const view = interpolator(t);
      const k = size / view[2]; // scale
      const translate = [centerX - view[0] * k, centerY - view[1] * k]; // translate
      return `translate(${translate}) scale(${k})`;
    };

    const transition = selection
      .transition()
      .duration(duration)
      .attrTween("transform", () => transform);

    transition.end().then(() => {
      zooming = false;

      // Sync the zoom state to the container, so after the transition,
      // the zoom behavior is consistent.
      const k = size / end[2];
      const tx = centerX - end[0] * k;
      const ty = centerY - end[1] * k;

      const transform = d3.zoomIdentity.translate(tx, ty).scale(k);
      zoom.transform(selection, transform);

      const container = d3.select("#forest-container");
      container.property("__zoom", selection.property("__zoom"));
    });
  }

  return cm.svg("svg", {
    viewBox: `${minX} ${minY} ${width} ${height}`,
    styleWidth,
    styleHeight,
    styleBackground: BACKGROUND_COLOR,
    id: "forest-container",
    children: [
      cm.svg("g", {
        id: "forest",
        transform: "translate(0, 0) scale(1)",
        children: [
          cm.svg("g", cells, {
            transform: (d) => `translate(${d.x - 240}, ${d.y - 240})`,
            children: (d, index) =>
              tree(d.name, {
                padding: 0,
                number: false,
                line: false,
                end: false,
              }),
          }),
          cm.svg("rect", cells, {
            width: 480,
            height: 480,
            x: (d) => d.x - 240,
            y: (d) => d.y - 240,
            fill: "transparent",
            styleCursor: "pointer",
            strokeWidth: 2,
            onclick: clicked,
          }),
        ],
      }),
    ],
  });
}
