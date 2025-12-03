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
    <div className="min-h-screen bg-gray-100">
      <AdminHeader
        title="👨‍🎓 Mis Cursos"
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Join Course Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Unirse a un Curso</h2>
          <p className="text-gray-600 mb-6">
            Ingresa el código del curso que te haya compartido tu profesor
          </p>

          <form onSubmit={handleJoinCourse} className="flex gap-2">
            <input
              type="text"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
              placeholder="Ej: COURSE-ABC123"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-semibold"
            >
              {loading ? 'Uniéndose...' : 'Unirse'}
            </button>
          </form>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Enrolled Courses Section */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Cursos Inscritos</h2>
          
          {loadingCourses ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Cargando cursos...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No estás inscrito en ningún curso aún</p>
              <p className="text-gray-500 text-sm">
                Usa el formulario de arriba para unirte a un curso
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div
                  key={course.enrollmentId}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {course.description || 'Sin descripción'}
                  </p>
                  
                  <div className="space-y-2 mb-4 text-sm">
                    <p className="text-gray-500">
                      Profesor: <span className="text-gray-700 font-medium">{course.teacher}</span>
                    </p>
                    <p className="text-gray-500">
                      Código: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{course.code}</span>
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-gray-600">Progreso</span>
                      <span className="text-xs font-semibold text-gray-900">{Math.round(course.progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <Link
                    href={`/courses/${course.id}`}
                    className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    Ver Curso
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
