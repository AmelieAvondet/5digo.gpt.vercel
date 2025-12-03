// src/app/admin/courses/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getTeacherCourses } from '@/app/admin/actions';
import AdminHeader from '@/components/AdminHeader';

interface Course {
  id: string;
  name: string;
  description: string;
  code: string;
  created_at: string;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function loadCourses() {
      const result = await getTeacherCourses();
      
      if (result.error) {
        setError(result.error);
      } else {
        setCourses(result.courses || []);
      }
      
      setLoading(false);
    }

    loadCourses();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Cargando cursos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader
        title="👨‍🏫 Mis Cursos"
        rightAction={{
          label: '+ Crear Curso',
          href: '/admin/courses/new',
          variant: 'primary',
        }}
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Opciones de Importación */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">📥 Importar Curso</h2>
          <p className="text-blue-800 text-sm mb-4">
            Importa un curso completo desde un archivo JSON con estructura de módulos y subtemas
          </p>
          <Link
            href="/admin/import-course"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            📤 Importar desde JSON
          </Link>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
            {error}
          </div>
        )}

        {courses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No tienes cursos aún</p>
            <Link
              href="/admin/courses/new"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Crear tu primer curso
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {course.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {course.description || 'Sin descripción'}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Código: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{course.code}</span>
                </p>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/courses/${course.id}`}
                    className="flex-1 text-center bg-blue-100 text-blue-600 px-3 py-2 rounded hover:bg-blue-200 transition text-sm"
                  >
                    Ver Detalles
                  </Link>
                  <Link
                    href={`/admin/courses/${course.id}/edit`}
                    className="flex-1 text-center bg-green-100 text-green-600 px-3 py-2 rounded hover:bg-green-200 transition text-sm"
                  >
                    Editar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
