// Archivo: app/chat/action.ts (Modificado para Gemini)

"use server";

// 1. Importar el SDK de Google Gen AI en lugar de OpenAI
import { GoogleGenAI, Content } from "@google/genai";
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// 2. Inicializar el cliente de la IA (Lee de .env.local)
// La clase GoogleGenAI busca automáticamente la variable de entorno GEMINI_API_KEY
const ai = new GoogleGenAI({});

// Prompt interno para forzar el inicio de la clase
const INTERNAL_START_PROMPT = "Por favor, inicia la clase con la explicación completa del subtema actual (el primero sin el estado 'COMPLETADO' en el PROGRESO).";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-min-32-chars-long!!!'
);

// Define el tipo de contexto de la conversación (ajustado a Gemini)
// Gemini usa 'user' y 'model' para los turnos de conversación
type ConversationMessage = { role: 'user' | 'assistant'; content: string };

// Función auxiliar para obtener el userId del JWT
async function getUserIdFromToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      console.log(`[CHAT] No se encontró token de autenticación`);
      return null;
    }

    const verified = await jwtVerify(token, JWT_SECRET);
    const userId = (verified.payload as any).userId;
    console.log(`[CHAT] UserId extraído del JWT: ${userId}`);
    return userId;
  } catch (error) {
    console.error(`[CHAT] Error al extraer userId del JWT:`, error);
    return null;
  }
}

