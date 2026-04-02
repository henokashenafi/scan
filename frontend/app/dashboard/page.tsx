'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface StudentRecord {
    id: number;
    first_name: string;
    last_name: string;
    grade: string;
    age: number;
    subjects: any;
    created_at: string;
}

export default function Dashboard() {
    const [records, setRecords] = useState<StudentRecord[]>([]);
    const [search, setSearch] = useState('');
    const [grade, setGrade] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchRecords();
    }, [search, grade]);

    const fetchRecords = async () => {
        setIsLoading(true);
        try {
            const query = new URLSearchParams();
            if (search) query.append('search', search);
            if (grade) query.append('grade', grade);

            const response = await fetch(`http://localhost:3001/api/analytics?${query.toString()}`);
            const data = await response.json();
            setRecords(data);
        } catch (err) {
            console.error('Failed to fetch records:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <header className="flex justify-between items-end">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Data Analytics</h1>
                        <p className="text-slate-500 font-medium">Explore and filter extracted student records</p>
                    </div>
                    <Link href="/" className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                        ← Back to Upload
                    </Link>
                </header>

                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 relative">
                        <input
                            type="text"
                            placeholder="Search by name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm text-slate-700 font-medium"
                        />
                        <svg className="w-6 h-6 absolute left-4 top-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <div>
                        <select
                            value={grade}
                            onChange={(e) => setGrade(e.target.value)}
                            className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm text-slate-700 font-medium appearance-none"
                        >
                            <option value="">All Grades</option>
                            <option value="9">Grade 9</option>
                            <option value="10">Grade 10</option>
                            <option value="11">Grade 11</option>
                            <option value="12">Grade 12</option>
                        </select>
                    </div>
                </section>

                <section className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-slate-900 uppercase tracking-wider text-xs">Student</th>
                                    <th className="px-6 py-4 font-bold text-slate-900 uppercase tracking-wider text-xs">Grade</th>
                                    <th className="px-6 py-4 font-bold text-slate-900 uppercase tracking-wider text-xs">Age</th>
                                    <th className="px-6 py-4 font-bold text-slate-900 uppercase tracking-wider text-xs">Subjects</th>
                                    <th className="px-6 py-4 font-bold text-slate-900 uppercase tracking-wider text-xs">Date Extracted</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={5} className="px-6 py-8 bg-slate-50/50"></td>
                                        </tr>
                                    ))
                                ) : records.length > 0 ? (
                                    records.map((record) => (
                                        <tr key={record.id} className="hover:bg-indigo-50/20 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900">{record.first_name} {record.last_name}</div>
                                                <div className="text-xs text-slate-400 font-medium">Record ID: {record.id}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-violet-50 text-violet-700 rounded-full font-bold text-xs">
                                                    Grade {record.grade || '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-700">{record.age || '—'}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2 flex-wrap">
                                                    {record.subjects && Object.keys(record.subjects).map((sub) => (
                                                        <span key={sub} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase transition-all hover:bg-slate-200">
                                                            {sub}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium text-slate-400">
                                                {new Date(record.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-medium">
                                            No records found. Try adjusting your filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
}
