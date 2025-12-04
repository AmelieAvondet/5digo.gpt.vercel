// Archivo: app/chat/action.ts (Refactorizado con Arquitectura Pedagógica)
// Implementa el Orquestador: Agente Docente (síncrono) + Agente Notario (asíncrono)

"use server";

import { GoogleGenAI } from "@google/genai";
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { TEACHER_PROMPT, fillPrompt } from '@/lib/prompts';
import {
  extractTextResponse,
  extractStateJSON,
  isValidStateUpdate,
  SyllabusState,
  AIStateUpdate,
} from '@/lib/stateParser';
import {
  getStudentSyllabus,
  getPersonaConfig,
  updateSyllabusState,
} from '@/lib/dbHelpers';
import { triggerNotaryAsync } from '@/lib/notaryAgent';

// Inicializar cliente de Gemini
const ai = new GoogleGenAI({});

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-min-32-chars-long!!!'
);

// ============ FUNCIONES AUXILIARES ============

/**
 * Obtiene el userId del JWT de las cookies
 */
async function getUserIdFromToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      console.log(`[CHAT] No authentication token found`);
      return null;
    }

    const verified = await jwtVerify(token, JWT_SECRET);
    const userId = (verified.payload as any).userId;
    console.log(`[CHAT] UserId extracted from JWT: ${userId}`);
    return userId;
  } catch (error) {
    console.error(`[CHAT] Error extracting userId from JWT:`, error);
    return null;
  }
}

// ============ ORQUESTADOR PRINCIPAL ============

/**
 * handleStudentMessage: Lógica principal del Sistema Educativo
 *
 * FLUJO:
 * 1. Validar autenticación
 * 2. Obtener Syllabus + Persona del estudiante
 * 3. Llamar Agente Docente (síncrono)
 * 4. Parsear respuesta (texto + JSON de estado)
 * 5. Actualizar Syllabus en BD (síncrono)
 * 6. RETORNAR respuesta al usuario (rápido)
 * 7. Trigger Notario en background SI es necesario (asíncrono, no bloquea)
 */
export async function handleStudentMessage(
  courseId: string,
  userMessage: string
): Promise<{ response: string; fullContext: any[]; isNewSession: boolean; error?: string }> {
  try {
    console.log(`[CHAT] Starting message handler: courseId=${courseId}`);

    // ===== PASO 1: Validar autenticación =====
    const userId = await getUserIdFromToken();
    if (!userId) {
      return {
        error: "No estás autenticado. Por favor inicia sesión.",
        response: "",
        fullContext: [],
        isNewSession: false,
      };
    }

    // ===== PASO 2: Obtener contexto pedagógico =====
    const syllabus = await getStudentSyllabus(userId, courseId);
    const personaConfig = await getPersonaConfig(courseId);

    if (!syllabus) {
      return {
        error: "No se encontró el plan de estudios. Contacta al profesor.",
        response: "",
        fullContext: [],
        isNewSession: false,
      };
    }

    console.log(
      `[CHAT] Syllabus loaded. Current topic: ${syllabus.current_topic_id}`
    );

    // ===== PASO 3: Construir y ejecutar Agente Docente =====
    const teacherPromptFilled = fillPrompt(TEACHER_PROMPT, {
      PERSONA_JSON: JSON.stringify(personaConfig),
      SYLLABUS_JSON: JSON.stringify(syllabus),
      USER_INPUT: userMessage,
    });

    console.log(`[CHAT] Calling Teacher Agent...`);
    const aiRawResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: teacherPromptFilled }],
        },
      ],
    } as any);

    const responseText = aiRawResponse.text || "";

    if (!responseText) {
      return {
        error: "No se pudo obtener respuesta de la IA.",
        response: "",
        fullContext: [],
        isNewSession: false,
      };
    }

    console.log(`[CHAT] Teacher Agent response received (${responseText.length} chars)`);
    console.log(`[CHAT] Raw response preview: ${responseText.substring(0, 200)}...`);

    // ===== PASO 4: Parsear respuesta (split texto + JSON) =====
    const textToUser = extractTextResponse(responseText);
    const stateUpdate = extractStateJSON(responseText);

    console.log(`[CHAT] Text extracted: ${textToUser.substring(0, 100)}...`);
    console.log(`[CHAT] State update extracted:`, stateUpdate);

    // ===== PASO 5: Validar y actualizar Syllabus (síncrono) =====
    let updateSuccess = false;
    if (stateUpdate && isValidStateUpdate(stateUpdate)) {
      console.log(`[CHAT] State update is VALID. Updating syllabus...`);
      updateSuccess = await updateSyllabusState(userId, courseId, stateUpdate);
      if (!updateSuccess) {
        console.warn(`[CHAT] Failed to update syllabus in DB, but continuing...`);
      } else {
        console.log(`[CHAT] ✓ Syllabus updated successfully`);
      }
    } else {
      console.warn(`[CHAT] ⚠️  State update is INVALID or missing`);
      console.warn(`[CHAT] Raw state update:`, stateUpdate);
      
      // Fallback inteligente: mantener tema en in_progress
      const fallbackUpdate: AIStateUpdate = {
        trigger_summary_generation: false,
        current_topic_id: syllabus.current_topic_id,
        topics_updated: [
          {
            topic_id: syllabus.current_topic_id,
            status: 'in_progress',
          },
        ],
      };
      console.log(`[CHAT] Using fallback state update:`, fallbackUpdate);
      updateSuccess = await updateSyllabusState(userId, courseId, fallbackUpdate);
    }

    // ===== PASO 6: RETORNAR RESPUESTA AL USUARIO (rápido) =====
    console.log(`[CHAT] Returning response to user`);
    const response = {
      response: textToUser,
      fullContext: [],
      isNewSession: false,
    };

    // ===== PASO 7: TRIGGER Agente Notario (asíncrono, "fire and forget") =====
    if (
      stateUpdate.trigger_summary_generation === true &&
      stateUpdate.current_topic_id
    ) {
      console.log(
        `[CHAT] Triggering Notary background process for topic ${stateUpdate.current_topic_id}`
      );
      // NO ESPERAMOS (no await) - Solo lanzamos el proceso
      triggerNotaryAsync(userId, stateUpdate.current_topic_id);
    }

    return response;
  } catch (error: any) {
    console.error(`[CHAT] Exception in handleStudentMessage:`, error);
    return {
      error: `Error interno: ${error.message}`,
      response: "",
      fullContext: [],
      isNewSession: false,
    };
  }
}

