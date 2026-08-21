# DocuFlow

A simple and practical web-based file utility platform that provides useful tools for everyday file, image, PDF, text, data, and utility tasks.

## Live Demo

Access the live application at: [https://docuflow-liart.vercel.app/](https://docuflow-liart.vercel.app/)

## Features

- **62 Practical Browser Utilities**: A comprehensive catalog of tools spanning image editing, text formatting, JSON/CSV manipulation, file archives, PDF utilities, and everyday calculators.
- **Client-Side Processing**: File operations run directly in your browser using standard Web APIs and client-side JavaScript libraries.
- **Fast Drag-and-Drop Interface**: Universal file dropzone support with instant format detection and preview options.
- **No Signup Required**: Access core utility features instantly without mandatory accounts or server queues.
- **Responsive Design**: Designed for both desktop and mobile web browsers with quick search navigation.

## Tool Categories

DocuFlow organizes 62 active tools into six major categories:

### 1. Image Tools (14)
- **Image Compressor**: Reduce image file size with quality and dimension controls.
- **Image Resizer**: Scale dimensions via custom pixels or percentage presets (25%, 50%, 75%).
- **Image Converter**: Convert images between JPG, PNG, and WEBP formats.
- **Image Crop**: Interactive crop box with 1:1, 4:3, 16:9, and 9:16 ratio locks.
- **Image Rotator**: Rotate images 90°, 180°, or 270° with horizontal/vertical flips.
- **Image Flip**: Mirror photos horizontally or vertically.
- **Image Grayscale**: Convert colored photos into black-and-white graphics.
- **Image Brightness**: Adjust light exposure levels.
- **Image Contrast**: Fine-tune contrast between light and dark tones.
- **Image Blur**: Apply configurable Gaussian blur radius (0–20px).
- **Image Watermark**: Stamp customizable text overlays with opacity and position controls.
- **Image Filters**: Stack visual adjustments including Sepia, Invert, Blur, and Brightness.
- **Image Metadata Viewer**: Inspect exact pixel dimensions, aspect ratio, and file sizes.
- **Image Information**: Simple file header inspector for photos.

### 2. Text Tools (11)
- **Word Counter**: Real-time count of words, characters, sentences, paragraphs, and reading time.
- **Case Converter**: Convert text to UPPERCASE, lowercase, Title Case, Sentence case, or aLtErNaTiNg CaSe.
- **Remove Extra Spaces**: Strip consecutive whitespace, trailing spaces, and blank lines.
- **Remove Duplicate Lines**: Deduplicate lists while preserving sequence or case.
- **Sort Text**: Sort lines alphabetically (A–Z / Z–A) or numerically.
- **Find and Replace**: Search and replace text occurrences with match count statistics.
- **Text Cleaner**: Multi-option text sanitizer with configurable cleaning rules.
- **Text Reverse**: Flip text strings by character, word, or line order.
- **Text to TXT**: Generate and download plain `.txt` files directly.
- **TXT Viewer**: View, inspect word metrics, and copy `.txt` or `.log` file contents.
- **Text Diff**: Side-by-side comparison tool to highlight line additions and deletions.

### 3. Data Tools (8)
- **JSON Formatter**: Prettify and indent raw JSON with 2-space or 4-space formatting.
- **JSON Validator**: Validate JSON syntax with line and column error position pinpointing.
- **JSON Minifier**: Remove whitespace and line breaks to compress JSON output.
- **JSON Viewer**: Interactive expandable tree view with key/value search filters.
- **CSV Viewer**: Tabular view of CSV datasets with column sorting and search.
- **CSV to JSON**: Convert CSV rows into structured JSON array objects.
- **JSON to CSV**: Flatten JSON object arrays into downloadable CSV files.
- **CSV Cleaner**: Remove blank rows, trim spaces, and sanitize CSV data.

### 4. File Utilities (5)
- **File Size Calculator**: Inspect individual and total byte sizes across batch uploads.
- **File Type Checker**: Inspect file headers and magic byte signatures to detect actual MIME formats.
- **File Renamer**: Batch rename uploaded files using custom pattern sequences and export as ZIP.
- **ZIP Creator**: Compress multiple uploaded files into a downloadable `.zip` archive.
- **Multiple File Downloader**: Package selected files into a single ZIP download bundle.

### 5. Everyday Utilities (15)
- **QR Code Generator**: Create QR codes for text, URLs, email, phone numbers, or Wi-Fi configurations.
- **QR Code Reader**: Scan uploaded QR code images to decode embedded text strings.
- **Color Picker**: Interactive palette selector outputting HEX, RGB, and HSL values.
- **Color Converter**: Convert color values between HEX, RGB, and HSL representations.
- **Gradient Generator**: Build linear CSS gradients with angle controls and preview.
- **Random Color Generator**: Generate random color codes with one-click copying.
- **Basic Calculator**: Perform arithmetic operations with history logging.
- **Percentage Calculator**: Solve percentage problems, changes, and ratios.
- **Unit Converter**: Convert metrics across 8 physical dimensions (Length, Weight, Temp, etc.).
- **Date Calculator**: Calculate days between dates or add/subtract day durations.
- **Age Calculator**: Compute age down to exact years, months, and days with birthday countdown.
- **Time Converter**: Convert time strings between 12-hour AM/PM and 24-hour military format.
- **Password Generator**: Generate cryptographically strong passwords using browser crypto APIs.
- **UUID Generator**: Create unique v4 UUIDs using `crypto.randomUUID()`.
- **Random Number Generator**: Produce bounded random numbers or dice rolls.

### 6. PDF Tools (9)
- **Merge PDF**: Combine multiple PDF files in custom order using `pdf-lib`.
- **Split PDF**: Extract page ranges or split all pages into a downloadable ZIP archive.
- **Extract PDF Pages**: Select specific pages to form a new trimmed PDF document.
- **Rotate PDF**: Rotate PDF pages by 90°, 180°, or 270°.
- **Delete PDF Pages**: Remove specific page numbers from a PDF document.
- **JPG to PDF**: Convert JPEG images into standard PDF documents.
- **PNG to PDF**: Convert PNG images into PDF files.
- **Add PDF Page Numbers**: Stamp page numbers onto existing PDF pages.
- **PDF Page Count**: Quick inspector for total page counts in PDF documents.

## Tech Stack

### Frontend & UI
- **React 19**: Modern UI component library
- **TypeScript**: Static typing for safer code execution
- **Vite**: Fast frontend build tool
- **Tailwind CSS v4**: Utility-first styling framework
- **Motion (Framer Motion)**: Smooth UI transitions
- **Lucide React**: Clean vector icon suite

### Client-Side Processing Libraries
- **pdf-lib**: Client-side PDF creation and modification
- **pdfjs-dist**: PDF rendering and text parsing
- **JSZip**: In-browser ZIP archive creation and extraction
- **PapaParse**: Fast CSV parsing and unparsing
- **qrcode & jsQR**: QR code generation and image decoding
- **docx & Mammoth**: Microsoft Word document handling
- **XLSX (SheetJS)**: Spreadsheet data processing
- **Crypto-JS**: Hash calculations and cryptography utilities
- **Canvas Confetti**: Visual celebration effects

### Server Environment
- **Node.js**: JavaScript runtime environment
- **Express**: HTTP server framework
- **tsx & esbuild**: Server bundling and execution
- **Vercel**: Production serverless hosting and static deployment

## Project Structure

```
DocuFlow/
├── api/                # Serverless API routes for Vercel
├── server/             # Express server middleware and setup
├── src/
│   ├── components/     # React view components, modals, and navigation
│   │   └── shared/     # Shared UI controls and status indicators
│   ├── data/           # Tool definitions and category configuration (tools.ts)
│   ├── lib/            # Specialized client processing engines
│   │   ├── pdfEngine.ts          # PDF manipulation logic
│   │   ├── imageEngine.ts        # Canvas-based image operations
│   │   ├── textEngine.ts         # Text formatting and diff helpers
│   │   ├── dataEngine.ts         # JSON and CSV transformation logic
│   │   ├── everydayEngine.ts     # Calculators, QR, color, and crypto tools
│   │   └── fileUtilitiesEngine.ts# ZIP creation and file checks
│   ├── App.tsx         # Primary application layout container
│   ├── main.tsx        # React entry point
│   ├── index.css       # Global styles and Tailwind configuration
│   └── types.ts        # TypeScript interface definitions
├── server.ts           # Development and production server entry point
├── package.json        # Dependencies and build scripts
├── vite.config.ts      # Vite build configuration
├── vercel.json         # Vercel deployment routing configuration
└── README.md           # Project documentation
```

## Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: Version 18.0 or higher
- **npm**: Version 9.0 or higher

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/tanyasingh29600/DocuFlow.git
   cd DocuFlow
   ```

2. Install project dependencies:
   ```bash
   npm install
   ```

### Running Locally

Start the local development server:
```bash
npm run dev
```

Open your browser and navigate to `http://localhost:3000` to view the application.

### Production Build

To test or build the application for production:

1. Compile the static frontend assets and bundle the server entry point:
   ```bash
   npm run build
   ```

2. Start the production server locally:
   ```bash
   npm start
   ```

## Deployment

DocuFlow is optimized for deployment on **Vercel**.

The live production build is hosted at:
[https://docuflow-liart.vercel.app/](https://docuflow-liart.vercel.app/)

### Deploying to Vercel

1. Push your code to GitHub.
2. Import the repository into your Vercel Dashboard.
3. Vercel automatically detects Vite and Node settings using the included `vercel.json`.
4. Click **Deploy**.

## Privacy

DocuFlow prioritizes client-side file processing. Utility operations (such as image compression, text formatting, CSV/JSON manipulation, PDF operations, QR code generation/decoding, and password creation) occur directly in your browser memory using HTML5 Canvas, the Web Crypto API, `pdf-lib`, `JSZip`, and client-side processing engines. Files are processed locally without persistent server uploads.

## Current Status

DocuFlow is actively maintained. Development focuses on delivering fast, browser-native utility tools that perform reliably across desktop and mobile browsers.

## Future Improvements

- Additional PDF editing capabilities (page reordering, annotation overlay).
- Enhanced batch file processing performance.
- Optional dark mode visual theme toggle.
- Offline Progressive Web App (PWA) support.

## Contributing

Contributions are welcome. If you find a bug or have a suggestion for a new utility:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/NewTool`).
3. Commit your changes (`git commit -m 'Add NewTool'`).
4. Push to the branch (`git push origin feature/NewTool`).
5. Open a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Author

**Tanya Singh**
