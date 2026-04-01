'use client';

interface StudentRecord {
  first_name: string;
  last_name: string;
  [subject: string]: string | number | null;
}

interface DataPreviewProps {
  data: {
    columns?: string[];
    students: StudentRecord[];
  };
  onUpdate: (updatedData: DataPreviewProps['data']) => void;
}

// Derive subject columns dynamically from actual data
function getSubjectColumns(data: DataPreviewProps['data']): string[] {
  if (data.columns && data.columns.length > 0) {
    return data.columns;
  }
  const reserved = new Set(['first_name', 'last_name']);
  const colSet = new Set<string>();
  for (const student of data.students) {
    for (const key of Object.keys(student)) {
      if (!reserved.has(key)) colSet.add(key);
    }
  }
  return Array.from(colSet);
}

function formatLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function DataPreview({ data, onUpdate }: DataPreviewProps) {
  if (!data || !data.students || data.students.length === 0) {
    return (
      <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200">
        <p>No student data was recognized in this document. Please check the image quality.</p>
      </div>
    );
  }

  const subjects = getSubjectColumns(data);

  const handleCellChange = (
    studentIdx: number,
    field: string,
    value: string
  ) => {
    const updatedStudents = [...data.students];
    const isScore = !['first_name', 'last_name'].includes(field);
    
    // Parse score if it's a numeric field, otherwise keep as string
    let finalValue: string | number | null = value;
    if (isScore) {
      if (value.trim() === '' || value === '—') {
        finalValue = null;
      } else {
        const num = parseFloat(value);
        finalValue = isNaN(num) ? value : num;
      }
    }

    updatedStudents[studentIdx] = {
      ...updatedStudents[studentIdx],
      [field]: finalValue,
    };

    onUpdate({ ...data, students: updatedStudents });
  };

  return (
    <div className="glass rounded-2xl overflow-hidden border border-indigo-100/50 shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-5 font-bold text-slate-900 uppercase tracking-wider text-xs">
                Student Name
              </th>
              {subjects.map((col) => (
                <th
                  key={col}
                  className="px-6 py-5 font-bold text-slate-900 uppercase tracking-wider text-xs text-center"
                >
                  {formatLabel(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.students.map((student, idx) => (
              <tr
                key={idx}
                className="hover:bg-indigo-50/30 transition-colors duration-200"
              >
                <td className="px-6 py-5 min-w-[280px]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {student.first_name?.[0] || '?'}{student.last_name?.[0] || ''}
                    </div>
                    <div className="flex flex-col w-full">
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={student.first_name || ''}
                          onChange={(e) => handleCellChange(idx, 'first_name', e.target.value)}
                          className="bg-transparent border-b border-transparent hover:border-indigo-200 focus:border-indigo-500 focus:outline-none font-bold text-slate-900 w-1/2 p-0.5 transition-all"
                          placeholder="First Name"
                        />
                        <input
                          type="text"
                          value={student.last_name || ''}
                          onChange={(e) => handleCellChange(idx, 'last_name', e.target.value)}
                          className="bg-transparent border-b border-transparent hover:border-indigo-200 focus:border-indigo-500 focus:outline-none font-bold text-slate-900 w-1/2 p-0.5 transition-all"
                          placeholder="Last Name"
                        />
                      </div>
                      <div className="text-xs text-slate-400 font-medium px-0.5">
                        Record #{idx + 1}
                      </div>
                    </div>
                  </div>
                </td>
                {subjects.map((col) => (
                  <td key={col} className="px-6 py-5 text-center min-w-[100px]">
                    <div className="flex justify-center">
                      <EditableScore
                        value={student[col] as number | null | undefined}
                        onChange={(val) => handleCellChange(idx, col, val)}
                      />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-6 bg-slate-50/30 backdrop-blur-sm flex justify-between items-center border-t border-slate-100">
        <p className="text-sm text-slate-500 font-medium italic">
          {subjects.length} column{subjects.length !== 1 ? 's' : ''} detected from document • Every cell is editable
        </p>
        <div className="flex gap-3">
          <button className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200/50 rounded-xl transition-all duration-200">
            Discard
          </button>
          <button className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/20 active:scale-95">
            Confirm &amp; Save
          </button>
        </div>
      </div>
    </div>
  );
}

function EditableScore({
  value,
  onChange,
}: {
  value: number | null | undefined;
  onChange: (val: string) => void;
}) {
  const isMissing = value === null || value === undefined;
  
  return (
    <input
      type="text"
      value={isMissing ? '' : String(value)}
      onChange={(e) => onChange(e.target.value)}
      placeholder="—"
      className={`w-16 text-center px-3 py-1 rounded-full text-xs font-black transition-all border outline-none
        ${isMissing 
          ? 'bg-slate-50 text-slate-400 border-slate-200 focus:bg-white focus:border-indigo-300 focus:text-slate-700' 
          : 'bg-emerald-50 text-emerald-700 border-emerald-100 focus:bg-white focus:border-emerald-400'
        }`}
    />
  );
}
