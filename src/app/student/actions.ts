// src/app/student/actions.ts
"use server";

import { supabaseAdmin } from '@/lib/supabase';
import { getUserIdFromToken } from '@/lib/auth';
import { GoogleGenAI } from "@google/genai";

// Inicializar cliente de Gemini
const ai = new GoogleGenAI({});

// ============ INSCRIPCIONES A CURSOS ============

// Inscribirse a un curso usando código
export async function enrollInCourse(courseCode: string) {
  if (!courseCode || !courseCode.trim()) {
    return { error: 'El código del curso es requerido' };
  }

  try {
    const studentId = await getUserIdFromToken();
    if (!studentId) {
      return { error: 'No estás autenticado' };
    }

    // Buscar el curso por código
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('code', courseCode.trim().toUpperCase())
      .single();

    if (courseError || !course) {
      return { error: 'Código de curso no válido' };
    }

    // Verificar si ya está inscrito
    const { data: existing } = await supabaseAdmin
      .from('course_enrollments')
      .select('id')
      .eq('student_id', studentId)
      .eq('course_id', course.id)
      .single();

    if (existing) {
      return { error: 'Ya estás inscrito en este curso' };
    }

    // Crear la inscripción
    const { data: enrollment, error: enrollError } = await supabaseAdmin
      .from('course_enrollments')
      .insert([{ student_id: studentId, course_id: course.id, progress: 0 }])
      .select('id')
      .single();

    if (enrollError) {
      return { error: 'Error al inscribirse en el curso' };
    }

    // ===== NUEVO: Inicializar Syllabus automáticamente =====
    console.log(`[STUDENT] Initializing syllabus for student ${studentId} in course ${course.id}`);
    
    // Obtener todos los topics del curso
    const { data: topics, error: topicsError } = await supabaseAdmin
      .from('topics')
      .select('id')
      .eq('course_id', course.id)
      .order('created_at', { ascending: true });

    if (topicsError || !topics || topics.length === 0) {
      console.warn('[STUDENT] No topics found for course, skipping syllabus initialization');
      return { success: true, courseId: course.id, warning: 'Curso sin temas' };
    }

    // Crear entrada de Syllabus para cada topic
    const syllabusEntries = topics.map((topic, index) => ({
      student_id: studentId,
      course_id: course.id,
      topic_id: topic.id,
      status: index === 0 ? 'in_progress' : 'pending',
      order_index: index,
    }));

    const { error: syllabusError } = await supabaseAdmin
      .from('student_syllabus')
      .insert(syllabusEntries);

    if (syllabusError) {
      console.error('[STUDENT] Error initializing syllabus:', syllabusError);
      // No retornar error - la inscripción fue exitosa, solo falla el syllabus
    } else {
      console.log(`[STUDENT] ✓ Syllabus initialized with ${topics.length} topics`);
    }

    return { success: true, courseId: course.id };
  } catch (error) {
    console.error('Error en enrollInCourse:', error);
    return { error: 'Error al procesar tu solicitud' };
  }
}

// Obtener cursos inscritos del estudiante
export async function getStudentCourses() {
  try {
    const studentId = await getUserIdFromToken();
    if (!studentId) {
      return { error: 'No estás autenticado', courses: [] };
    }

    const { data: enrollments, error: enrollError } = await supabaseAdmin
      .from('course_enrollments')
      .select(`
        id,
        progress,
        courses (
          id,
          name,
          description,
          code,
          created_at,
          users (
            email
          )
        )
      `)
      .eq('student_id', studentId);

    if (enrollError) {
      return { error: 'Error al cargar cursos', courses: [] };
    }

    const courses = enrollments?.map((e: any) => ({
      enrollmentId: e.id,
      id: e.courses.id,
      name: e.courses.name,
      description: e.courses.description,
      code: e.courses.code,
      progress: e.progress,
      teacher: e.courses.users?.email || 'Desconocido',
      created_at: e.courses.created_at,
    })) || [];

    return { success: true, courses };
  } catch (error) {
    console.error('Error en getStudentCourses:', error);
    return { error: 'Error al procesar tu solicitud', courses: [] };
  }
}

