# 🚨 SOLUCIÓN RÁPIDA - ERR_CONNECTION_REFUSED

## Problema
El servidor de Next.js no inicia porque:
1. ❌ La BD de Supabase nueva NO tiene las tablas
2. ❌ Falta ejecutar schema.sql en tu Supabase actual

## Solución Inmediata (3 pasos)

### 1️⃣ Abre tu Supabase Nuevo
```
URL: https://app.supabase.com
Selecciona: pagdtqsxyocjjnjxabzu (tu BD nueva)
```

### 2️⃣ Abre SQL Editor
```
Click: SQL Editor
Click: "+ New query"
```

### 3️⃣ Copia y Ejecuta schema.sql
```sql
-- Copia TODO el contenido de schema.sql
-- Y pégalo aquí en SQL Editor
-- Luego click: Run
```

## Después de Ejecutar

Verifica que las 5 tablas se crearon:
- ✅ users
- ✅ courses
- ✅ topics
- ✅ course_enrollments
- ✅ chat_sessions

## Luego Intenta

```bash
npm run dev
```

Debería funcionar ahora.

---

## Si Sigue Sin Funcionar

Intenta esto:

```bash
# Limpiar caché
rm -r .next
rm -r node_modules

# Reinstalar
npm install

# Compilar nuevamente
npm run build

# Ejecutar
npm run dev
```

---

## ⚡ ATAJO - Usa las Variables Correctas

Tu `.env.local` tiene:
```
NEXT_PUBLIC_SUPABASE_URL=https://pagdtqsxyocjjnjxabzu.supabase.co
```

Esto es correctamente la BD nueva. Solo necesitas ejecutar schema.sql en esa BD.
