/**
 * Utility to optimize receipt and boleta images of ANY size (even 10MB - 30MB camera photos).
 * Uses URL.createObjectURL to avoid mobile RAM crashes, downscales high-res photos to 1200px max,
 * and compresses them to high-clarity ~100-250KB JPEGs that easily sync to Firestore.
 */
export async function optimizeReceiptImage(file: File): Promise<{
  dataUrl: string;
  sizeKb: number;
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('El archivo seleccionado no es una imagen válida.'));
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        URL.revokeObjectURL(objectUrl);

        // Target maximum dimension: 1200px guarantees receipts are sharp and legible
        const MAX_DIMENSION = 1200;
        let { width, height } = img;

        if (width > height && width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('No se pudo inicializar el procesador de imágenes del navegador.'));
        }

        // Fill white background in case of transparent PNG/WebP
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Dynamic compression loop: target under 300 KB for rapid cloud sync and storage
        let quality = 0.75;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        let sizeKb = Math.round((dataUrl.length * 0.75) / 1024);

        if (sizeKb > 350) {
          quality = 0.6;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          sizeKb = Math.round((dataUrl.length * 0.75) / 1024);
        }

        if (sizeKb > 350) {
          quality = 0.45;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          sizeKb = Math.round((dataUrl.length * 0.75) / 1024);
        }

        resolve({
          dataUrl,
          sizeKb,
          width,
          height,
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo decodificar la imagen seleccionada.'));
    };

    img.src = objectUrl;
  });
}
