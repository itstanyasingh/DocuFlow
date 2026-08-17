import QRCode from 'qrcode';

/**
 * 1. Base64 Encode text or file
 */
export function encodeBase64(text: string): string {
  return btoa(unescape(encodeURIComponent(text)));
}

/**
 * 2. Base64 Decode string to text
 */
export function decodeBase64(base64: string): string {
  return decodeURIComponent(escape(atob(base64.trim())));
}

/**
 * 3. URL Encode
 */
export function encodeUrlString(input: string, componentMode: boolean = true): string {
  return componentMode ? encodeURIComponent(input) : encodeURI(input);
}

/**
 * 4. URL Decode
 */
export function decodeUrlString(input: string, componentMode: boolean = true): string {
  return componentMode ? decodeURIComponent(input) : decodeURI(input);
}

/**
 * 5. UUID v4 Generator
 */
export function generateUUIDs(count: number = 1): string[] {
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      result.push(crypto.randomUUID());
    } else {
      // Fallback RFC4122 compliant
      result.push(
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        })
      );
    }
  }
  return result;
}

/**
 * 6. QR Code Generator
 */
export async function generateQrCodeDataUrl(
  text: string,
  options?: {
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  }
): Promise<string> {
  return await QRCode.toDataURL(text, {
    width: options?.width || 360,
    margin: options?.margin || 2,
    color: {
      dark: options?.color?.dark || '#000000',
      light: options?.color?.light || '#ffffff',
    },
    errorCorrectionLevel: options?.errorCorrectionLevel || 'M',
  });
}

/**
 * 7. Cryptographically Secure Password Generator (100% Client-side)
 */
export interface PasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean;
}

export function generateSecurePassword(options: PasswordOptions): { password: string; entropyBits: number } {
  let chars = '';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const similarChars = /[il1Lo0O]/g;

  let poolUpper = uppercase;
  let poolLower = lowercase;
  let poolNum = numbers;
  let poolSym = symbols;

  if (options.excludeSimilar) {
    poolUpper = poolUpper.replace(similarChars, '');
    poolLower = poolLower.replace(similarChars, '');
    poolNum = poolNum.replace(similarChars, '');
  }

  if (options.includeUppercase) chars += poolUpper;
  if (options.includeLowercase) chars += poolLower;
  if (options.includeNumbers) chars += poolNum;
  if (options.includeSymbols) chars += poolSym;

  if (!chars) {
    chars = poolLower + poolNum;
  }

  const length = Math.max(4, Math.min(128, options.length));
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);

  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[randomValues[i] % chars.length];
  }

  // Calculate Shannon Entropy
  const poolSize = chars.length;
  const entropyBits = Math.round(length * (Math.log2(poolSize || 1)));

  return { password, entropyBits };
}
