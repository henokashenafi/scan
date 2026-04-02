'use client';
import { useState } from 'react';

interface PdfPreviewerProps {
    data: any;
}

export default function PdfPreviewer({ data }: PdfPreviewerProps) {
    const [pageSize, setPageSize] = useState<'A3' | 'A4' | 'A5'>('A4');

    const getPageDimensions = () => {
        switch (pageSize) {
            case 'A3': return 'w-[297mm] h-[420mm]';
            case 'A4': return 'w-[210mm] h-[297mm]';
            case 'A5': return 'w-[148mm] h-[210mm]';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800">PDF Configuration</h3>
                <div className="flex gap-2">
                    {['A3', 'A4', 'A5'].map((size) => (
                        <button
                            key={size}
                            onClick={() => setPageSize(size as any)}
                            className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all ${pageSize === size
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                        >
                            {size}
                        </button>
                    ))}
                </div>
            </div>

            <div className="overflow-auto bg-slate-800/10 p-8 rounded-3xl flex justify-center border-4 border-dashed border-slate-200/50">
                <div className={`${getPageDimensions()} bg-white shadow-2xl p-12 transition-all duration-500 origin-top overflow-hidden flex flex-col`}>
                    <header className="border-b-2 border-slate-900 pb-8 mb-8 flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Student Progress Report</h1>
                            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mt-1">Academic Year 2026</p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-black text-slate-900">HARD TO SOFT</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Verification ID: #87621-X</div>
                        </div>
                    </header>

                    <div className="flex-grow">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="py-4 text-xs font-black uppercase text-slate-400">Student Name</th>
                                    {data.columns?.map((col: string) => (
                                        <th key={col} className="py-4 text-xs font-black uppercase text-slate-400 text-center">{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.students?.map((student: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-slate-50/50">
                                        <td className="py-4 font-bold text-slate-900">{student.first_name} {student.last_name}</td>
                                        {data.columns?.map((col: string) => (
                                            <td key={col} className="py-4 text-center font-medium text-slate-700">{student[col] || '—'}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <footer className="mt-8 pt-8 border-t border-slate-100 flex justify-between items-end">
                        <div className="space-y-4">
                            <div className="w-32 h-px bg-slate-300"></div>
                            <div className="text-[10px] font-black uppercase text-slate-400">Class Teacher Signature</div>
                        </div>
                        <div className="text-[10px] font-bold text-slate-300">Generated via Hard to Soft AI Engine • {new Date().toLocaleDateString()}</div>
                    </footer>
                </div>
            </div>

            <div className="flex justify-end gap-3">
                <button className="px-8 py-3 bg-slate-900 hover:bg-black text-white font-black rounded-2xl transition-all shadow-xl flex items-center gap-2 active:scale-95">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print to PDF
                </button>
            </div>
        </div>
    );
}
