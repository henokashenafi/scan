'use client';
import { useState } from 'react';
import FileUpload from '../components/FileUpload';
import DataPreview from '../components/DataPreview';

export default function Home() {
  const [extractedData, setExtractedData] = useState<any>(null);
  const [rawLines, setRawLines] = useState<string[]>([]);
  const [currentFilename, setCurrentFilename] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setCurrentFilename(file.name);
    setPreviewUrl(URL.createObjectURL(file));
    setIsProcessing(true);
    setExtractedData(null);
    setRawLines([]);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('document', file);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/upload?t=${Date.now()}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to extract data');
      }

      const result = await response.json();
      if (result.success && result.data) {
        const mapped = result.data.mapped_data;
        const lines = result.data.raw_lines || [];
        setRawLines(lines);
        if (mapped && mapped.students && mapped.students.length > 0) {
          setExtractedData(mapped);
        } else {
          setExtractedData(null);
        }
      } else {
        setError('Could not recognize the document structure.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsProcessing(false);
    }
  };

  const hasTable = extractedData && extractedData.students?.length > 0;
  const hasRawText = rawLines.length > 0;
  const hasResults = hasTable || hasRawText;

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">

        <header className="text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-block px-4 py-1.5 mb-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold uppercase tracking-wider">
            Local AI — Surya OCR
          </div>
          <h1 className="text-5xl font-black tracking-tight text-slate-900 sm:text-6xl">
            Student Record <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Digitizer</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">
            Transform scanned Amharic and English student records into structured digital data.
          </p>
        </header>

        {/* Upload — only shown before any result */}
        {!hasResults && !isProcessing && (
          <section className="animate-in fade-in zoom-in-95 delay-300 duration-700">
            <FileUpload onUpload={handleFileUpload} isProcessing={isProcessing} />
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium">{error}</p>
              </div>
            )}
          </section>
        )}

        {/* Processing state — image with overlay spinner */}
        {isProcessing && previewUrl && (
          <section className="animate-in fade-in duration-500">
            <div className="relative w-full max-w-lg mx-auto rounded-2xl overflow-hidden border border-indigo-100 shadow-xl">
              <img src={previewUrl} alt="Uploaded document" className="w-full object-contain max-h-[400px]" />
              <div className="absolute inset-0 bg-indigo-900/10 flex items-center justify-center">
                <div className="bg-white/90 rounded-xl px-6 py-3 flex items-center gap-3 shadow-lg">
                  <div className="w-5 h-5 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                  <span className="text-sm font-semibold text-indigo-700">Analyzing with Surya OCR...</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Side by side results */}
        {hasResults && !isProcessing && (
          <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Header bar */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-800">Extracted Results</h2>
                {hasTable && (
                  <div className="text-sm font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                    {extractedData.students.length} Records Found
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setExtractedData(null);
                  setRawLines([]);
                  setPreviewUrl(null);
                  setError(null);
                }}
                className="text-sm text-slate-400 hover:text-slate-700 transition-colors"
              >
                ← Upload another
              </button>
            </div>

            {/* Side by side layout */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">

              {/* Left — original image, sticky */}
              {previewUrl && (
                <div className="w-full lg:w-[38%] lg:sticky lg:top-6">
                  <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-lg bg-slate-50">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Uploaded Document</span>
                      <span className="text-xs text-slate-400 truncate max-w-[160px]">{currentFilename}</span>
                    </div>
                    <img
                      src={previewUrl}
                      alt="Original scanned document"
                      className="w-full object-contain max-h-[600px]"
                    />
                  </div>
                </div>
              )}

              {/* Right — extracted data */}
              <div className="w-full lg:flex-1 min-w-0 space-y-4">
                {!hasTable && hasRawText && (
                  <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-medium text-sm">No student records found,this document may not be a student record. Extracted text is shown below.</p>
                  </div>
                )}
                {hasTable && (
                  <DataPreview
                    data={extractedData}
                    onUpdate={setExtractedData}
                    filename={currentFilename}
                  />
                )}
                {!hasTable && hasRawText && (
                  <RawTextView lines={rawLines} />
                )}
              </div>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium">{error}</p>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function RawTextView({ lines }: { lines: string[] }) {
  const copyAll = () => navigator.clipboard.writeText(lines.join('\n'));
  return (
    <div className="rounded-2xl border border-indigo-100/50 shadow-xl overflow-hidden">
      <div className="flex justify-between items-center px-6 py-4 bg-slate-50 border-b border-slate-100">
        <span className="text-sm font-semibold text-slate-600">No table detected — raw extracted text</span>
        <button onClick={copyAll} className="text-xs px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          Copy All
        </button>
      </div>
      <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
        {lines.map((line, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-6 py-3 hover:bg-indigo-50/30 group cursor-pointer"
            onClick={() => navigator.clipboard.writeText(line)}
          >
            <span className="text-sm text-slate-800 font-medium">{line}</span>
            <span className="text-xs text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">click to copy</span>
          </div>
        ))}
      </div>
    </div>
  );
}