// Obtener detalles de un curso inscrito (con temarios)
export async function getStudentCourseDetails(courseId: string) {
  try {
    const studentId = await getUserIdFromToken();
    if (!studentId) {
      return { error: 'No estás autenticado' };
    }

    // Verificar que está inscrito
    const { data: enrollment, error: enrollError } = await supabaseAdmin
      .from('course_enrollments')
      .select('id, progress')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .single();

    if (enrollError || !enrollment) {
      return { error: 'No estás inscrito en este curso' };
    }

    // Obtener detalles del curso
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select(`
        id,
        name,
        description,
        code,
        created_at,
        users (
          email
        )
      `)
      .eq('id', courseId)
      .single();

    if (courseError) {
      return { error: 'Error al cargar el curso' };
    }

    // Obtener temarios
    const { data: topics, error: topicsError } = await supabaseAdmin
      .from('topics')
      .select('id, name, content, activities, created_at')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true });

    if (topicsError) {
      return { error: 'Error al cargar los temarios' };
    }

    // Obtener el estado de cada topic desde student_syllabus
    const { data: syllabusData, error: syllabusError } = await supabaseAdmin
      .from('student_syllabus')
      .select('topic_id, status')
      .eq('student_id', studentId)
      .eq('course_id', courseId);

    if (syllabusError) {
      console.error('[STUDENT] Error loading syllabus:', syllabusError);
    }

    // Crear mapa de estados por topic_id
    const topicStatusMap = new Map<string, string>();
    syllabusData?.forEach(item => {
      topicStatusMap.set(item.topic_id, item.status);
    });

    // Calcular progreso real basado en topics completados
    const totalTopics = topics?.length || 0;
    const completedTopics = syllabusData?.filter(t => t.status === 'completed').length || 0;
    const realProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    // Agregar estado a cada topic
    const topicsWithStatus = topics?.map(topic => ({
      ...topic,
      status: (topicStatusMap.get(topic.id) || 'pending') as 'pending' | 'in_progress' | 'completed',
    })) || [];

    const teacherEmail = Array.isArray((course as any).users)
      ? (course as any).users[0]?.email || 'Desconocido'
      : (course as any).users?.email || 'Desconocido';

    return {
      success: true,
      course: {
        id: course.id,
        name: course.name,
        description: course.description,
        code: course.code,
        teacher: teacherEmail,
        created_at: course.created_at,
      },
      topics: topicsWithStatus,
      progress: realProgress,
    };
  } catch (error) {
    console.error('Error en getStudentCourseDetails:', error);
    return { error: 'Error al procesar tu solicitud' };
  }
}

