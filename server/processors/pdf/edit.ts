import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function addWatermarkToPdf(
  pdfBuffer: Buffer,
  watermarkText = 'CONFIDENTIAL',
  opacity = 0.3
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    const textSize = 48;
    const textWidth = font.widthOfTextAtSize(watermarkText, textSize);

    page.drawText(watermarkText, {
      x: width / 2 - textWidth / 2,
      y: height / 2,
      size: textSize,
      font,
      color: rgb(0.5, 0.5, 0.5),
      opacity,
      rotate: { angle: Math.PI / 4, type: 'radians' } as any,
    });
  }

  const outputBytes = await pdfDoc.save();
  return Buffer.from(outputBytes);
}

export async function addPageNumbersToPdf(
  pdfBuffer: Buffer,
  position: 'bottom-right' | 'bottom-center' | 'top-right' = 'bottom-center'
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  const total = pages.length;

  pages.forEach((page, idx) => {
    const { width, height } = page.getSize();
    const text = `Page ${idx + 1} of ${total}`;
    const textSize = 10;
    const textWidth = font.widthOfTextAtSize(text, textSize);

    let x = width / 2 - textWidth / 2;
    let y = 20;

    if (position === 'bottom-right') {
      x = width - textWidth - 30;
      y = 20;
    } else if (position === 'top-right') {
      x = width - textWidth - 30;
      y = height - 25;
    }

    page.drawText(text, {
      x,
      y,
      size: textSize,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
  });

  const outputBytes = await pdfDoc.save();
  return Buffer.from(outputBytes);
}

export async function addTextToPdfPages(
  pdfBuffer: Buffer,
  text: string,
  pageNumber = 1,
  x = 50,
  y = 50
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  const targetPageIndex = Math.max(0, Math.min(pageNumber - 1, pages.length - 1));
  const targetPage = pages[targetPageIndex];

  targetPage.drawText(text, {
    x,
    y: targetPage.getHeight() - y, // flip y
    size: 12,
    font,
    color: rgb(0, 0, 0),
  });

  const outputBytes = await pdfDoc.save();
  return Buffer.from(outputBytes);
}

export async function removePdfMetadataBytes(pdfBuffer: Buffer): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  pdfDoc.setTitle('');
  pdfDoc.setAuthor('');
  pdfDoc.setSubject('');
  pdfDoc.setKeywords([]);
  pdfDoc.setProducer('');
  pdfDoc.setCreator('');

  const outputBytes = await pdfDoc.save();
  return Buffer.from(outputBytes);
}
