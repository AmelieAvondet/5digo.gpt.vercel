// src/app/courses/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { enrollInCourse, getStudentCourses } from '@/app/student/actions';
import AdminHeader from '@/components/AdminHeader';

interface Course {
  enrollmentId: string;
  id: string;
  name: string;
  description: string;
  code: string;
  progress: number;
  teacher: string;
  created_at: string;
}

export default function CoursesPage() {
  const [courseCode, setCourseCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const router = useRouter();

  // Cargar cursos inscritos
  useEffect(() => {
    async function loadCourses() {
      const result = await getStudentCourses();
      if (!result.error) {
        setCourses(result.courses || []);
      }
      setLoadingCourses(false);
    }
    loadCourses();
  }, []);

  const handleJoinCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!courseCode.trim()) {
      setError('Ingresa un código de curso');
      return;
    }

    setLoading(true);

    try {
      const result = await enrollInCourse(courseCode);
      if (result.error) {
        setError(result.error);
      } else {
        setCourseCode('');
        // Recargar la lista de cursos
        const updated = await getStudentCourses();
        setCourses(updated.courses || []);
      }
    } catch (err: any) {
      setError('Error al unirse al curso');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      <AdminHeader
        title="Mis Cursos"
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Join Course Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Unirse a un Curso</h2>
              <p className="text-gray-600 text-sm mt-1">
                Ingresa el código que te compartió tu profesor para acceder al curso
              </p>
            </div>
          </div>

          <form onSubmit={handleJoinCourse} className="flex gap-3">
            <input
              type="text"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
              placeholder="Ej: COURSE-ABC123"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-semibold"
            >
              {loading ? 'Uniéndose...' : 'Unirse'}
            </button>
          </form>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Enrolled Courses Section */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Cursos Inscritos</h2>
            <p className="text-gray-600 text-sm mt-1">{courses.length} curso{courses.length !== 1 ? 's' : ''} disponible{courses.length !== 1 ? 's' : ''}</p>
          </div>
          
          {loadingCourses ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-600 mt-4">Cargando cursos...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17s4.5 10.747 10 10.747c5.5 0 10-4.998 10-10.747S17.5 6.253 12 6.253z" />
              </svg>
              <p className="text-gray-600 font-medium mb-2">No estás inscrito en ningún curso aún</p>
              <p className="text-gray-500 text-sm">
                Usa el formulario anterior para unirte a un curso con su código
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div
                  key={course.enrollmentId}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex-1 line-clamp-2 group-hover:text-blue-600 transition">{course.name}</h3>
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0 ml-2">
                      <span className="text-lg">📖</span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {course.description || 'Sin descripción disponible'}
                  </p>
                  
                  <div className="space-y-2 mb-4 pb-4 border-b border-gray-100 text-sm">
                    <p className="text-gray-500">
                      Profesor: <span className="text-gray-900 font-medium">{course.teacher}</span>
                    </p>
                    <p className="text-gray-500">
                      Código: <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-900">{course.code}</span>
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-gray-600">Progreso del Curso</span>
                      <span className="text-xs font-bold text-blue-600">{Math.round(course.progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-linear-to-r from-blue-600 to-blue-500 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <Link
                    href={`/courses/${course.id}`}
                    className="block w-full text-center bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition font-semibold text-sm"
                  >
                    Continuar Curso
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
