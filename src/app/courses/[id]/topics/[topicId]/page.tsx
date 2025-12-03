// src/app/courses/[id]/topics/[topicId]/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getTopicDetails, saveChatMessage, generateAIResponse, updateStudentProgress } from '@/app/student/actions';
import AdminHeader from '@/components/AdminHeader';

interface Topic {
  id: string;
  name: string;
  content: string;
  activities?: string;
  created_at: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  metadata?: any;
}

// Función auxiliar para extraer acciones de la IA
function extractActionFromAIResponse(actionData: any): { action: string; topicId?: string } | null {
  if (!actionData) return null;

  if (actionData.completion_status === 'completed' || actionData.action === 'update_progress') {
    return {
      action: 'complete_topic',
      topicId: actionData.subtopic_id,
    };
  }

  if (actionData.task_generated) {
    return {
      action: 'task_generated',
      topicId: actionData.subtopic_id,
    };
  }

  return null;
}

export default function TopicChatPage() {
  const params = useParams();
  const courseId = params.id as string;
  const topicId = params.topicId as string;

  const [topic, setTopic] = useState<Topic | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userMessage, setUserMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [completionStatus, setCompletionStatus] = useState<'in_progress' | 'task_pending' | 'completed'>('in_progress');

  useEffect(() => {
    async function loadTopic() {
      const result = await getTopicDetails(courseId, topicId);

      if (result.error) {
        setError(result.error);
      } else if (result.topic) {
        setTopic(result.topic);
        setSessionId(result.sessionId);
        setChatHistory(result.chatHistory || []);
      }

      setLoading(false);
    }

    loadTopic();
  }, [courseId, topicId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userMessage.trim() || !sessionId || !topic) return;

    setSending(true);
    setError('');

    try {
      // Guardar el mensaje del usuario
      const userMsg: ChatMessage = {
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
      };

      // Actualizar el historial local
      const updatedHistory = [...chatHistory, userMsg];
      setChatHistory(updatedHistory);
      setUserMessage('');

      // Guardar en la base de datos
      await saveChatMessage(sessionId, 'user', userMessage);

      // Generar respuesta con IA mejorada
      const aiResult = await generateAIResponse(
        topic.name,
        topic.content,
        userMessage,
        updatedHistory,
        topicId,
        { courseId }
      );

      if (aiResult.error) {
        setError(aiResult.error);
      } else if (aiResult.response) {
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: aiResult.response,
          timestamp: new Date().toISOString(),
          metadata: aiResult.action,
        };

        const finalHistory = [...updatedHistory, assistantMsg];
        setChatHistory(finalHistory);

        // Guardar respuesta en BD
        await saveChatMessage(sessionId, 'assistant', aiResult.response);

        // Verificar si hay acciones de progreso
        if (aiResult.action) {
          const action = extractActionFromAIResponse(aiResult.action);
          if (action) {
            if (action.action === 'complete_topic') {
              setCompletionStatus('completed');
              // Actualizar progreso en la BD
              await updateStudentProgress(courseId, 100);
            } else if (action.action === 'task_generated') {
              setCompletionStatus('task_pending');
            }
          }
        }
      }
    } catch (err: any) {
      setError('Error al enviar mensaje');
      console.error(err);
    }

    setSending(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Cargando temario...</p>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-red-600">Error al cargar el temario</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <AdminHeader
        title={topic.name}
        backLink={`/courses/${courseId}`}
        backText="← Volver al Curso"
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto gap-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Content Panel */}
        <div className="w-full md:w-1/3 bg-white rounded-lg shadow-md p-6 h-fit">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📖 Contenido</h3>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
              {topic.content}
            </p>
          </div>

          {topic.activities && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">📝 Actividades</h4>
              <p className="text-blue-800 text-sm whitespace-pre-wrap">
                {topic.activities}
              </p>
            </div>
          )}
        </div>

        {/* Chat Panel */}
        <div className="w-full md:w-2/3 flex flex-col bg-white rounded-lg shadow-md overflow-hidden">
          {/* Status Bar */}
          {completionStatus !== 'in_progress' && (
            <div className={`px-6 py-3 text-sm font-medium text-white ${
              completionStatus === 'completed' ? 'bg-green-600' : 'bg-blue-600'
            }`}>
              {completionStatus === 'completed' && (
                <p>✅ ¡Temario completado! Puedes pasar al siguiente.</p>
              )}
              {completionStatus === 'task_pending' && (
                <p>📝 Tarea pendiente. Resuelve la tarea para avanzar.</p>
              )}
            </div>
          )}

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {chatHistory.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-gray-500 mb-2">🤖 Tutor IA</p>
                  <p className="text-gray-400 text-sm">
                    Haz preguntas sobre el contenido
                  </p>
                </div>
              </div>
            ) : (
              chatHistory.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-gray-200 text-gray-900 rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    {msg.timestamp && (
                      <p
                        className={`text-xs mt-1 ${
                          msg.role === 'user'
                            ? 'text-blue-100'
                            : 'text-gray-500'
                        }`}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="border-t border-gray-200 p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                placeholder="Escribe tu pregunta..."
                disabled={sending}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
              <button
                type="submit"
                disabled={sending || !userMessage.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-semibold"
              >
                {sending ? '⏳' : '📤'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
