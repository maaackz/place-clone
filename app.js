const api = "https://script.google.com/macros/s/AKfycbw4BoAACY8qxC0TrN6JD31AYkgeAzUlAu7KXpJC6tICTGF6I64Ec_ea0a6iskx7t-cc/exec";
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const gridSize = 50;
const pixelSize = canvas.width / gridSize;
const paletteColors = ["#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"];
let selectedColor = paletteColors[0];

// 🎨 Build color palette
const palette = document.getElementById("palette");
paletteColors.forEach(color => {
  const swatch = document.createElement("div");
  swatch.className = "color";
  swatch.style.backgroundColor = color;
  swatch.onclick = () => selectedColor = color;
  palette.appendChild(swatch);
});

// 🧱 Draw the grid
function drawGrid(grid) {
  // Draw pixels
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      ctx.fillStyle = grid[y][x] || "#ffffff";
      ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    }
  }

  // Draw grid lines
  ctx.strokeStyle = "rgba(0,0,0,0.1)"; // very light black
  ctx.lineWidth = 1;

  // Vertical lines
  for (let x = 0; x <= gridSize; x++) {
    ctx.beginPath();
    ctx.moveTo(x * pixelSize + 0.5, 0);            // +0.5 for crisp lines
    ctx.lineTo(x * pixelSize + 0.5, canvas.height);
    ctx.stroke();
  }

  // Horizontal lines
  for (let y = 0; y <= gridSize; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * pixelSize + 0.5);
    ctx.lineTo(canvas.width, y * pixelSize + 0.5);
    ctx.stroke();
  }
}

// ✅ JSONP utility with dynamic callback names
function jsonpFetch(url) {
  return new Promise((resolve, reject) => {
    const callbackName = "cb_" + Math.random().toString(36).substring(2);
    window[callbackName] = data => {
      resolve(data);
      delete window[callbackName];
      script.remove();
    };
    const script = document.createElement("script");
    script.src = `${url}&callback=${callbackName}`;
    script.onerror = () => {
      reject(new Error("JSONP request failed"));
      delete window[callbackName];
      script.remove();
    };
    document.body.appendChild(script);
  });
}

// 🌐 Load canvas
async function loadGrid() {
  try {
    const json = await jsonpFetch(api + "?action=get");
    if (json.success) {
      drawGrid(json.data);
      document.getElementById("status").textContent = "Canvas loaded";
    } else {
      document.getElementById("status").textContent = "Failed to load canvas: " + json.message;
    }
  } catch (err) {
    document.getElementById("status").textContent = "Error loading canvas";
  }
}

// ✅ Update pixel using GET + JSONP
async function updatePixel(x, y, color) {
  try {
    const encodedColor = encodeURIComponent(color);
    const url = `${api}?action=update&x=${x}&y=${y}&color=${encodedColor}`;
    const json = await jsonpFetch(url);
    return json.success;
  } catch (err) {
    console.error("Update failed", err);
    return false;
  }
}

// 🎯 Handle canvas clicks
canvas.addEventListener("click", async (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / pixelSize);
  const y = Math.floor((e.clientY - rect.top) / pixelSize);

  document.getElementById("status").textContent = `Placing at (${x}, ${y})...`;

  const success = await updatePixel(x, y, selectedColor);
  if (success) {
    await loadGrid();
    document.getElementById("status").textContent = `Placed color ${selectedColor} at (${x}, ${y})`;
  } else {
    document.getElementById("status").textContent = `Failed to place color at (${x}, ${y})`;
  }
});

// ⏱ Auto-refresh every 5s
setInterval(loadGrid, 5000);
loadGrid();
