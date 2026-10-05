'use client';
import React from 'react';

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()} 
      className="no-print" 
      style={{ 
        backgroundColor: '#0f172a', 
        color: 'white', 
        border: 'none', 
        padding: '0.6rem 1.5rem', 
        borderRadius: '6px', 
        fontSize: '0.85rem', 
        fontWeight: 600, 
        cursor: 'pointer' 
      }}
    >
      🖨️ Print Receipt
    </button>
  );
}
