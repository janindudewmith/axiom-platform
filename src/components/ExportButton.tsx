'use client';

import React from 'react';

interface ExportButtonProps {
  data: any[];
  filename: string;
  label: string;
  type: 'students' | 'revenue';
}

export default function ExportButton({ data, filename, label, type }: ExportButtonProps) {
  const handleExport = () => {
    let csv = "";
    if (type === 'students') {
      csv = "Student ID,Name,Email,Grade,WhatsApp\n" + data.map(u => `"${u.studentId || ''}","${u.name}","${u.email}","${u.gradeLevel}","${u.whatsapp || ''}"`).join("\n");
    } else {
      csv = "Date,Student ID,Student,Email,Class,Amount\n" + data.map(s => `"${new Date(s.createdAt).toISOString().split('T')[0]}","${s.user.studentId || ''}","${s.user.name}","${s.user.email}","${s.class.title}","2500"`).join("\n");
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <button 
      onClick={handleExport}
      className="btn btn-outline" 
      style={{ 
        fontSize: '0.75rem', 
        borderColor: type === 'students' ? 'var(--color-success)' : 'var(--color-primary)', 
        color: type === 'students' ? 'var(--color-success)' : 'var(--color-primary)' 
      }}
    >
      {label}
    </button>
  );
}