// ============ INICIALIZAR CHAT =============
/**
 * initializeChatSession: Envía el primer mensaje del Tutor cuando el alumno abre un tema
 * Esto inicia la conversación sin esperar input del usuario
 */
export async function initializeChatSession(
  courseId: string
): Promise<{ response: string; error?: string }> {
  try {
    console.log(`[CHAT] Initializing chat session for course: ${courseId}`);

    const userId = await getUserIdFromToken();
    if (!userId) {
      return {
        error: "No estás autenticado.",
        response: "",
      };
    }

    // Obtener syllabus e identificar el tema actual
    const syllabus = await getStudentSyllabus(userId, courseId);
    if (!syllabus) {
      return {
        error: "No se encontró el plan de estudios.",
        response: "",
      };
    }

    // Obtener persona config
    const personaConfig = await getPersonaConfig(courseId);

    // Mensaje de inicialización vacío (el Tutor debe generar su introducción)
    const teacherPromptFilled = fillPrompt(TEACHER_PROMPT, {
      PERSONA_JSON: JSON.stringify(personaConfig),
      SYLLABUS_JSON: JSON.stringify(syllabus),
      USER_INPUT: "[SISTEMA: Esta es la primera interacción. Por favor, introduce el tema actual de forma amigable y motivadora. No esperes a que el estudiante pregunte.]",
    });

    const aiRawResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: teacherPromptFilled }],
        },
      ],
    } as any);

    const responseText = aiRawResponse.text || "";

    if (!responseText) {
      return {
        error: "No se pudo obtener respuesta de la IA.",
        response: "",
      };
    }

    // Parsear respuesta
    const textToUser = extractTextResponse(responseText);
    const stateUpdate = extractStateJSON(responseText);

    // Actualizar syllabus si es necesario
    if (stateUpdate && isValidStateUpdate(stateUpdate)) {
      await updateSyllabusState(userId, courseId, stateUpdate);
    }

    console.log(`[CHAT] Chat session initialized successfully`);
    return {
      response: textToUser,
    };
  } catch (error: any) {
    console.error(`[CHAT] Error initializing chat session:`, error);
    return {
      error: `Error al inicializar: ${error.message}`,
      response: "",
    };
  }
}

// ============ COMPATIBLE CON API ANTERIOR =============
// Para mantener compatibilidad, mantenemos la función chatWithAI
// que llama internamente a handleStudentMessage

export async function chatWithAI(
  newMessage: string,
  cursoId: string
): Promise<{ response: string; fullContext: any[]; isNewSession: boolean; error?: string }> {
  console.log(`[CHAT] chatWithAI (legacy) called`);
  return handleStudentMessage(cursoId, newMessage);
}