import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Save, AlertCircle } from 'lucide-react';
import { Student, AttendanceList, AttendanceSummary, Notification } from './types';
import { saveAttendanceList, getAttendanceLists, deleteAttendanceList } from './utils/storageUtils';
import ListManager from './components/ListManager';
import ExcelUpload from './components/ExcelUpload';
import StudentForm from './components/StudentForm';
import StudentTable from './components/StudentTable';
import AttendanceSummaryComponent from './components/AttendanceSummary';
import ExportControls from './components/ExportControls';
import NotificationSystem from './components/NotificationSystem';

function App() {
  const [currentList, setCurrentList] = useState<AttendanceList | null>(null);
  const [allLists, setAllLists] = useState<AttendanceList[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load existing lists on component mount
  useEffect(() => {
    const savedLists = getAttendanceLists();
    setAllLists(savedLists);
  }, []);

  // Auto-save current list when it changes
  useEffect(() => {
    if (currentList && hasUnsavedChanges) {
      const updatedList = {
        ...currentList,
        fechaModificacion: new Date()
      };
      
      try {
        saveAttendanceList(updatedList);
        setCurrentList(updatedList);
        setAllLists(prev => {
          const updated = prev.filter(l => l.id !== updatedList.id);
          return [...updated, updatedList];
        });
        setHasUnsavedChanges(false);
        
        addNotification('success', 'Lista guardada automáticamente');
      } catch (error) {
        addNotification('error', 'Error al guardar la lista');
      }
    }
  }, [currentList, hasUnsavedChanges]);

  // Calculate attendance summary
  const attendanceSummary: AttendanceSummary = useMemo(() => {
    if (!currentList) {
      return {
        total: 0,
        presentes: 0,
        ausentes: 0,
        presentesExcel: 0,
        presentesManuales: 0,
        ausentesExcel: 0,
        ausentesManuales: 0
      };
    }

    const students = currentList.estudiantes;
    const presentes = students.filter(s => s.presente);
    const ausentes = students.filter(s => !s.presente);
    
    return {
      total: students.length,
      presentes: presentes.length,
      ausentes: ausentes.length,
      presentesExcel: presentes.filter(s => !s.esManual).length,
      presentesManuales: presentes.filter(s => s.esManual).length,
      ausentesExcel: ausentes.filter(s => !s.esManual).length,
      ausentesManuales: ausentes.filter(s => s.esManual).length
    };
  }, [currentList]);

  const addNotification = (tipo: Notification['tipo'], mensaje: string) => {
    const notification: Notification = {
      id: Date.now().toString(),
      tipo,
      mensaje,
      timestamp: new Date()
    };
    setNotifications(prev => [...prev, notification]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleCreateList = (name: string) => {
    const newList: AttendanceList = {
      id: Date.now().toString(),
      nombre: name,
      estudiantes: [],
      fechaCreacion: new Date(),
      fechaModificacion: new Date()
    };

    try {
      saveAttendanceList(newList);
      setCurrentList(newList);
      setAllLists(prev => [...prev, newList]);
      addNotification('success', `Lista "${name}" creada exitosamente`);
    } catch (error) {
      addNotification('error', 'Error al crear la lista');
    }
  };

  const handleSelectList = (list: AttendanceList) => {
    if (hasUnsavedChanges && currentList) {
      const confirmSwitch = window.confirm(
        'Tienes cambios sin guardar. ¿Quieres cambiar de lista de todas formas?'
      );
      if (!confirmSwitch) return;
    }

    setCurrentList(list);
    setHasUnsavedChanges(false);
    addNotification('info', `Lista "${list.nombre}" cargada`);
  };

  const handleDeleteList = (listId: string) => {
    try {
      deleteAttendanceList(listId);
      setAllLists(prev => prev.filter(l => l.id !== listId));
      
      if (currentList?.id === listId) {
        setCurrentList(null);
        setHasUnsavedChanges(false);
      }
      
      addNotification('success', 'Lista eliminada exitosamente');
    } catch (error) {
      addNotification('error', 'Error al eliminar la lista');
    }
  };

  const handleStudentsLoaded = (students: Student[], duplicatesFound: number) => {
    if (!currentList) {
      addNotification('error', 'Primero debes crear o seleccionar una lista');
      return;
    }

    const updatedList = {
      ...currentList,
      estudiantes: [...currentList.estudiantes, ...students]
    };

    setCurrentList(updatedList);
    setHasUnsavedChanges(true);

    let message = `${students.length} estudiantes cargados desde Excel`;
    if (duplicatesFound > 0) {
      message += `. ${duplicatesFound} duplicados eliminados automáticamente`;
      addNotification('warning', `Se encontraron y eliminaron ${duplicatesFound} estudiantes duplicados`);
    }
    
    addNotification('success', message);
  };

  const handleAddStudent = (studentData: Omit<Student, 'id' | 'fechaCreacion'>) => {
    if (!currentList) {
      addNotification('error', 'Primero debes crear o seleccionar una lista');
      return;
    }

    const newStudent: Student = {
      ...studentData,
      id: `manual_${Date.now()}`,
      fechaCreacion: new Date()
    };

    const updatedList = {
      ...currentList,
      estudiantes: [...currentList.estudiantes, newStudent]
    };

    setCurrentList(updatedList);
    setHasUnsavedChanges(true);
    addNotification('success', `${newStudent.nombre} ${newStudent.apellido} agregado como presente`);
  };

  const handleToggleAttendance = (studentId: string) => {
    if (!currentList) return;

    const updatedStudents = currentList.estudiantes.map(student =>
      student.id === studentId
        ? { ...student, presente: !student.presente }
        : student
    );

    const updatedList = {
      ...currentList,
      estudiantes: updatedStudents
    };

    setCurrentList(updatedList);
    setHasUnsavedChanges(true);

    const student = updatedStudents.find(s => s.id === studentId);
    if (student) {
      const status = student.presente ? 'presente' : 'ausente';
      addNotification('info', `${student.nombre} ${student.apellido} marcado como ${status}`);
    }
  };

  const handleDeleteStudent = (studentId: string) => {
    if (!currentList) return;

    const student = currentList.estudiantes.find(s => s.id === studentId);
    const updatedStudents = currentList.estudiantes.filter(s => s.id !== studentId);

    const updatedList = {
      ...currentList,
      estudiantes: updatedStudents
    };

    setCurrentList(updatedList);
    setHasUnsavedChanges(true);

    if (student) {
      addNotification('success', `${student.nombre} ${student.apellido} eliminado de la lista`);
    }
  };

  const handleManualSave = () => {
    if (!currentList) return;

    const updatedList = {
      ...currentList,
      fechaModificacion: new Date()
    };

    try {
      saveAttendanceList(updatedList);
      setCurrentList(updatedList);
      setAllLists(prev => {
        const updated = prev.filter(l => l.id !== updatedList.id);
        return [...updated, updatedList];
      });
      setHasUnsavedChanges(false);
      addNotification('success', 'Lista guardada exitosamente');
    } catch (error) {
      addNotification('error', 'Error al guardar la lista');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <NotificationSystem
        notifications={notifications}
        removeNotification={removeNotification}
      />

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Sistema de Asistencia Escolar
                </h1>
                <p className="text-sm text-gray-600">
                  Gestión de asistencia para promotores escolares
                </p>
              </div>
            </div>
            {currentList && hasUnsavedChanges && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center text-yellow-600">
                  <AlertCircle className="w-5 h-5 mr-1" />
                  <span className="text-sm font-medium">Cambios sin guardar</span>
                </div>
                <button
                  onClick={handleManualSave}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center font-medium"
                >
                  <Save className="w-4 h-4 mr-1" />
                  Guardar Ahora
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ListManager
          lists={allLists}
          currentList={currentList}
          onCreateList={handleCreateList}
          onSelectList={handleSelectList}
          onDeleteList={handleDeleteList}
        />

        {currentList && (
          <div className="space-y-6">
            <ExcelUpload
              onStudentsLoaded={handleStudentsLoaded}
              disabled={!currentList}
            />

            <StudentForm
              onAddStudent={handleAddStudent}
              existingStudents={currentList.estudiantes}
            />

            <AttendanceSummaryComponent summary={attendanceSummary} />

            <StudentTable
              students={currentList.estudiantes}
              onToggleAttendance={handleToggleAttendance}
              onDeleteStudent={handleDeleteStudent}
            />

            <ExportControls
              students={currentList.estudiantes}
              summary={attendanceSummary}
              listName={currentList.nombre}
            />
          </div>
        )}

        {!currentList && (
          <div className="text-center py-12">
            <BookOpen className="w-24 h-24 text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-600 mb-4">
              Bienvenido al Sistema de Asistencia Escolar
            </h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Crea una nueva lista de asistencia o selecciona una existente para comenzar a gestionar la asistencia de tus estudiantes.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>Apoyos UTP</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;