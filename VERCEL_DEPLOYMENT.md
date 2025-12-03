# 🚀 Guía de Deployment en Vercel

## 1. Configurar Variables de Entorno en Vercel Dashboard

Ve a tu proyecto en Vercel → Settings → Environment Variables

Agrega estas variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://aihjbewzxaoqwthuzoag.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpaGpiZXd6eGFvcXd0aHV6b2FnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDY5NzE5OSwiZXhwIjoyMDgwMjczMTk5fQ.zb4cvujc2UH0fzTMBjUtMaBquCDV7w9g-NNeyP4Qfog
JWT_SECRET=31d7e27a137b9da6ffa8702baa0e965deea7bac62cc455fbc85b9d11bc650fd9
OPENAI_API_KEY=AIzaSyD1U4bfSnAaAlraVBi0eF3t7_X_NLsni1Y
GEMINI_API_KEY=AIzaSyD1U4bfSnAaAlraVBi0eF3t7_X_NLsni1Y
```

## 2. Inicializar la Base de Datos

Ejecuta en tu terminal local:

```bash
# Conectarse a Supabase y ejecutar el schema
npm run setup:db
# O manualmente:
# psql postgresql://[user]:[password]@[host]:5432/[database] < schema.sql
```

## 3. Verificar Configuración de Cookies

El middleware requiere que HTTPS esté habilitado. En Vercel, esto debería ser automático.
Si aún tienes problemas con cookies, modifica `src/app/action.ts`:

```typescript
cookieStore.set('auth_token', token, {
  httpOnly: true,
  secure: true, // Vercel siempre usa HTTPS
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60,
  path: '/',
});
```

## 4. Verificar Logs en Vercel

- Ve a Deployments → Selecciona el deployment
- Click en "Function Logs"
- Busca errores relacionados con:
  - `[MIDDLEWARE]` - problemas de autenticación
  - `[AUTH]` - problemas de login
  - `[CHAT]` - problemas de chat
  - Errores de Supabase (conexión)

## 5. Troubleshooting Común

### Error 404: NOT_FOUND en Supabase
**Causa**: La tabla `users`, `chat_sessions`, etc. no existen
**Solución**: Ejecuta el schema.sql en tu base de datos Supabase

```bash
# En el dashboard de Supabase:
# SQL Editor → Abrir una nueva query → Copiar contenido de schema.sql → Ejecutar
```

### Cookies no funcionan después del login
**Causa**: Problema de configuración de cookies en la acción del servidor
**Solución**: Asegúrate que `secure: true` está configurado para HTTPS

### Error de API keys de Gemini/OpenAI
**Causa**: Las variables de entorno no están disponibles
**Solución**: Verifica que estén en Vercel Dashboard → Environment Variables

## 6. Verificación Final

Una vez deployed:

1. Abre tu app en Vercel
2. Deberías ser redirigido automáticamente a `/login`
3. Intenta registrar un usuario
4. Revisa los logs en Vercel para errores
5. Si ves `[MIDDLEWARE] Acceso denegado` sin token → problema de cookies
6. Si ves error de Supabase → problema de base de datos

## 7. Comandos Útiles

```bash
# Verificar que todo está en orden localmente
npm run build

# Ver logs mientras desarrollas
npm run dev
```
