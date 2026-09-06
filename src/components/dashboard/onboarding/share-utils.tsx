export function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.276-.101-.477-.15-.677.15-.2.301-.777.979-.953 1.18-.175.2-.351.226-.652.076-.3-.15-1.267-.467-2.414-1.488-.893-.796-1.496-1.78-1.672-2.08-.176-.301-.019-.464.132-.614.136-.135.301-.351.451-.527.151-.175.2-.301.301-.502.1-.2.05-.376-.025-.526-.075-.15-.677-1.63-.928-2.232-.244-.587-.492-.507-.677-.517-.175-.009-.376-.01-.577-.01-.2 0-.527.075-.802.376-.276.301-1.054 1.029-1.054 2.509s1.079 2.91 1.229 3.111c.15.201 2.122 3.24 5.141 4.544.718.31 1.279.496 1.716.634.721.23 1.377.197 1.895.12.577-.087 1.78-.727 2.03-1.43.25-.702.25-1.304.175-1.43-.075-.125-.276-.2-.577-.35z" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.05 22l4.98-1.332A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2a8.167 8.167 0 01-4.228-1.17l-.303-.18-2.955.79.79-2.93-.198-.315A8.163 8.163 0 013.8 12c0-4.529 3.671-8.2 8.2-8.2s8.2 3.671 8.2 8.2-3.671 8.2-8.2 8.2z"
      />
    </svg>
  );
}

// Convert SVG to high-res PNG blob for native device sharing
export async function svgToPngBlob(svgString: string): Promise<Blob> {
  return new Promise((resolve) => {
    try {
      const img = new window.Image();
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          resolve(svgBlob);
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 512, 512);
        ctx.drawImage(img, 0, 0, 512, 512);
        URL.revokeObjectURL(url);

        canvas.toBlob((blob) => {
          resolve(blob || svgBlob);
        }, "image/png");
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(svgBlob);
      };

      img.src = url;
    } catch {
      resolve(new Blob([svgString], { type: "image/svg+xml" }));
    }
  });
}

export function buildPhotoUploadShareMessage(uploadUrl: string, propertyTitle?: string): string {
  const qrViewUrl = `${uploadUrl}&view=qr`;
  return `📸 Photo Upload Request: Please upload photos for ${propertyTitle || "Property"}.\n\n🔗 Tap this link to upload from your camera or gallery:\n${uploadUrl}\n\n📱 Or scan/view the QR code here:\n${qrViewUrl}`;
}