export async function chatWithAI(newMessage: string, cursoId: number) {
  try {
    // 1. Obtener userId del JWT
    const userId = await getUserIdFromToken();
    if (!userId) {
      return { error: "No estás autenticado. Por favor inicia sesión." };
    }

    console.log(`[CHAT] Iniciando chatWithAI: userId=${userId}, cursoId=${cursoId}`);

    let actualMessageToSend = newMessage; // Por defecto, es el mensaje del alumno

    // 2. Obtener la sesión (context_data) del curso
    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from('chat_sessions')
      .select('id, context_data')
      .eq('user_id', userId)
      .eq('course_id', cursoId)
      .maybeSingle();

    console.log(`[CHAT] Búsqueda de sesión:`, { sessionError, hasSession: !!sessionData });

    // 3. Determinar si es una sesión nueva
    // Es nueva si no hay datos O si el historial está vacío.
    const isNewSession = !sessionData || !sessionData.context_data || sessionData.context_data.length === 0;

    if (isNewSession) {
      // 4. ¡Punto clave! Si la sesión es nueva, ignoramos el saludo del alumno 
      // y forzamos la instrucción de inicio para la IA.
      actualMessageToSend = INTERNAL_START_PROMPT;
      console.log(`[CHAT] Sesión nueva detectada. Usando INTERNAL_START_PROMPT`);
    } else {
      console.log(`[CHAT] Sesión existente. Usando mensaje del alumno.`);
    }

    // 5. Si no existe sesión, crearla
    let session = sessionData;
    if (!sessionData) {
      console.log(`[DEBUG] Sesión no encontrada, creando nueva...`);
      const { data: newSession, error: createError } = await supabaseAdmin
        .from('chat_sessions')
        .insert([{
          user_id: userId,
          course_id: cursoId,
          context_data: []
        }])
        .select('id, context_data')
        .single();

      if (createError) {
        console.error(`[ERROR] Error al crear sesión:`, createError);
        return { error: `Error al crear sesión: ${createError.message}` };
      }
      session = newSession;
      console.log(`[DEBUG] Sesión creada exitosamente`);
    }

    if (!session) {
      return { error: "No se pudo obtener o crear la sesión de chat." };
    }

    // 6. Obtener el contenido del curso para el System Prompt
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('name, description')
      .eq('id', cursoId)
      .single();

    if (courseError || !course) {
      console.error(`[ERROR] Error al obtener curso:`, courseError);
      return { error: `Error al obtener el curso: ${courseError?.message || 'No encontrado'}` };
    }

    console.log(`[DEBUG] Curso obtenido: ${course.name}`);

    // 7. Construir el System Prompt con el protocolo estricto de Tutor IA
    const systemPrompt = `Eres "Tutor IA", un asistente educativo experto, sumamente paciente y CRÍTICAMENTE ESTRICTO CON EL PROTOCOLO DE CLASE Y LA SALIDA JSON.

Tu objetivo fundamental es guiar al alumno paso a paso a través del Temario, asegurando la comprensión antes de avanzar.

[ROL Y PERSONALIDAD IMPERATIVA]
1. Modo de Operación: Estás en modo de Tutoría Dirigida.
2. Tono: Profesional, motivador. Siempre responde en español.
3. Prioridad Máxima: Las reglas de Clase y Evaluación tienen prioridad sobre cualquier pregunta que no esté relacionada con el subtema actual.

[CURSO]
Nombre: "${course.name}"
Descripción: "${course.description}"

[REGLAS DE CLASE Y CONVERSACIÓN ESTRICTAS]
1. INICIO DE TEMA (Clase): Si es la primera interacción o el alumno no ha completado el subtema, INICIA con una Explicación Detallada del tema, seguida de un ejemplo práctico.
2. EVALUACIÓN (Tarea): Inmediatamente después de la explicación, genera UNA TAREA con 2-3 preguntas o ejercicios para evaluar comprensión.
3. RECONDUCCIÓN (Anti-Q&A): Si el alumno hace una pregunta que NO es la tarea actual, IGNORA la pregunta directa. Responde recordándole la Tarea Pendiente o el concepto actual. NO AVANCES hasta que evalúes la tarea.
4. VALIDACIÓN: Si el alumno responde la tarea correctamente, celebra el logro y marca como completado. Si responde incorrectamente, proporciona retroalimentación constructiva y pide que lo intente de nuevo.

[PROTOCOLO DE JSON DE ACCIÓN]
El JSON DEBE ser el ÚLTIMO elemento de tu respuesta. Estructura exacta:
{"action": "update_progress", "subtopic_id": "[ID]", "status": "COMPLETADO"}

USAR SOLO cuando:
- El alumno responde correctamente la tarea
- El alumno demuestra comprensión del tema

CUANDO NO USAR JSON:
- En explicaciones iniciales
- Cuando generas la tarea
- Cuando el alumno responde incorrectamente
- Cuando haces reconducción`;

    // 8. Mapear el historial guardado a la estructura de Gemini
    const mappedContext: Content[] = (session.context_data || []).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // 9. Agregar el mensaje actual (que ahora es el mensaje forzado o el mensaje del alumno real)
    const userMessagePart: Content = {
      role: 'user',
      parts: [{ text: actualMessageToSend }],
    };
    const messagesToSend: Content[] = [...mappedContext, userMessagePart];

    console.log(`[DEBUG] Enviando ${messagesToSend.length} mensajes a Gemini. isNewSession=${isNewSession}`);

    // 10. Llamada a la API de Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: messagesToSend,
      systemInstruction: systemPrompt,
    } as any);

    const aiResponse = response.text || "Lo siento, no pude procesar tu solicitud.";
    console.log(`[DEBUG] Respuesta recibida de Gemini (${aiResponse.length} caracteres)`);

    // 11. Actualizar el contexto en la DB
    // Guardar el mensaje REAL del alumno (no el INTERNAL_START_PROMPT)
    const newContext: ConversationMessage[] = [
      ...(session.context_data || []),
      { role: 'user', content: newMessage }, // Siempre guardar el mensaje REAL del alumno
      { role: 'assistant', content: aiResponse },
    ];

    console.log(`[DEBUG] Actualizando sesión con ${newContext.length} mensajes`);

    // Guardar el nuevo contexto en la base de datos
    const { error: updateError } = await supabaseAdmin
      .from('chat_sessions')
      .update({ context_data: newContext })
      .eq('id', session.id);

    if (updateError) {
      console.error(`[ERROR] Error al actualizar sesión:`, updateError);
      return { error: `Error al guardar el contexto: ${updateError.message}` };
    }

    console.log(`[DEBUG] Sesión actualizada exitosamente`);

    // 12. Devolver la respuesta de la IA
    return { response: aiResponse, fullContext: newContext, isNewSession };
  } catch (error: any) {
    console.error(`[ERROR] Excepción en chatWithAI:`, error);
    return { error: `Error interno: ${error.message}` };
  }
}
    return { error: error.message || "Error al procesar el mensaje.", response: undefined, fullContext: [] };
  }
}