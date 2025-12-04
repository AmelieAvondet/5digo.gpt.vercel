# 🎓 Arquitectura de Agente Pedagógico - Implementación Completa

## Estado: ✅ IMPLEMENTADO Y COMPILADO

Esta documentación describe la arquitectura de Sistema Educativo Inteligente basado en LLMs implementada en tu proyecto. Resuelve el problema de la "pérdida de contexto" en sesiones educativas largas mediante una arquitectura de **Máquina de Estados**.

---

## 📋 Tabla de Contenidos

1. [Conceptos Principales](#conceptos-principales)
2. [Componentes Implementados](#componentes-implementados)
3. [Flujo de Datos](#flujo-de-datos)
4. [Archivos Creados](#archivos-creados)
5. [Schema de Base de Datos](#schema-de-base-de-datos)
6. [Cómo Usar](#cómo-usar)
7. [Próximos Pasos](#próximos-pasos)

---

## 🧠 Conceptos Principales

### 1. El Agente Docente (Síncrono)
- **Rol:** Interactúa en tiempo real con el alumno
- **Función:** Enseña y gestiona el "puntero" del programa (syllabus)
- **Características:**
  - Responde en baja latencia (sin generar resúmenes largos)
  - Devuelve respuesta dual: **Texto para el usuario + JSON de estado**
  - Mantiene la personificación pedagógica según `PERSONA_CONFIG`
  - Evalúa comprensión y avanza en el Syllabus

### 2. El Agente Notario (Asíncrono)
- **Rol:** Proceso oculto en background
- **Función:** Genera resúmenes pedagógicos de alta calidad
- **Trigger:** Se activa SOLO cuando `trigger_summary_generation === true`
- **Características:**
  - "Fire and Forget" - NO bloquea la respuesta al usuario
  - Lee el historial completo del tema
  - Genera insights pedagógicos (dudas, analogías efectivas, engagement)
  - Guarda resúmenes en BD para futuras referencias

### 3. Máquina de Estados (Syllabus)
- **Estados por Tema:**
  - `pending` - No iniciado
  - `in_progress` - Siendo enseñado
  - `completed` - Completado y resumido

- **Gestión Automática:**
  - El Docente evalúa comprensión
  - Marca temas como completados
  - Activa automáticamente el siguiente tema

---

## 🏗️ Componentes Implementados

### Archivos Creados/Modificados

| Archivo | Rol | Estado |
|---------|-----|--------|
| `lib/prompts.ts` | Define TEACHER_PROMPT y NOTARY_PROMPT | ✅ Creado |
| `lib/stateParser.ts` | Parse de respuestas JSON del LLM | ✅ Creado |
| `lib/dbHelpers.ts` | Queries para Syllabus y Summaries | ✅ Creado |
| `lib/notaryAgent.ts` | Lógica del Agente Notario | ✅ Creado |
| `src/app/chat/action.ts` | Orquestador principal (refactorizado) | ✅ Refactorizado |
| `schema.sql` | Nuevas tablas (persona_configs, student_syllabus, topic_summaries) | ✅ Actualizado |

---

## 🔄 Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│ USUARIO ENVÍA MENSAJE                                           │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ ORQUESTADOR (handleStudentMessage)                              │
│ ├─ Validar autenticación                                         │
│ ├─ Obtener Syllabus + Persona del estudiante                    │
│ └─ Construir contexto pedagógico                                │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ AGENTE DOCENTE (Gemini LLM) - SÍNCRONO                         │
│ ├─ Input: PERSONA_JSON + SYLLABUS_JSON + USER_INPUT            │
│ ├─ Evalúa comprensión del tema actual                          │
│ ├─ Genera respuesta pedagógica                                 │
│ └─ Output: Texto + JSON ###STATE_UPDATE###                     │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PARSEO DE RESPUESTA                                             │
│ ├─ extractTextResponse() → Texto para el usuario               │
│ └─ extractStateJSON() → Estado nuevo del Syllabus              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ ACTUALIZACIÓN DE BD (Síncrono)                                  │
│ ├─ updateSyllabusState() → Guardar nuevo estado                │
│ └─ Marcar temas completados/in_progress/pending                │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
          ┌──────────────────────────┐
          │ RETORNAR AL USUARIO      │ ← RESPUESTA RÁPIDA
          │ (Sin esperar Notario)    │
          └──────────────────────────┘
                     │
                     │ (SI trigger_summary_generation === true)
                     │
                     ▼ ASINCRÓNICO (Fire and Forget)
┌─────────────────────────────────────────────────────────────────┐
│ AGENTE NOTARIO (Background) - ASINCRÓNICO                      │
│ ├─ getChatHistoryForTopic() → Obtener historial del tema       │
│ ├─ NOTARY_PROMPT → Gemini genera resumen                       │
│ ├─ Output: JSON pedagógico estructurado                         │
│ └─ saveTopicSummary() → Guardar en BD para futuro              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Archivos Creados

### 1. `lib/prompts.ts`
Define los dos prompts del sistema:

**TEACHER_PROMPT:**
- Recibe: PERSONA_CONFIG, SYLLABUS_STATE, USER_INPUT
- Genera: Respuesta pedagógica + JSON de estado
- Estructura: Texto + `###STATE_UPDATE###` + JSON

**NOTARY_PROMPT:**
- Recibe: CHAT_HISTORY de un tema
- Genera: Resumen pedagógico estructurado
- Output: JSON puro (sin markdown)

### 2. `lib/stateParser.ts`
Utilidades para parsear respuestas JSON:
- `cleanAndParseJSON()` - Limpia y parsea JSON del LLM
- `extractTextResponse()` - Extrae texto antes del delimitador
- `extractStateJSON()` - Extrae JSON después del delimitador
- `isValidStateUpdate()` - Valida estructura del estado

### 3. `lib/dbHelpers.ts`
Funciones de acceso a base de datos:
- `getStudentSyllabus()` - Obtiene plan de estudios del alumno
- `getPersonaConfig()` - Obtiene configuración pedagógica
- `updateSyllabusState()` - Actualiza estado de temas
- `getChatHistoryForTopic()` - Obtiene historial para el Notario
- `saveTopicSummary()` - Guarda resúmenes pedagógicos
- `initializeStudentSyllabus()` - Setup inicial cuando se inscribe

### 4. `lib/notaryAgent.ts`
Orquestación del Agente Notario:
- `runNotaryProcess()` - Ejecución completa (async)
- `triggerNotaryAsync()` - Trigger sin bloquear

### 5. `src/app/chat/action.ts` (Refactorizado)
Orquestador principal:
- `handleStudentMessage()` - Flujo completo dual
- `chatWithAI()` - Compatibilidad con API anterior

---

## 🗄️ Schema de Base de Datos

### Nuevas Tablas Agregadas

#### `persona_configs`
```sql
CREATE TABLE persona_configs (
  id UUID PRIMARY KEY,
  course_id UUID REFERENCES courses(id),
  tone VARCHAR(50), -- 'profesional', 'casual', 'motivador'
  explanation_style VARCHAR(50), -- 'detallado', 'conciso', 'socrático'
  language VARCHAR(10), -- 'es', 'en', etc.
  difficulty_level VARCHAR(50), -- 'basico', 'intermedio', 'avanzado'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### `student_syllabus`
```sql
CREATE TABLE student_syllabus (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES users(id),
  course_id UUID REFERENCES courses(id),
  topic_id UUID REFERENCES topics(id),
  status VARCHAR(50), -- 'pending', 'in_progress', 'completed'
  order_index INT, -- Posición en el syllabus
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### `topic_summaries`
```sql
CREATE TABLE topic_summaries (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES users(id),
  topic_id UUID REFERENCES topics(id),
  topic_completion_summary TEXT, -- Resumen del tema
  student_doubts JSONB, -- Lista de dudas
  effective_analogies TEXT, -- Metáforas que funcionaron
  engagement_level VARCHAR(50), -- 'High', 'Medium', 'Low'
  next_session_hook TEXT, -- Gancho para la próxima sesión
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 🚀 Cómo Usar

### 1. Setup Inicial de Base de Datos

```bash
# Ejecutar el script de schema actualizado
psql postgresql://[user]:[password]@[host]:5432/[database] < schema.sql
```

### 2. Inicializar Syllabus para un Estudiante

Cuando un alumno se inscribe a un curso:

```typescript
import { initializeStudentSyllabus } from '@/lib/dbHelpers';

// Se llama al inscribirse
await initializeStudentSyllabus(studentId, courseId);
```

### 3. Enviar Mensaje en Chat

El flujo se dispara automáticamente:

```typescript
import { handleStudentMessage } from '@/app/chat/action';

// Usuario envía mensaje
const result = await handleStudentMessage(courseId, userMessage);
// Retorna inmediatamente con respuesta
// El Notario se ejecuta en background (si corresponde)
```

### 4. Configurar Persona del Curso

```typescript
import { supabaseAdmin } from '@/lib/supabase';

// Configurar estilo pedagógico del curso
await supabaseAdmin
  .from('persona_configs')
  .insert([{
    course_id: courseId,
    tone: 'motivador',
    explanation_style: 'detallado',
    language: 'es',
    difficulty_level: 'intermedio'
  }]);
```

---

## 🔧 Configuración Avanzada

### Modificar Prompts

Los prompts están en `lib/prompts.ts`. Puedes modificarlos para:
- Cambiar tono pedagógico
- Agregar reglas de evaluación
- Modificar formato de salida

### Personalizar Notario

En `lib/notaryAgent.ts`:
- Cambiar modelo LLM (actualmente `gemini-2.0-flash`)
- Modificar cantidad de contexto que procesa
- Agregar pasos de post-procesamiento

### Extender State Updates

En `lib/stateParser.ts`, expande `AIStateUpdate`:
```typescript
export interface AIStateUpdate {
  trigger_summary_generation: boolean;
  current_topic_id: string;
  topics_updated: Array<{ topic_id: string; status: string }>;
  // Agregar nuevos campos aquí
  custom_field?: string;
}
```

---

## ⚠️ Consideraciones Importantes

### 1. "Fire and Forget" para el Notario

El Agente Notario se ejecuta sin esperar:
```typescript
triggerNotaryAsync(userId, topicId);
// No es await - retorna inmediatamente
```

Esto asegura que el usuario reciba la respuesta del Docente sin latencia.

### 2. Manejo de Errores del Notario

Si el Notario falla:
- Se logea el error
- NO afecta la respuesta al usuario
- El historial sigue disponible para intentos futuros

### 3. Consistencia de IDs

El Agente Docente **DEBE copiar exactamente** los IDs del input:
```typescript
// ✅ CORRECTO
"topic_id": "abc-123" // Copiado del SYLLABUS_JSON

// ❌ INCORRECTO
"topic_id": "new-id-generated" // Genera IDs nuevos
```

---

## 📈 Próximos Pasos

### Inmediatos (Para Producción)
1. ✅ Crear tablas en Supabase
2. ✅ Probar flujo completo localmente
3. ✅ Compilar para Vercel
4. [ ] Desplegaren Vercel
5. [ ] Monitorear logs del Notario

### Mejoras Futuras
- [ ] WebSockets para respuestas en tiempo real
- [ ] Caching de resúmenes pedagógicos
- [ ] Dashboard para profesores con métricas de aprendizaje
- [ ] Integración con más LLMs (Claude, GPT-4, etc.)
- [ ] Exportar historial educativo del alumno
- [ ] Detección automática de temas difíciles
- [ ] Sistema de recomendaciones de estudio

### Optimizaciones
- [ ] Batch processing de múltiples alumnos en Notario
- [ ] Pre-generación de resúmenes en background
- [ ] Caching inteligente de contextos pedagógicos
- [ ] Rate limiting por usuario

---

## 🎯 Ejemplo Completo de Flujo

**Escenario:** Alumno aprendiendo "Variables en JavaScript"

```
1. Alumno escribe: "¿Qué es una variable?"

2. DOCENTE recibe contexto:
   - PERSONA: tone='motivador', explanation_style='detallado'
   - SYLLABUS: current_topic='variables', status='in_progress'
   - INPUT: "¿Qué es una variable?"

3. DOCENTE responde:
   Texto: "Excelente pregunta. Una variable es como una caja 
           donde guardas valores. Imagina que tienes una caja 
           etiquetada 'edad' y dentro guardas el número 25..."
   JSON: {
     "trigger_summary_generation": false,
     "current_topic_id": "vars-001",
     "topics_updated": [{"topic_id": "vars-001", "status": "in_progress"}]
   }

4. BD se actualiza: Variables sigue "in_progress"

5. Usuario recibe respuesta inmediatamente

---

6. Alumno responde correctamente la tarea

7. DOCENTE detecta comprensión:
   Texto: "¡Perfecto! Has entendido las variables. 
           Ahora vamos con los Tipos de Datos..."
   JSON: {
     "trigger_summary_generation": true,  ← TRIGGER ACTIVADO
     "current_topic_id": "vars-001",
     "topics_updated": [
       {"topic_id": "vars-001", "status": "completed"},
       {"topic_id": "types-001", "status": "in_progress"}
     ]
   }

8. BD se actualiza: Variables = "completed", Tipos = "in_progress"

9. Usuario recibe respuesta inmediatamente

---

10. EN BACKGROUND (sin bloquear):
    NOTARIO lee historial completo de Variables
    Genera: {
      "topic_completion_summary": "Alumno comprendió que variables 
                                   son contenedores de valores...",
      "pedagogical_notes": {
        "student_doubts": ["¿Puedo cambiar el tipo?", "¿Diferencia 
                          entre let y const?"],
        "effective_analogies": "Metáfora de 'cajas' fue muy efectiva",
        "engagement_level": "High"
      },
      "next_session_hook": "Recuerda que completaste Variables, 
                            ahora aprenderemos Tipos de Datos"
    }

11. Resumen se guarda en BD para futuras referencias
```

---

## 📞 Soporte

Si tienes dudas sobre la arquitectura:
1. Revisa los comentarios en `lib/*.ts`
2. Consulta el documento original "IA Docente.txt"
3. Revisa los logs en consola (hay logging extenso)

---

**Última actualización:** 4 de Diciembre, 2025  
**Status:** ✅ Implementado y Compilado  
**Pronto:** Despliegue a Vercel
