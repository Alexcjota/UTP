import React, { useState } from 'react';
import { UserPlus, Save, X } from 'lucide-react';
import { Student } from '../types';

interface StudentFormProps {
  onAddStudent: (student: Omit<Student, 'id' | 'fechaCreacion'>) => void;
  existingStudents: Student[];
}

const StudentForm: React.FC<StudentFormProps> = ({ onAddStudent, existingStudents }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    telefono: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre.trim() || !formData.apellido.trim()) {
      alert('Nombre y apellido son obligatorios');
      return;
    }

    // Check for duplicates
    const normalizedName = formData.nombre.toLowerCase().trim();
    const normalizedSurname = formData.apellido.toLowerCase().trim();
    
    const isDuplicate = existingStudents.some(student =>
      student.nombre.toLowerCase().trim() === normalizedName &&
      student.apellido.toLowerCase().trim() === normalizedSurname
    );

    if (isDuplicate) {
      alert('Este estudiante ya existe en la lista');
      return;
    }

    const newStudent: Omit<Student, 'id' | 'fechaCreacion'> = {
      nombre: formData.nombre.trim(),
      apellido: formData.apellido.trim(),
      dni: formData.dni.trim() || undefined,
      telefono: formData.telefono.trim() || undefined,
      presente: true, // Always mark as present when added manually
      esManual: true
    };

    onAddStudent(newStudent);
    setFormData({ nombre: '', apellido: '', dni: '', telefono: '' });
    setShowForm(false);
  };

  const handleCancel = () => {
    setFormData({ nombre: '', apellido: '', dni: '', telefono: '' });
    setShowForm(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <UserPlus className="w-6 h-6 mr-2" />
          Agregar Estudiante Manualmente
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center font-medium"
          >
            <UserPlus className="w-4 h-4 mr-1" />
            Agregar Estudiante
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
                placeholder="Ingresa el nombre"
              />
            </div>
            <div>
              <label htmlFor="apellido" className="block text-sm font-medium text-gray-700 mb-1">
                Apellido <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="apellido"
                value={formData.apellido}
                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
                placeholder="Ingresa el apellido"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="dni" className="block text-sm font-medium text-gray-700 mb-1">
                DNI <span className="text-gray-500">(opcional)</span>
              </label>
              <input
                type="text"
                id="dni"
                value={formData.dni}
                onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ingresa el DNI"
              />
            </div>
            <div>
              <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono <span className="text-gray-500">(opcional)</span>
              </label>
              <input
                type="tel"
                id="telefono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ingresa el teléfono"
              />
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">
              <strong>Nota:</strong> El estudiante será marcado automáticamente como <strong>presente</strong> al agregarlo.
            </p>
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center font-medium"
            >
              <Save className="w-4 h-4 mr-1" />
              Agregar Estudiante
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center font-medium"
            >
              <X className="w-4 h-4 mr-1" />
              Cancelar
            </button>
          </div>
        </form>
      )}

      {!showForm && (
        <p className="text-gray-600 text-sm">
          Agrega estudiantes que no estén en el archivo Excel. Serán marcados automáticamente como presentes.
        </p>
      )}
    </div>
  );
};

export default StudentForm;