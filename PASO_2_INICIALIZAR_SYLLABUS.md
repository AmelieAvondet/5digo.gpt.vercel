# Paso 2: Inicializar Syllabus para Alumnos

## Opción 1: Automático (Recomendado) ✅

Ya está implementado. Cuando un alumno se inscribe a un curso:

```typescript
// En enrollInCourse() - student/actions.ts
// Automáticamente se crea un Syllabus con:
// - Primer tema: status = "in_progress"
// - Resto de temas: status = "pending"
```

**¿Qué ocurre?**
1. Alumno ingresa código del curso → se inscribe
2. Sistema obtiene automáticamente todos los temas
3. Se crea `student_syllabus` con el orden y estados

**No requiere acción manual** ✓

---

## Opción 2: Para Alumnos Ya Inscritos

Si ya tienes alumnos inscritos **antes** de desplegar los cambios, usa estas funciones:

### A) Inicializar para un alumno específico

```typescript
import { initializeSyllabusForStudent } from '@/app/admin/actions';

// En un endpoint o script:
const result = await initializeSyllabusForStudent(
  studentId,  // UUID del alumno
  courseId    // UUID del curso
);

if (result.success) {
  console.log('✓ Syllabus inicializado para', studentId);
} else {
  console.error(result.error);
}
```

### B) Inicializar para TODOS los alumnos de un curso

```typescript
import { initializeSyllabusForAllStudents } from '@/app/admin/actions';

// El profesor ejecuta esto desde el admin panel:
const result = await initializeSyllabusForAllStudents(courseId);

// Retorna: { success: true, successCount: 5, failCount: 0, totalStudents: 5 }
```

---

## Opción 3: Configurar la Persona Pedagógica del Curso

```typescript
import { setPersonaForCourse } from '@/app/admin/actions';

const result = await setPersonaForCourse(courseId, {
  tone: 'motivador',           // 'profesional' | 'casual' | 'motivador'
  explanation_style: 'detallado', // 'detallado' | 'conciso' | 'socrático'
  language: 'es',               // 'es' | 'en' | etc
  difficulty_level: 'intermedio' // 'basico' | 'intermedio' | 'avanzado'
});

if (result.success) {
  console.log('✓ Persona configurada');
}
```

---

## Checklist - Paso 2

- [ ] **1. Ejecutar migrations en Supabase**
  ```bash
  # Copiar y ejecutar schema.sql en tu Supabase SQL editor
  psql postgresql://... < schema.sql
  ```

- [ ] **2. Para alumnos nuevos**: Listo automáticamente ✓
  - Al inscribirse → se crea su Syllabus

- [ ] **3. Para alumnos existentes**: 
  - Opción A: Ejecutar `initializeSyllabusForAllStudents(courseId)` por cada curso
  - Opción B: Manual en Supabase (insert directo en `student_syllabus`)

- [ ] **4. Configurar Persona de cada curso**:
  ```typescript
  await setPersonaForCourse(courseId, {
    tone: 'motivador',
    explanation_style: 'detallado',
    language: 'es',
    difficulty_level: 'intermedio'
  });
  ```

---

## Script de Ejemplo: Inicializar Todo (Node.js)

Copia y ejecuta esto en tu terminal si tienes Node.js:

```typescript
// Archivo: init-syllabus.js
const { supabaseAdmin } = require('@/lib/supabase');

async function initializeAll() {
  try {
    // Obtener todos los cursos
    const { data: courses } = await supabaseAdmin
      .from('courses')
      .select('id, name');

    console.log(`Encontrados ${courses.length} cursos`);

    for (const course of courses) {
      console.log(`Inicializando ${course.name}...`);

      // Obtener todos los alumnos
      const { data: enrollments } = await supabaseAdmin
        .from('course_enrollments')
        .select('student_id')
        .eq('course_id', course.id);

      // Obtener todos los temas
      const { data: topics } = await supabaseAdmin
        .from('topics')
        .select('id')
        .eq('course_id', course.id)
        .order('created_at');

      if (!topics?.length) {
        console.log('  ⚠️ Sin temas');
        continue;
      }

      // Crear syllabus para cada alumno
      for (const enrollment of enrollments) {
        const syllabusEntries = topics.map((topic, idx) => ({
          student_id: enrollment.student_id,
          course_id: course.id,
          topic_id: topic.id,
          status: idx === 0 ? 'in_progress' : 'pending',
          order_index: idx,
        }));

        await supabaseAdmin
          .from('student_syllabus')
          .insert(syllabusEntries);

        console.log(`  ✓ Alumno ${enrollment.student_id}`);
      }

      // Configurar persona por defecto
      await supabaseAdmin
        .from('persona_configs')
        .insert([{
          course_id: course.id,
          tone: 'motivador',
          explanation_style: 'detallado',
          language: 'es',
          difficulty_level: 'intermedio',
        }])
        .select()
        .single();

      console.log(`  ✓ Persona configurada`);
    }

    console.log('\n✅ Inicialización completada');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

initializeAll();
```

---

## ¿Qué Sigue Después (Paso 3)?

**Paso 3:** Configurar Persona de Cursos

Ver: `QUICK_START_PEDAGOGICAL.md` Paso 3

---

## Verificar que Funcionó

En Supabase, ejecuta:

```sql
-- Verificar student_syllabus
SELECT COUNT(*) FROM student_syllabus;

-- Ver primer tema de un alumno
SELECT * FROM student_syllabus 
WHERE student_id = 'alumno-id'
ORDER BY order_index;

-- Verificar persona_configs
SELECT * FROM persona_configs;
```

---

**¿Listo para Paso 3?**

Paso 3 es **Configurar Persona de Cursos** - Ya tienes las funciones, solo necesitas ejecutarlas.
