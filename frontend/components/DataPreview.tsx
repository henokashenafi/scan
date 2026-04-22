'use client';
import { useState, useMemo } from 'react';

interface StudentRecord {
  first_name: string;
  last_name: string;
  [subject: string]: string | number | null;
}

interface DataPreviewProps {
  data: { columns?: string[]; students: StudentRecord[] };
  onUpdate: (updated: DataPreviewProps['data']) => void;
  filename?: string;
}

function getSubjectColumns(data: DataPreviewProps['data']): string[] {
  if (data.columns && data.columns.length > 0) return data.columns;
  const reserved = new Set(['first_name', 'last_name']);
  const cols = new Set<string>();
  for (const s of data.students)
    for (const k of Object.keys(s))
      if (!reserved.has(k)) cols.add(k);
  return Array.from(cols);
}

function formatLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function DataPreview({ data, onUpdate, filename }: DataPreviewProps) {
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  if (!data?.students?.length) {
    return (
      <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200">
        No student data was recognized. Please check the image quality.
      </div>
    );
  }

  const subjects = getSubjectColumns(data);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const filtered = useMemo(() => {
    if (!search.trim()) return data.students;
    const q = search.toLowerCase();
    return data.students.filter((s) =>
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
      subjects.some((col) => String(s[col] ?? '').toLowerCase().includes(q))
    );
  }, [search, data.students, subjects]);

  const copyCell = (val: string | number | null) => {
    const text = val == null ? '' : String(val);
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleCellChange = (idx: number, field: string, value: string) => {
    const updated = [...data.students];
    const isScore = !['first_name', 'last_name'].includes(field);
    let final: string | number | null = value;
    if (isScore) {
      if (!value.trim() || value === '—') {
        final = null;
      } else {
        const n = parseFloat(value);
        final = isNaN(n) ? value : n;
      }
    }
    updated[idx] = { ...updated[idx], [field]: final };
    onUpdate({ ...data, students: updated });
  };

  const exportCSV = async () => {
    const res = await fetch(`${API_URL}/api/export/csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students: data.students, columns: subjects }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'student_records.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = async () => {
    const res = await fetch(`${API_URL}/api/export/json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students: data.students, columns: subjects }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'student_records.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const saveToDatabase = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`${API_URL}/api/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: filename || 'unknown', students: data.students, columns: subjects }),
      });
      const result = await res.json();
      if (res.ok) {
        setSaveMsg(`Saved ${result.saved} records successfully.`);
      } else {
        setSaveMsg(`Save failed: ${result.error}`);
      }
    } catch {
      setSaveMsg('Save failed: could not reach server.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <input
          type="text"
          placeholder="Search by name or score..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-72 px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-400 bg-white"
        />
        <div className="flex gap-2 flex-wrap">
          <button onClick={exportCSV} className="px-4 py-2 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors">Export CSV</button>
          <button onClick={exportJSON} className="px-4 py-2 text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors">Export JSON</button>
          <button onClick={saveToDatabase} disabled={saving} className="px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Confirm & Save'}
          </button>
        </div>
      </div>

      {(copied || saveMsg) && (
        <div className="text-xs text-center font-medium text-indigo-600">
          {saveMsg || `Copied: "${copied}"`}
        </div>
      )}

      <div className="glass rounded-2xl overflow-hidden border border-indigo-100/50 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-xs font-bold text-slate-900 uppercase tracking-wider">Student Name</th>
                {subjects.map((col) => (
                  <th key={col} className="px-6 py-5 text-xs font-bold text-slate-900 uppercase tracking-wider text-center">
                    {formatLabel(col)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((student, idx) => {
                const origIdx = data.students.indexOf(student);
                return (
                  <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-6 py-4 min-w-[260px]">
                      <div className="flex gap-1.5 w-full">
                        <input type="text" value={student.first_name || ''} onChange={(e) => handleCellChange(origIdx, 'first_name', e.target.value)} onDoubleClick={() => copyCell(`${student.first_name} ${student.last_name}`)} title="Double-click to copy" className="bg-transparent border-b border-transparent hover:border-indigo-200 focus:border-indigo-500 focus:outline-none font-bold text-slate-900 w-1/2 p-0.5" placeholder="First Name" />
                        <input type="text" value={student.last_name || ''} onChange={(e) => handleCellChange(origIdx, 'last_name', e.target.value)} onDoubleClick={() => copyCell(`${student.first_name} ${student.last_name}`)} title="Double-click to copy" className="bg-transparent border-b border-transparent hover:border-indigo-200 focus:border-indigo-500 focus:outline-none font-bold text-slate-900 w-1/2 p-0.5" placeholder="Last Name" />
                      </div>
                    </td>
                    {subjects.map((col) => (
                      <td key={col} className="px-6 py-4 text-center min-w-[90px] cursor-pointer" onClick={() => copyCell(student[col])} title="Click to copy">
                        <ScoreCell value={student[col] as number | null | undefined} onChange={(val) => handleCellChange(origIdx, col, val)} />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 flex justify-between items-center text-sm text-slate-500">
          <span>{filtered.length} of {data.students.length} records &bull; click score to copy &bull; double-click name to copy</span>
          <button onClick={() => onUpdate({ ...data, students: [] })} className="px-4 py-2 text-slate-500 hover:text-red-600 font-medium transition-colors">Discard</button>
        </div>
      </div>
    </div>
  );
}

function ScoreCell({ value, onChange }: { value: number | null | undefined; onChange: (v: string) => void }) {
  const missing = value == null;
  return (
    <input
      type="text"
      value={missing ? '' : String(value)}
      onChange={(e) => onChange(e.target.value)}
      placeholder="—"
      className={`w-16 text-center px-3 py-1 rounded-full text-xs font-black border outline-none transition-all ${missing ? 'bg-slate-50 text-slate-400 border-slate-200 focus:bg-white focus:border-indigo-300' : 'bg-emerald-50 text-emerald-700 border-emerald-100 focus:bg-white focus:border-emerald-400'}`}
    />
  );
}
