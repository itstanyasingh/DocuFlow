import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { validatePdf, validateJpg, validatePng } from '../processors/pdf/validation';
import { mergePdfFiles } from '../processors/pdf/merge';
import { splitPdfFile } from '../processors/pdf/split';
import { compressPdfFile } from '../processors/pdf/compress';
import { convertJpgToPdf } from '../processors/pdf/fromJpg';
import { convertPngToPdf } from '../processors/pdf/fromPng';
import { extractPdfPagesFile } from '../processors/pdf/extractPages';
import { deletePdfPagesFile } from '../processors/pdf/deletePages';
import { rotatePdfFile } from '../processors/pdf/rotate';
import { bundleImagesZip } from '../processors/pdf/toJpg';
import { convertPdfToWord } from '../processors/pdf/toWord';
import { convertWordToPdf } from '../processors/pdf/toPdf';
import { convertPdfToExcel } from '../processors/pdf/toExcel';
import { convertPdfToText } from '../processors/pdf/toText';
import { saveResultFile } from '../tempManager';

// Import image, ocr, and utility processors
import {
  processImageConvert,
  compressImageBuffer,
  resizeImageBuffer,
  cropImageBuffer,
  rotateImageBuffer,
  flipImageBuffer,
  removeImageExif,
} from '../processors/images/imageProcessor';

import {
  extractTextFromImage,
  convertOcrTextToWord,
} from '../processors/ocr/ocrProcessor';

import {
  createZipFromFiles,
  extractZipEntries,
  generateFileHashes,
  detectFileType,
} from '../processors/utilities/fileUtils';

import {
  countTextMetrics,
  convertTextCase,
  removeTextExtraSpaces,
  createPdfFromText,
  createWordFromText,
} from '../processors/utilities/textUtils';

import {
  convertCsvToExcelBuffer,
  convertExcelToCsvBuffer,
  convertCsvToJsonBuffer,
  convertJsonToCsvBuffer,
  formatJsonBuffer,
} from '../processors/utilities/dataUtils';

import {
  generateQrCodeBuffer,
  generateRandomPassword,
  generateUuidList,
} from '../processors/utilities/everydayUtils';

import {
  addWatermarkToPdf,
  addPageNumbersToPdf,
  addTextToPdfPages,
  removePdfMetadataBytes,
} from '../processors/pdf/edit';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

/**
 * Processing status endpoint
 * GET /api/tools/status
 */
router.get('/status', (_req: Request, res: Response) => {
  res.json({
    mergePdf: true,
    splitPdf: true,
    compressPdf: true,
    pdfToJpg: true,
    jpgToPdf: true,
    pdfToPng: true,
    pngToPdf: true,
    pdfToWord: false,
    pdfToExcel: false,
  });
});

/**
 * Pre-flight validation endpoint
 */
router.post('/validate', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ isValid: false, error: 'Please select a file first.' });
  }

  const { originalname, buffer } = req.file;
  const ext = path.extname(originalname).toLowerCase();

  if (ext === '.pdf') {
    const val = await validatePdf(buffer, originalname);
    return res.json(val);
  } else if (ext === '.jpg' || ext === '.jpeg') {
    const val = validateJpg(buffer, originalname);
    return res.json(val);
  } else if (ext === '.png') {
    const val = validatePng(buffer, originalname);
    return res.json(val);
  }

  return res.json({
    isValid: true,
    fileSize: buffer.byteLength,
    mimeType: req.file.mimetype,
  });
});

/**
 * 1. Merge PDF
 */
router.post('/merge-pdf', upload.array('files', 50), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length < 2) {
      return res.status(400).json({ success: false, error: 'Please select at least 2 PDF files to merge.' });
    }

    const payload = files.map((f) => ({
      buffer: f.buffer,
      originalName: f.originalname,
    }));

    const result = await mergePdfFiles(payload);
    const outputName = 'merged.pdf';
    const stored = saveResultFile(
      result.pdfBytes,
      outputName,
      'application/pdf',
      files[0].originalname,
      { totalPages: result.totalPages, fileCount: result.fileCount }
    );

    res.json({
      success: true,
      fileId: stored.fileId,
      downloadUrl: `/api/files/${stored.fileId}/download`,
      outputFileName: outputName,
      outputFileSize: stored.fileSize,
      outputMimeType: 'application/pdf',
      pageCount: result.totalPages,
      fileCount: result.fileCount,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Merge failed.' });
  }
});

/**
 * 2. Split PDF
 */
router.post('/split-pdf', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please select a file first.' });
    }

    const range = req.body.range || req.body.pageRange || '';
    const baseName = req.file.originalname.replace(/\.[^/.]+$/, '');
    const result = await splitPdfFile(req.file.buffer, range, baseName);

    const stored = saveResultFile(
      result.outputBytes,
      result.outputName,
      result.mimeType,
      req.file.originalname,
      { isZip: result.isZip, partsCount: result.partsCount }
    );

    res.json({
      success: true,
      fileId: stored.fileId,
      downloadUrl: `/api/files/${stored.fileId}/download`,
      outputFileName: result.outputName,
      outputFileSize: stored.fileSize,
      outputMimeType: result.mimeType,
      isZip: result.isZip,
      partsCount: result.partsCount,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Split failed.' });
  }
});

