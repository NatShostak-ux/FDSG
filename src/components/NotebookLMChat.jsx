import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Settings2, MoreVertical, ThumbsUp, ThumbsDown, Copy, Pin, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const CitationBadge = ({ children }) => (
    <span className="inline-flex items-center justify-center w-5 h-5 ml-1 mr-1 text-[10px] font-bold text-gray-500 bg-gray-100 rounded-full align-middle select-none">
        {children}
    </span>
);

const NotebookLMChat = ({ isOpen, onClose, areaLabel }) => {
    const [messages, setMessages] = useState([
        { id: 1, type: 'bot', text: `Ciao! Sono il tuo assistente NotebookLM per l'area **${areaLabel}**. Sulla base dei documenti analizzati, come posso aiutarti oggi?` }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sourceCount, setSourceCount] = useState(90); // Default placeholder

    // Size and Position State
    const [dimensions, setDimensions] = useState({ width: 500, height: 700 });
    const [isResizing, setIsResizing] = useState(false);

    const messagesEndRef = useRef(null);
    const chatRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    // Resize Logic
    const startResizing = useCallback((e) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = useCallback((e) => {
        if (isResizing && chatRef.current) {
            const rect = chatRef.current.getBoundingClientRect();
            const newWidth = rect.right - e.clientX;
            const newHeight = rect.bottom - e.clientY;

            if (newWidth > 350 && newWidth < 1000) {
                setDimensions(prev => ({ ...prev, width: newWidth }));
            }
            if (newHeight > 450 && newHeight < 1000) {
                setDimensions(prev => ({ ...prev, height: newHeight }));
            }
        }
    }, [isResizing]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
        } else {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        }
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [isResizing, resize, stopResizing]);

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const userMsg = { id: Date.now(), type: 'user', text: inputText };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsLoading(true);

        try {
            const apiUrl = import.meta.env.DEV ? 'http://localhost:3000/api/chat' : '/api/chat';
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg.text,
                    notebookTitle: areaLabel
                })
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();

            if (data.sourceCount !== undefined) {
                setSourceCount(data.sourceCount);
            }

            const botMsg = {
                id: Date.now() + 1,
                type: 'bot',
                text: data.answer || "Non ho trovato una risposta specifica nel notebook."
            };
            setMessages(prev => [...prev, botMsg]);

        } catch (error) {
            console.error("Chat Error:", error);
            const errorMsg = {
                id: Date.now() + 1,
                type: 'bot',
                text: "Mi dispiace, si è verificato un errore di connessione con il server NotebookLM."
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    // Custom Markdown Components for high-fidelity rendering
    const MarkdownComponents = {
        p: ({ children }) => <p className="mb-4 text-[#3c4043] font-normal leading-7">{children}</p>,
        strong: ({ children }) => <strong className="font-bold text-[#202124]">{children}</strong>,
        ul: ({ children }) => <ul className="mb-4 space-y-2">{children}</ul>,
        li: ({ children }) => (
            <li className="flex gap-2">
                <span className="text-[#3c4043]">•</span>
                <span className="flex-1 text-[#3c4043] leading-7">{children}</span>
            </li>
        ),
        text: ({ value }) => {
            const parts = value.split(/(\[[\d,\s]+\])/g);
            return parts.map((part, i) => {
                const match = part.match(/\[([\d,\s]+)\]/);
                if (match) {
                    const nums = match[1].split(',').map(n => n.trim());
                    return nums.map((n, idx) => (
                        <CitationBadge key={`${i}-${idx}`}>{n}</CitationBadge>
                    ));
                }
                return part;
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div
            ref={chatRef}
            style={{
                width: `${dimensions.width}px`,
                height: `${dimensions.height}px`,
                transition: isResizing ? 'none' : 'box-shadow 0.3s ease'
            }}
            className="fixed bottom-6 right-6 bg-[#f8f9fa] rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-[#e0e3e6] flex flex-col overflow-hidden z-50 font-sans"
        >
            {/* Resize Handle */}
            <div
                onMouseDown={startResizing}
                className="absolute top-0 left-0 w-8 h-8 cursor-nw-resize z-[60] flex items-start justify-start p-1"
            >
                <div className="w-2 h-2 border-t-2 border-l-2 border-gray-300 rounded-tl-[1px]" />
            </div>

            {/* Premium Header */}
            <div className="bg-white px-5 py-4 flex items-center justify-between border-b border-[#eef0f2] shrink-0">
                <h2 className="text-[17px] font-medium text-[#3c4043]">Chat</h2>
                <div className="flex items-center gap-1">
                    <button className="p-2 text-[#5f6368] hover:bg-gray-100 rounded-lg transition-colors">
                        <Settings2 size={18} strokeWidth={2.2} />
                    </button>
                    <button className="p-2 text-[#5f6368] hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreVertical size={18} strokeWidth={2.2} />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 text-[#5f6368] hover:bg-gray-100 rounded-lg transition-colors ml-1"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Messages Content */}
            <div className="flex-1 overflow-y-auto px-10 pt-10 pb-4 bg-white custom-scrollbar">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`mb-8 ${msg.type === 'user' ? 'flex justify-end' : 'flex flex-col'}`}
                    >
                        <div className={`max-w-[95%] text-[15px] ${msg.type === 'user'
                            ? 'bg-blue-600 text-white px-5 py-3 rounded-2xl shadow-sm'
                            : 'text-[#3c4043]'
                            }`}>
                            {msg.type === 'bot' ? (
                                <>
                                    <div className="prose-high-fidelity">
                                        <ReactMarkdown components={MarkdownComponents}>{msg.text}</ReactMarkdown>
                                    </div>
                                    {/* Bot Action Bar */}
                                    <div className="flex items-center gap-4 mt-6 pt-2 border-t border-transparent select-none">
                                        <button className="flex items-center gap-2 px-3 py-1.5 border border-[#dadce0] rounded-[8px] text-[12px] font-medium text-[#3c4043] hover:bg-[#f8f9fa] transition-colors">
                                            <Pin size={14} className="text-[#5f6368]" />
                                            <span>Salva nella nota</span>
                                        </button>
                                        <div className="flex items-center gap-1 text-[#5f6368]">
                                            <button className="p-2 hover:bg-[#f1f3f4] rounded-full transition-colors">
                                                <Copy size={16} />
                                            </button>
                                            <button className="p-2 hover:bg-[#f1f3f4] rounded-full transition-colors">
                                                <ThumbsUp size={16} />
                                            </button>
                                            <button className="p-2 hover:bg-[#f1f3f4] rounded-full transition-colors">
                                                <ThumbsDown size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                msg.text
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="mb-8 flex flex-col">
                        <div className="flex items-center gap-3 animate-pulse opacity-70">
                            <div className="w-8 h-1.5 bg-[#e8eaed] rounded-full"></div>
                            <div className="w-12 h-1.5 bg-[#e8eaed] rounded-full"></div>
                            <div className="w-6 h-1.5 bg-[#e8eaed] rounded-full"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* High-Fidelity Pill Input */}
            <div className="p-5 bg-white border-t border-[#f1f3f4] shrink-0">
                <div className="relative flex items-center gap-4 bg-[#f1f3f4] px-5 py-3 rounded-[32px] border border-transparent focus-within:bg-white focus-within:border-[#dadce0] focus-within:shadow-[0_1px_6px_rgba(32,33,36,0.28)] transition-all">
                    <input
                        type="text"
                        autoFocus
                        placeholder="Inizia a digitare..."
                        className="flex-1 bg-transparent border-0 focus:ring-0 text-[15px] py-1 text-[#202124] placeholder:text-[#5f6368]"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <div className="flex items-center gap-5 shrink-0">
                        <span className="text-[13px] text-[#5f6368] font-medium border-r border-[#dadce0] pr-4 py-1">
                            {sourceCount} fonti
                        </span>
                        <button
                            onClick={handleSend}
                            disabled={!inputText.trim() || isLoading}
                            className={`flex items-center justify-center w-9 h-9 rounded-full transition-all ${inputText.trim() && !isLoading
                                ? 'bg-gray-200 text-[#3c4043] hover:bg-gray-300 active:scale-95 shadow-sm'
                                : 'bg-gray-100 text-[#bdc1c6] cursor-not-allowed'
                                }`}
                        >
                            <ArrowRight size={20} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
                
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #dadce0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #bdc1c6; }
                
                .font-sans { font-family: 'Roboto', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
                
                .prose-high-fidelity p { 
                    font-size: 15px; 
                    color: #3c4043; 
                    line-height: 1.7;
                    margin-bottom: 1.25rem;
                }
                .prose-high-fidelity b, .prose-high-fidelity strong {
                    color: #202124;
                    font-weight: 700;
                }
                .prose-high-fidelity ul {
                    list-style-type: none;
                    margin-left: 0;
                    padding-left: 0;
                    margin-bottom: 1.25rem;
                }
                .prose-high-fidelity li {
                    font-size: 15px;
                    color: #3c4043;
                    line-height: 1.7;
                    margin-bottom: 0.5rem;
                }
            `}} />
        </div>
    );
};

export default NotebookLMChat;
