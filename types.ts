export enum ProcessingStatus {
  IDLE = 'IDLE',
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export type ToolType = 
  | 'PNG to EXCEL' | 'JPG to BMP' | 'EXCEL to CSV' | 'JPG to SVG' 
  | 'EXCEL to PDF' | 'JPG to WEBP' | 'HEIC to JPG' | 'WORD to JPG' 
  | 'Image To Text' | 'PNG to JPG' | 'JFIF to JPG' | 'SVG to JPG' 
  | 'JPG to WORD' | 'PDF to EXCEL' | 'WEBP to JPG' | 'EXCEL to JPG' 
  | 'JPG to PNG' | 'CSV to EXCEL' | 'GIF to JPG' | 'EXCEL FORMULA' 
  | 'CSV Splitter';

export interface TableData {
  rows: string[][];
  suggestedSheetName?: string;
  subject?: string;
  textContent?: string; // For text extraction tools
}

export interface ProcessedFile {
  id: string;
  file: File;
  previewUrl: string;
  status: ProcessingStatus;
  result?: TableData;
  outputBlob?: Blob; // For image conversion results
  outputExtension?: string;
  error?: string;
}

export interface ExtractionResponse {
  data: string[][];
  summary: string;
}