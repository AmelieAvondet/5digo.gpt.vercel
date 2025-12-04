// Archivo: app/chat/page.tsx (Componente de Interfaz de Chat)

"use client";

import React, { useState, useEffect } from 'react';
import { chatWithAI, initializeChatSession } from './action';
import { loadAvailableTopics } from './loader';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { logoutUser } from '@/app/action';
import MarkdownMessage from '@/components/MarkdownMessage';

type Message = { role: 'user' | 'assistant'; content: string };
type Course = { id: string; title: string; type: string };

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-400 transition-colors">
            {pending ? 'Enviando...' : 'Enviar'}
        </button>
    );
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [courseLoading, setCourseLoading] = useState(false);
    const [chatInitialized, setChatInitialized] = useState(false);
    const router = useRouter();

    // Cargar cursos disponibles al montar
    useEffect(() => {
        loadCourses();
    }, []);

    // Inicializar chat cuando cambia el curso
    useEffect(() => {
        if (selectedCourse && !chatInitialized) {
            initializeChat();
        }
    }, [selectedCourse, chatInitialized]);

    const loadCourses = async () => {
        const result = await loadAvailableTopics();
        if (result.topics && result.topics.length > 0) {
            setCourses(result.topics);
            setSelectedCourse(result.topics[0].id);
        }
        setLoading(false);
    };

    const initializeChat = async () => {
        setCourseLoading(true);
        try {
            const result = await initializeChatSession(selectedCourse);
            if (result.error) {
                console.error('Error initializing chat:', result.error);
                alert(result.error);
            } else {
                // Crear mensaje inicial del tutor
                const assistantMessage: Message = {
                    role: 'assistant',
                    content: result.response,
                };
                setMessages([assistantMessage]);
                setChatInitialized(true);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setCourseLoading(false);
        }
    };

    const handleChangeCourse = (courseId: string) => {
        setSelectedCourse(courseId);
        setMessages([]);
        setChatInitialized(false);
    };

    const handleSubmit = async (formData: FormData) => {
        const newMessage = formData.get("message") as string;
        if (!newMessage.trim()) return;

        const userMessage: Message = { role: 'user', content: newMessage };
        setMessages(prev => [...prev, userMessage]);

        const form = document.querySelector('form') as HTMLFormElement;
        if (form) form.reset();

        try {
            const result = await chatWithAI(newMessage, selectedCourse);

            if (result.error) {
                alert(result.error);
                setMessages(prev => prev.slice(0, -1));
                return;
            }

            const assistantMessage: Message = {
                role: 'assistant',
                content: result.response,
            };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error:', error);
            alert('Error al enviar mensaje');
            setMessages(prev => prev.slice(0, -1));
        }
    };

    const handleLogout = async () => {
        await logoutUser();
        router.push('/login');
    };

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Header */}
            <div className="bg-white shadow-md p-4 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Tutor IA</h1>
                    <p className="text-sm text-gray-600">Aprende con inteligencia artificial</p>
                </div>
                <div className="flex gap-4 items-center">
                    <a
                        href="/student"
                        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                    >
                        Mis Cursos
                    </a>
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 gap-4 p-4 overflow-hidden">
                {/* Sidebar de cursos */}
                <div className="w-64 bg-white rounded-lg shadow-md p-4 overflow-y-auto">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Tus Cursos</h2>
                    {loading ? (
                        <p className="text-gray-500 text-sm">Cargando cursos...</p>
                    ) : courses.length === 0 ? (
                        <p className="text-gray-500 text-sm">No tienes cursos inscritos. <a href="/courses" className="text-blue-500">Inscríbete aquí</a></p>
                    ) : (
                        <div className="space-y-2">
                            {courses.map((course) => (
                                <button
                                    key={course.id}
                                    onClick={() => handleChangeCourse(course.id)}
                                    disabled={courseLoading}
                                    className={`w-full text-left p-3 rounded-lg transition-colors disabled:opacity-50 text-sm ${
                                        selectedCourse === course.id
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                    }`}
                                >
                                    {course.title}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Chat Area */}
                <div className="flex-1 bg-white rounded-lg shadow-md p-4 flex flex-col">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                        {courseLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-gray-500">Inicializando chat...</p>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-gray-500">Selecciona un curso para comenzar</p>
                            </div>
                        ) : (
                            messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-md lg:max-w-3xl px-5 py-4 rounded-lg ${
                                            msg.role === 'user'
                                                ? 'bg-blue-500 text-white rounded-br-none'
                                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-md'
                                        }`}
                                    >
                                        <MarkdownMessage content={msg.content} isUser={msg.role === 'user'} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Input Form */}
                    {selectedCourse && !courseLoading && (
                        <form action={handleSubmit} className="flex gap-2">
                            <input
                                type="text"
                                name="message"
                                placeholder="Escribe tu pregunta..."
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                                disabled={courseLoading}
                            />
                            <SubmitButton />
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}