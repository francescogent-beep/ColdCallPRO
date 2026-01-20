
import React from 'react';
import { TabType } from '../types';

interface LayoutProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ activeTab, setActiveTab, children }) => {
  const navItems = [
    { id: 'master', label: 'Master Call Log' },
    { id: 'followup', label: 'Follow-Up View' },
    { id: 'metrics', label: 'Daily Metrics' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-500 p-1.5 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight">COLDCALL <span className="text-indigo-400">PRO</span></h1>
        </div>
        <nav className="flex gap-1 bg-slate-800 p-1 rounded-xl">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === item.id 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
        {children}
      </main>
    </div>
  );
};

export default Layout;
