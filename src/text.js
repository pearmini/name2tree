function createSpan(text) {
  const span = document.createElement("span");
  span.style.position = "absolute";
  span.style.visibility = "hidden";
  span.style.whiteSpace = "pre";
  span.textContent = text;
  return span;
}

export function measureText(text, {fontSize = "16px", fontFamily = "monospace"} = {}) {
  const span = createSpan(text);
  span.style.fontSize = fontSize;
  span.style.fontFamily = fontFamily;
  document.body.appendChild(span);
  const {width, height} = span.getBoundingClientRect();
  document.body.removeChild(span);
  return {width, height};
}