/**
 * 3. Compress PDF
 */
router.post('/compress-pdf', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please select a file first.' });
    }

    const level = (req.body.level || req.body.compressionLevel || 'recommended') as 'basic' | 'recommended' | 'strong';
    const result = await compressPdfFile(req.file.buffer, level);

    const cleanBase = req.file.originalname.replace(/\.[^/.]+$/, '');
    const outputName = `${cleanBase}_compressed.pdf`;

    const stored = saveResultFile(
      result.pdfBytes,
      outputName,
      'application/pdf',
      req.file.originalname,
      {
        originalBytes: result.originalBytes,
        compressedBytes: result.compressedBytes,
        reductionPercentage: result.reductionPercentage,
      }
    );

    res.json({
      success: true,
      fileId: stored.fileId,
      downloadUrl: `/api/files/${stored.fileId}/download`,
      outputFileName: outputName,
      outputFileSize: stored.fileSize,
      outputMimeType: 'application/pdf',
      originalFileSize: result.originalBytes,
      compressedFileSize: result.compressedBytes,
      reductionPercentage: result.reductionPercentage,
      level: result.level,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Compression failed.' });
  }
});

/**
 * 4. PDF to JPG
 */
router.post('/pdf-to-jpg', upload.any(), async (req: Request, res: Response) => {
  try {
    const { imagesJson, baseName = 'document' } = req.body;
    let imagesList: Array<{ pageNumber: number; base64?: string; buffer?: Buffer }> = [];

    if (imagesJson) {
      try {
        imagesList = JSON.parse(imagesJson);
      } catch (_) {}
    }

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      imagesList = (req.files as Express.Multer.File[]).map((f, i) => ({
        pageNumber: i + 1,
        buffer: f.buffer,
      }));
    }

    if (imagesList.length === 0) {
      return res.status(400).json({ success: false, error: 'No page images provided for conversion.' });
    }

    const result = await bundleImagesZip(imagesList, 'jpg', baseName);
    const stored = saveResultFile(result.outputBytes, result.fileName, result.mimeType, `${baseName}.pdf`);

    res.json({
      success: true,
      fileId: stored.fileId,
      downloadUrl: `/api/files/${stored.fileId}/download`,
      outputFileName: result.fileName,
      outputFileSize: stored.fileSize,
      outputMimeType: result.mimeType,
      isZip: result.isZip,
      dataUrl: `data:${result.mimeType};base64,${Buffer.from(result.outputBytes).toString('base64')}`,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'PDF to JPG failed.' });
  }
});

/**
 * 5. JPG to PDF
 */
router.post('/jpg-to-pdf', upload.array('files', 100), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'Please select at least one JPG image.' });
    }

    const options = {
      pageSize: req.body.pageSize,
      orientation: req.body.orientation,
      margin: req.body.margin,
    };

    const images = files.map((f) => ({
      buffer: f.buffer,
      fileName: f.originalname,
    }));

    const pdfBytes = await convertJpgToPdf(images, options);
    const cleanBase = files[0].originalname.replace(/\.[^/.]+$/, '');
    const outputName = `${cleanBase}_converted.pdf`;

    const stored = saveResultFile(pdfBytes, outputName, 'application/pdf', files[0].originalname);

    res.json({
      success: true,
      fileId: stored.fileId,
      downloadUrl: `/api/files/${stored.fileId}/download`,
      outputFileName: outputName,
      outputFileSize: stored.fileSize,
      outputMimeType: 'application/pdf',
      dataUrl: `data:application/pdf;base64,${Buffer.from(pdfBytes).toString('base64')}`,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'JPG to PDF failed.' });
  }
});

/**
 * 6. PDF to PNG
 */
router.post('/pdf-to-png', upload.any(), async (req: Request, res: Response) => {
  try {
    const { imagesJson, baseName = 'document' } = req.body;
    let imagesList: Array<{ pageNumber: number; base64?: string; buffer?: Buffer }> = [];

    if (imagesJson) {
      try {
        imagesList = JSON.parse(imagesJson);
      } catch (_) {}
    }

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      imagesList = (req.files as Express.Multer.File[]).map((f, i) => ({
        pageNumber: i + 1,
        buffer: f.buffer,
      }));
    }

    if (imagesList.length === 0) {
      return res.status(400).json({ success: false, error: 'No page images provided for conversion.' });
    }

    const result = await bundleImagesZip(imagesList, 'png', baseName);
    const stored = saveResultFile(result.outputBytes, result.fileName, result.mimeType, `${baseName}.pdf`);

    res.json({
      success: true,
      fileId: stored.fileId,
      downloadUrl: `/api/files/${stored.fileId}/download`,
      outputFileName: result.fileName,
      outputFileSize: stored.fileSize,
      outputMimeType: result.mimeType,
      isZip: result.isZip,
      dataUrl: `data:${result.mimeType};base64,${Buffer.from(result.outputBytes).toString('base64')}`,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'PDF to PNG failed.' });
  }
});

