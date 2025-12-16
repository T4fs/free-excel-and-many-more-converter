// Service for simple client-side image conversions using Canvas

export const convertImage = async (file: File, targetFormat: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      
      // Handle transparency for JPEG/BMP (fill white background)
      if (['image/jpeg', 'image/bmp'].includes(targetFormat)) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Conversion failed"));
        }
      }, targetFormat, 0.9);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    
    img.src = url;
  });
};

export const imageToSvg = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <image href="${base64}" width="100%" height="100%" />
        </svg>
      `;
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      resolve(blob);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
