// Archivo: app/chat/page.tsx (Componente de Interfaz de Chat)

"use client";

import React, { useState, useEffect } from 'react';
import { chatWithAI, initializeChatSession } from './action';
import { loadAvailableTopics } from './loader';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { logoutUser } from '@/app/action';
import MarkdownMessage from '@/components/MarkdownMessage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, LogOut, Menu, X, BookOpen, MessageCircle } from 'lucide-react';

type Message = { role: 'user' | 'assistant'; content: string };
type Course = { id: string; title: string; type: string };

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button
            type="submit"
            disabled={pending}
            size="icon"
            className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
        >
            <Send className="w-4 h-4" />
        </Button>
    );
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [courseLoading, setCourseLoading] = useState(false);
    const [chatInitialized, setChatInitialized] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
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
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div
                className={`${
                    sidebarOpen ? 'w-64' : 'w-0'
                } bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden flex flex-col`}
            >
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-linear-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">AI</span>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">Tutor IA</p>
                            <p className="text-xs text-gray-500">Aprendizaje Inteligente</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <h3 className="text-xs font-semibold text-gray-600 uppercase mb-3">Tus Cursos</h3>
                    {loading ? (
                        <p className="text-gray-500 text-sm">Cargando cursos...</p>
                    ) : courses.length === 0 ? (
                        <p className="text-gray-500 text-sm">No tienes cursos inscritos. <a href="/courses" className="text-blue-600">Inscríbete aquí</a></p>
                    ) : (
                        <div className="space-y-2">
                            {courses.map((course) => (
                                <button
                                    key={course.id}
                                    onClick={() => handleChangeCourse(course.id)}
                                    disabled={courseLoading}
                                    className={`w-full text-left p-3 rounded-lg transition-all disabled:opacity-50 text-sm font-medium flex items-start gap-2 ${
                                        selectedCourse === course.id
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                    }`}
                                >
                                    <BookOpen className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span className="line-clamp-2">{course.title}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-200">
                    <Button
                        onClick={handleLogout}
                        variant="outline"
                        className="w-full"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Cerrar Sesión
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-4">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
                    >
                        {sidebarOpen ? (
                            <X className="w-5 h-5" />
                        ) : (
                            <Menu className="w-5 h-5" />
                        )}
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-gray-900">
                            {selectedCourse && courses.find(c => c.id === selectedCourse)?.title || 'Selecciona un curso'}
                        </h1>
                        <p className="text-xs text-gray-500">Aprende con inteligencia artificial</p>
                    </div>
                    <Badge variant="secondary">
                        <MessageCircle className="w-3 h-3 mr-1" />
                        {messages.length} mensajes
                    </Badge>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {courseLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
                                <p className="text-gray-500">Inicializando chat...</p>
                            </div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">Selecciona un curso para comenzar</p>
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-lg px-4 py-3 rounded-lg ${
                                        msg.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none shadow-sm'
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
                    <div className="bg-white border-t border-gray-200 p-4">
                        <form action={handleSubmit} className="flex gap-2">
                            <Input
                                type="text"
                                name="message"
                                placeholder="Escribe tu pregunta..."
                                disabled={courseLoading}
                                className="flex-1"
                            />
                            <SubmitButton />
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}