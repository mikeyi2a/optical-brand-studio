export interface GlitchOptions {
  enabled: boolean;
  amount: number;
  seed: number;
}

export interface SignalBreakupOptions {
  enabled: boolean;
  density: number;
  seed: number;
  colour: string;
}

const createRandom = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};

/** A deterministic broadcast-breakup layer for vector artwork. */
export function svgGlitchOverlay(width: number, height: number, options: GlitchOptions): string {
  if (!options.enabled || options.amount === 0) return '';

  const random = createRandom(options.seed);
  const count = Math.ceil(options.amount / 4);
  let strips = '';

  for (let index = 0; index < count; index++) {
    const y = random() * height;
    const stripHeight = Math.max(2, height * (.003 + random() * .014));
    const x = random() * width * .14;
    const stripWidth = width * (.16 + random() * .72);
    const colour = index % 3 === 0 ? '#27e0ef' : index % 3 === 1 ? '#ff3157' : '#f6f7e8';
    strips += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${stripWidth.toFixed(1)}" height="${stripHeight.toFixed(1)}" fill="${colour}" opacity="${(.24 + random() * .45).toFixed(2)}"/>`;
  }

  return `<g data-effect="glitch-overlay" style="mix-blend-mode:screen">${strips}</g>`;
}

/** Sparse horizontal dropouts inspired by broadcast signal loss. */
export function svgSignalBreakup(width: number, height: number, options: SignalBreakupOptions): string {
  if (!options.enabled || options.density === 0) return '';
  const random = createRandom(options.seed + 7919);
  let bars = '';
  for (let index = 0; index < Math.ceil(options.density * 1.2); index++) {
    const barHeight = Math.max(1, height * (.001 + random() * .007));
    const barWidth = width * (.025 + random() * .22);
    const x = random() * (width - barWidth);
    const y = random() * (height - barHeight);
    bars += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${barHeight.toFixed(1)}" fill="${options.colour}" opacity="${(.18 + random() * .46).toFixed(2)}"/>`;
  }
  return `<g data-effect="signal-breakup">${bars}</g>`;
}

/** Applies the same breakup language directly to a canvas-based heat-map frame. */
export function drawCanvasGlitch(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: GlitchOptions,
): void {
  if (!options.enabled || options.amount === 0) return;

  const random = createRandom(options.seed);
  const source = context.getImageData(0, 0, width, height);
  const strips = Math.ceil(options.amount / 5);

  for (let index = 0; index < strips; index++) {
    const y = Math.floor(random() * height);
    const stripHeight = Math.max(1, Math.floor(height * (.003 + random() * .012)));
    const offset = Math.round((random() - .5) * width * options.amount / 160);
    const sourceY = Math.max(0, Math.min(height - stripHeight, y));
    const row = new ImageData(width, stripHeight);
    row.data.set(source.data.slice(sourceY * width * 4, (sourceY + stripHeight) * width * 4));
    context.putImageData(row, offset, sourceY);
  }

  context.save();
  context.globalCompositeOperation = 'screen';
  for (let index = 0; index < strips; index++) {
    const colour = index % 2 ? 'rgba(39, 224, 239, .36)' : 'rgba(255, 49, 87, .34)';
    context.fillStyle = colour;
    context.fillRect(random() * width * .18, random() * height, width * (.18 + random() * .7), Math.max(1, height * (.002 + random() * .008)));
  }
  context.restore();
}

/** Canvas equivalent of the sparse signal-breakup layer. */
export function drawCanvasSignalBreakup(context: CanvasRenderingContext2D, width: number, height: number, options: Omit<SignalBreakupOptions, 'colour'>): void {
  if (!options.enabled || options.density === 0) return;
  const random = createRandom(options.seed + 7919);
  context.save();
  context.fillStyle = 'rgba(24, 28, 21, .45)';
  for (let index = 0; index < Math.ceil(options.density * 1.2); index++) {
    const barHeight = Math.max(1, height * (.001 + random() * .007));
    const barWidth = width * (.025 + random() * .22);
    context.globalAlpha = .35 + random() * .55;
    context.fillRect(random() * (width - barWidth), random() * (height - barHeight), barWidth, barHeight);
  }
  context.restore();
}
