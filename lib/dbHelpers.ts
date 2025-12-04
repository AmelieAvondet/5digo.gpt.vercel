// Archivo: lib/dbHelpers.ts
// Funciones auxiliares para interactuar con la BD para Syllabus y Summaries

import { supabaseAdmin } from '@/lib/supabase';
import { SyllabusState, TopicState, AIStateUpdate } from '@/lib/stateParser';

/**
 * Obtiene el Syllabus completo del estudiante para un curso
 */
export async function getStudentSyllabus(
  studentId: string,
  courseId: string
): Promise<SyllabusState | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('student_syllabus')
      .select('*')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('[DB] Error fetching syllabus:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    const currentTopic = data.find((t) => t.status === 'in_progress') || data[0];

    return {
      syllabus_id: data[0]?.id || '',
      course_id: courseId,
      student_id: studentId,
      topics: data.map((row) => ({
        topic_id: row.topic_id,
        status: row.status,
        order_index: row.order_index,
      })),
      current_topic_id: currentTopic?.topic_id || '',
    };
  } catch (error) {
    console.error('[DB] Exception in getStudentSyllabus:', error);
    return null;
  }
}

/**
 * Obtiene la configuración de persona para un curso
 */
export async function getPersonaConfig(courseId: string): Promise<any> {
  try {
    const { data, error } = await supabaseAdmin
      .from('persona_configs')
      .select('*')
      .eq('course_id', courseId)
      .single();

    if (error) {
      console.warn('[DB] No persona config found, using defaults');
      return getDefaultPersonaConfig();
    }

    return data || getDefaultPersonaConfig();
  } catch (error) {
    console.error('[DB] Exception in getPersonaConfig:', error);
    return getDefaultPersonaConfig();
  }
}

/**
 * Configuración de persona por defecto
 */
function getDefaultPersonaConfig() {
  return {
    tone: 'profesional',
    explanation_style: 'detallado',
    language: 'es',
    difficulty_level: 'intermedio',
  };
}

/**
 * Actualiza el estado del Syllabus del estudiante después de la respuesta de la IA
 */
export async function updateSyllabusState(
  studentId: string,
  courseId: string,
  stateUpdate: AIStateUpdate
): Promise<boolean> {
  try {
    // Actualizar cada topic que cambió de estado
    for (const topicUpdate of stateUpdate.topics_updated) {
      const { error } = await supabaseAdmin
        .from('student_syllabus')
        .update({ status: topicUpdate.status })
        .eq('student_id', studentId)
        .eq('course_id', courseId)
        .eq('topic_id', topicUpdate.topic_id);

      if (error) {
        console.error('[DB] Error updating topic status:', error);
        return false;
      }
    }

    console.log('[DB] Syllabus updated successfully');
    return true;
  } catch (error) {
    console.error('[DB] Exception in updateSyllabusState:', error);
    return false;
  }
}

/**
 * Obtiene el historial de chat para un topic específico
 * Usado por el Agente Notario para generar resúmenes
 */
export async function getChatHistoryForTopic(
  studentId: string,
  topicId: string
): Promise<string> {
  try {
    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .select('context_data')
      .eq('student_id', studentId)
      .eq('topic_id', topicId)
      .single();

    if (error) {
      console.warn('[DB] No chat history found for topic');
      return '';
    }

    if (!data?.context_data) {
      return '';
    }

    // Formatea el historial como texto para el prompt
    const messages = Array.isArray(data.context_data) ? data.context_data : [];
    return messages
      .map((msg: any) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n');
  } catch (error) {
    console.error('[DB] Exception in getChatHistoryForTopic:', error);
    return '';
  }
}

/**
 * Guarda el resumen pedagógico generado por el Notario
 */
export async function saveTopicSummary(
  studentId: string,
  topicId: string,
  summaryData: any
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('topic_summaries')
      .insert([
        {
          student_id: studentId,
          topic_id: topicId,
          topic_completion_summary: summaryData.topic_completion_summary || '',
          student_doubts: summaryData.pedagogical_notes?.student_doubts || [],
          effective_analogies: summaryData.pedagogical_notes?.effective_analogies || '',
          engagement_level: summaryData.pedagogical_notes?.engagement_level || 'Medium',
          next_session_hook: summaryData.next_session_hook || '',
        },
      ]);

    if (error) {
      console.error('[DB] Error saving topic summary:', error);
      return false;
    }

    console.log(
      `[DB] Topic summary saved successfully for topic ${topicId}`
    );
    return true;
  } catch (error) {
    console.error('[DB] Exception in saveTopicSummary:', error);
    return false;
  }
}

/**
 * Obtiene los resúmenes previos de un topic para contexto futuro
 */
export async function getPreviousTopicSummary(
  studentId: string,
  topicId: string
): Promise<any | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('topic_summaries')
      .select('*')
      .eq('student_id', studentId)
      .eq('topic_id', topicId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('[DB] Exception in getPreviousTopicSummary:', error);
    return null;
  }
}

/**
 * Inicializa el Syllabus para un estudiante en un curso
 * Se llama cuando el estudiante se inscribe
 */
export async function initializeStudentSyllabus(
  studentId: string,
  courseId: string
): Promise<boolean> {
  try {
    // Obtener todos los topics del curso
    const { data: topics, error: topicsError } = await supabaseAdmin
      .from('topics')
      .select('id')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true });

    if (topicsError || !topics) {
      console.error('[DB] Error fetching course topics:', topicsError);
      return false;
    }

    // Crear entrada de Syllabus para cada topic
    const syllabusEntries = topics.map((topic, index) => ({
      student_id: studentId,
      course_id: courseId,
      topic_id: topic.id,
      status: index === 0 ? 'in_progress' : 'pending',
      order_index: index,
    }));

    const { error: insertError } = await supabaseAdmin
      .from('student_syllabus')
      .insert(syllabusEntries);

    if (insertError) {
      console.error('[DB] Error initializing syllabus:', insertError);
      return false;
    }

    console.log(
      `[DB] Syllabus initialized for student ${studentId} in course ${courseId}`
    );
    return true;
  } catch (error) {
    console.error('[DB] Exception in initializeStudentSyllabus:', error);
    return false;
  }
}
