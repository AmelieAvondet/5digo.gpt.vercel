# 🚀 Guía Completa de Implementación

## 1️⃣ BASE DE DATOS - EJECUTA EN SUPABASE

Abre tu proyecto en Supabase → SQL Editor → Nueva query y copia-pega esto:

```sql
-- Arquivo: schema.sql
-- Esquema de base de datos para Educación AI

-- 1. Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'alumno' CHECK (role IN ('profesor', 'alumno')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de cursos (creados por profesores)
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  code VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de temarios dentro de cursos
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  activities TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de inscripciones de alumnos a cursos
CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  progress DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, course_id)
);

-- 5. Tabla de sesiones de chat por temario
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  context_data JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, topic_id)
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_topics_course_id ON topics(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_student_id ON chat_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_topic_id ON chat_sessions(topic_id);
```

---

## 2️⃣ CONFIGURAR VERCEL

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega estas variables (REEMPLAZA CON TUS PROPIAS CREDENCIALES):

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
JWT_SECRET=your-jwt-secret-min-32-chars
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
NODE_ENV=production
```

**⚠️ IMPORTANTE:** Obtén tus propias credenciales:
- Supabase: https://app.supabase.com → Tu proyecto → Settings → API
- Gemini API: https://aistudio.google.com/app/apikey
- JWT Secret: Genera con `openssl rand -hex 32` en terminal

---

## 3️⃣ FLUJO DE USUARIOS

### 🎯 REGISTRO
```
/register
  ├─ Email
  ├─ Contraseña
  └─ Rol: Profesor | Alumno
     ├─ Si es Profesor → /admin/courses
     └─ Si es Alumno → /courses
```

### 👨‍🏫 FLUJO DEL PROFESOR

1. **Ver mis cursos**: `/admin/courses`
   - Listar todos los cursos creados
   - Botón "+ Crear Curso"

2. **Crear curso**: `/admin/courses/new`
   - Nombre del curso
   - Descripción
   - Código (para que alumnos se unan)
   - ➜ Redirecciona a detalles del curso

3. **Detalles del curso**: `/admin/courses/[id]`
   - Información del curso
   - Listar temarios
   - Listar alumnos inscritos
   - Botón "+ Añadir Temario"
   - Botón "Editar Curso"

4. **Editar curso**: `/admin/courses/[id]/edit`
   - Modificar nombre/descripción
   - Botón "Eliminar Curso"

5. **Crear temario**: `/admin/courses/[id]/topics/new`
   - Nombre del temario
   - Contenido (usado por la IA)
   - Actividades sugeridas
   - ➜ Redirecciona a detalles del curso

6. **Editar temario**: `/admin/courses/[id]/topics/[topicId]/edit`
   - Modificar contenido
   - Botón "Eliminar Temario"

### 👨‍🎓 FLUJO DEL ALUMNO

1. **Mis cursos**: `/courses`
   - Unirse a un curso (con código)
   - Ver cursos inscritos
   - Botón "Unirse a Curso"

2. **Detalles del curso**: `/courses/[id]` *(PENDIENTE)*
   - Ver información del curso
   - Listar temarios
   - Botón para acceder a cada temario

3. **Chat del temario**: `/courses/[id]/topics/[topicId]` *(PENDIENTE)*
   - Ver contenido del temario
   - Chat con IA
   - Actividades sugeridas
   - Progreso del alumno

---

## 🛠️ ARCHIVOS CREADOS/MODIFICADOS

### ✨ NUEVOS ARCHIVOS:
```
schema.sql (renovado)
src/app/admin/actions.ts (renovado)
src/app/register/page.tsx (actualizado)
src/app/login/page.tsx (actualizado)
src/app/action.ts (actualizado)

src/app/admin/courses/page.tsx (nuevo)
src/app/admin/courses/new/page.tsx (nuevo)
src/app/admin/courses/[id]/page.tsx (nuevo)
src/app/admin/courses/[id]/edit/page.tsx (nuevo)
src/app/admin/courses/[id]/topics/new/page.tsx (nuevo)
src/app/admin/courses/[id]/topics/[topicId]/edit/page.tsx (nuevo)

src/app/courses/page.tsx (nuevo)
```

---

## 📋 PRÓXIMOS PASOS

### INMEDIATO:
- [ ] Ejecutar schema.sql en Supabase
- [ ] Configurar variables de entorno en Vercel
- [ ] Hacer git push
- [ ] Verificar que Vercel no tiene errores de build

### FUNCIONALIDAD PENDIENTE:
- [ ] Crear función `enrollInCourse()` - Permitir que alumnos se unan
- [ ] Página `/courses/[id]` - Ver detalles del curso
- [ ] Página `/courses/[id]/topics/[topicId]` - Chat con IA
- [ ] Integración con Gemini API para el chat
- [ ] Actualizar progreso del alumno
- [ ] Dashboard del alumno mejorado

---

## 🧪 PRUEBAS RECOMENDADAS

1. **Registrarse como Profesor**
   - Verificar que redirige a `/admin/courses`
   - Crear un curso
   - Agregar temarios

2. **Registrarse como Alumno**
   - Verificar que redirige a `/courses`
   - Ver página de unirse a curso

3. **Login**
   - Probar login con credenciales correctas
   - Probar login con credenciales incorrectas
   - Verificar que redirige según rol

4. **CRUD de Cursos**
   - Crear, ver, editar, eliminar cursos
   - Verificar que solo el profesor propietario puede editar

5. **CRUD de Temarios**
   - Crear, ver, editar, eliminar temarios
   - Verificar que pertenecen al curso correcto

---

## 🐛 TROUBLESHOOTING

### Error: "Table 'users' doesn't exist"
- Solución: Ejecuta el schema.sql completo en Supabase

### Error: 404 al acceder a /admin/courses
- Solución: Verifica que JWT_SECRET está configurado
- Middleware debe estar redirigiendo correctamente

### Error: "Relation 'courses' doesn't exist"
- Solución: Ejecuta el schema.sql, incluye la tabla courses

### Usuario logueado pero página no carga
- Solución: Revisa Function Logs en Vercel
- Busca errores de Supabase en los logs

---

## 📞 SOPORTE

Si hay errores:
1. Revisa los Function Logs en Vercel
2. Revisa la consola del navegador (F12)
3. Verifica que todas las variables de entorno estén en Vercel
4. Asegúrate de que el schema.sql se ejecutó completamente
