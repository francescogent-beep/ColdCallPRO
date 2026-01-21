
import React from 'react';

interface DropdownProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  className?: string;
  label?: string;
}

const Dropdown: React.FC<DropdownProps> = ({ value, options, onChange, className = '', label }) => {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all cursor-pointer hover:border-slate-300"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
};

export default Dropdown;
