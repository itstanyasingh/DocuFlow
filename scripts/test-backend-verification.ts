import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import JSZip from 'jszip';

async function runVerification() {
  console.log('=== Step 15: Testing GET /api/health ===');
  const healthRes = await fetch('http://localhost:3000/api/health');
  if (!healthRes.ok) {
    throw new Error(`Health check failed with status ${healthRes.status}`);
  }
  const healthJson = await healthRes.json();
  console.log('Health Output:', JSON.stringify(healthJson));
  if (healthJson.status !== 'ok' || healthJson.service !== 'DocuFlow API') {
    throw new Error('Health check payload mismatch');
  }

  console.log('\n=== Step 8: Testing GET /api/tools/status ===');
  const statusRes = await fetch('http://localhost:3000/api/tools/status');
  if (!statusRes.ok) {
    throw new Error(`Tools status failed with status ${statusRes.status}`);
  }
  const statusJson = await statusRes.json();
  console.log('Tools Status Output:', JSON.stringify(statusJson, null, 2));
  if (statusJson.mergePdf !== true || statusJson.splitPdf !== true) {
    throw new Error('Tools status check failed');
  }

  console.log('\n=== Step 16: Merge Test (PDF A = 2 pages, PDF B = 3 pages) ===');
  const pdfA = await PDFDocument.create();
  pdfA.addPage([400, 600]);
  pdfA.addPage([400, 600]);
  const pdfABytes = await pdfA.save();

  const pdfB = await PDFDocument.create();
  pdfB.addPage([400, 600]);
  pdfB.addPage([400, 600]);
  pdfB.addPage([400, 600]);
  const pdfBBytes = await pdfB.save();

  const mergeFormData = new FormData();
  mergeFormData.append('files', new Blob([pdfABytes], { type: 'application/pdf' }), 'pdfA.pdf');
  mergeFormData.append('files', new Blob([pdfBBytes], { type: 'application/pdf' }), 'pdfB.pdf');

  const mergeRes = await fetch('http://localhost:3000/api/tools/merge-pdf', {
    method: 'POST',
    body: mergeFormData,
  });

  if (!mergeRes.ok) {
    const errText = await mergeRes.text();
    throw new Error(`Merge request failed (${mergeRes.status}): ${errText}`);
  }

  const mergeJson = await mergeRes.json();
  console.log('Merge Result:', JSON.stringify(mergeJson, null, 2));

  if (!mergeJson.success || !mergeJson.fileId || !mergeJson.downloadUrl) {
    throw new Error('Merge JSON output missing expected fields');
  }

  // Ensure no base64 dataUrl is returned (Step 12)
  if (mergeJson.dataUrl) {
    throw new Error('merge-pdf returned base64 dataUrl which is forbidden in Step 12!');
  }

  // Test Download Endpoint (Step 11)
  const mergeDownloadUrl = `http://localhost:3000${mergeJson.downloadUrl}`;
  console.log(`Downloading merged PDF from: ${mergeDownloadUrl}`);
  const mergeDlRes = await fetch(mergeDownloadUrl);
  if (!mergeDlRes.ok) {
    throw new Error(`Failed to download merged file: ${mergeDlRes.status}`);
  }

  const mergedBuf = Buffer.from(await mergeDlRes.arrayBuffer());
  const mergedDoc = await PDFDocument.load(mergedBuf);
  const mergedPagesCount = mergedDoc.getPageCount();
  console.log(`Verified Merged PDF Page Count: ${mergedPagesCount} (Expected: 5)`);
  if (mergedPagesCount !== 5) {
    throw new Error(`Expected 5 pages in merged PDF, got ${mergedPagesCount}`);
  }

  console.log('\n=== Step 17: Split Test (5-page PDF with range = "all") ===');
  const splitFormData = new FormData();
  splitFormData.append('file', new Blob([mergedBuf], { type: 'application/pdf' }), '5pages.pdf');
  splitFormData.append('range', 'all');

  const splitRes = await fetch('http://localhost:3000/api/tools/split-pdf', {
    method: 'POST',
    body: splitFormData,
  });

  if (!splitRes.ok) {
    const errText = await splitRes.text();
    throw new Error(`Split request failed (${splitRes.status}): ${errText}`);
  }

  const splitJson = await splitRes.json();
  console.log('Split Result:', JSON.stringify(splitJson, null, 2));

  if (!splitJson.success || !splitJson.fileId || !splitJson.downloadUrl) {
    throw new Error('Split JSON output missing expected fields');
  }

  if (splitJson.dataUrl) {
    throw new Error('split-pdf returned base64 dataUrl which is forbidden in Step 12!');
  }

  const splitDownloadUrl = `http://localhost:3000${splitJson.downloadUrl}`;
  console.log(`Downloading split ZIP from: ${splitDownloadUrl}`);
  const splitDlRes = await fetch(splitDownloadUrl);
  if (!splitDlRes.ok) {
    throw new Error(`Failed to download split zip: ${splitDlRes.status}`);
  }

  const zipBuf = Buffer.from(await splitDlRes.arrayBuffer());
  const zip = await JSZip.loadAsync(zipBuf);
  const zipFileNames = Object.keys(zip.files);
  console.log('ZIP Files contained:', zipFileNames);

  if (zipFileNames.length !== 5) {
    throw new Error(`Expected 5 page files in ZIP, got ${zipFileNames.length}`);
  }

  for (let i = 0; i < zipFileNames.length; i++) {
    const fileName = zipFileNames[i];
    const singlePdfBuf = await zip.files[fileName].async('nodebuffer');
    const singleDoc = await PDFDocument.load(singlePdfBuf);
    const count = singleDoc.getPageCount();
    console.log(`  - File "${fileName}" page count: ${count} (Expected: 1)`);
    if (count !== 1) {
      throw new Error(`File ${fileName} contains ${count} pages instead of 1`);
    }
  }

  console.log('\n==================================================');
  console.log('SUCCESS: All Step 15, Step 16, and Step 17 tests PASSED!');
  console.log('==================================================');
}

runVerification().catch((err) => {
  console.error('\n❌ VERIFICATION TEST FAILED:', err);
  process.exit(1);
});
