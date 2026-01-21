import React, { useState } from 'react';
import { 
  FileSpreadsheet, Image, FileText, FileCode, 
  ChevronDown, Globe, Menu, X, Split, FileType, 
  Settings, LogIn
} from 'lucide-react';
import { ToolType } from '../types';

export const tools: { name: ToolType; icon: any; color: string; bg: string }[] = [
  { name: 'PNG to EXCEL', icon: FileSpreadsheet, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  { name: 'JPG to BMP', icon: Image, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  { name: 'EXCEL to CSV', icon: FileSpreadsheet, color: 'text-purple-600', bg: 'bg-purple-100' },
  { name: 'JPG to SVG', icon: Image, color: 'text-teal-600', bg: 'bg-teal-100' },
  { name: 'EXCEL to PDF', icon: FileText, color: 'text-red-500', bg: 'bg-red-100' },
  { name: 'JPG to WEBP', icon: Image, color: 'text-sky-500', bg: 'bg-sky-100' },
  { name: 'HEIC to JPG', icon: Image, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  { name: 'WORD to JPG', icon: FileText, color: 'text-blue-700', bg: 'bg-blue-100' },
  { name: 'Image To Text', icon: FileCode, color: 'text-cyan-600', bg: 'bg-cyan-100' },
  { name: 'PNG to JPG', icon: Image, color: 'text-green-600', bg: 'bg-green-100' },
  { name: 'JFIF to JPG', icon: Image, color: 'text-lime-700', bg: 'bg-lime-100' },
  { name: 'SVG to JPG', icon: FileCode, color: 'text-orange-500', bg: 'bg-orange-100' },
  { name: 'JPG to WORD', icon: FileText, color: 'text-violet-600', bg: 'bg-violet-100' },
  { name: 'PDF to EXCEL', icon: FileSpreadsheet, color: 'text-amber-700', bg: 'bg-amber-100' },
  { name: 'WEBP to JPG', icon: Image, color: 'text-fuchsia-600', bg: 'bg-fuchsia-100' },
  { name: 'EXCEL to JPG', icon: FileSpreadsheet, color: 'text-rose-500', bg: 'bg-rose-100' },
  { name: 'JPG to PNG', icon: Image, color: 'text-pink-600', bg: 'bg-pink-100' },
  { name: 'CSV to EXCEL', icon: FileSpreadsheet, color: 'text-slate-600', bg: 'bg-slate-100' },
  { name: 'GIF to JPG', icon: Image, color: 'text-stone-500', bg: 'bg-stone-100' },
  { name: 'EXCEL FORMULA', icon: FileSpreadsheet, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { name: 'CSV Splitter', icon: Split, color: 'text-purple-500', bg: 'bg-purple-50' },
  { name: 'PDF to WORD', icon: FileText, color: 'text-blue-800', bg: 'bg-blue-50' },
];

interface HeaderProps {
  activeTool: ToolType;
  onToolSelect: (tool: ToolType) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTool, onToolSelect }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm font-sans">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onToolSelect('PNG to EXCEL')}>
            <div className="bg-emerald-600 p-1.5 rounded-lg text-white">
              <FileSpreadsheet size={24} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">
              JPG to Excel
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <button onClick={() => onToolSelect('PNG to EXCEL')} className="text-slate-600 hover:text-emerald-600 font-medium text-sm transition-colors">
              Home
            </button>
            
            {/* Mega Menu Dropdown */}
            <div 
              className="relative group"
              onMouseEnter={() => setIsToolsOpen(true)}
              onMouseLeave={() => setIsToolsOpen(false)}
            >
              <button className="flex items-center gap-1 text-slate-800 font-semibold text-sm py-5">
                Tools
                <ChevronDown size={14} className={`transition-transform duration-200 ${isToolsOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Content */}
              <div className={`absolute top-full left-1/2 -translate-x-1/2 w-[900px] bg-white rounded-xl shadow-xl border border-slate-100 p-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0`}>
                <div className="grid grid-cols-4 gap-x-4 gap-y-4">
                  {tools.map((tool, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => {
                        onToolSelect(tool.name);
                        setIsToolsOpen(false);
                      }}
                      className={`flex items-center gap-3 p-2.5 rounded-lg transition-all hover:bg-slate-50 w-full text-left ${activeTool === tool.name ? 'bg-slate-100 ring-1 ring-slate-200' : ''}`}
                    >
                      <div className={`p-1.5 rounded ${tool.bg} ${tool.color}`}>
                        <tool.icon size={16} strokeWidth={2} />
                      </div>
                      <span className={`text-xs font-semibold ${activeTool === tool.name ? 'text-slate-900' : 'text-slate-600'} uppercase tracking-wide`}>
                        {tool.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <a href="#" className="text-slate-600 hover:text-emerald-600 font-medium text-sm transition-colors">
              Blogs
            </a>
            <a href="#" className="text-slate-600 hover:text-emerald-600 font-medium text-sm transition-colors">
              Plans
            </a>
          </div>

          {/* Right Side Actions */}
          <div className="hidden lg:flex items-center gap-4">
            <button className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-medium text-sm transition-colors">
              Login
            </button>
            <button className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors">
              <span className="text-sm font-medium text-slate-600">EN</span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white absolute w-full left-0 top-16 shadow-lg h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="p-4 flex flex-col gap-4">
            <button onClick={() => onToolSelect('PNG to EXCEL')} className="p-2 font-medium text-slate-700 hover:bg-slate-50 rounded-lg text-left">Home</button>
            <div className="space-y-2">
              <div className="px-2 font-medium text-slate-900">Tools</div>
              <div className="grid grid-cols-1 gap-2 pl-4">
                {tools.map((tool, idx) => (
                  <button key={idx} onClick={() => { onToolSelect(tool.name); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 p-2 text-slate-600 hover:bg-slate-50 rounded-lg w-full text-left">
                    <tool.icon size={16} className={tool.color} />
                    <span className="text-sm">{tool.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4 mt-2 flex gap-4">
               <button className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium">
                Login
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};