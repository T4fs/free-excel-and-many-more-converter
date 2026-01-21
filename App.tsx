import React, { useState, useCallback, useMemo } from 'react';
import { Header, tools as toolsConfig } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { FilePreviewList } from './components/FilePreviewList';
import { ProcessedFile, ProcessingStatus, ToolType } from './types';
import { extractTableFromImage, extractTextFromImage, extractRichDocumentContent, generateExcelFormula } from './services/gemini';
import { generateExcelWorkbook, generateSingleExcel, generateBatchZip } from './services/excel';
import { convertImage, imageToSvg } from './services/imageConversion';
import { Sparkles, FileSpreadsheet, AlertTriangle, Download, Archive, Layers, Calculator, FileText, ArrowRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

export default function App() {
  const [activeTool, setActiveTool] = useState<ToolType>('PNG to EXCEL');
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);
  const [mergeOutput, setMergeOutput] = useState(false);
  
  // Formula State
  const [formulaPrompt, setFormulaPrompt] = useState('');
  const [formulaResult, setFormulaResult] = useState('');

  // 1. Tool Configuration Logic
  const currentToolConfig = useMemo(() => {
    return toolsConfig.find(t => t.name === activeTool) || toolsConfig[0];
  }, [activeTool]);

  const acceptedFileTypes = useMemo(() => {
    if (activeTool === 'PDF to EXCEL' || activeTool === 'PDF to WORD' || activeTool === 'EXCEL to PDF') return '.pdf';
    if (activeTool.includes('EXCEL') && !activeTool.includes('PNG')) return '.xlsx, .xls, .csv';
    if (activeTool.includes('CSV')) return '.csv, .xlsx';
    if (activeTool === 'WORD to JPG') return '.doc, .docx';
    return 'image/png, image/jpeg, image/webp';
  }, [activeTool]);

  // 2. Clear state on tool change
  const handleToolSelect = (tool: ToolType) => {
    setActiveTool(tool);
    setFiles([]);
    setProcessError(null);
    setFormulaPrompt('');
    setFormulaResult('');
  };

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    const processedFiles: ProcessedFile[] = newFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: file.type.startsWith('image') ? URL.createObjectURL(file) : '', // Only create URL for images
      status: ProcessingStatus.IDLE
    }));
    setFiles(prev => [...prev, ...processedFiles]);
    setProcessError(null);
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  // 3. Central Processing Logic
  const processFiles = async () => {
    const pendingFiles = files.filter(f => f.status === ProcessingStatus.IDLE || f.status === ProcessingStatus.ERROR);
    if (pendingFiles.length === 0) return;

    setIsProcessing(true);
    setProcessError(null);

    const updateFileState = (id: string, updates: Partial<ProcessedFile>) => {
      setFiles(currentFiles => 
        currentFiles.map(f => f.id === id ? { ...f, ...updates } : f)
      );
    };

    pendingFiles.forEach(f => updateFileState(f.id, { status: ProcessingStatus.PROCESSING, error: undefined }));

    try {
      await Promise.all(pendingFiles.map(async (fileWrapper) => {
        try {
          // --- BRANCH LOGIC BASED ON TOOL ---
          
          // A. Gemini Table Extraction (PNG/PDF to Excel)
          if (['PNG to EXCEL', 'PDF to EXCEL'].includes(activeTool)) {
            const result = await extractTableFromImage(fileWrapper.file);
            updateFileState(fileWrapper.id, { status: ProcessingStatus.COMPLETED, result });
          }
          
          // B. Rich Document Extraction (PDF to Word, JPG to Word)
          // Using extractRichDocumentContent to preserve charts/tables
          else if (['JPG to WORD', 'PDF to WORD'].includes(activeTool)) {
            const richHtml = await extractRichDocumentContent(fileWrapper.file);
            updateFileState(fileWrapper.id, { 
              status: ProcessingStatus.COMPLETED, 
              result: { rows: [], textContent: richHtml } 
            });
          }

          // C. Simple Text Extraction
          else if (activeTool === 'Image To Text') {
            const text = await extractTextFromImage(fileWrapper.file);
            updateFileState(fileWrapper.id, { 
              status: ProcessingStatus.COMPLETED, 
              result: { rows: [], textContent: text } 
            });
          }

          // D. Image Conversion (Simple Canvas)
          else if (['JPG to PNG', 'PNG to JPG', 'WEBP to JPG', 'JPG to WEBP', 'GIF to JPG', 'JFIF to JPG', 'HEIC to JPG', 'BMP', 'JPG to BMP'].includes(activeTool)) {
            let format = 'image/jpeg';
            let ext = 'jpg';
            if (activeTool.includes('PNG')) { format = 'image/png'; ext = 'png'; }
            if (activeTool.includes('WEBP')) { format = 'image/webp'; ext = 'webp'; }
            if (activeTool.includes('BMP')) { format = 'image/bmp'; ext = 'bmp'; }

            const blob = await convertImage(fileWrapper.file, format);
            updateFileState(fileWrapper.id, { 
              status: ProcessingStatus.COMPLETED, 
              outputBlob: blob,
              outputExtension: ext
            });
          }

          // E. SVG Conversion
          else if (activeTool === 'JPG to SVG' || activeTool === 'SVG to JPG') {
             if (activeTool === 'JPG to SVG') {
               const blob = await imageToSvg(fileWrapper.file);
               updateFileState(fileWrapper.id, { status: ProcessingStatus.COMPLETED, outputBlob: blob, outputExtension: 'svg' });
             } else {
               const blob = await convertImage(fileWrapper.file, 'image/jpeg');
               updateFileState(fileWrapper.id, { status: ProcessingStatus.COMPLETED, outputBlob: blob, outputExtension: 'jpg' });
             }
          }

          // F. Excel/CSV conversions
          else if (activeTool === 'EXCEL to CSV' || activeTool === 'CSV to EXCEL') {
            const arrayBuffer = await fileWrapper.file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer);
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const data = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
            
            updateFileState(fileWrapper.id, { 
              status: ProcessingStatus.COMPLETED, 
              result: { rows: data as string[][], suggestedSheetName: 'Converted' } 
            });
          }

          else {
             throw new Error("This specific conversion is not fully supported in this demo yet.");
          }

        } catch (err: any) {
          updateFileState(fileWrapper.id, { status: ProcessingStatus.ERROR, error: err.message });
        }
      }));
    } catch (err: any) {
       setProcessError("Batch processing error.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Download Handling
  const handleDownloadSingle = (file: ProcessedFile) => {
    if (['PNG to EXCEL', 'PDF to EXCEL', 'CSV to EXCEL', 'EXCEL to CSV'].includes(activeTool)) {
       if (activeTool === 'EXCEL to CSV') {
          if (!file.result?.rows) return;
          const ws = XLSX.utils.aoa_to_sheet(file.result.rows);
          const csv = XLSX.utils.sheet_to_csv(ws);
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `${file.file.name.split('.')[0]}.csv`;
          link.click();
       } else {
          generateSingleExcel(file);
       }
    } 
    else if (['Image To Text', 'JPG to WORD', 'PDF to WORD'].includes(activeTool)) {
       const content = file.result?.textContent || "";
       const isWord = ['JPG to WORD', 'PDF to WORD'].includes(activeTool);
       const ext = isWord ? 'doc' : 'txt';
       
       // Enhanced Word Header to preserve structure
       const fullDocContent = isWord 
          ? `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
              <meta charset='utf-8'>
              <style>
                body { font-family: 'Calibri', 'Arial', sans-serif; line-height: 1.5; }
                table { border-collapse: collapse; width: 100%; margin: 15px 0; }
                th, td { border: 1px solid #999; padding: 8px; text-align: left; }
                h1, h2, h3 { color: #2E74B5; }
              </style>
            </head>
            <body>
              ${content}
            </body>
            </html>
          `
          : content;
          
       const mime = isWord ? 'application/msword' : 'text/plain';
       
       const blob = new Blob([fullDocContent], { type: mime });
       const link = document.createElement("a");
       link.href = URL.createObjectURL(blob);
       link.download = `${file.file.name.split('.')[0]}.${ext}`;
       link.click();
    }
    else if (file.outputBlob && file.outputExtension) {
       const link = document.createElement("a");
       link.href = URL.createObjectURL(file.outputBlob);
       link.download = `${file.file.name.split('.')[0]}.${file.outputExtension}`;
       link.click();
    }
  };
  
  const handleFormulaGenerate = async () => {
    if (!formulaPrompt) return;
    setIsProcessing(true);
    const result = await generateExcelFormula(formulaPrompt);
    setFormulaResult(result);
    setIsProcessing(false);
  };

  const pendingCount = files.filter(f => f.status === ProcessingStatus.IDLE || f.status === ProcessingStatus.ERROR).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/50 pb-20 font-sans">
      
      <Header activeTool={activeTool} onToolSelect={handleToolSelect} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        
        <div className="mb-8 text-center max-w-2xl mx-auto mt-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-3 flex items-center justify-center gap-3">
             <div className={`p-2 rounded-lg ${currentToolConfig.bg} ${currentToolConfig.color}`}>
                <currentToolConfig.icon size={32} />
             </div>
             {currentToolConfig.name}
          </h2>
          <p className="text-slate-600 text-lg">
            {activeTool === 'EXCEL FORMULA' 
              ? "Describe what you want to calculate, and AI will generate the Excel formula for you."
              : `Upload your ${activeTool.split(' ')[0]} files to convert them to ${activeTool.split(' ').pop()} format instantly.`}
          </p>
        </div>

        {activeTool === 'EXCEL FORMULA' ? (
           <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <label className="block text-sm font-medium text-slate-700 mb-2">Describe your calculation</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={formulaPrompt}
                  onChange={(e) => setFormulaPrompt(e.target.value)}
                  placeholder="e.g., Sum column A if column B is 'Paid'"
                  className="flex-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleFormulaGenerate()}
                />
                <button 
                  onClick={handleFormulaGenerate}
                  disabled={isProcessing || !formulaPrompt}
                  className="bg-emerald-600 text-white px-6 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isProcessing ? 'Thinking...' : 'Generate'}
                </button>
              </div>
              
              {formulaResult && (
                <div className="mt-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Result Formula</div>
                  <div className="font-mono text-xl text-slate-800 bg-white p-4 rounded border border-slate-200 shadow-inner select-all">
                    {formulaResult}
                  </div>
                </div>
              )}
           </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
              <FileUpload 
                onFilesSelected={handleFilesSelected} 
                disabled={isProcessing} 
                accept={acceptedFileTypes}
              />
              
              {processError && (
                <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm border border-red-100">
                  <AlertTriangle size={16} />
                  {processError}
                </div>
              )}

              {files.length > 0 && (
                <div className="mt-6 border-t border-slate-100 pt-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="text-sm text-slate-600 whitespace-nowrap">
                        <span className="font-semibold text-slate-900">{files.length}</span> file{files.length !== 1 && 's'} loaded
                      </div>
                      
                      {['PNG to EXCEL', 'PDF to EXCEL'].includes(activeTool) && (
                        <label className="flex items-center gap-2 text-sm text-slate-700 font-medium cursor-pointer hover:text-indigo-600 transition-colors bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 select-none">
                          <input 
                            type="checkbox" 
                            checked={mergeOutput}
                            onChange={(e) => setMergeOutput(e.target.checked)}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                          />
                          <div className="flex items-center gap-1.5">
                            <Layers size={14} />
                            <span>Merge all into one Excel file</span>
                          </div>
                        </label>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      {pendingCount > 0 && (
                        <button
                          onClick={processFiles}
                          disabled={isProcessing}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95 hover:shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isProcessing ? (
                            <>
                              <Sparkles size={18} className="animate-spin" />
                              Converting...
                            </>
                          ) : (
                            <>
                              <Sparkles size={18} />
                              Convert {pendingCount} Files
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <FilePreviewList 
              files={files} 
              onRemove={handleRemoveFile} 
              onDownload={handleDownloadSingle}
            />
          </>
        )}
      </main>
    </div>
  );
}
