const classes = [
  "airplane", "automobile", "bird", "cat", "deer",
  "dog", "frog", "horse", "ship", "truck"
];

const comparison = [
  { name: "LeNet-5", architecture: "LeNet-5", augmentation: "None", parameters: 62006, accuracy: 0.1108 },
  { name: "CNN Scratch No Aug", architecture: "Custom CNN", augmentation: "None", parameters: 175018, accuracy: 0.7922 },
  { name: "CNN Scratch + Aug", architecture: "Custom CNN", augmentation: "ImageDataGenerator", parameters: 175018, accuracy: 0.8171 },
  { name: "CNN + Keras Aug Layers", architecture: "Custom CNN", augmentation: "Keras preprocessing", parameters: 175018, accuracy: 0.7897 },
  { name: "MobileNetV2 Feature Extraction", architecture: "MobileNetV2", augmentation: "Frozen base", parameters: 2423242, accuracy: 0.8100 },
  { name: "MobileNetV2 Fine-Tuned", architecture: "MobileNetV2", augmentation: "Top 30 layers", parameters: 2423242, accuracy: 0.8100 }
];

const classificationReport = [
  ["airplane", 0.81, 0.81, 0.81],
  ["automobile", 0.89, 0.89, 0.89],
  ["bird", 0.72, 0.72, 0.72],
  ["cat", 0.63, 0.60, 0.62],
  ["deer", 0.71, 0.85, 0.77],
  ["dog", 0.77, 0.64, 0.70],
  ["frog", 0.78, 0.87, 0.82],
  ["horse", 0.82, 0.84, 0.83],
  ["ship", 0.92, 0.84, 0.88],
  ["truck", 0.89, 0.85, 0.87]
];

const imageGroups = {
  "preprocess-gallery": [3, 5, 6, 18],
  "architecture-gallery": [8, 9],
  "training-gallery": [14, 20, 25],
  "results-gallery": [15, 17, 20, 25]
};

const imageDescriptions = {
  3: "Before-and-after pixel distributions for normalization",
  5: "Grayscale input and manual 3 × 3 edge convolution",
  6: "Zero-padded CIFAR-10 example",
  8: "Sixteen learned convolution feature maps",
  9: "Feature maps before and after max pooling",
  14: "Scratch CNN training and validation loss and accuracy",
  15: "Scratch CNN confusion matrix",
  17: "Ten actual misclassified test images labeled with their true and predicted classes",
  18: "One original CIFAR-10 image and nine actual augmentation transforms",
  20: "Training and validation comparison: scratch CNN vs ImageDataGenerator",
  25: "MobileNetV2 feature extraction and fine-tuning training curves"
};

const outputDescriptions = {
  1: "Saved-model lookup",
  2: "Dataset shapes and class labels",
  3: "Pixel distributions and normalization range",
  4: "One-hot label shapes",
  5: "Grayscale conversion and edge convolution",
  6: "Convolution padding and output shapes",
  7: "Stride and output shapes",
  8: "Learned convolution feature maps",
  9: "Pooling output shapes and feature maps",
  10: "Flattened feature dimensions",
  11: "LeNet-5 layer summary",
  12: "Custom CNN layer summary",
  13: "Scratch CNN training log",
  14: "Scratch CNN training curves",
  15: "Scratch CNN evaluation and classification report",
  16: "Most frequent class confusions",
  17: "Misclassified test images",
  18: "ImageDataGenerator transformations",
  19: "Augmented CNN training log",
  20: "Training comparison curves",
  21: "Keras augmentation training log",
  22: "MobileNetV2 architecture and parameter counts",
  23: "MobileNetV2 feature-extraction training log",
  24: "MobileNetV2 fine-tuning training log",
  25: "MobileNetV2 training curves",
  27: "Notebook model-comparison table",
  28: "Residual block layer summary",
  29: "Selected-model save confirmation"
};

const formatNumber = new Intl.NumberFormat("en-US");
const apiBase = (window.PROJECT_API_BASE || "").replace(/\/$/, "");
let selectedFile = null;
let previewUrl = null;

