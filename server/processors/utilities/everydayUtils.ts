import QRCode from 'qrcode';

export async function generateQrCodeBuffer(text: string): Promise<Buffer> {
  const pngDataUrl = await QRCode.toDataURL(text, { width: 600, margin: 2 });
  const base64Data = pngDataUrl.replace(/^data:image\/png;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

export function generateRandomPassword(length = 16, includeSymbols = true): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const valid = includeSymbols ? chars + symbols : chars;

  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * valid.length);
    password += valid[randomIndex];
  }
  return password;
}

export function generateUuidList(count = 10): string {
  const uuids: string[] = [];
  for (let i = 0; i < count; i++) {
    uuids.push(crypto.randomUUID());
  }
  return uuids.join('\n');
}
