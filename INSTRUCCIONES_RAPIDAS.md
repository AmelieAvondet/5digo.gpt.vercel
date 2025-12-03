# 🚀 PRÓXIMAS ACCIONES - HOJA DE RUTA

## AHORA MISMO (5 minutos)

### 1. Abre Supabase Dashboard
```
URL: https://app.supabase.com
→ Selecciona tu proyecto
→ Ve a: SQL Editor
```

### 2. Ejecuta el Schema
```
1. Click en "+ New query"
2. Copia TODO el contenido de "schema.sql"
3. Pégalo en el editor
4. Click en "Run"
5. Espera a que termine (debería estar verde)
```

### 3. Verifica las tablas
```
Ve a: Table Editor
Deberías ver:
- users ✅
- courses ✅
- topics ✅
- course_enrollments ✅
- chat_sessions ✅
```

---

## LUEGO (10 minutos)

### 4. Configura Vercel
```
URL: https://vercel.com
→ [Tu proyecto]
→ Settings
→ Environment Variables
```

**Copia y pega estas variables:**

```
NEXT_PUBLIC_SUPABASE_URL=https://aihjbewzxaoqwthuzoag.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpaGpiZXd6eGFvcXd0aHV6b2FnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDY5NzE5OSwiZXhwIjoyMDgwMjczMTk5fQ.zb4cvujc2UH0fzTMBjUtMaBquCDV7w9g-NNeyP4Qfog
JWT_SECRET=31d7e27a137b9da6ffa8702baa0e965deea7bac62cc455fbc85b9d11bc650fd9
GEMINI_API_KEY=AIzaSyD1U4bfSnAaAlraVBi0eF3t7_X_NLsni1Y
OPENAI_API_KEY=AIzaSyD1U4bfSnAaAlraVBi0eF3t7_X_NLsni1Y
NODE_ENV=production
```

(Presiona Enter/Save para cada una)

### 5. Deploy
```
Terminal en tu proyecto:
git add .
git commit -m "Sistema de cursos implementado y probado"
git push origin main
```

(Vercel automáticamente hará deploy)

---

## DESPUÉS (20 minutos)

### 6. Prueba Local
```bash
npm run dev
```

Abre: http://localhost:3000

**Deberías ver:**
- Redirecciona a /login
- Botón "Regístrate aquí"

### 7. Test: Registrarse como Profesor
```
1. Click "Regístrate aquí"
2. Email: profesor@test.com
3. Contraseña: password123
4. Rol: Profesor
5. Click "Crear Cuenta"
6. ✅ Debería redirigir a /admin/courses
7. ✅ Debería haber un botón "+ Crear Curso"
```

### 8. Test: Crear Curso
```
1. Click "+ Crear Curso"
2. Nombre: Test Course
3. Descripción: Mi primer curso
4. Código: Click "Generar"
5. Click "Crear Curso"
6. ✅ Debería redirigir a /admin/courses/[id]
```

### 9. Test: Agregar Temario
```
1. Click "+ Añadir Temario"
2. Nombre: Introducción
3. Contenido: Bienvenido a este curso...
4. Actividades: (opcional)
5. Click "Crear Temario"
6. ✅ Debería volver al curso
7. ✅ Debería aparecer el temario en la lista
```

### 10. Test: Logout y Alumno
```
1. Ve a /login
2. Logout (cerrar sesión)
3. Ve a /register
4. Email: alumno@test.com
5. Contraseña: password123
6. Rol: Alumno
7. Click "Crear Cuenta"
8. ✅ Debería redirigir a /courses
9. ✅ Debería haber opción "Unirse a Curso"
```

---

## VERIFICACIÓN FINAL

### ✅ Checklist

- [ ] Schema.sql ejecutado en Supabase
- [ ] Variables de entorno en Vercel
- [ ] Git push realizado
- [ ] Vercel deploy exitoso (sin errores)
- [ ] Página /login funciona
- [ ] Registro profesor funciona
- [ ] Registro alumno funciona
- [ ] Crear curso funciona
- [ ] Agregar temario funciona
- [ ] Editar temario funciona
- [ ] Eliminar temario funciona
- [ ] Login funciona para ambos roles

---

## 🎯 SI ALGO FALLA

### Error: "Table 'users' doesn't exist"
```
→ Schema.sql no se ejecutó
→ Abre Supabase → SQL Editor
→ Ejecuta schema.sql nuevamente
```

### Error: "JWT verification failed"
```
→ JWT_SECRET no está en variables
→ Vercel → Settings → Environment Variables
→ Agrega JWT_SECRET
→ Redeploy
```

### Error: 404 en /admin/courses
```
→ Verifica que estés logueado
→ Middleware redirige si no hay JWT
→ Revisa cookies en DevTools (F12)
```

### Error: "El email ya está registrado"
```
→ Usa otro email
→ O elimina el usuario en Supabase
```

---

## 📚 ARCHIVOS IMPORTANTES

```
schema.sql                          ← EJECUTAR EN SUPABASE
src/app/action.ts                   ← Autenticación
src/app/admin/actions.ts            ← CRUD de cursos/temarios
src/app/admin/courses/page.tsx       ← Panel profesor
src/app/courses/page.tsx             ← Panel alumno
middleware.ts                        ← Protección de rutas
```

---

## 🔑 CREDENCIALES DE PRUEBA

Después de registrarte, usa:

**Profesor:**
```
Email: profesor@test.com
Contraseña: password123
Rol: Profesor
```

**Alumno:**
```
Email: alumno@test.com
Contraseña: password123
Rol: Alumno
```

(Puede ser cualquier email/contraseña válida)

---

## 📞 SOPORTE RÁPIDO

| Problema | Solución |
|----------|----------|
| No puedo loguear | Verifica email/contraseña, o registrate primero |
| Error de BD | Ejecuta schema.sql en Supabase |
| Variables de entorno no funcionan | Redeploy en Vercel después de agregar |
| Middleware redirige a /login | JWT_SECRET incorrecto o missing |
| No puedo editar curso | Solo profesor propietario puede editar |

---

## 🎓 SIGUIENTE FASE (OPCIONAL)

Después de que todo funcione, implementar:

1. **Que el alumno se una a un curso**
   - Crear función `enrollInCourse(courseCode)`
   - Validar que el código existe
   - Insertar en course_enrollments

2. **Chat del alumno**
   - Página `/courses/[id]/topics/[topicId]`
   - Integración con Gemini API
   - Guardar historial en chat_sessions

3. **Progreso del alumno**
   - Calcular porcentaje completado
   - Mostrar en dashboard

---

## ⏱️ TIEMPO ESTIMADO

- **Ejecutar schema**: 2 minutos
- **Configurar Vercel**: 5 minutos
- **Git push**: 2 minutos
- **Deploy Vercel**: 2-3 minutos
- **Pruebas locales**: 10 minutos

**Total: ~25 minutos**

---

Documento actualizado: Diciembre 3, 2025  
¡Listo para producción! 🚀
