const colorCache = new Map<number, string>();

export const hueToOklch = (hue: number): string => {
  if (!colorCache.has(hue)) {
    colorCache.set(hue, `oklch(0.75 0.125 ${hue})`);
  }
  return colorCache.get(hue)!;
};
