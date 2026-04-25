export function downsample(data: number[], targetCount: number) {
  const result = [];
  const bucketSize = data.length / targetCount;

  for (let i = 0; i < targetCount; i++) {
    const start = Math.floor(i * bucketSize);
    const end = Math.floor((i + 1) * bucketSize);

    let sum = 0;
    let count = 0;

    for (let j = start; j < end; j++) {
      sum += data[j];
      count++;
    }

    result.push(count ? sum / count : 0);
  }

  return result;
}

function normalizeLoudness(data: number[]) {
  const peak = Math.max(...data.map(Math.abs));
  if (peak === 0) return data; // avoid divide-by-zero
  return data.map((v) => v / peak);
}

export function drawWaveform(
  canvas: HTMLCanvasElement | null,
  data: number[],
  visualizerData: Record<string, any>,
) {
  const ctx = canvas?.getContext("2d");
  if (!ctx || !canvas) return;
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);
  ctx.beginPath();

  data = normalizeLoudness(data);
  const n = data.length;
  const amplitude = (visualizerData.amplitudeMultiplier || 1) * 0.8;

  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * width;

    // center + shape
    const centered = data[i];
    let v = Math.sign(centered) * Math.pow(Math.abs(centered), 0.8) * amplitude;
    v = Math.max(-1, Math.min(1, v));

    const y = height / 2 - v * (height / 2);

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.strokeStyle = visualizerData?.color || "#fff";
  ctx.lineWidth = parseInt(visualizerData?.strokeWidth || "1", 10);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.stroke();
}

export function drawFilledWaveform(
  canvas: HTMLCanvasElement | null,
  data: number[],
  visualizerData: Record<string, any>,
) {
  const ctx = canvas?.getContext("2d");
  if (!ctx || !canvas) return;
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);

  data = normalizeLoudness(data);
  const n = data.length;
  const amplitude = (visualizerData.amplitudeMultiplier || 1) * 0.8;

  ctx.beginPath();
  ctx.moveTo(0, height / 2);

  // top half of the waveform
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * width;
    const centered = data[i];
    let v = Math.pow(Math.abs(centered), 0.8) * amplitude;
    v = Math.max(0, Math.min(1, v));

    const y = height / 2 - v * (height / 2);
    ctx.lineTo(x, y);
  }

  // bottom half (mirrored) - go backwards to close the path
  for (let i = n - 1; i >= 0; i--) {
    const x = (i / (n - 1)) * width;
    const centered = data[i];
    let v = Math.pow(Math.abs(centered), 0.8) * amplitude;
    v = Math.max(0, Math.min(1, v));

    const y = height / 2 + v * (height / 2);
    ctx.lineTo(x, y);
  }

  ctx.closePath();

  ctx.fillStyle = visualizerData?.fillColor || "transparent";
  ctx.fill();

  ctx.strokeStyle = visualizerData?.color || "#fff";
  ctx.lineWidth = parseInt(visualizerData?.strokeWidth || "1", 10);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();
}

export function drawSoundBar(
  canvas: HTMLCanvasElement | null,
  data: number[],
  visualizerData: Record<string, any>,
) {
  const ctx = canvas?.getContext("2d");
  if (!ctx || !canvas) return;
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);
  ctx.beginPath();

  data = normalizeLoudness(data);
  const n = data.length;
  let barWidth = parseInt(visualizerData?.strokeWidth || "1", 10);
  let gap = visualizerData?.gap || 2;
  const barsCount = Math.floor((width + gap) / (barWidth + gap));
  const sampled = downsample(data, barsCount);
  const totalWidth = barsCount * barWidth + (barsCount - 1) * gap;
  if (totalWidth > width) {
    const scale = width / totalWidth;
    barWidth *= scale;
    gap *= scale;
  }
  let x = (width - (barsCount * barWidth + (barsCount - 1) * gap)) / 2;

  sampled.forEach((val) => {
    const magnitude = val * 100 * (visualizerData.amplitudeMultiplier || 1);
    const barHeight = (magnitude / n) * height;

    ctx.fillStyle = visualizerData?.color || "#fff";
    ctx.roundRect(x, height / 2 - barHeight, barWidth, barHeight * 2, 5);
    ctx.fill();
    x += barWidth + gap;
  });
}

export function drawFlatLine(
  canvas: HTMLCanvasElement | null,
  visualizerData: Record<string, any>,
) {
  const ctx = canvas?.getContext("2d");
  if (!ctx || !canvas) return;
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);
  ctx.beginPath();

  const y = height / 2;
  ctx.moveTo(0, y);
  ctx.lineTo(width, y);

  ctx.strokeStyle = visualizerData?.color || "#fff";
  ctx.lineWidth = Math.max(
    1,
    parseInt(visualizerData?.strokeWidth || "1", 10) / 2,
  );
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.stroke();
}

export function hannWindow(size: number): number[] {
  const out = new Array(size);
  for (let i = 0; i < size; i++) {
    out[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
  }
  return out;
}
