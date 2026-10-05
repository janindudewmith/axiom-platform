import React from 'react';

interface AvatarProps {
  name: string;
  size?: number;
  fontSize?: string;
}

export default function Avatar({ name, size = 40, fontSize = '0.9rem' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Generate a consistent color based on the name
  const colors = [
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#f59e0b', // amber
    '#10b981', // emerald
    '#6366f1', // indigo
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = colors[Math.abs(hash) % colors.length];

  return (
    <div 
      style={{ 
        width: `${size}px`, 
        height: `${size}px`, 
        borderRadius: '50%', 
        backgroundColor: color, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        color: 'white', 
        fontWeight: 700, 
        fontSize: fontSize,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        flexShrink: 0
      }}
    >
      {initials}
    </div>
  );
}
