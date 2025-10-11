import * as d3 from "d3";
import * as Plot from "@observablehq/plot";
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
    const random = d3.randomUniform.source(d3.randomLcg(+seed * 1000));
    const r = random(-240, 240);
    d.x += r();
    d.y += r();
  });
}

const positionByIndex = new Map();

function cloud(nodes, {increase = 10, padding = 20} = {}) {
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

export function forest(container, {styleWidth, styleHeight, names}) {
  const cells = names.map((d) => ({width: 480, height: 480, x: 0, y: 0, ...d}));
  const listeners = {};

  let timeout;

  function render({cells, line = false} = {}) {
    container.innerHTML = "";

    const {minX, minY, maxX, maxY} = extend(cells);

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

    function clicked(event, datum) {
      if (zooming) return;
      zooming = true;

      const end = [datum.x, datum.y, 480];
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

    const svg = d3
      .create("svg")
      .attr("viewBox", `${minX} ${minY} ${width} ${height}`)
      .attr("width", styleWidth)
      .attr("height", styleHeight)
      .attr("style", `background: ${BACKGROUND_COLOR}`)
      .attr("id", "forest-container")
      .call(zoom); // Can't call on #forest, it's not smooth

    const grids = svg
      .append("g")
      .attr("id", "forest")
      .attr("transform", "translate(0, 0) scale(1)")
      .selectAll("g")
      .data(cells)
      .join("g")
      .attr("transform", (d) => `translate(${d.x - 240}, ${d.y - 240})`);

    grids.append("g").each(function (d, i) {
      const treeNode = tree(d.name, {padding: 0, number: false, line, end: false});
      this.appendChild(treeNode.render());
    });

    grids
      .append("rect")
      .attr("width", 480)
      .attr("height", 480)
      .attr("fill", "transparent")
      .attr("style", "cursor: pointer; stroke-width: 2;")
      .on("click", clicked);

    container.appendChild(svg.node());
  }

  function wordCloud() {
    const copyCells = cells.map((d) => ({...d}));
    cloud(copyCells);
    randomize(copyCells);
    scaleY(copyCells, styleWidth / styleHeight);
    render({cells: copyCells});
  }

  function grid({sortBy}) {
    const getNumber = (d) => {
      const text = d.name;
      const ascii = text
        .split("")
        .map((code) => code.charCodeAt(0))
        .join("");
      const digitsSum = ascii.split("").reduce((acc, digit) => acc + +digit, 0);
      return digitsSum;
    };

    const numberedCells = cells.map((d, i) => ({...d, number: getNumber(d)}));

    let comparator;

    switch (sortBy) {
      case "time-asc":
        comparator = (a, b) => d3.ascending(a.createdAt, b.createdAt);
        break;
      case "time-desc":
        comparator = (a, b) => d3.descending(a.createdAt, b.createdAt);
        break;
      case "name-asc":
        comparator = (a, b) => d3.ascending(a.name, b.name);
        break;
      case "name-desc":
        comparator = (a, b) => d3.descending(a.name, b.name);
        break;
      case "number-asc":
        comparator = (a, b) => d3.ascending(a.number, b.number);
        break;
      case "number-desc":
        comparator = (a, b) => d3.descending(a.number, b.number);
        break;
      default:
        comparator = (a, b) => d3.ascending(a.createdAt, b.createdAt);
        break;
    }

    const sortedCells = d3.sort(numberedCells, comparator);

    const t = styleHeight / styleWidth;
    const n = Math.ceil(Math.sqrt(sortedCells.length / t));

    for (let i = 0; i < sortedCells.length; i++) {
      const x = (i % n) * 480;
      const y = Math.floor(i / n) * 480;
      sortedCells[i].x = x;
      sortedCells[i].y = y;
    }

    render({line: true, cells: sortedCells});
  }

  function update({layout, sortBy}) {
    emit("start");
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      if (layout === "cloud") wordCloud();
      else if (layout === "grid") grid({sortBy});
      else if (layout === "swarm") swarm();
      emit("end");
    }, 50);
  }

  function swarm() {
    container.innerHTML = "";
    const div = document.createElement("div");
    div.style.width = "100%";
    div.style.height = "100%";
    div.style.display = "flex";
    div.style.justifyContent = "center";
    div.style.alignItems = "center";
    container.appendChild(div);

    const FIRST = "First Day\n2025-05-11";
    const SECOND = "Second Day\n2025-05-12";

    const slicedNames = [...names].reverse().slice(7, names.length);
    const data = slicedNames.map((d) => {
      const isFirstDay = new Date(d.createdAt) < new Date("2025-05-12");
      const firstDayStartTime = new Date("2025-05-11T18:00:00.000Z"); // New York Time 4pm
      const secondDayStartTime = new Date("2025-05-12T20:00:00.000Z"); // New York Time 6pm
      return {
        ...d,
        day: isFirstDay ? FIRST : SECOND,
        offset: isFirstDay ? new Date(d.createdAt) - firstDayStartTime : new Date(d.createdAt) - secondDayStartTime,
      };
    });
    const min = d3.min(data, (d) => d.offset);
    data.forEach((d) => (d.offset = (d.offset - min) / 1000 / 60));

    const r = 25;

    const node = Plot.plot({
      height: styleHeight - 20,
      width: styleWidth - 40,
      marginLeft: 80,
      marginRight: 50,
      fy: {padding: 0},
      x: {
        label: "Time (minutes)",
        grid: true,
      },
      marks: [
        Plot.dotX(
          data.filter((d) => d.day === FIRST),
          Plot.dodgeY({
            x: (d) => d.offset,
            title: "name",
            fill: "currentColor",
            fy: "day",
            r,
          }),
        ),
        Plot.dotX(
          data.filter((d) => d.day === SECOND),
          Plot.dodgeY({
            x: (d) => d.offset,
            title: "name",
            fill: "currentColor",
            fy: "day",
            r,
            anchor: "top",
          }),
        ),
      ],
    });

    d3.select(node)
      .selectAll("circle")
      .each(function (d) {
        const circle = d3.select(this);
        const title = circle.select("title");
        const text = title.text();
        const x = circle.attr("cx");
        const y = circle.attr("cy");
        const group = d3
          .create("svg:g")
          .attr("transform", `translate(${x - r}, ${y - r})`)
          .node();
        const treeNode = tree(text, {padding: 0, number: false, line: false, end: false, strokeWidth: 2}).render();
        d3.select(treeNode).attr("transform", `scale(${(r * 2) / 480})`);
        group.appendChild(treeNode);
        circle.node().parentNode.appendChild(group);
        circle.attr("fill", "transparent");
        circle.attr("stroke", "black");
      });

    div.appendChild(node);
  }

  function on(event, callback) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(callback);
  }

  function emit(event, ...args) {
    if (listeners[event]) {
      listeners[event].forEach((callback) => callback(...args));
    }
  }

  function stop() {
    clearTimeout(timeout);
  }

  return {update, on, stop};
}
