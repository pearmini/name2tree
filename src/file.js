export function saveToLocalStorage(names) {
  localStorage.setItem("names", JSON.stringify(names));
}

export const downloadSVG = (name, svg) => {
  const svgData = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([svgData], {type: "image/svg+xml"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.svg`;
  a.click();
};

export const downloadPNG = (name, svg) => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const img = new Image();

  img.onerror = (e) => {
    console.error("Error loading image:", e);
  };

  // Convert SVG to data URL
  const svgData = new XMLSerializer().serializeToString(svg);
  const svgBlob = new Blob([svgData], {type: "image/svg+xml;charset=utf-8"});
  const reader = new FileReader();

  reader.onload = (e) => {
    img.src = e.target.result;
  };

  reader.readAsDataURL(svgBlob);

  img.onload = () => {
    console.log("Image loaded successfully");
    // Get device pixel ratio
    const dpr = window.devicePixelRatio || 1;

    // Set canvas dimensions accounting for pixel ratio
    canvas.width = img.width * dpr;
    canvas.height = img.height * dpr;

    // Scale context to account for pixel ratio
    ctx.scale(dpr, dpr);

    // Draw image at original size
    ctx.drawImage(img, 0, 0, img.width, img.height);

    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.png`;
    a.click();
  };
};
