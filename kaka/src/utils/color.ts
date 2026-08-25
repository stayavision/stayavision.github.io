export function hexToRgba(hex: string, alpha: number): string {
  if (!hex || !hex.startsWith('#')) return `rgba(20, 20, 40, ${alpha})`;
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const h = Math.max(0, Math.min(255, Math.round(n))).toString(16);
    return h.length === 1 ? '0' + h : h;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function extractColorFromImageUrl(
  imageUrl: string
): Promise<{ color1: string; color2: string }> {
  return new Promise((resolve, reject) => {
    if (!imageUrl) {
      reject(new Error('No image URL provided'));
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context not available'));
          return;
        }

        canvas.width = Math.min(img.width, 300);
        canvas.height = Math.min(img.height, 300);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let rS = 0, gS = 0, bS = 0, wS = 0;

        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const w = (max - min) + 5;
          rS += r * w;
          gS += g * w;
          bS += b * w;
          wS += w;
        }

        if (wS === 0) wS = 1;
        let rA = Math.floor(rS / wS);
        let gA = Math.floor(gS / wS);
        let bA = Math.floor(bS / wS);

        const lum = 0.299 * rA + 0.587 * gA + 0.114 * bA;
        if (lum > 70) {
          const f = 70 / lum;
          rA = Math.floor(rA * f);
          gA = Math.floor(gA * f);
          bA = Math.floor(bA * f);
        }

        const hex1 = rgbToHex(rA, gA, bA);
        const hex2 = rgbToHex(
          Math.floor(rA * 0.4),
          Math.floor(gA * 0.4),
          Math.floor(bA * 0.4)
        );

        resolve({ color1: hex1, color2: hex2 });
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (err) => reject(err);
    img.src = imageUrl;
  });
}
