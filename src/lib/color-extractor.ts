/**
 * Extrae los colores dominantes de una imagen usando HTML5 Canvas en el navegador.
 */
export interface ExtractedBranding {
  primary: string;
  secondary: string;
  accent: string;
}

export function extractColorsFromImage(imageSrc: string): Promise<ExtractedBranding> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageSrc;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return resolve({ primary: "#cda870", secondary: "#131110", accent: "#e53e3e" });
      }

      // Redimensionar para análisis rápido (max 150px)
      const scale = Math.min(150 / img.width, 150 / img.height, 1);
      canvas.width = Math.floor(img.width * scale);
      canvas.height = Math.floor(img.height * scale);

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

      const colorBucket: Record<string, { r: number; g: number; b: number; count: number }> = {};

      for (let i = 0; i < imageData.length; i += 4) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        const a = imageData[i + 3];

        // Ignorar píxeles transparentes o semi-transparentes
        if (a < 128) continue;

        // Cuantizar colores reduciendo profundidad (pasos de 16 para agrupar tonos similares)
        const qR = Math.round(r / 16) * 16;
        const qG = Math.round(g / 16) * 16;
        const qB = Math.round(b / 16) * 16;

        // Descartar casi blancos y casi negros extremados para evitar capturar fondos
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        if (brightness > 245 || brightness < 15) continue;

        const key = `${qR},${qG},${qB}`;
        if (!colorBucket[key]) {
          colorBucket[key] = { r: qR, g: qG, b: qB, count: 0 };
        }
        colorBucket[key].count++;
      }

      const sortedColors = Object.values(colorBucket).sort((a, b) => b.count - a.count);

      function rgbToHex(r: number, g: number, b: number): string {
        const toHex = (n: number) => Math.min(255, Math.max(0, n)).toString(16).padStart(2, "0");
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      }

      if (sortedColors.length === 0) {
        return resolve({ primary: "#cda870", secondary: "#1e1b18", accent: "#d97706" });
      }

      const primary = rgbToHex(sortedColors[0].r, sortedColors[0].g, sortedColors[0].b);
      
      // Buscar secundario distintivo (con cierta distancia cromática del primario)
      let secondaryItem = sortedColors.find((c) => {
        const diff = Math.abs(c.r - sortedColors[0].r) + Math.abs(c.g - sortedColors[0].g) + Math.abs(c.b - sortedColors[0].b);
        return diff > 60;
      }) || sortedColors[1] || sortedColors[0];

      const secondary = rgbToHex(secondaryItem.r, secondaryItem.g, secondaryItem.b);

      // Buscar acento
      let accentItem = sortedColors.find((c) => {
        const diffP = Math.abs(c.r - sortedColors[0].r) + Math.abs(c.g - sortedColors[0].g) + Math.abs(c.b - sortedColors[0].b);
        const diffS = Math.abs(c.r - secondaryItem.r) + Math.abs(c.g - secondaryItem.g) + Math.abs(c.b - secondaryItem.b);
        return diffP > 80 && diffS > 80;
      }) || sortedColors[2] || secondaryItem;

      const accent = rgbToHex(accentItem.r, accentItem.g, accentItem.b);

      resolve({ primary, secondary, accent });
    };

    img.onerror = () => {
      resolve({ primary: "#cda870", secondary: "#131110", accent: "#e53e3e" });
    };
  });
}