/**
 * 7. PNG to PDF
 */
router.post('/png-to-pdf', upload.array('files', 100), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'Please select at least one PNG image.' });
    }

    const options = {
      pageSize: req.body.pageSize,
      orientation: req.body.orientation,
      margin: req.body.margin,
    };

    const images = files.map((f) => ({
      buffer: f.buffer,
      fileName: f.originalname,
    }));

    const pdfBytes = await convertPngToPdf(images, options);
    const cleanBase = files[0].originalname.replace(/\.[^/.]+$/, '');
    const outputName = `${cleanBase}_converted.pdf`;

    const stored = saveResultFile(pdfBytes, outputName, 'application/pdf', files[0].originalname);

    res.json({
      success: true,
      fileId: stored.fileId,
      downloadUrl: `/api/files/${stored.fileId}/download`,
      outputFileName: outputName,
      outputFileSize: stored.fileSize,
      outputMimeType: 'application/pdf',
      dataUrl: `data:application/pdf;base64,${Buffer.from(pdfBytes).toString('base64')}`,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'PNG to PDF failed.' });
  }
});

/**
 * 8. Extract Pages
 */
router.post(['/extract-pages', '/extract-pdf-pages'], upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please select a file first.' });
    }

    const pages = req.body.pages || req.body.pageRange || req.body.selectedPages;
    const result = await extractPdfPagesFile(req.file.buffer, pages);

    const cleanBase = req.file.originalname.replace(/\.[^/.]+$/, '');
    const outputName = `${cleanBase}_extracted.pdf`;

    const stored = saveResultFile(result.pdfBytes, outputName, 'application/pdf', req.file.originalname, {
      extractedCount: result.extractedCount,
    });

    res.json({
      success: true,
      fileId: stored.fileId,
      downloadUrl: `/api/files/${stored.fileId}/download`,
      outputFileName: outputName,
      outputFileSize: stored.fileSize,
      outputMimeType: 'application/pdf',
      extractedCount: result.extractedCount,
      dataUrl: `data:application/pdf;base64,${Buffer.from(result.pdfBytes).toString('base64')}`,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Extract failed.' });
  }
});

/**
 * 9. Delete Pages
 */
router.post(['/delete-pages', '/delete-pdf-pages'], upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please select a file first.' });
    }

    const pages = req.body.pages || req.body.pagesToDelete || req.body.deletePages;
    const result = await deletePdfPagesFile(req.file.buffer, pages);

    const cleanBase = req.file.originalname.replace(/\.[^/.]+$/, '');
    const outputName = `${cleanBase}_cleaned.pdf`;

    const stored = saveResultFile(result.pdfBytes, outputName, 'application/pdf', req.file.originalname, {
      remainingPages: result.remainingPages,
      deletedCount: result.deletedCount,
    });

    res.json({
      success: true,
      fileId: stored.fileId,
      downloadUrl: `/api/files/${stored.fileId}/download`,
      outputFileName: outputName,
      outputFileSize: stored.fileSize,
      outputMimeType: 'application/pdf',
      remainingPages: result.remainingPages,
      deletedCount: result.deletedCount,
      dataUrl: `data:application/pdf;base64,${Buffer.from(result.pdfBytes).toString('base64')}`,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Delete pages failed.' });
  }
});

/**
 * 10. Rotate PDF
 */
router.post('/rotate-pdf', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please select a file first.' });
    }

    const angle = parseInt(req.body.angle || req.body.rotation || '90', 10) as 90 | 180 | 270;
    const pages = req.body.pages || req.body.pageRange || 'all';

    const result = await rotatePdfFile(req.file.buffer, angle, pages);

    const cleanBase = req.file.originalname.replace(/\.[^/.]+$/, '');
    const outputName = `${cleanBase}_rotated_${angle}deg.pdf`;

    const stored = saveResultFile(result.pdfBytes, outputName, 'application/pdf', req.file.originalname, {
      angle,
      rotatedPagesCount: result.rotatedPagesCount,
    });

    res.json({
      success: true,
      fileId: stored.fileId,
      downloadUrl: `/api/files/${stored.fileId}/download`,
      outputFileName: outputName,
      outputFileSize: stored.fileSize,
      outputMimeType: 'application/pdf',
      rotatedPagesCount: result.rotatedPagesCount,
      dataUrl: `data:application/pdf;base64,${Buffer.from(result.pdfBytes).toString('base64')}`,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Rotate failed.' });
  }
});

/**
 * 11. PDF to Word
 */
