import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function runTests() {
  console.log('--- Creating Test PDFs ---');
  // Create PDF 1 with 2 pages
  const pdf1 = await PDFDocument.create();
  pdf1.addPage([400, 600]);
  pdf1.addPage([400, 600]);
  const pdf1Bytes = await pdf1.save();
  fs.writeFileSync('test1.pdf', pdf1Bytes);

  // Create PDF 2 with 3 pages
  const pdf2 = await PDFDocument.create();
  pdf2.addPage([400, 600]);
  pdf2.addPage([400, 600]);
  pdf2.addPage([400, 600]);
  const pdf2Bytes = await pdf2.save();
  fs.writeFileSync('test2.pdf', pdf2Bytes);

  console.log('--- Testing Merge PDF API ---');
  const formData = new FormData();
  formData.append('files', new Blob([pdf1Bytes], { type: 'application/pdf' }), 'test1.pdf');
  formData.append('files', new Blob([pdf2Bytes], { type: 'application/pdf' }), 'test2.pdf');

  const mergeRes = await fetch('http://localhost:3000/api/tools/merge-pdf', {
    method: 'POST',
    body: formData,
  });

  const mergeJson = await mergeRes.json();
  console.log('Merge Result:', mergeJson);

  if (!mergeJson.success) {
    throw new Error('Merge PDF failed: ' + mergeJson.error);
  }

  // Verify Download URL
  const downloadRes = await fetch(`http://localhost:3000${mergeJson.downloadUrl}`);
  const downloadedBuf = Buffer.from(await downloadRes.arrayBuffer());

  const mergedDoc = await PDFDocument.load(downloadedBuf);
  console.log(`Merged PDF Downloaded Page Count: ${mergedDoc.getPageCount()} (Expected: 5)`);

  if (mergedDoc.getPageCount() !== 5) {
    throw new Error(`Expected 5 pages, got ${mergedDoc.getPageCount()}`);
  }

  console.log('--- Testing Split PDF API ---');
  const splitFormData = new FormData();
  splitFormData.append('file', new Blob([downloadedBuf], { type: 'application/pdf' }), 'merged.pdf');
  splitFormData.append('range', '1-2, 3-5');

  const splitRes = await fetch('http://localhost:3000/api/tools/split-pdf', {
    method: 'POST',
    body: splitFormData,
  });

  const splitJson = await splitRes.json();
  console.log('Split Result:', splitJson);

  if (!splitJson.success) {
    throw new Error('Split PDF failed: ' + splitJson.error);
  }

  // Clean up
  fs.unlinkSync('test1.pdf');
  fs.unlinkSync('test2.pdf');

  console.log('--- ALL BACKEND TESTS PASSED SUCCESSFULLY! ---');
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
