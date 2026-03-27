interface StudentRecord {
  first_name: string;
  last_name: string;
  math_score: number | null;
  english_score: number | null;
  science_score: number | null;
}

interface DataPreviewProps {
  data: {
    students: StudentRecord[];
  };
}

export default function DataPreview({ data }: DataPreviewProps) {
  if (!data || !data.students || data.students.length === 0) {
    return (
      <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200">
        <p>No student data was recognized in this document. Please check the image quality.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200">
      <table className="w-full text-sm text-left text-neutral-600">
        <thead className="text-xs text-neutral-700 uppercase bg-neutral-50 border-b border-neutral-200">
          <tr>
            <th className="px-6 py-4">First Name</th>
            <th className="px-6 py-4">Last Name</th>
            <th className="px-6 py-4">Math Score</th>
            <th className="px-6 py-4">English Score</th>
            <th className="px-6 py-4">Science Score</th>
          </tr>
        </thead>
        <tbody>
          {data.students.map((student, idx) => (
            <tr key={idx} className="bg-white border-b hover:bg-neutral-50 last:border-0 border-neutral-100 transition-colors">
              <td className="px-6 py-4 font-medium text-neutral-900">{student.first_name || '-'}</td>
              <td className="px-6 py-4">{student.last_name || '-'}</td>
              <td className={`px-6 py-4 ${student.math_score === null ? 'text-red-500 bg-red-50/50' : 'text-neutral-700'}`}>
                {student.math_score !== null ? student.math_score : 'Missing'}
              </td>
              <td className={`px-6 py-4 ${student.english_score === null ? 'text-red-500 bg-red-50/50' : 'text-neutral-700'}`}>
                {student.english_score !== null ? student.english_score : 'Missing'}
              </td>
              <td className={`px-6 py-4 ${student.science_score === null ? 'text-red-500 bg-red-50/50' : 'text-neutral-700'}`}>
                {student.science_score !== null ? student.science_score : 'Missing'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="p-4 bg-neutral-50 flex justify-end gap-4 border-t border-neutral-200">
        <button className="px-4 py-2 text-neutral-700 font-medium hover:bg-neutral-200 rounded-lg transition-colors">
          Discard
        </button>
        <button className="px-4 py-2 bg-indigo-600 focus:ring-4 focus:ring-indigo-100 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm">
          Save to Database
        </button>
      </div>
    </div>
  );
}
