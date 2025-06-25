import * as XLSX from 'xlsx';
import { ExcelData, Student } from '../types';

export const processExcelFile = (file: File): Promise<{ students: Student[], duplicatesFound: number }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert sheet to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        // Process data
        const excelData: ExcelData[] = [];
        const seenStudents = new Set<string>();
        let duplicatesFound = 0;
        
        // Skip header row and process data
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length < 4) continue; // Skip empty or incomplete rows (need at least 4 columns)
          
          const primerNombre = String(row[0] || '').trim();
          const segundoNombre = String(row[1] || '').trim();
          const primerApellido = String(row[2] || '').trim();
          const segundoApellido = String(row[3] || '').trim();
          
          // At least first name and first surname are required
          if (!primerNombre || !primerApellido) continue;
          
          // Combine names and surnames
          const nombre = [primerNombre, segundoNombre].filter(n => n).join(' ');
          const apellido = [primerApellido, segundoApellido].filter(a => a).join(' ');
          
          // Create a normalized key for duplicate detection
          const normalizedKey = `${nombre.toLowerCase().replace(/\s+/g, ' ')}|${apellido.toLowerCase().replace(/\s+/g, ' ')}`;
          
          if (seenStudents.has(normalizedKey)) {
            duplicatesFound++;
            continue; // Skip duplicate
          }
          
          seenStudents.add(normalizedKey);
          excelData.push({ nombre, apellido });
        }
        
        // Sort by apellido (surname) first, then by nombre (name)
        excelData.sort((a, b) => {
          const apellidoComparison = a.apellido.localeCompare(b.apellido, 'es', { sensitivity: 'base' });
          if (apellidoComparison !== 0) {
            return apellidoComparison;
          }
          return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
        });
        
        // Convert to Student objects
        const students: Student[] = excelData.map((data, index) => ({
          id: `excel_${Date.now()}_${index}`,
          nombre: data.nombre,
          apellido: data.apellido,
          presente: false,
          esManual: false,
          fechaCreacion: new Date()
        }));
        
        resolve({ students, duplicatesFound });
      } catch (error) {
        reject(new Error('Error procesando el archivo Excel. Verifique que el formato sea correcto.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error leyendo el archivo'));
    };
    
    reader.readAsBinaryString(file);
  });
};

export const validateExcelFile = (file: File): string | null => {
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv'
  ];
  
  if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
    return 'Formato de archivo no válido. Solo se permiten archivos .xlsx, .xls o .csv';
  }
  
  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    return 'El archivo es demasiado grande. Máximo 10MB permitido.';
  }
  
  return null;
};