import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Student } from '../types';
import { processExcelFile, validateExcelFile } from '../utils/excelUtils';

interface ExcelUploadProps {
  onStudentsLoaded: (students: Student[], duplicatesFound: number) => void;
  disabled?: boolean;
}

const ExcelUpload: React.FC<ExcelUploadProps> = ({ onStudentsLoaded, disabled = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = async (file: File) => {
    const validationError = validateExcelFile(file);
    if (validationError) {
      alert(validationError);
      return;
    }

    setIsProcessing(true);
    try {
      const { students, duplicatesFound } = await processExcelFile(file);
      onStudentsLoaded(students, duplicatesFound);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error procesando el archivo');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <FileSpreadsheet className="w-6 h-6 mr-2" />
        Cargar Estudiantes desde Excel
      </h2>

      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold mb-1">Formato requerido (4 columnas):</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Primera columna: <strong>Primer Nombre</strong></li>
              <li>Segunda columna: <strong>Segundo Nombre</strong> (opcional)</li>
              <li>Tercera columna: <strong>Primer Apellido</strong></li>
              <li>Cuarta columna: <strong>Segundo Apellido</strong> (opcional)</li>
              <li>Los estudiantes se ordenarán automáticamente por apellidos</li>
              <li>Los duplicados se eliminarán automáticamente</li>
              <li>Se ignorarán las filas vacías o incompletas</li>
            </ul>
          </div>
        </div>
      </div>

      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400 hover:bg-blue-50'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && !isProcessing && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled || isProcessing}
        />

        {isProcessing ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Procesando archivo...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Arrastra tu archivo aquí o haz clic para seleccionar
            </p>
            <p className="text-sm text-gray-500">
              Formatos soportados: .xlsx, .xls, .csv
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>* El archivo debe contener 4 columnas: Primer Nombre, Segundo Nombre, Primer Apellido, Segundo Apellido.</p>
        <p>* Los estudiantes cargados aparecerán ordenados por apellidos y marcados como ausentes por defecto.</p>
        <p>* Al menos el primer nombre y primer apellido son obligatorios.</p>
      </div>
    </div>
  );
};

export default ExcelUpload;