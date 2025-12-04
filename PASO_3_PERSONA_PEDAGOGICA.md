# Paso 3: Configurar Persona de Cursos

## ¿Qué es la Persona?

Es el **tono y estilo pedagógico** que el Agente Docente usará al enseñar. Define cómo se comunica con los alumnos.

---

## 🎯 Opciones de Persona

### **Tono de Voz**
| Opción | Descripción |
|--------|-------------|
| 🎓 **Profesional** | Formal, académico, riguroso |
| 😊 **Casual** | Relajado, amigable, conversacional |
| 🌟 **Motivador** | Entusiasta, inspirador, supportivo |

### **Estilo de Explicación**
| Opción | Descripción |
|--------|-------------|
| 📖 **Detallado** | Explicaciones exhaustivas con ejemplos |
| ⚡ **Conciso** | Explicaciones breves y directas |
| ❓ **Socrático** | Preguntas para que descubra por sí mismo |

### **Nivel de Dificultad**
| Opción | Descripción |
|--------|-------------|
| 🟢 **Básico** | Principiantes, conceptos fundacionales |
| 🟡 **Intermedio** | Conocimiento previo, aplicaciones |
| 🔴 **Avanzado** | Expertos, tópicos complejos |

### **Idioma**
- Español (es)
- English (en)
- Português (pt)
- Français (fr)

---

## 🚀 Opción 1: Panel Gráfico (Recomendado)

### Acceder desde Admin

```
https://tu-app.com/admin/persona
```

**Pasos:**
1. Profesor inicia sesión
2. Ir a `/admin/persona`
3. Seleccionar curso
4. Elegir tono, estilo, nivel e idioma
5. Click "Guardar Configuración"

✅ **Ventaja:** Interfaz visual intuitiva

---

## 🖥️ Opción 2: Por Código (Para Automatizar)

```typescript
import { setPersonaForCourse } from '@/app/admin/actions';

const result = await setPersonaForCourse(courseId, {
  tone: 'motivador',           // 'profesional' | 'casual' | 'motivador'
  explanation_style: 'detallado', // 'detallado' | 'conciso' | 'socrático'
  language: 'es',               // 'es' | 'en' | 'pt' | 'fr'
  difficulty_level: 'intermedio' // 'basico' | 'intermedio' | 'avanzado'
});

console.log(result); // { success: true } o { error: "..." }
```

---

## 💡 Ejemplos de Configuración

### **Curso: JavaScript Básico**
```typescript
{
  tone: 'motivador',
  explanation_style: 'detallado',
  language: 'es',
  difficulty_level: 'basico'
}
```
**Resultado:** Docente entusiasta que explica paso a paso

---

### **Curso: Algoritmos Avanzados**
```typescript
{
  tone: 'profesional',
  explanation_style: 'socrático',
  language: 'es',
  difficulty_level: 'avanzado'
}
```
**Resultado:** Docente que hace preguntas para que descubran

---

### **Curso: React Intermedio (EN)**
```typescript
{
  tone: 'casual',
  explanation_style: 'conciso',
  language: 'en',
  difficulty_level: 'intermedio'
}
```
**Resultado:** Docente amigable y directo al punto

---

## ¿Cómo Afecta la Persona?

La Persona se inyecta en el `TEACHER_PROMPT`:

```typescript
const teacherPromptFilled = fillPrompt(TEACHER_PROMPT, {
  PERSONA_JSON: JSON.stringify(persona), // ← AQUÍ
  SYLLABUS_JSON: JSON.stringify(syllabus),
  USER_INPUT: userMessage,
});
```

Gemini recibe:
```json
{
  "tone": "motivador",
  "explanation_style": "detallado",
  "language": "es",
  "difficulty_level": "basico"
}
```

Y ajusta su respuesta en consecuencia.

---

## 🔄 ¿Se puede cambiar después?

✅ **Sí, en cualquier momento**

1. Profesor va a `/admin/persona`
2. Selecciona el curso
3. Cambia la configuración
4. Las **próximas respuestas** del Docente usarán la nueva Persona

Nota: El historial anterior no cambia, solo las nuevas respuestas.

---

## Checklist - Paso 3

- [ ] **1. Acceder a `/admin/persona`**

- [ ] **2. Para cada curso, configurar:**
  - [ ] Tono
  - [ ] Estilo de explicación
  - [ ] Nivel de dificultad
  - [ ] Idioma

- [ ] **3. Click "Guardar Configuración"**
  - [ ] Debe mostrar ✅ Persona configurada exitosamente

- [ ] **4. Verificar en BD**
  ```sql
  SELECT * FROM persona_configs;
  ```

---

## Verificar que Funcionó

En Supabase SQL Editor:

```sql
-- Ver configuraciones guardadas
SELECT 
  c.name as curso,
  p.tone,
  p.explanation_style,
  p.language,
  p.difficulty_level
FROM persona_configs p
JOIN courses c ON p.course_id = c.id;
```

**Resultado esperado:**
```
| curso | tone | explanation_style | language | difficulty_level |
|-------|------|-------------------|----------|------------------|
| JavaScript 101 | motivador | detallado | es | basico |
| React Avanzado | profesional | socrático | es | avanzado |
```

---

## 🧪 Prueba en Chat

Después de configurar la Persona:

1. Alumno accede a `/chat`
2. Selecciona el curso
3. Envía un mensaje
4. El Agente Docente responde con el **tono configurado** ✓

Ejemplo:
- **Persona "motivador":** "¡Excelente pregunta! 🌟 Te ayudaré a..."
- **Persona "profesional":** "Según la teoría de... la respuesta es..."
- **Persona "casual":** "Mira, es simple. Lo que pasa es que..."

---

## Parámetros de Persona en Prompt

El TEACHER_PROMPT usa la Persona así:

```python
# En TEACHER_PROMPT
<PERSONA_CONFIG>
{
  "tone": "motivador",
  "explanation_style": "detallado",
  "language": "es",
  "difficulty_level": "basico"
}
</PERSONA_CONFIG>

# Instrucciones:
"Tu tono debe ser: {{tone}}"
"Estilo de explicación: {{explanation_style}}"
"Adapta al nivel: {{difficulty_level}}"
"Responde en idioma: {{language}}"
```

---

## 🎓 Recomendaciones

### Para Cursos Principiantes
```
tone: "motivador"
explanation_style: "detallado"
difficulty_level: "basico"
```

### Para Cursos Profesionales
```
tone: "profesional"
explanation_style: "conciso"
difficulty_level: "avanzado"
```

### Para Cursos Auto-Dirigidos
```
tone: "casual"
explanation_style: "socrático"
difficulty_level: "intermedio"
```

---

## Próximo Paso

**Paso 4:** Deploy a Vercel

Ver: `PASO_4_DEPLOY_VERCEL.md`