// Abandonar un curso
export async function dropCourse(courseId: string) {
  try {
    const studentId = await getUserIdFromToken();
    if (!studentId) {
      return { error: 'No estás autenticado' };
    }

    const { error } = await supabaseAdmin
      .from('course_enrollments')
      .delete()
      .eq('student_id', studentId)
      .eq('course_id', courseId);

    if (error) {
      return { error: 'Error al abandonar el curso' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error en dropCourse:', error);
    return { error: 'Error al procesar tu solicitud' };
  }
}

// ============ CHAT Y TEMARIOS ============

// Obtener detalles de un temario con historial de chat
export async function getTopicDetails(courseId: string, topicId: string) {
  try {
    const studentId = await getUserIdFromToken();
    if (!studentId) {
      return { error: 'No estás autenticado' };
    }

    // Verificar que está inscrito en el curso
    const { data: enrollment } = await supabaseAdmin
      .from('course_enrollments')
      .select('id')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .single();

    if (!enrollment) {
      return { error: 'No estás inscrito en este curso' };
    }

    // Obtener detalles del temario
    const { data: topic, error: topicError } = await supabaseAdmin
      .from('topics')
      .select('id, name, content, activities, created_at')
      .eq('id', topicId)
      .eq('course_id', courseId)
      .single();

    if (topicError || !topic) {
      return { error: 'Temario no encontrado' };
    }

    // Obtener o crear sesión de chat
    const { data: chatSession, error: chatError } = await supabaseAdmin
      .from('chat_sessions')
      .select('id, context_data')
      .eq('student_id', studentId)
      .eq('topic_id', topicId)
      .single();

    let sessionId = chatSession?.id;

    if (!sessionId) {
      // Crear nueva sesión
      const { data: newSession, error: newSessionError } = await supabaseAdmin
        .from('chat_sessions')
        .insert([{
          student_id: studentId,
          topic_id: topicId,
          context_data: JSON.stringify([]),
        }])
        .select('id')
        .single();

      if (newSessionError) {
        return { error: 'Error al crear sesión de chat' };
      }

      sessionId = newSession.id;
    }

    return {
      success: true,
      topic: {
        id: topic.id,
        name: topic.name,
        content: topic.content,
        activities: topic.activities,
        created_at: topic.created_at,
      },
      sessionId,
      chatHistory: chatSession?.context_data ? JSON.parse(chatSession.context_data) : [],
    };
  } catch (error) {
    console.error('Error en getTopicDetails:', error);
    return { error: 'Error al procesar tu solicitud' };
  }
}

// Guardar mensaje en el chat
export async function saveChatMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string
) {
  try {
    const studentId = await getUserIdFromToken();
    if (!studentId) {
      return { error: 'No estás autenticado' };
    }

    // Obtener la sesión actual
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('chat_sessions')
      .select('context_data')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return { error: 'Sesión no encontrada' };
    }

    // Agregar el nuevo mensaje
    const chatHistory = JSON.parse(session.context_data) || [];
    chatHistory.push({ role, content, timestamp: new Date().toISOString() });

    // Actualizar la sesión
    const { error: updateError } = await supabaseAdmin
      .from('chat_sessions')
      .update({ context_data: JSON.stringify(chatHistory) })
      .eq('id', sessionId);

    if (updateError) {
      return { error: 'Error al guardar el mensaje' };
    }

    return { success: true, chatHistory };
  } catch (error) {
    console.error('Error en saveChatMessage:', error);
    return { error: 'Error al procesar tu solicitud' };
  }
}

