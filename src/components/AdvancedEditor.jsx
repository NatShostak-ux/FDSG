import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import {
    Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Link as LinkIcon,
    Sparkles, Send, X, Check, Loader2, Wand2, Maximize
} from 'lucide-react';

const AdvancedEditor = ({ value, onChange, placeholder, disabled = false }) => {
    const [isAIActive, setIsAIActive] = useState(false);
    const [aiInstruction, setAiInstruction] = useState('');
    const [aiResult, setAiResult] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    
    // STATI PER LA COLLABORAZIONE FLUIDA
    const [isFocused, setIsFocused] = useState(false);
    const timerRef = useRef(null);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link.configure({
                openOnClick: false,
            }),
        ],
        // Inizializza con il valore dal database
        content: value,
        editable: !disabled,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            
            // Cancella il timer precedente se l'utente sta ancora scrivendo
            if (timerRef.current) clearTimeout(timerRef.current);
            
            // Imposta un nuovo timer: salva su Firebase solo dopo 800ms di inattività
            timerRef.current = setTimeout(() => {
                onChange(html);
            }, 800);
        },
        onFocus: () => {
            setIsFocused(true);
        },
        onBlur: ({ editor }) => {
            setIsFocused(false);
            // Salva istantaneamente quando si esce dal campo
            if (timerRef.current) clearTimeout(timerRef.current);
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: `prose prose-sm focus:outline-none max-w-none p-4 text-gray-700 leading-relaxed overflow-y-auto ${isMaximized ? 'h-[60vh]' : 'min-h-[100px] max-h-[300px]'} ${disabled ? 'bg-gray-50/50 cursor-not-allowed' : ''}`,
            },
        },
    });

    // Effetto per aggiornare l'editor con i dati provenienti da Firebase
    useEffect(() => {
        // AGGIORNA SOLO SE L'UTENTE NON CI STA SCRIVENDO DENTRO
        if (editor && !isFocused) {
            const currentHTML = editor.getHTML();
            // Evita loop infiniti di aggiornamento se il testo è già uguale
            if (value !== currentHTML) {
                // Mantiene il cursore al suo posto se l'editor non è completamente distrutto
                const { from, to } = editor.state.selection;
                editor.commands.setContent(value || '');
                // Prova a ripristinare la posizione del cursore, se possibile
                try {
                     editor.commands.setTextSelection({ from, to });
                } catch (e) {
                     // Ignora errori se la lunghezza del testo è cambiata drasticamente
                }
            }
        }
    }, [value, editor, isFocused]);

    useEffect(() => {
        if (editor) {
            editor.setEditable(!disabled);
        }
    }, [disabled, editor]);

    // Pulizia del timer se il componente viene distrutto
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    if (!editor) return null;

    const toggleBold = () => editor.chain().focus().toggleBold().run();
    const toggleItalic = () => editor.chain().focus().toggleItalic().run();
    const toggleUnderline = () => editor.chain().focus().toggleUnderline().run();
    const toggleBulletList = () => editor.chain().focus().toggleBulletList().run();
    const toggleOrderedList = () => editor.chain().focus().toggleOrderedList().run();

    const handleAIAction = async (mode = null) => {
        if (!editor || isGenerating || disabled) return;
        const { from, to } = editor.state.selection;
        const selectionText = editor.state.doc.textBetween(from, to, ' ');
        const fullText = editor.getText();
        setIsGenerating(true);
        try {
            const apiUrl = import.meta.env.DEV ? 'http://localhost:3000/api/ai-writer' : '/api/ai-writer';
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: fullText, selection: selectionText || null, instruction: aiInstruction, mode: mode })
            });
            const data = await response.json();
            if (data.text) setAiResult(data.text);
        } catch (error) {
            console.error('AI Error:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const applyAIProposal = () => {
        if (!editor || disabled) return;
        const { from, to } = editor.state.selection;
        if (from !== to) {
            editor.chain().focus().deleteSelection().insertContent(aiResult).run();
        } else {
            editor.commands.setContent(aiResult);
        }
        setAiResult('');
        setIsAIActive(false);
        // Forza un salvataggio quando applichi l'AI
        onChange(editor.getHTML());
    };

    return (
        <div className={`flex flex-col border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden transition-all ${isMaximized ? 'fixed inset-4 z-[1000] shadow-2xl' : 'relative w-full h-full'}`}>
            {!disabled && (
                <div className="flex flex-col border-b border-gray-100 bg-gray-50/50 print:hidden">
                    <div className="flex flex-wrap items-center justify-between p-1.5 gap-1">
                        <div className="flex items-center gap-0.5">
                            <button onClick={toggleBold} className={`p-1 rounded ${editor.isActive('bold') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}><Bold size={15} /></button>
                            <button onClick={toggleItalic} className={`p-1 rounded ${editor.isActive('italic') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}><Italic size={15} /></button>
                            <button onClick={toggleUnderline} className={`p-1 rounded ${editor.isActive('underline') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}><UnderlineIcon size={15} /></button>
                            <div className="w-px h-4 bg-gray-300 mx-1" />
                            <button onClick={toggleBulletList} className={`p-1 rounded ${editor.isActive('bulletList') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}><List size={15} /></button>
                            <button onClick={toggleOrderedList} className={`p-1 rounded ${editor.isActive('orderedList') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}><ListOrdered size={15} /></button>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setIsMaximized(!isMaximized)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md"><Maximize size={15} /></button>
                            <button
                                onClick={() => setIsAIActive(!isAIActive)}
                                className={`p-1.5 rounded-full transition-all ${isAIActive ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-200' : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'}`}
                            >
                                {isGenerating ? <Loader2 size={16} className="animate-spin text-purple-600" /> : <Sparkles size={16} />}
                            </button>
                        </div>
                    </div>
                    {isAIActive && (
                        <div className="px-3 py-2 border-t border-purple-100 bg-purple-50/30 flex flex-col gap-2">
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                                <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest shrink-0">AI:</span>
                                {['Professionale', 'Accorcia', 'Espandi', 'Fluido'].map(label => (
                                    <button key={label} onClick={() => handleAIAction(label)} className="px-2 py-0.5 bg-white border border-purple-100 text-purple-600 rounded-full text-[10px] font-medium hover:bg-purple-100 transition-all whitespace-nowrap">{label}</button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-grow">
                                    <input
                                        type="text"
                                        placeholder="Istruzioni AI..."
                                        className="w-full bg-white border border-purple-100 rounded-lg px-3 py-1 text-xs focus:ring-2 focus:ring-purple-200 outline-none"
                                        value={aiInstruction}
                                        onChange={(e) => setAiInstruction(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAIAction()}
                                    />
                                    <button onClick={() => handleAIAction()} disabled={!aiInstruction.trim() || isGenerating} className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-purple-500 disabled:opacity-30"><Send size={14} /></button>
                                </div>
                                <button onClick={() => setIsAIActive(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={16} /></button>
                            </div>
                        </div>
                    )}
                </div>
            )}
            <div className="relative flex-grow flex flex-col [&>div]:flex-grow">
                <EditorContent editor={editor} className="flex-grow flex flex-col" />
                {(!editor.getHTML() || editor.getHTML() === '<p></p>') && (
                    <div className="absolute top-4 left-4 text-gray-400 pointer-events-none text-xs italic">{placeholder}</div>
                )}
            </div>
            {aiResult && (
                <div className="m-2 p-3 bg-white border border-purple-100 rounded-xl shadow-lg z-[1001]">
                    <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-purple-50">
                        <div className="flex items-center gap-1.5 text-purple-600 uppercase font-bold text-[10px]"><Wand2 size={12} /> Suggerimento AI</div>
                        <button onClick={() => setAiResult('')} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                    </div>
                    <div className="text-[13px] text-gray-700 leading-relaxed mb-3 italic">{aiResult}</div>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setAiResult('')} className="px-2.5 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-lg">Scarta</button>
                        <button onClick={applyAIProposal} className="px-3 py-1 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700">Applica</button>
                    </div>
                </div>
            )}
            <style dangerouslySetInnerHTML={{
                __html: `
                .prose p { margin: 0; }
                .prose ul { list-style-type: disc; padding-left: 1.25rem; }
                .prose ol { list-style-type: decimal; padding-left: 1.25rem; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .tiptap { flex-grow: 1; outline: none; }
            `}} />
        </div>
    );
};

export default AdvancedEditor;
