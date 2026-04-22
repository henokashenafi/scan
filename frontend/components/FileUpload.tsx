import { useCallback } from 'react';

interface FileUploadProps {
  onUpload: (files: File[]) => void;
  isProcessing: boolean;
  progress?: number;
}

export default function FileUpload({ onUpload, isProcessing }: FileUploadProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (isProcessing) return;
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onUpload(Array.from(e.dataTransfer.files));
      }
    },
    [onUpload, isProcessing]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(Array.from(e.target.files));
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={`relative group border-2 border-dashed rounded-2xl p-16 text-center transition-all duration-300 ${isProcessing
          ? 'bg-slate-100/50 border-slate-300 opacity-80 cursor-wait'
          : 'glass border-indigo-200 hover:border-indigo-400 cursor-pointer'
        }`}
    >
      <input
        type="file"
        id="fileInput"
        className="hidden"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        disabled={isProcessing}
      />

      {isProcessing ? (
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-indigo-600/10 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              AI Processing...
            </p>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">
              Our vision models are analyzing your document. This usually takes 5-10 seconds.
            </p>
          </div>
        </div>
      ) : (
        <label htmlFor="fileInput" className="cursor-pointer space-y-6 flex flex-col items-center">
          <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-2 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-inner">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-slate-800">Drop your file here</h3>
            <p className="text-slate-500">
              or <span className="text-indigo-600 font-semibold underline underline-offset-4 decoration-2">browse files</span> from your computer
            </p>
          </div>
          <div className="flex gap-4 text-xs font-medium text-slate-400 pt-4">
            <span className="px-3 py-1 bg-slate-100 rounded-full">PNG</span>
            <span className="px-3 py-1 bg-slate-100 rounded-full">JPG</span>
            <span className="px-3 py-1 bg-slate-100 rounded-full">JPEG</span>
          </div>
        </label>
      )}
    </div>
  );
}
