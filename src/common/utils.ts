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
  const n = data.length;

  const sliceWidth = width / n;
  let x = 0;

  for (let i = 0; i < n; i++) {
    const v =
      (Math.log10(1 + data[i]) / Math.log10(1 + 1)) *
      (visualizerData.amplitudeMultiplier || 1);
    const y = height / 2 - v * (height / 2);

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }

    x += sliceWidth;
  }

  ctx.strokeStyle = visualizerData?.color || "#fff";
  ctx.lineWidth = parseInt(visualizerData?.strokeWidth || "1", 10);
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
    ctx.fillRect(x, height / 2 - barHeight, barWidth, barHeight * 2);
    x += barWidth + gap;
  });
}

export function hannWindow(size: number): number[] {
  const out = new Array(size);
  for (let i = 0; i < size; i++) {
    out[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
  }
  return out;
}