// Generar respuesta con Gemini API - Tutor IA Estricto
export async function generateAIResponse(
  topicName: string,
  topicContent: string,
  userMessage: string,
  chatHistory: any[],
  topicId?: string,
  courseData?: any
) {
  try {
    // Prompt ESTRICTO con protocolo de clase y JSON
    const systemPrompt = `Eres "Tutor IA", un asistente educativo experto, sumamente paciente y CRÍTICAMENTE ESTRICTO CON EL PROTOCOLO DE CLASE Y LA SALIDA JSON.

Tu objetivo fundamental es guiar al alumno paso a paso a través del Temario, asegurando la comprensión antes de avanzar.

[ROL Y PERSONALIDAD IMPERATIVA]
1. Modo de Operación: Estás en modo de Tutoría Dirigida.
2. Tono: Profesional, motivador. Siempre responde en español.
3. Prioridad Máxima: Las reglas de Clase y Evaluación tienen prioridad sobre cualquier pregunta que no esté relacionada con el subtema actual.

[TEMA ACTUAL]
Nombre: "${topicName}"
ID: "${topicId || 'current'}"
Contenido:
${topicContent}

[REGLAS DE CLASE Y CONVERSACIÓN ESTRICTAS]
1. INICIO DE TEMA (Clase): Si es la primera interacción o el alumno no ha completado el subtema, INICIA con una Explicación Detallada del tema, seguida de un ejemplo práctico.
2. EVALUACIÓN (Tarea): Inmediatamente después de la explicación, genera UNA TAREA con 2-3 preguntas o ejercicios para evaluar comprensión.
3. RECONDUCCIÓN (Anti-Q&A): Si el alumno hace una pregunta que NO es la tarea actual, IGNORA la pregunta directa. Responde recordándole la Tarea Pendiente o el concepto actual. NO AVANCES hasta que evalúes la tarea.
4. VALIDACIÓN: Si el alumno responde la tarea correctamente, celebra el logro y marca como completado. Si responde incorrectamente, proporciona retroalimentación constructiva y pide que lo intente de nuevo.

[FORMATO ESTRICTO DE RESPUESTA]
- Tu respuesta DEBE tener DOS partes: 
  1. TEXTO EDUCATIVO (200-400 palabras máximo)
  2. JSON DE ACCIÓN (al final, sin triple comillas ni markdown)

[PROTOCOLO DE JSON DE ACCIÓN]
El JSON DEBE ser el ÚLTIMO elemento de tu respuesta. Estructura exacta:

{"action": "update_progress", "subtopic_id": "${topicId || 'current'}", "status": "COMPLETADO"}

USAR SOLO cuando:
- El alumno responde correctamente la tarea
- El alumno demuestra comprensión del tema

CUANDO NO USAR JSON:
- En explicaciones iniciales
- Cuando generas la tarea
- Cuando el alumno responde incorrectamente
- Cuando haces reconducción

[RESPONSABILIDAD MÁXIMA]
- Eres responsable de la calidad educativa
- NO saltees etapas del aprendizaje
- Verifica comprensión antes de avanzar
- El JSON de acción es sagrado: solo úsalo cuando sea REALMENTE merecido`;

    // Construir mensajes para Gemini
    const messages = chatHistory.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    messages.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });

    let fullResponse = '';

    try {
      const aiResponse = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: systemPrompt }],
          },
          ...messages,
        ],
      } as any);

      fullResponse = aiResponse.text || '';
    } catch (error: any) {
      console.error('Gemini API error:', error);
      return {
        success: true,
        response: `Tutor IA: Entiendo. Vamos paso a paso con "${topicName}".\n\n${topicContent.substring(0, 150)}...\n\n¿Qué parte necesitas que te explique con más detalle?`,
        action: null,
        provider: 'fallback',
      };
    }

    if (!fullResponse) {
      return {
        success: true,
        response: `Tutor IA: Estoy aquí para enseñarte "${topicName}". Cuéntame qué quieres aprender.`,
        action: null,
        provider: 'fallback',
      };
    }

    // Extraer texto y JSON de la respuesta
    let textResponse = fullResponse;
    let actionData = null;

    // Buscar JSON al final
    const jsonMatch = fullResponse.match(/\{[\s\S]*?"action"[\s\S]*?\}/);
    if (jsonMatch) {
      try {
        actionData = JSON.parse(jsonMatch[0]);
        // Remover el JSON del texto visible
        textResponse = fullResponse.replace(jsonMatch[0], '').trim();
      } catch (e) {
        console.error('Error parsing JSON:', e);
      }
    }

    return {
      success: true,
      response: textResponse,
      action: actionData,
      provider: 'gemini',
    };
  } catch (error) {
    console.error('Error en generateAIResponse:', error);
    return {
      success: true,
      response: `Tutor IA: Disculpa, estoy procesando. Intenta de nuevo con tu pregunta.`,
      action: null,
      provider: 'fallback',
    };
  }
}


// Actualizar progreso del estudiante
export async function updateStudentProgress(courseId: string, progress: number) {
  try {
    const studentId = await getUserIdFromToken();
    if (!studentId) {
      return { error: 'No estás autenticado' };
    }

    const { error } = await supabaseAdmin
      .from('course_enrollments')
      .update({ progress })
      .eq('student_id', studentId)
      .eq('course_id', courseId);

    if (error) {
      return { error: 'Error al actualizar progreso' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error en updateStudentProgress:', error);
    return { error: 'Error al procesar tu solicitud' };
  }
}
