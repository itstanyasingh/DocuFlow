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
import { saveResultFile, getResultFile } from '../tempManager';

const router = express.Router();

// Configure multer memory storage (limit 50 MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

/**
 * 0. File Pre-flight Validation
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
 * POST /api/tools/merge-pdf
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
      // Also provide base64 data for immediate preview or direct client download
      dataUrl: `data:application/pdf;base64,${Buffer.from(result.pdfBytes).toString('base64')}`,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'We couldn’t process this PDF. Please try again.' });
  }
});

/**
 * 2. Split PDF
 * POST /api/tools/split-pdf
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
      dataUrl: `data:${result.mimeType};base64,${Buffer.from(result.outputBytes).toString('base64')}`,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'We couldn’t process this PDF. Please try again.' });
  }
});

/**
 * 3. Compress PDF
 * POST /api/tools/compress-pdf
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
      dataUrl: `data:application/pdf;base64,${Buffer.from(result.pdfBytes).toString('base64')}`,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'We couldn’t process this PDF. Please try again.' });
  }
});

/**
 * 4. PDF to JPG
 * POST /api/tools/pdf-to-jpg
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

    // If files uploaded directly
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
    res.status(400).json({ success: false, error: err.message || 'We couldn’t process this PDF. Please try again.' });
  }
});

/**
 * 5. JPG to PDF
 * POST /api/tools/jpg-to-pdf
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
    res.status(400).json({ success: false, error: err.message || 'We couldn’t process these images. Please try again.' });
  }
});

/**
 * 6. PDF to PNG
 * POST /api/tools/pdf-to-png
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
    res.status(400).json({ success: false, error: err.message || 'We couldn’t process this PDF. Please try again.' });
  }
});

/**
 * 7. PNG to PDF
 * POST /api/tools/png-to-pdf
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
    res.status(400).json({ success: false, error: err.message || 'We couldn’t process these images. Please try again.' });
  }
});

/**
 * 8. Extract PDF Pages
 * POST /api/tools/extract-pages
 */
router.post('/extract-pages', upload.single('file'), async (req: Request, res: Response) => {
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
    res.status(400).json({ success: false, error: err.message || 'We couldn’t process this PDF. Please try again.' });
  }
});

/**
 * 9. Delete PDF Pages
 * POST /api/tools/delete-pages
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
    res.status(400).json({ success: false, error: err.message || 'We couldn’t process this PDF. Please try again.' });
  }
});

/**
 * 10. Rotate PDF
 * POST /api/tools/rotate-pdf
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
    res.status(400).json({ success: false, error: err.message || 'We couldn’t process this PDF. Please try again.' });
  }
});

export default router;
