'use client';
import { useState } from 'react';
import FileUpload from '../components/FileUpload';
import DataPreview from '../components/DataPreview';

export default function Home() {
  const [extractedData, setExtractedData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setExtractedData(null);
    try {
      const formData = new FormData();
      formData.append('document', file);

      // Call the Node.js Express backend proxy
      const response = await fetch('http://127.0.0.1:3001/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to extract data');
      }

      const result = await response.json();
      if (result.success && result.data && result.data.mapped_data) {
        setExtractedData(result.data.mapped_data);
      } else {
         console.error("Invalid response format", result);
      }
    } catch (error) {
      console.error(error);
      alert('Error extracting data from document');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900">
            Student Record Digitizer
          </h1>
          <p className="text-lg text-neutral-500">
            Upload an Amharic/English scanned template to automatically extract student scores using AI.
          </p>
        </header>

        <section className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
          <FileUpload onUpload={handleFileUpload} isProcessing={isProcessing} />
        </section>

        {extractedData && (
          <section className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-2xl font-bold mb-6 text-neutral-800">Extracted Data Preview</h2>
            <DataPreview data={extractedData} />
          </section>
        )}
      </div>
    </main>
  );
}
