import jsQR from 'jsqr';

/**
 * Extracts a clean booking reference from raw decoded QR code content.
 * Handles full URLs (e.g. https://domain.com/?ref=WH-8492), query strings,
 * JSON payloads, invoice identifiers (INV-2026-WH8492), or plain codes.
 */
export function extractBookingReference(rawText: string): string {
  if (!rawText) return '';
  const text = rawText.trim();

  // 1. Full URL with query param ?ref= or &ref= or ?reference=
  try {
    const url = new URL(text);
    const ref = url.searchParams.get('ref') || url.searchParams.get('reference') || url.searchParams.get('id');
    if (ref) {
      return ref.trim().replace(/^#/, '');
    }
  } catch {
    // Not a full URL with scheme, check substring regex
  }

  const queryMatch = text.match(/[?&](?:ref|reference|id)=([^&#\s]+)/i);
  if (queryMatch && queryMatch[1]) {
    try {
      return decodeURIComponent(queryMatch[1]).trim().replace(/^#/, '');
    } catch {
      return queryMatch[1].trim().replace(/^#/, '');
    }
  }

  // 2. JSON structured payload
  if ((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']'))) {
    try {
      const parsed = JSON.parse(text);
      const val = parsed.referenceNumber || parsed.reference || parsed.ref || parsed.bookingId || parsed.id;
      if (val) return String(val).trim().replace(/^#/, '');
    } catch {
      // Ignore JSON error
    }
  }

  // 3. Invoice Number pattern (e.g., INV-2026-WH8492 or INV-2026-8492)
  const invMatch = text.match(/INV-\d{4}-([A-Za-z0-9-]+)/i);
  if (invMatch && invMatch[1]) {
    return invMatch[1].trim().replace(/^#/, '');
  }

  // 4. Labeled text pattern: "Booking Reference: WH-8492" or "REF: WH-8492"
  const labelMatch = text.match(/(?:ref(?:erence)?|booking|reservation)[\s:#]+([A-Za-z0-9-]+)/i);
  if (labelMatch && labelMatch[1]) {
    return labelMatch[1].trim().replace(/^#/, '');
  }

  // 5. Default fallback: clean any leading hashtag and whitespace
  return text.replace(/^#/, '').trim();
}

/**
 * Scans an ImageData object using jsQR or native BarcodeDetector if available.
 */
export async function decodeQrFromImageData(
  imageData: ImageData
): Promise<{ text: string; location?: any } | null> {
  // Check if native BarcodeDetector is supported
  if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
    try {
      const BarcodeDetectorClass = (window as any).BarcodeDetector;
      const detector = new BarcodeDetectorClass({ formats: ['qr_code'] });
      // Create ImageBitmap from ImageData
      const imageBitmap = await createImageBitmap(imageData);
      const barcodes = await detector.detect(imageBitmap);
      if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
        return { text: barcodes[0].rawValue };
      }
    } catch {
      // Fallback to jsQR on any error or unsupported format
    }
  }

  // Fallback to pure JS jsQR
  try {
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });
    if (code && code.data) {
      return { text: code.data, location: code.location };
    }
  } catch (err) {
    console.warn('jsQR scan error:', err);
  }

  return null;
}

/**
 * Scans a file/blob (e.g. from user image upload) for QR codes.
 */
export async function decodeQrFromFile(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const result = await decodeQrFromImageData(imgData);
        resolve(result ? result.text : null);
      };
      img.onerror = () => resolve(null);
      img.src = reader.result as string;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}