function renderClasses() {
  const grid = document.getElementById("class-grid");
  grid.innerHTML = classes.map((name, index) => `
    <div class="class-item">
      <span class="class-index">${String(index + 1).padStart(2, "0")}</span>
      <span class="class-name">${name}</span>
      <span class="class-count"><i style="--class-index:${index}"></i>5,000 <small>/ 1,000</small></span>
    </div>`).join("");
}

function renderComparison() {
  const body = document.getElementById("comparison-body");
  body.innerHTML = comparison.map((row) => `
    <tr class="${row.accuracy === 0.8171 ? "row-best" : ""}">
      <th scope="row">${row.name}${row.accuracy === 0.8171 ? '<span class="best-badge">TOP RESULT</span>' : ""}</th>
      <td>${row.architecture} · ${row.augmentation}</td>
      <td>${formatNumber.format(row.parameters)}</td>
      <td>${(row.accuracy * 100).toFixed(2)}%</td>
    </tr>`).join("");

  const chart = document.getElementById("accuracy-chart");
  const width = 900;
  const height = 265;
  const left = 46;
  const right = 10;
  const top = 14;
  const baseline = 204;
  const chartWidth = width - left - right;
  const barWidth = 75;
  const gap = (chartWidth - comparison.length * barWidth) / (comparison.length - 1);
  const gridLines = [0, 25, 50, 75, 100].map((value) => {
    const y = baseline - (value / 100) * (baseline - top);
    return `<line x1="${left}" y1="${y}" x2="${width - right}" y2="${y}" class="chart-gridline"/><text x="${left - 10}" y="${y + 4}" text-anchor="end" class="chart-axis">${value}</text>`;
  }).join("");
  const bars = comparison.map((row, index) => {
    const x = left + index * (barWidth + gap);
    const barHeight = (row.accuracy * 100 / 100) * (baseline - top);
    const y = baseline - barHeight;
    const isBest = row.accuracy === 0.8171;
    const label = row.name.replace("MobileNetV2 ", "MobileNet ");
    const firstLine = label.length > 18 ? label.slice(0, 17) + "…" : label;
    return `<g class="chart-bar ${isBest ? "chart-bar-best" : ""}">
      <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="5"/>
      <text x="${x + barWidth / 2}" y="${y - 10}" text-anchor="middle" class="chart-value">${(row.accuracy * 100).toFixed(2)}%</text>
      <text x="${x + barWidth / 2}" y="${baseline + 22}" text-anchor="middle" class="chart-label">${firstLine}</text>
      <title>${row.name}: ${(row.accuracy * 100).toFixed(2)}%</title></g>`;
  }).join("");
  chart.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="accuracy-chart-title">
    <title id="accuracy-chart-title">Notebook-reported test accuracy by model</title>${gridLines}${bars}</svg>`;

  document.getElementById("report-body").innerHTML = classificationReport.map((row) => `
    <tr><th scope="row">${row[0]}</th><td>${row[1].toFixed(2)}</td><td>${row[2].toFixed(2)}</td><td>${row[3].toFixed(2)}</td><td>1,000</td></tr>`).join("");
}

async function renderNotebookFigures() {
  const response = await fetch("assets/data/notebook-figures.json");
  if (!response.ok) throw new Error("Notebook figure manifest could not be loaded.");
  const figures = await response.json();
  const figureMarkup = (figure) => `
    <figure class="figure-card">
      <button class="figure-open" type="button" data-image="${figure.src}" data-caption="${figure.title}">
        <img loading="lazy" src="${figure.src}" alt="${imageDescriptions[figure.cell] || figure.title}">
        <span class="zoom-hint" aria-hidden="true">VIEW ↗</span>
      </button>
      <figcaption><span>CELL ${String(figure.cell).padStart(2, "0")} · NOTEBOOK OUTPUT</span>${figure.title}</figcaption>
    </figure>`;

  for (const [id, cellIds] of Object.entries(imageGroups)) {
    const target = document.getElementById(id);
    target.innerHTML = figures.filter((figure) => cellIds.includes(figure.cell)).map(figureMarkup).join("");
  }
  document.getElementById("all-figures").innerHTML = figures.map(figureMarkup).join("");
  bindLightbox();
}

async function renderNotebookTextOutputs() {
  const target = document.getElementById("output-archive");
  const response = await fetch("assets/data/notebook-text-outputs.json");
  if (!response.ok) throw new Error("The saved notebook text outputs could not be loaded.");
  const cells = await response.json();
  target.replaceChildren();

  for (const cell of cells) {
    const cellDetails = document.createElement("details");
    cellDetails.className = "output-cell";
    const cellSummary = document.createElement("summary");
    cellSummary.textContent = `CELL ${String(cell.cell).padStart(2, "0")} · ${outputDescriptions[cell.cell] || "Notebook outputs"}`;
    cellDetails.append(cellSummary);

    for (const output of cell.outputs) {
      const outputDetails = document.createElement("details");
      outputDetails.className = "output-entry";
      const outputSummary = document.createElement("summary");
      outputSummary.textContent = `OUTPUT ${String(output.index).padStart(2, "0")} · ${output.output_type.replace("_", " ")}`;
      outputDetails.append(outputSummary);

      if (output.images.length) {
        const imageNote = document.createElement("p");
        imageNote.className = "output-image-note";
        imageNote.textContent = `Figure available in gallery above (${output.images.join(", ")}).`;
        outputDetails.append(imageNote);
      }

      for (const item of output.items) {
        const label = document.createElement("span");
        label.className = "output-item-label";
        label.textContent = item.type === "stream" ? "Printed output" : item.type;
        const text = document.createElement("pre");
        text.textContent = item.text;
        outputDetails.append(label, text);
      }
      cellDetails.append(outputDetails);
    }

    target.append(cellDetails);
  }
}

function bindLightbox() {
  const dialog = document.getElementById("lightbox");
  const image = document.getElementById("lightbox-image");
  const caption = document.getElementById("lightbox-caption");
  document.querySelectorAll(".figure-open").forEach((button) => {
    button.addEventListener("click", () => {
      image.src = button.dataset.image;
      image.alt = button.querySelector("img").alt;
      caption.textContent = button.dataset.caption;
      dialog.showModal();
    });
  });
  dialog.querySelector(".lightbox-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      dialog.close();
    }
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
}

function setupNavigation() {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.getElementById("primary-nav");
  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    nav.classList.toggle("nav-open", !expanded);
  });
  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    nav.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
  }));
}

function setupReveal() {
  if (!("IntersectionObserver" in window)) {
    document.querySelectorAll(".content-section, .stat-card, .model-card").forEach((item) => item.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll(".content-section, .stat-card, .model-card").forEach((item) => observer.observe(item));
}

async function checkApi() {
  const label = document.getElementById("api-status");
  const dot = document.getElementById("api-dot");
  try {
    const response = await fetch(`${apiBase}/api/health`);
    const data = await response.json();
    if (!response.ok || !data.model_loaded) throw new Error(data.detail || data.message || "Model API is not ready.");
    label.textContent = "Prediction service ready";
    dot.classList.add("is-ready");
    document.getElementById("demo-message").textContent = "The saved CIFAR-10 model is ready. Upload an image to run a real prediction.";
  } catch {
    label.textContent = "Prediction service offline";
    dot.classList.add("is-offline");
    document.getElementById("demo-message").textContent = "The static showcase is ready, but live prediction needs the optional Python API. See the run instructions in README.";
  }
}

function setSelectedFile(file) {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const message = document.getElementById("demo-message");
  if (!file) return;
  if (!allowedTypes.includes(file.type)) {
    message.textContent = "Choose a PNG, JPG, WEBP, or GIF image.";
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    message.textContent = "That image is larger than 8 MB. Choose a smaller file.";
    return;
  }
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  selectedFile = file;
  previewUrl = URL.createObjectURL(file);
  document.getElementById("image-preview").src = previewUrl;
  document.getElementById("file-name").textContent = file.name;
  document.getElementById("upload-zone").hidden = true;
  document.getElementById("preview-wrap").hidden = false;
  document.getElementById("predict-button").disabled = false;
  message.textContent = "Image ready. Run the model when you’re ready.";
  document.getElementById("prediction-output").hidden = true;
  document.querySelector(".empty-result").hidden = false;
}

function clearSelectedFile() {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = null;
  selectedFile = null;
  document.getElementById("image-input").value = "";
  document.getElementById("upload-zone").hidden = false;
  document.getElementById("preview-wrap").hidden = true;
  document.getElementById("predict-button").disabled = true;
  document.getElementById("prediction-output").hidden = true;
  document.querySelector(".empty-result").hidden = false;
  document.getElementById("demo-message").textContent = "Choose an image from the 10 CIFAR-10 classes: airplane, automobile, bird, cat, deer, dog, frog, horse, ship, or truck.";
}

async function predict(event) {
  event.preventDefault();
  if (!selectedFile) return;
  const button = document.getElementById("predict-button");
  const message = document.getElementById("demo-message");
  const output = document.getElementById("prediction-output");
  button.disabled = true;
  button.classList.add("is-loading");
  button.innerHTML = '<span class="spinner" aria-hidden="true"></span> Classifying…';
  message.textContent = "Sending the image to the saved model…";
  output.hidden = true;
  document.querySelector(".empty-result").hidden = true;
  try {
    const body = new FormData();
    body.append("file", selectedFile);
    const response = await fetch(`${apiBase}/api/predict`, { method: "POST", body });
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || "The prediction request failed.");
    output.innerHTML = `
      <span class="eyebrow">MODEL PREDICTION</span>
      <div class="prediction-label">${result.predicted_class}<span>${(result.confidence * 100).toFixed(2)}%</span></div>
      <p class="prediction-caption">Top class · softmax score</p>
      <div class="probability-list">${result.scores.map((score) => `
        <div class="probability-row ${score.class_name === result.predicted_class ? "probability-top" : ""}">
          <span>${score.class_name}</span><div><i style="width:${(score.score * 100).toFixed(2)}%"></i></div><b>${(score.score * 100).toFixed(1)}%</b>
        </div>`).join("")}</div>
      <small class="result-model-note">REAL MODEL OUTPUT · ${result.model}</small>`;
    output.hidden = false;
    message.textContent = "Prediction complete. These scores came from the included trained model.";
  } catch (error) {
    document.querySelector(".empty-result").hidden = false;
    message.textContent = error instanceof TypeError
      ? "The prediction API could not be reached. Start the FastAPI service, then try again."
      : error.message || "The prediction could not be completed.";
  } finally {
    button.disabled = !selectedFile;
    button.classList.remove("is-loading");
    button.innerHTML = 'Run classification <span aria-hidden="true">↗</span>';
  }
}

function setupDemo() {
  const input = document.getElementById("image-input");
  const zone = document.getElementById("upload-zone");
  input.addEventListener("change", () => setSelectedFile(input.files[0]));
  document.getElementById("remove-image").addEventListener("click", clearSelectedFile);
  document.getElementById("predict-form").addEventListener("submit", predict);
  zone.addEventListener("dragover", (event) => {
    event.preventDefault();
    zone.classList.add("is-dragging");
  });
  zone.addEventListener("dragleave", () => zone.classList.remove("is-dragging"));
  zone.addEventListener("drop", (event) => {
    event.preventDefault();
    zone.classList.remove("is-dragging");
    setSelectedFile(event.dataTransfer.files[0]);
  });
  checkApi();
}

renderClasses();
renderComparison();
setupNavigation();
setupReveal();
setupDemo();
renderNotebookFigures().catch((error) => {
  document.getElementById("all-figures").textContent = error.message;
});
renderNotebookTextOutputs().catch((error) => {
  document.getElementById("output-archive").textContent = error.message;
});
