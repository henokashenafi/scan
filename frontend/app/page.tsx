'use client';
import { useState } from 'react';
import FileUpload from '../components/FileUpload';
import DataPreview from '../components/DataPreview';
import Link from 'next/link';

export default function Home() {
  const [extractedData, setExtractedData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (files: File[]) => {
    setIsProcessing(true);
    setUploadProgress(0);
    setError(null);

    // For large uploads, we process one by one or send to the batch endpoint
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));

        const formData = new FormData();
        formData.append('document', file);

        const response = await fetch('http://localhost:3001/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) continue;

        const result = await response.json();
        if (result.success && result.data && result.data.mapped_data) {
          setExtractedData(result.data.mapped_data); // Show the last one processed
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred during processing.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12">
        <header className="text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-block px-4 py-1.5 mb-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold uppercase tracking-wider">
            Powered by Groq Vision LLM
          </div>
          <h1 className="text-5xl font-black tracking-tight text-slate-900 sm:text-6xl">
            Student Record <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Digitizer</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">
            Transform scanned Amharic and English student records into structured digital data in seconds.
          </p>
          <div className="pt-4 animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-500">
            <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-indigo-600 font-bold rounded-2xl hover:bg-slate-50 transition-all shadow-sm group">
              View Analytics Dashboard
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </header>

        <section className="animate-in fade-in zoom-in-95 delay-300 duration-700">
          <FileUpload onUpload={handleFileUpload} isProcessing={isProcessing} />

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 animate-in fade-in slide-in-from-top-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-medium">{error}</p>
            </div>
          )}
        </section>

        {extractedData && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800">Extracted Results</h2>
              <div className="text-sm font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                {extractedData.students?.length || 0} Records Found
              </div>
            </div>
            <DataPreview data={extractedData} onUpdate={setExtractedData} />
          </section>
        )}
      </div>
    </main>
  );
}
