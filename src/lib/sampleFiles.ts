import { textToPdf } from './pdfEngine';
import { tableToXlsx } from './tableEngine';

export interface SampleDoc {
  id: string;
  name: string;
  category: 'invoice' | 'research' | 'contract_v1' | 'contract_v2' | 'spreadsheet' | 'scanned_receipt';
  description: string;
  fileType: string;
  mimeType: string;
  sizeFormatted: string;
  generateFile: () => Promise<File>;
  rawText?: string;
}

export const SAMPLE_DOCS: SampleDoc[] = [
  {
    id: 'sample-invoice',
    name: 'TechFlow_Invoice_INV-2026-904.pdf',
    category: 'invoice',
    description: 'Cloud Infrastructure & Enterprise SaaS Consulting Bill ($14,850.00)',
    fileType: 'PDF',
    mimeType: 'application/pdf',
    sizeFormatted: '48 KB',
    generateFile: async () => {
      const invoiceText = `TECHFLOW SYSTEMS INC.
100 Silicon Way, Suite 400
San Francisco, CA 94107
Tax ID: 94-8291048
Email: billing@techflow.io

INVOICE: #INV-2026-904
Invoice Date: August 10, 2026
Payment Due Date: August 25, 2026
Payment Terms: Net 15
Currency: USD

BILLED TO:
Global Logistics Enterprises
Attn: Tanya Singh, VP Engineering
850 Market Street, Level 12
San Francisco, CA 94102

ITEMIZED CHARGES:
-----------------------------------------------------------------------------------------
1. Enterprise Cloud Migration Architecture (40 hrs @ $175/hr)          $7,000.00
2. Distributed Vector Database Optimization & RAG Pipeline Setup        $4,500.00
3. Security Compliance Audit & Zero-Trust IAM Configuration             $2,500.00
4. 24/7 Dedicated Priority SLA Support Tier (Monthly Aug 2026)            $850.00
-----------------------------------------------------------------------------------------
Subtotal:                                                              $14,850.00
Tax (CA State Tax 8.625%):                                              $1,280.81
Total Amount Due:                                                      $16,130.81

PAYMENT INSTRUCTIONS:
Wire Transfer / ACH:
Bank: First National Commercial Bank
Account Name: TechFlow Systems Operating Account
Account Number: 8492019482
Routing / ABA: 121000358
Swift: FNCBUS6S

Thank you for your business! Please remit payment before August 25, 2026 to avoid a 1.5% late fee.`;

      const pdfBytes = await textToPdf(invoiceText);
      return new File([pdfBytes as any], 'TechFlow_Invoice_INV-2026-904.pdf', { type: 'application/pdf' });
    },
    rawText: `TechFlow Systems Invoice #INV-2026-904. Amount: $16,130.81. Due Date: August 25, 2026. Vendor: TechFlow Systems. Customer: Global Logistics Enterprises.`
  },
  {
    id: 'sample-research',
    name: 'Quantum_Transformers_Doc_AI_Paper.pdf',
    category: 'research',
    description: 'Academic Paper: "Self-Supervised Multimodal Document Understanding via Hybrid Attention"',
    fileType: 'PDF',
    mimeType: 'application/pdf',
    sizeFormatted: '82 KB',
    generateFile: async () => {
      const paperText = `ABSTRACT
Modern document understanding pipelines struggle with heterogeneous multi-column layouts, mixed handwritten notes, and dense tabular data. In this paper, we propose DocuNet-X, a hybrid transformer architecture that fuses 2D spatial coordinates with cross-attention visual tokens and tokenized text embeddings. Our benchmarks on the DocVQA and FUNSD datasets demonstrate a state-of-the-art F1 score of 94.8%, outperforming baseline layout models by 6.2%. Furthermore, we present an efficient linear attention mechanism reducing computational memory complexity from O(N^2) to O(N log N).

1. INTRODUCTION & BACKGROUND
Document processing in high-throughput enterprise environments requires parsing millions of semi-structured invoices, medical records, and legal briefs. Traditional OCR engines frequently produce OCR drift and misalign column reading orders. We introduce:
- A dual-path layout-aware positional encoder.
- An attention-guided table extraction heuristic capable of reconstructing nested hierarchies.
- Real-time token streaming with sub-50ms latency per page.

2. METHODOLOGY & ARCHITECTURAL DESIGN
We evaluate DocuNet-X against 5 standard benchmark datasets. The model was trained across 8x NVIDIA H100 GPUs using a distributed AdamW optimizer with a cosine annealing learning rate scheduler starting at 2e-4.

Key Experiments:
- Baseline ResNet-50 + BERT: 78.4% Accuracy
- LayoutLMv3: 88.6% Accuracy
- DocuNet-X (Ours): 94.8% Accuracy (p < 0.001)

3. RESULTS & PERFORMANCE BENCHMARKS
The inference latency on A4 standard 300 DPI scanned images was reduced to 34.2ms. Table extraction accuracy achieved 98.1% cell boundary precision across noisy scans.

4. CONCLUSION & FUTURE WORK
DocuNet-X demonstrates that explicit geometric coordinate conditioning combined with multimodal attention significantly elevates extraction fidelity. Future research will explore on-device quantization and multi-page cross-document reasoning.`;

      const pdfBytes = await textToPdf(paperText);
      return new File([pdfBytes as any], 'Quantum_Transformers_Doc_AI_Paper.pdf', { type: 'application/pdf' });
    }
  },
  {
    id: 'sample-contract-v1',
    name: 'Master_Services_Agreement_v1.0.pdf',
    category: 'contract_v1',
    description: 'Original Legal Agreement (Baseline version with 30-day payment term & standard liability)',
    fileType: 'PDF',
    mimeType: 'application/pdf',
    sizeFormatted: '54 KB',
    generateFile: async () => {
      const contract1 = `MASTER SERVICES AGREEMENT (v1.0 - June 2025)
BETWEEN:
AlphaTech Cloud Inc. ("Provider") AND Meridian Holdings LLC ("Client")

1. SCOPE OF SERVICES
Provider agrees to deliver enterprise cloud hosting and managed DevOps services described in Schedule A.

2. PAYMENT TERMS & PRICING
Client shall pay an annual subscription fee of $120,000 payable in monthly installments of $10,000. All invoices shall be paid within 30 days of receipt (Net 30). Late payments incur interest of 1.0% per month.

3. TERM AND TERMINATION
This Agreement is effective for 12 months commencing July 1, 2025. Either party may terminate without cause by providing 60 days written notice.

4. LIMITATION OF LIABILITY
Provider's total cumulative liability under this agreement shall be strictly capped at the total amount paid by Client during the preceding 6 months ($60,000).

5. GOVERNING LAW & JURISDICTION
This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware.`;

      const pdfBytes = await textToPdf(contract1);
      return new File([pdfBytes as any], 'Master_Services_Agreement_v1.0.pdf', { type: 'application/pdf' });
    }
  },
  {
    id: 'sample-contract-v2',
    name: 'Master_Services_Agreement_v2.0_Redline.pdf',
    category: 'contract_v2',
    description: 'Updated Legal Agreement (Revised version with $150k fee, Net 15 terms, 24-month term)',
    fileType: 'PDF',
    mimeType: 'application/pdf',
    sizeFormatted: '58 KB',
    generateFile: async () => {
      const contract2 = `MASTER SERVICES AGREEMENT (v2.0 - August 2026 - REVISED)
BETWEEN:
AlphaTech Cloud Inc. ("Provider") AND Meridian Holdings LLC ("Client")

1. SCOPE OF SERVICES
Provider agrees to deliver enterprise cloud hosting, AI document processing pipelines, and managed DevOps services described in Schedule A & Schedule B.

2. PAYMENT TERMS & PRICING
Client shall pay an updated annual subscription fee of $150,000 payable in quarterly installments of $37,500. All invoices shall be paid within 15 days of receipt (Net 15). Late payments incur interest of 2.0% per month.

3. TERM AND TERMINATION
This Agreement is effective for 24 months commencing September 1, 2026. Either party may terminate without cause only by providing 90 days written notice. Early termination by Client incurs a 25% remaining contract penalty.

4. LIMITATION OF LIABILITY & INDEMNIFICATION
Provider's total cumulative liability under this agreement shall be capped at 12 months of fees ($150,000). Provider adds mandatory intellectual property indemnification for AI models.

5. GOVERNING LAW & ARBITRATION
This Agreement shall be governed by the laws of the State of California with mandatory binding arbitration in San Francisco, CA.`;

      const pdfBytes = await textToPdf(contract2);
      return new File([pdfBytes as any], 'Master_Services_Agreement_v2.0_Redline.pdf', { type: 'application/pdf' });
    }
  },
  {
    id: 'sample-financial-csv',
    name: 'Q3_2026_Financial_Performance.csv',
    category: 'spreadsheet',
    description: 'Financial Spreadsheet with Quarterly Revenue, Operating Margins, and Dept Budgets',
    fileType: 'CSV',
    mimeType: 'text/csv',
    sizeFormatted: '12 KB',
    generateFile: async () => {
      const csv = `Quarter,Department,Revenue,CostOfGoods,OperatingExpenses,NetProfit,MarginPercent
Q1-2026,Enterprise SaaS,1450000,280000,620000,550000,37.9%
Q1-2026,Professional Services,480000,190000,180000,110000,22.9%
Q2-2026,Enterprise SaaS,1720000,310000,680000,730000,42.4%
Q2-2026,Professional Services,520000,210000,195000,115000,22.1%
Q3-2026,Enterprise SaaS,2100000,360000,740000,1000000,47.6%
Q3-2026,Professional Services,610000,230000,210000,170000,27.8%
Q3-2026,AI Intelligence Add-on,390000,45000,120000,225000,57.7%`;

      return new File([csv], 'Q3_2026_Financial_Performance.csv', { type: 'text/csv' });
    }
  }
];

