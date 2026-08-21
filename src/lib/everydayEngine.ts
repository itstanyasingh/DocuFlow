import QRCode from 'qrcode';
import jsQR from 'jsqr';

// 1. QR Code Generator
export async function generateQrCodeDataUrl(
  text: string,
  options?: {
    width?: number;
    margin?: number;
    darkColor?: string;
    lightColor?: string;
  }
): Promise<string> {
  if (!text || text.trim() === '') {
    throw new Error('Please enter text or a URL to generate a QR code.');
  }

  return await QRCode.toDataURL(text, {
    width: options?.width || 300,
    margin: options?.margin !== undefined ? options?.margin : 2,
    color: {
      dark: options?.darkColor || '#000000',
      light: options?.lightColor || '#FFFFFF',
    },
  });
}

// 2. QR Code Reader
export async function decodeQrCodeFromImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context unavailable in browser.'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code && code.data) {
        resolve(code.data);
      } else {
        reject(new Error('No QR code could be detected in this image. Please upload a clearer image containing a QR code.'));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image file. Please upload a valid image file (PNG, JPG, WEBP).'));
    };

    img.src = url;
  });
}

// 3. Base64
export function base64Encode(text: string): string {
  return btoa(unescape(encodeURIComponent(text)));
}

export function base64Decode(str: string): string {
  return decodeURIComponent(escape(atob(str)));
}

export const encodeBase64 = base64Encode;
export const decodeBase64 = base64Decode;

// 4. URL Encoding
export function encodeUrlString(text: string): string {
  return encodeURIComponent(text);
}

export function decodeUrlString(text: string): string {
  return decodeURIComponent(text);
}

// 5. UUID Generator
export function generateUUIDs(count: number = 5): string[] {
  const result: string[] = [];
  const qty = Math.max(1, Math.min(count, 100));
  for (let i = 0; i < qty; i++) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      result.push(crypto.randomUUID());
    } else {
      result.push('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0,
          v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }));
    }
  }
  return result;
}

// 6. Secure Password Generator
export function generateSecurePassword(options?: {
  length?: number;
  uppercase?: boolean;
  lowercase?: boolean;
  numbers?: boolean;
  symbols?: boolean;
  excludeSimilar?: boolean;
}): { password: string; entropyBits: number } {
  const length = Math.max(6, Math.min(options?.length || 16, 128));
  let chars = '';
  if (options?.uppercase !== false) chars += 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  if (options?.lowercase !== false) chars += 'abcdefghijkmnopqrstuvwxyz';
  if (options?.numbers !== false) chars += '23456789';
  if (options?.symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (!chars) chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  let pass = '';
  const array = new Uint32Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      pass += chars[array[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      pass += chars[Math.floor(Math.random() * chars.length)];
    }
  }

  const entropyBits = Math.round(length * Math.log2(chars.length));
  return { password: pass, entropyBits };
}

// 7. Color Utilities
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace('#', '').trim();
  if (!/^[0-9A-Fa-f]{3,6}$/.test(cleanHex)) return null;
  let fullHex = cleanHex;
  if (cleanHex.length === 3) {
    fullHex = cleanHex.split('').map(c => c + c).join('');
  }
  const num = parseInt(fullHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

export function generateRandomColor(): { hex: string; rgb: string; hsl: string } {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  const hex = rgbToHex(r, g, b);
  const { h, s, l } = rgbToHsl(r, g, b);
  return {
    hex,
    rgb: `rgb(${r}, ${g}, ${b})`,
    hsl: `hsl(${h}, ${s}%, ${l}%)`,
  };
}

// 8. Unit Conversion
export function convertUnits(val: number, category: string, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return val;

  // Length in meters
  const lengthToMeters: Record<string, number> = {
    mm: 0.001, cm: 0.01, m: 1, km: 1000, inch: 0.0254, feet: 0.3048, yard: 0.9144, mile: 1609.344
  };

  // Weight in grams
  const weightToGrams: Record<string, number> = {
    mg: 0.001, g: 1, kg: 1000, oz: 28.3495, lb: 453.592, ton: 1000000
  };

  // Data storage in bytes
  const storageToBytes: Record<string, number> = {
    B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4
  };

  if (category === 'length' && lengthToMeters[fromUnit] && lengthToMeters[toUnit]) {
    return (val * lengthToMeters[fromUnit]) / lengthToMeters[toUnit];
  }

  if (category === 'weight' && weightToGrams[fromUnit] && weightToGrams[toUnit]) {
    return (val * weightToGrams[fromUnit]) / weightToGrams[toUnit];
  }

  if (category === 'storage' && storageToBytes[fromUnit] && storageToBytes[toUnit]) {
    return (val * storageToBytes[fromUnit]) / storageToBytes[toUnit];
  }

  if (category === 'temperature') {
    let c = val;
    if (fromUnit === 'F') c = (val - 32) * (5 / 9);
    else if (fromUnit === 'K') c = val - 273.15;

    if (toUnit === 'C') return c;
    if (toUnit === 'F') return c * (9 / 5) + 32;
    if (toUnit === 'K') return c + 273.15;
  }

  return val;
}

// 9. Date & Age Calculator
export function calculateAge(dobStr: string): { years: number; months: number; days: number; daysToNextBirthday: number } {
  const dob = new Date(dobStr);
  const now = new Date();

  let years = now.getFullYear() - dob.getFullYear();
  let months = now.getMonth() - dob.getMonth();
  let days = now.getDate() - dob.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  // Next birthday calculation
  let nextBday = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
  if (nextBday < now) {
    nextBday = new Date(now.getFullYear() + 1, dob.getMonth(), dob.getDate());
  }
  const diffMs = nextBday.getTime() - now.getTime();
  const daysToNextBirthday = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return { years, months, days, daysToNextBirthday };
}

// 10. Random Number Generator
export function generateRandomNumbers(min: number, max: number, quantity: number, unique: boolean): number[] {
  const results: number[] = [];
  const qty = Math.max(1, Math.min(quantity, 1000));
  const range = max - min + 1;

  if (unique && range < qty) {
    throw new Error(`Cannot generate ${qty} unique numbers in range ${min} to ${max}.`);
  }

  const set = new Set<number>();
  while (results.length < qty) {
    const val = Math.floor(Math.random() * (max - min + 1)) + min;
    if (unique) {
      if (!set.has(val)) {
        set.add(val);
        results.push(val);
      }
    } else {
      results.push(val);
    }
  }

  return results;
}
