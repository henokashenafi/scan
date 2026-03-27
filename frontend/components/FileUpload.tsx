import { useCallback } from 'react';

interface FileUploadProps {
  onUpload: (file: File) => void;
  isProcessing: boolean;
}

export default function FileUpload({ onUpload, isProcessing }: FileUploadProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (isProcessing) return;
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onUpload(e.dataTransfer.files[0]);
      }
    },
    [onUpload, isProcessing]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
        isProcessing
          ? 'bg-neutral-100 border-neutral-300 opacity-70 cursor-wait'
          : 'bg-indigo-50/50 border-indigo-200 hover:bg-indigo-50 cursor-pointer'
      }`}
    >
      <input
        type="file"
        id="fileInput"
        className="hidden"
        accept="image/*,application/pdf"
        onChange={handleFileChange}
        disabled={isProcessing}
      />
      
      {isProcessing ? (
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg font-medium text-neutral-600">AI is extracting data...</p>
        </div>
      ) : (
        <label htmlFor="fileInput" className="cursor-pointer space-y-4 flex flex-col items-center">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-neutral-800">Click or drag a scanned file here</h3>
          <p className="text-neutral-500">Supports PNG, JPG, JPEG (PDF requires conversion first)</p>
        </label>
      )}
    </div>
  );
}
