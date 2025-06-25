import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Student, AttendanceSummary } from '../types';

export const exportToExcel = (students: Student[], listName: string, summary: AttendanceSummary): void => {
  try {
    // Prepare data for Excel
    const excelData = students.map((student, index) => ({
      'Nº': index + 1,
      'Nombre': student.nombre,
      'Apellido': student.apellido,
      'DNI': student.dni || '',
      'Teléfono': student.telefono || '',
      'Asistencia': student.presente ? 'Presente' : 'Ausente',
      'Origen': student.esManual ? 'Manual' : 'Excel',
      'Fecha Creación': student.fechaCreacion.toLocaleDateString('es-ES')
    }));
    
    // Add summary data
    const summaryData = [
      ['RESUMEN DE ASISTENCIA'],
      [''],
      ['Total de estudiantes', summary.total],
      ['Presentes', summary.presentes],
      ['Ausentes', summary.ausentes],
      [''],
      ['Presentes del Excel', summary.presentesExcel],
      ['Presentes agregados manualmente', summary.presentesManuales],
      ['Ausentes del Excel', summary.ausentesExcel],
      ['Ausentes agregados manualmente', summary.ausentesManuales],
      [''],
      ['Fecha de exportación', new Date().toLocaleString('es-ES')]
    ];
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Add students sheet
    const wsStudents = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, wsStudents, 'Estudiantes');
    
    // Add summary sheet
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');
    
    // Save file
    const fileName = `${listName}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Error al exportar a Excel');
  }
};

export const exportToPDF = async (elementId: string, listName: string): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Elemento no encontrado para exportar');
    }
    
    // Increase scale for better quality
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Calculate dimensions to fit the page
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    const ratio = Math.min(pdfWidth / canvasWidth, pdfHeight / canvasHeight);
    const imgWidth = canvasWidth * ratio;
    const imgHeight = canvasHeight * ratio;
    
    // Center the image
    const x = (pdfWidth - imgWidth) / 2;
    const y = (pdfHeight - imgHeight) / 2;
    
    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
    
    // Save file
    const fileName = `${listName}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('Error al exportar a PDF');
  }
};