export async function generateSamplePdf(): Promise<Uint8Array> {
  const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Page 1: Overview
  const p1 = doc.addPage([595.28, 841.89]); // A4
  p1.drawText('DocuFlow Sample Multi-Page Document', {
    x: 50,
    y: 780,
    size: 20,
    font: fontBold,
    color: rgb(0.06, 0.09, 0.16),
  });
  p1.drawText('Section 1: Introduction & Architecture Overview', {
    x: 50,
    y: 740,
    size: 14,
    font: fontBold,
    color: rgb(0.15, 0.39, 0.92),
  });
  p1.drawText(
    'This multi-page PDF document is generated deterministically for testing merge, split, compress, and page extraction tools.\n\nDocuFlow processes files without relying on AI services or third-party cloud data brokers. Every byte transformation is performed directly via robust local engines.',
    {
      x: 50,
      y: 700,
      size: 11,
      font,
      color: rgb(0.2, 0.25, 0.33),
      lineHeight: 18,
      maxWidth: 495,
    }
  );

  // Page 2: Data Tables
  const p2 = doc.addPage([595.28, 841.89]);
  p2.drawText('Section 2: Engineering Benchmarks & Metrics', {
    x: 50,
    y: 780,
    size: 16,
    font: fontBold,
    color: rgb(0.06, 0.09, 0.16),
  });
  p2.drawText(
    'Benchmark 1: 5-PDF Merge operation took 18ms\nBenchmark 2: 100-page Split completed in 42ms\nBenchmark 3: Compression level Strong achieved 62% byte reduction\nBenchmark 4: 300-DPI rasterization delivered 0% visual degradation',
    {
      x: 50,
      y: 730,
      size: 11,
      font,
      color: rgb(0.2, 0.25, 0.33),
      lineHeight: 22,
    }
  );

  // Page 3: Summary
  const p3 = doc.addPage([595.28, 841.89]);
  p3.drawText('Section 3: Summary & Verification Checkpoint', {
    x: 50,
    y: 780,
    size: 16,
    font: fontBold,
    color: rgb(0.06, 0.09, 0.16),
  });
  p3.drawText(
    'DocuFlow Phase 1 implementation confirms deterministic PDF operations.\n\nAll tools validate magic-bytes, enforce 50MB limits, manage temporary memory lifecycles, and output standard PDF/ZIP compliant binaries.',
    {
      x: 50,
      y: 730,
      size: 11,
      font,
      color: rgb(0.2, 0.25, 0.33),
      lineHeight: 18,
      maxWidth: 495,
    }
  );

  return doc.save();
}

export async function generateSampleInvoicePdf(): Promise<Uint8Array> {
  const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const p = doc.addPage([595.28, 841.89]);
  p.drawText('INVOICE #INV-2026-904', {
    x: 50,
    y: 780,
    size: 20,
    font: fontBold,
    color: rgb(0.06, 0.09, 0.16),
  });
  p.drawText('TECHFLOW SYSTEMS INC. — Silicon Valley, CA', {
    x: 50,
    y: 750,
    size: 11,
    font,
    color: rgb(0.4, 0.45, 0.53),
  });
  p.drawText('Billed to: Global Logistics Enterprises ($16,130.81)', {
    x: 50,
    y: 710,
    size: 12,
    font: fontBold,
    color: rgb(0.15, 0.39, 0.92),
  });

  return doc.save();
}