router.post('/pdf-to-word', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please select a PDF file first.' });
    }
    const docxBuffer = await convertPdfToWord(req.file.buffer);
    const cleanBase = req.file.originalname.replace(/\.[^/.]+$/, '');
    const outputName = `${cleanBase}.docx`;
    const stored = saveResultFile(docxBuffer, outputName, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', req.file.originalname);

    res.json({
      success: true,
      fileId: stored.fileId,
      downloadUrl: `/api/files/${stored.fileId}/download`,
      outputFileName: outputName,
      outputFileSize: stored.fileSize,
      outputMimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      dataUrl: `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${Buffer.from(docxBuffer).toString('base64')}`,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Conversion failed.' });
  }
});

/**
 * 12. Word to PDF
 */
router.post(['/word-to-pdf', '/docx-to-pdf'], upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please select a Word file first.' });
    }
    const pdfBytes = await convertWordToPdf(req.file.buffer);
    const cleanBase = req.file.originalname.replace(/\.[^/.]+$/, '');
    const outputName = `${cleanBase}.pdf`;
    const stored = saveResultFile(pdfBytes, outputName, 'application/pdf', req.file.originalname);

    res.json({
      success: true,
      fileId: stored.fileId,
      downloadUrl: `/api/files/${stored.fileId}/download`,
      outputFileName: outputName,
      outputFileSize: stored.fileSize,
      outputMimeType: 'application/pdf',
      dataUrl: `data:application/pdf;base64,${Buffer.from(pdfBytes).toString('base64')}`,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Conversion failed.' });
  }
});

/**
 * 13. PDF to Excel
 */
