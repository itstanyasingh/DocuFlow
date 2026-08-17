import React from 'react';
import { FileText, FileSpreadsheet, Image, Archive, CheckCircle } from 'lucide-react';

interface SupportedFormatsViewProps {
  onBackToHome: () => void;
}

export const SupportedFormatsView: React.FC<SupportedFormatsViewProps> = ({ onBackToHome }) => {
  const formatGroups = [
    {
      category: 'Documents',
      icon: FileText,
      description: 'Convert and edit text documents and word processing files.',
      formats: [
        { ext: 'DOC', name: 'Microsoft Word 97-2003', read: true, write: true },
        { ext: 'DOCX', name: 'Microsoft Word Document', read: true, write: true },
        { ext: 'TXT', name: 'Plain Text File', read: true, write: true },
        { ext: 'RTF', name: 'Rich Text Format', read: true, write: true },
      ]
    },
    {
      category: 'Spreadsheets',
      icon: FileSpreadsheet,
      description: 'Work with spreadsheets, financial tables, and tabular data.',
      formats: [
        { ext: 'XLS', name: 'Microsoft Excel 97-2003', read: true, write: true },
        { ext: 'XLSX', name: 'Microsoft Excel Worksheet', read: true, write: true },
        { ext: 'CSV', name: 'Comma Separated Values', read: true, write: true },
      ]
    },
    {
      category: 'Presentations',
      icon: FileText,
      description: 'View and convert presentation slides.',
      formats: [
        { ext: 'PPT', name: 'Microsoft PowerPoint 97-2003', read: true, write: false },
        { ext: 'PPTX', name: 'Microsoft PowerPoint Presentation', read: true, write: true },
      ]
    },
    {
      category: 'Images',
      icon: Image,
      description: 'Convert, compress, resize, and extract images from documents.',
      formats: [
        { ext: 'JPG / JPEG', name: 'Joint Photographic Experts Group', read: true, write: true },
        { ext: 'PNG', name: 'Portable Network Graphics', read: true, write: true },
        { ext: 'WEBP', name: 'WebP Image Format', read: true, write: true },
        { ext: 'HEIC', name: 'High Efficiency Image Container', read: true, write: false },
        { ext: 'SVG', name: 'Scalable Vector Graphics', read: true, write: true },
        { ext: 'TIFF', name: 'Tagged Image File Format', read: true, write: false },
        { ext: 'BMP', name: 'Bitmap Image File', read: true, write: true },
      ]
    },
    {
      category: 'PDF & Archives',
      icon: Archive,
      description: 'Portable Document Format and compressed container archives.',
      formats: [
        { ext: 'PDF', name: 'Adobe Portable Document Format', read: true, write: true },
        { ext: 'ZIP', name: 'Compressed Archive Container', read: true, write: true },
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-[#fcfcfb] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-200 pb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Supported File Formats
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            DocuFlow supports a wide variety of standard document, image, spreadsheet, and archive formats for instant processing.
          </p>
        </div>

        {/* Format Groups */}
        <div className="space-y-6">
          {formatGroups.map((group) => {
            const Icon = group.icon;
            return (
              <div key={group.category} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{group.category}</h2>
                    <p className="text-xs text-slate-500">{group.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  {group.formats.map((fmt) => (
                    <div key={fmt.ext} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
                      <div>
                        <span className="text-xs font-bold text-slate-900 font-mono bg-white px-2 py-0.5 rounded border border-slate-200 mr-2">
                          {fmt.ext}
                        </span>
                        <span className="text-xs text-slate-700 font-medium">{fmt.name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-green-600 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Supported</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 text-center">
          <button
            onClick={onBackToHome}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
          >
            Back to Tools
          </button>
        </div>

      </div>
    </div>
  );
};
