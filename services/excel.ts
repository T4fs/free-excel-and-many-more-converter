import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { ProcessedFile } from '../types';

// Helper to check if two header rows are effectively the same
const areHeadersCompatible = (header1: string[], header2: string[]): boolean => {
  if (header1.length !== header2.length) return false;
  return header1.every((col, i) => col.trim().toLowerCase() === header2[i].trim().toLowerCase());
};

export const generateExcelWorkbook = (files: ProcessedFile[]): void => {
  const wb = XLSX.utils.book_new();
  let hasSheets = false;

  // Group files by Subject
  // Structure: { "Addresses": [file1, file2], "Inventory": [file3] }
  const groups: Record<string, ProcessedFile[]> = {};

  files.forEach(file => {
    if (file.result && file.result.rows.length > 0) {
      // Use subject or fallback to suggested name or generic
      let subject = file.result.subject || "General";
      // Normalize subject key
      subject = subject.trim();
      // Capitalize first letter
      subject = subject.charAt(0).toUpperCase() + subject.slice(1);
      
      if (!groups[subject]) {
        groups[subject] = [];
      }
      groups[subject].push(file);
    }
  });

  // Process groups
  Object.keys(groups).forEach(subject => {
    const groupFiles = groups[subject];
    
    // Within a subject group, we might have different table structures.
    // We try to merge those with identical headers.
    
    // Sub-groups based on table structure (hashed by header string for simplicity or just sequential check)
    // Simple approach: Iterate and build sheets.
    
    const processedIndices = new Set<number>();

    groupFiles.forEach((file, index) => {
      if (processedIndices.has(index)) return;

      const baseHeader = file.result!.rows[0];
      const mergedRows = [...file.result!.rows]; // Start with this file's rows (including header)

      // Look for other files in this group with same header
      groupFiles.forEach((otherFile, otherIndex) => {
        if (index === otherIndex || processedIndices.has(otherIndex)) return;

        const otherHeader = otherFile.result!.rows[0];
        if (areHeadersCompatible(baseHeader, otherHeader)) {
          // Append data rows only (skip header)
          mergedRows.push(...otherFile.result!.rows.slice(1));
          processedIndices.add(otherIndex);
        }
      });
      
      processedIndices.add(index);

      // Create Sheet
      const ws = XLSX.utils.aoa_to_sheet(mergedRows);
      
      // Determine Sheet Name
      // If it's the first sheet of this subject: "Addresses"
      // If collision: "Addresses (1)"
      let sheetName = subject;
      
      // Sanitize
      sheetName = sheetName.replace(/[\\/?*[\]]/g, "").substring(0, 31);
      
      let uniqueName = sheetName;
      let counter = 1;
      while (wb.SheetNames.includes(uniqueName)) {
        uniqueName = `${sheetName} (${counter})`;
        counter++;
      }

      XLSX.utils.book_append_sheet(wb, ws, uniqueName);
      hasSheets = true;
    });
  });

  if (hasSheets) {
    XLSX.writeFile(wb, "Merged_Grouped_Tables.xlsx");
  } else {
    alert("No valid data to download.");
  }
};

export const generateSingleExcel = (file: ProcessedFile): void => {
  if (!file.result || file.result.rows.length === 0) return;

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(file.result.rows);
  
  // Sanitizing sheet name
  let sheetName = file.result.subject || file.result.suggestedSheetName || "Sheet1";
  sheetName = sheetName.replace(/[\\/?*[\]]/g, "").substring(0, 31);
  
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Naming convention: c1.png -> c1EX.xlsx
  const originalName = file.file.name;
  const lastDotIndex = originalName.lastIndexOf('.');
  const nameWithoutExt = lastDotIndex !== -1 ? originalName.substring(0, lastDotIndex) : originalName;
  
  const fileName = `${nameWithoutExt}EX.xlsx`;

  XLSX.writeFile(wb, fileName);
};

export const generateBatchZip = async (files: ProcessedFile[]): Promise<void> => {
  const zip = new JSZip();
  let count = 0;

  files.forEach((file) => {
    if (file.result && file.result.rows.length > 0) {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(file.result.rows);
      
      let sheetName = file.result.subject || file.result.suggestedSheetName || "Sheet1";
      sheetName = sheetName.replace(/[\\/?*[\]]/g, "").substring(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      // Naming convention: c1.png -> c1EX.xlsx
      const originalName = file.file.name;
      const lastDotIndex = originalName.lastIndexOf('.');
      const nameWithoutExt = lastDotIndex !== -1 ? originalName.substring(0, lastDotIndex) : originalName;
      const fileName = `${nameWithoutExt}EX.xlsx`;

      // Generate binary buffer for this excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      
      // Add to ZIP
      zip.file(fileName, excelBuffer);
      count++;
    }
  });

  if (count > 0) {
    // Generate ZIP blob and trigger download
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Converted_Grouped_Package.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } else {
    alert("No valid data to download.");
  }
};