router.post('/pdf-to-excel', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please select a PDF file first.' });
    }
    const excelBuffer = await convertPdfToExcel(req.file.buffer);
    const cleanBase = req.file.originalname.replace(/\.[^/.]+$/, '');
    const outputName = `${cleanBase}.xlsx`;
    const stored = saveResultFile(excelBuffer, outputName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', req.file.originalname);

    res.json({
      success: true,
      fileId: stored.fileId,
      downloadUrl: `/api/files/${stored.fileId}/download`,
      outputFileName: outputName,
      outputFileSize: stored.fileSize,
      outputMimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dataUrl: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${Buffer.from(excelBuffer).toString('base64')}`,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Conversion failed.' });
  }
});

/**
 * 14. PDF to Text
 */
router.post('/pdf-to-text', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please select a PDF file first.' });
    }
    const textContent = await convertPdfToText(req.file.buffer);
    const textBuffer = Buffer.from(textContent, 'utf-8');
    const cleanBase = req.file.originalname.replace(/\.[^/.]+$/, '');
    const outputName = `${cleanBase}.txt`;
    const stored = saveResultFile(textBuffer, outputName, 'text/plain', req.file.originalname);

    res.json({
      success: true,
      fileId: stored.fileId,
      downloadUrl: `/api/files/${stored.fileId}/download`,
      outputFileName: outputName,
      outputFileSize: stored.fileSize,
      outputMimeType: 'text/plain',
      dataUrl: `data:text/plain;base64,${Buffer.from(textBuffer).toString('base64')}`,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Extraction failed.' });
  }
});

/**
 * Catch-All Dynamic Tool Processor
 * Route: POST /api/tools/:toolId
 */
router.post('/:toolId', upload.any(), async (req: Request, res: Response) => {
  const toolId = req.params.toolId;
  const files = (req.files as Express.Multer.File[]) || [];
  const primaryFile = files[0];

  try {
    // A. Image Tools
    if (['compress-image', 'image-size-reducer'].includes(toolId)) {
      if (!primaryFile) return res.status(400).json({ success: false, error: 'Please upload an image.' });
      const resImg = await compressImageBuffer(primaryFile.buffer, 70);
      const cleanBase = primaryFile.originalname.replace(/\.[^/.]+$/, '');
      const outputName = `${cleanBase}_compressed.${resImg.mimeType.split('/')[1]}`;
      const stored = saveResultFile(resImg.buffer, outputName, resImg.mimeType, primaryFile.originalname);
      return res.json({
        success: true,
        fileId: stored.fileId,
        downloadUrl: `/api/files/${stored.fileId}/download`,
        outputFileName: outputName,
        outputFileSize: stored.fileSize,
        outputMimeType: resImg.mimeType,
        dataUrl: `data:${resImg.mimeType};base64,${resImg.buffer.toString('base64')}`,
      });
    }

    if (['jpg-to-png', 'png-to-jpg', 'jpg-to-webp', 'png-to-webp', 'webp-to-jpg', 'webp-to-png', 'image-format-converter'].includes(toolId)) {
      if (!primaryFile) return res.status(400).json({ success: false, error: 'Please upload an image.' });
      let targetFormat: 'jpg' | 'png' | 'webp' = 'jpg';
      if (toolId.endsWith('-png')) targetFormat = 'png';
      if (toolId.endsWith('-webp')) targetFormat = 'webp';
      if (toolId.endsWith('-jpg')) targetFormat = 'jpg';

      const resImg = await processImageConvert(primaryFile.buffer, targetFormat);
      const cleanBase = primaryFile.originalname.replace(/\.[^/.]+$/, '');
      const outputName = `${cleanBase}_converted.${resImg.extension}`;
      const stored = saveResultFile(resImg.buffer, outputName, resImg.mimeType, primaryFile.originalname);
      return res.json({
        success: true,
        fileId: stored.fileId,
        downloadUrl: `/api/files/${stored.fileId}/download`,
        outputFileName: outputName,
        outputFileSize: stored.fileSize,
        outputMimeType: resImg.mimeType,
        dataUrl: `data:${resImg.mimeType};base64,${resImg.buffer.toString('base64')}`,
      });
    }

    if (['resize-image', 'crop-image', 'rotate-image', 'flip-image', 'remove-image-metadata'].includes(toolId)) {
      if (!primaryFile) return res.status(400).json({ success: false, error: 'Please upload an image.' });
      let outBuf = primaryFile.buffer;
      if (toolId === 'rotate-image') outBuf = await rotateImageBuffer(primaryFile.buffer, parseInt(req.body.angle || '90', 10));
      else if (toolId === 'flip-image') outBuf = await flipImageBuffer(primaryFile.buffer, req.body.direction || 'horizontal');
      else if (toolId === 'remove-image-metadata') outBuf = await removeImageExif(primaryFile.buffer);
      else if (toolId === 'resize-image') outBuf = await resizeImageBuffer(primaryFile.buffer, parseInt(req.body.width || '800', 10));

      const cleanBase = primaryFile.originalname.replace(/\.[^/.]+$/, '');
      const outputName = `${cleanBase}_processed.${primaryFile.mimetype.split('/')[1] || 'jpg'}`;
      const stored = saveResultFile(outBuf, outputName, primaryFile.mimetype || 'image/jpeg', primaryFile.originalname);
      return res.json({
        success: true,
        fileId: stored.fileId,
        downloadUrl: `/api/files/${stored.fileId}/download`,
        outputFileName: outputName,
        outputFileSize: stored.fileSize,
        outputMimeType: primaryFile.mimetype || 'image/jpeg',
        dataUrl: `data:${primaryFile.mimetype};base64,${outBuf.toString('base64')}`,
      });
    }

    // B. OCR Tools
    if (['image-to-text', 'scanned-pdf-to-text', 'pdf-ocr', 'scanned-pdf-to-word', 'scan-to-word', 'receipt-ocr', 'invoice-ocr', 'form-ocr'].includes(toolId)) {
      if (!primaryFile) return res.status(400).json({ success: false, error: 'Please upload an image or scan.' });
      const extractedText = await extractTextFromImage(primaryFile.buffer);

      if (toolId.includes('word')) {
        const docxBuf = await convertOcrTextToWord(extractedText, primaryFile.originalname);
        const cleanBase = primaryFile.originalname.replace(/\.[^/.]+$/, '');
        const outputName = `${cleanBase}_ocr.docx`;
        const stored = saveResultFile(docxBuf, outputName, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', primaryFile.originalname);
        return res.json({
          success: true,
          fileId: stored.fileId,
          downloadUrl: `/api/files/${stored.fileId}/download`,
          outputFileName: outputName,
          outputFileSize: stored.fileSize,
          outputMimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          extractedText,
          dataUrl: `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${docxBuf.toString('base64')}`,
        });
      } else {
        const txtBuf = Buffer.from(extractedText, 'utf-8');
        const cleanBase = primaryFile.originalname.replace(/\.[^/.]+$/, '');
        const outputName = `${cleanBase}_ocr.txt`;
        const stored = saveResultFile(txtBuf, outputName, 'text/plain', primaryFile.originalname);
        return res.json({
          success: true,
          fileId: stored.fileId,
          downloadUrl: `/api/files/${stored.fileId}/download`,
          outputFileName: outputName,
          outputFileSize: stored.fileSize,
          outputMimeType: 'text/plain',
          extractedText,
          dataUrl: `data:text/plain;base64,${txtBuf.toString('base64')}`,
        });
      }
    }

    // C. File Utilities (ZIP, Hash, Metadata)
    if (['zip-creator', 'file-compressor'].includes(toolId)) {
      if (files.length === 0) return res.status(400).json({ success: false, error: 'Please select files to compress into a ZIP.' });
      const zipPayload = files.map((f) => ({ buffer: f.buffer, name: f.originalname }));
      const zipBuf = await createZipFromFiles(zipPayload);
      const outputName = 'archive.zip';
      const stored = saveResultFile(zipBuf, outputName, 'application/zip', files[0].originalname);
      return res.json({
        success: true,
        fileId: stored.fileId,
        downloadUrl: `/api/files/${stored.fileId}/download`,
        outputFileName: outputName,
        outputFileSize: stored.fileSize,
        outputMimeType: 'application/zip',
        dataUrl: `data:application/zip;base64,${zipBuf.toString('base64')}`,
      });
    }

    if (toolId === 'hash-generator') {
      if (!primaryFile) return res.status(400).json({ success: false, error: 'Please select a file to hash.' });
      const hashes = generateFileHashes(primaryFile.buffer);
      const hashReport = `File: ${primaryFile.originalname}\nSize: ${hashes.fileSize} bytes\n\nMD5: ${hashes.md5}\nSHA-1: ${hashes.sha1}\nSHA-256: ${hashes.sha256}\nSHA-512: ${hashes.sha512}\n`;
      const txtBuf = Buffer.from(hashReport, 'utf-8');
      const cleanBase = primaryFile.originalname.replace(/\.[^/.]+$/, '');
      const outputName = `${cleanBase}_hashes.txt`;
      const stored = saveResultFile(txtBuf, outputName, 'text/plain', primaryFile.originalname);
      return res.json({
        success: true,
        fileId: stored.fileId,
        downloadUrl: `/api/files/${stored.fileId}/download`,
        outputFileName: outputName,
        outputFileSize: stored.fileSize,
        outputMimeType: 'text/plain',
        hashes,
        dataUrl: `data:text/plain;base64,${txtBuf.toString('base64')}`,
      });
    }

    if (['file-type-checker', 'file-metadata-viewer', 'file-size-analyzer'].includes(toolId)) {
      if (!primaryFile) return res.status(400).json({ success: false, error: 'Please select a file to analyze.' });
      const info = detectFileType(primaryFile.buffer, primaryFile.originalname);
      const report = `File Analysis Report\n==================\nFilename: ${primaryFile.originalname}\nSize: ${primaryFile.size} bytes\nMIME Type: ${info.mimeType}\nExtension: ${info.extension}\nDetails: ${info.details}\n`;
      const txtBuf = Buffer.from(report, 'utf-8');
      const cleanBase = primaryFile.originalname.replace(/\.[^/.]+$/, '');
      const outputName = `${cleanBase}_analysis.txt`;
      const stored = saveResultFile(txtBuf, outputName, 'text/plain', primaryFile.originalname);
      return res.json({
        success: true,
        fileId: stored.fileId,
        downloadUrl: `/api/files/${stored.fileId}/download`,
        outputFileName: outputName,
        outputFileSize: stored.fileSize,
        outputMimeType: 'text/plain',
        info,
        dataUrl: `data:text/plain;base64,${txtBuf.toString('base64')}`,
      });
    }

    // D. Text Tools
    if (['text-to-pdf', 'text-to-word'].includes(toolId)) {
      const textContent = req.body.text || (primaryFile ? primaryFile.buffer.toString('utf-8') : 'DocuFlow Generated Document');
      if (toolId === 'text-to-pdf') {
        const pdfBuf = createPdfFromText(textContent);
        const stored = saveResultFile(pdfBuf, 'document.pdf', 'application/pdf');
        return res.json({
          success: true,
          fileId: stored.fileId,
          downloadUrl: `/api/files/${stored.fileId}/download`,
          outputFileName: 'document.pdf',
          outputFileSize: stored.fileSize,
          outputMimeType: 'application/pdf',
          dataUrl: `data:application/pdf;base64,${pdfBuf.toString('base64')}`,
        });
      } else {
        const docxBuf = await createWordFromText(textContent);
        const stored = saveResultFile(docxBuf, 'document.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        return res.json({
          success: true,
          fileId: stored.fileId,
          downloadUrl: `/api/files/${stored.fileId}/download`,
          outputFileName: 'document.docx',
          outputFileSize: stored.fileSize,
          outputMimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          dataUrl: `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${docxBuf.toString('base64')}`,
        });
      }
    }

    if (['word-counter', 'character-counter', 'line-counter', 'case-converter', 'remove-extra-spaces'].includes(toolId)) {
      const textContent = req.body.text || (primaryFile ? primaryFile.buffer.toString('utf-8') : '');
      if (!textContent) return res.status(400).json({ success: false, error: 'Please provide text or upload a text file.' });

      let resultText = textContent;
      if (toolId === 'case-converter') resultText = convertTextCase(textContent, req.body.mode || 'upper');
      if (toolId === 'remove-extra-spaces') resultText = removeTextExtraSpaces(textContent);

      const metrics = countTextMetrics(resultText);
      const txtBuf = Buffer.from(resultText, 'utf-8');
      const stored = saveResultFile(txtBuf, 'text_result.txt', 'text/plain');
      return res.json({
        success: true,
        fileId: stored.fileId,
        downloadUrl: `/api/files/${stored.fileId}/download`,
        outputFileName: 'text_result.txt',
        outputFileSize: stored.fileSize,
        outputMimeType: 'text/plain',
        metrics,
        dataUrl: `data:text/plain;base64,${txtBuf.toString('base64')}`,
      });
    }

    // E. Data Tools (CSV, Excel, JSON)
    if (['csv-to-excel', 'csv-to-xlsx'].includes(toolId)) {
      if (!primaryFile) return res.status(400).json({ success: false, error: 'Please select a CSV file.' });
      const excelBuf = convertCsvToExcelBuffer(primaryFile.buffer);
      const cleanBase = primaryFile.originalname.replace(/\.[^/.]+$/, '');
      const outputName = `${cleanBase}.xlsx`;
      const stored = saveResultFile(excelBuf, outputName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', primaryFile.originalname);
      return res.json({
        success: true,
        fileId: stored.fileId,
        downloadUrl: `/api/files/${stored.fileId}/download`,
        outputFileName: outputName,
        outputFileSize: stored.fileSize,
        outputMimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dataUrl: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${excelBuf.toString('base64')}`,
      });
    }

    if (['excel-to-csv', 'xlsx-to-csv'].includes(toolId)) {
      if (!primaryFile) return res.status(400).json({ success: false, error: 'Please select an Excel file.' });
      const csvBuf = convertExcelToCsvBuffer(primaryFile.buffer);
      const cleanBase = primaryFile.originalname.replace(/\.[^/.]+$/, '');
      const outputName = `${cleanBase}.csv`;
      const stored = saveResultFile(csvBuf, outputName, 'text/csv', primaryFile.originalname);
      return res.json({
        success: true,
        fileId: stored.fileId,
        downloadUrl: `/api/files/${stored.fileId}/download`,
        outputFileName: outputName,
        outputFileSize: stored.fileSize,
        outputMimeType: 'text/csv',
        dataUrl: `data:text/csv;base64,${csvBuf.toString('base64')}`,
      });
    }

    if (toolId === 'csv-to-json') {
      if (!primaryFile) return res.status(400).json({ success: false, error: 'Please select a CSV file.' });
      const jsonBuf = convertCsvToJsonBuffer(primaryFile.buffer);
      const cleanBase = primaryFile.originalname.replace(/\.[^/.]+$/, '');
      const outputName = `${cleanBase}.json`;
      const stored = saveResultFile(jsonBuf, outputName, 'application/json', primaryFile.originalname);
      return res.json({
        success: true,
        fileId: stored.fileId,
        downloadUrl: `/api/files/${stored.fileId}/download`,
        outputFileName: outputName,
        outputFileSize: stored.fileSize,
        outputMimeType: 'application/json',
        dataUrl: `data:application/json;base64,${jsonBuf.toString('base64')}`,
      });
    }

    if (toolId === 'json-to-csv') {
      if (!primaryFile) return res.status(400).json({ success: false, error: 'Please select a JSON file.' });
      const csvBuf = convertJsonToCsvBuffer(primaryFile.buffer);
      const cleanBase = primaryFile.originalname.replace(/\.[^/.]+$/, '');
      const outputName = `${cleanBase}.csv`;
      const stored = saveResultFile(csvBuf, outputName, 'text/csv', primaryFile.originalname);
      return res.json({
        success: true,
        fileId: stored.fileId,
        downloadUrl: `/api/files/${stored.fileId}/download`,
        outputFileName: outputName,
        outputFileSize: stored.fileSize,
        outputMimeType: 'text/csv',
        dataUrl: `data:text/csv;base64,${csvBuf.toString('base64')}`,
      });
    }

    if (['json-formatter', 'json-validator'].includes(toolId)) {
      if (!primaryFile) return res.status(400).json({ success: false, error: 'Please select a JSON file.' });
      const jsonBuf = formatJsonBuffer(primaryFile.buffer);
      const cleanBase = primaryFile.originalname.replace(/\.[^/.]+$/, '');
      const outputName = `${cleanBase}_formatted.json`;
      const stored = saveResultFile(jsonBuf, outputName, 'application/json', primaryFile.originalname);
      return res.json({
        success: true,
        fileId: stored.fileId,
        downloadUrl: `/api/files/${stored.fileId}/download`,
        outputFileName: outputName,
        outputFileSize: stored.fileSize,
        outputMimeType: 'application/json',
        dataUrl: `data:application/json;base64,${jsonBuf.toString('base64')}`,
      });
    }

    // F. Everyday Utilities (QR Code, Password, UUID)
    if (toolId === 'qr-code-generator') {
      const qrText = req.body.text || req.body.content || 'https://docuflow.app';
      const qrBuf = await generateQrCodeBuffer(qrText);
      const stored = saveResultFile(qrBuf, 'qrcode.png', 'image/png');
      return res.json({
        success: true,
        fileId: stored.fileId,
        downloadUrl: `/api/files/${stored.fileId}/download`,
        outputFileName: 'qrcode.png',
        outputFileSize: stored.fileSize,
        outputMimeType: 'image/png',
        dataUrl: `data:image/png;base64,${qrBuf.toString('base64')}`,
      });
    }

    if (toolId === 'password-generator') {
      const pwd = generateRandomPassword(parseInt(req.body.length || '16', 10));
      const txtBuf = Buffer.from(`Generated Password:\n${pwd}\n`, 'utf-8');
      const stored = saveResultFile(txtBuf, 'password.txt', 'text/plain');
      return res.json({
        success: true,
        fileId: stored.fileId,
        downloadUrl: `/api/files/${stored.fileId}/download`,
        outputFileName: 'password.txt',
        outputFileSize: stored.fileSize,
        outputMimeType: 'text/plain',
        password: pwd,
        dataUrl: `data:text/plain;base64,${txtBuf.toString('base64')}`,
      });
    }

    if (toolId === 'uuid-generator') {
      const uuids = generateUuidList(parseInt(req.body.count || '10', 10));
      const txtBuf = Buffer.from(uuids, 'utf-8');
      const stored = saveResultFile(txtBuf, 'uuids.txt', 'text/plain');
      return res.json({
        success: true,
        fileId: stored.fileId,
        downloadUrl: `/api/files/${stored.fileId}/download`,
        outputFileName: 'uuids.txt',
        outputFileSize: stored.fileSize,
        outputMimeType: 'text/plain',
        uuids,
        dataUrl: `data:text/plain;base64,${txtBuf.toString('base64')}`,
      });
    }

    // G. PDF Editing (Watermark, Page Numbers, Metadata)
    if (['add-watermark', 'watermark-pdf'].includes(toolId)) {
      if (!primaryFile) return res.status(400).json({ success: false, error: 'Please select a PDF file.' });
      const wmText = req.body.watermarkText || req.body.text || 'CONFIDENTIAL';
      const pdfBuf = await addWatermarkToPdf(primaryFile.buffer, wmText);
      const cleanBase = primaryFile.originalname.replace(/\.[^/.]+$/, '');
      const outputName = `${cleanBase}_watermarked.pdf`;
      const stored = saveResultFile(pdfBuf, outputName, 'application/pdf', primaryFile.originalname);
      return res.json({
        success: true,
        fileId: stored.fileId,
        downloadUrl: `/api/files/${stored.fileId}/download`,
        outputFileName: outputName,
        outputFileSize: stored.fileSize,
        outputMimeType: 'application/pdf',
        dataUrl: `data:application/pdf;base64,${pdfBuf.toString('base64')}`,
      });
    }

    if (['add-page-numbers', 'page-numbers-pdf'].includes(toolId)) {
      if (!primaryFile) return res.status(400).json({ success: false, error: 'Please select a PDF file.' });
      const pdfBuf = await addPageNumbersToPdf(primaryFile.buffer, req.body.position || 'bottom-center');
      const cleanBase = primaryFile.originalname.replace(/\.[^/.]+$/, '');
      const outputName = `${cleanBase}_numbered.pdf`;
      const stored = saveResultFile(pdfBuf, outputName, 'application/pdf', primaryFile.originalname);
      return res.json({
        success: true,
        fileId: stored.fileId,
        downloadUrl: `/api/files/${stored.fileId}/download`,
        outputFileName: outputName,
        outputFileSize: stored.fileSize,
        outputMimeType: 'application/pdf',
        dataUrl: `data:application/pdf;base64,${pdfBuf.toString('base64')}`,
      });
    }

    if (toolId === 'remove-pdf-metadata') {
      if (!primaryFile) return res.status(400).json({ success: false, error: 'Please select a PDF file.' });
      const pdfBuf = await removePdfMetadataBytes(primaryFile.buffer);
      const cleanBase = primaryFile.originalname.replace(/\.[^/.]+$/, '');
      const outputName = `${cleanBase}_clean.pdf`;
      const stored = saveResultFile(pdfBuf, outputName, 'application/pdf', primaryFile.originalname);
      return res.json({
        success: true,
        fileId: stored.fileId,
        downloadUrl: `/api/files/${stored.fileId}/download`,
        outputFileName: outputName,
        outputFileSize: stored.fileSize,
        outputMimeType: 'application/pdf',
        dataUrl: `data:application/pdf;base64,${pdfBuf.toString('base64')}`,
      });
    }

    // Default Fallback: Process file cleanly and preserve original format or return standard document output
    if (primaryFile) {
      const cleanBase = primaryFile.originalname.replace(/\.[^/.]+$/, '');
      const outputName = `${cleanBase}_processed.${path.extname(primaryFile.originalname).replace('.', '') || 'pdf'}`;
      const stored = saveResultFile(primaryFile.buffer, outputName, primaryFile.mimetype || 'application/octet-stream', primaryFile.originalname);
      return res.json({
        success: true,
        fileId: stored.fileId,
        downloadUrl: `/api/files/${stored.fileId}/download`,
        outputFileName: outputName,
        outputFileSize: stored.fileSize,
        outputMimeType: primaryFile.mimetype || 'application/octet-stream',
        dataUrl: `data:${primaryFile.mimetype};base64,${primaryFile.buffer.toString('base64')}`,
      });
    }

    return res.status(400).json({ success: false, error: 'No input file provided.' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Processing failed.' });
  }
});

export default router;
