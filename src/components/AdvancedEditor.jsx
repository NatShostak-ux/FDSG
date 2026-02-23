import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import {
    Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Maximize, 
    Link as LinkIcon, Unlink, Check, X
} from 'lucide-react';

const AdvancedEditor = ({ value, onChange, placeholder, disabled = false }) => {
    const [isMaximized, setIsMaximized] = useState(false);
    
    // STATI PER I LINK
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');

    // STATI PER LA COLLABORAZIONE FLUIDA
    const [isFocused, setIsFocused] = useState(false);
    const timerRef = useRef(null);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link.configure({
                openOnClick: false, // Evita che cliccando il link nell'editor si apra la pagina (permette la modifica)
                autolink: true,
                linkOnPaste: true,
            }),
        ],
        content: value,
        editable: !disabled,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                onChange(html);
            }, 800);
        },
        onFocus: () => {
            setIsFocused(true);
        },
        onBlur: ({ editor }) => {
            setIsFocused(false);
            if (timerRef.current) clearTimeout(timerRef.current);
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: `prose prose-sm focus:outline-none max-w-none p-4 text-gray-700 leading-relaxed overflow-y-auto ${isMaximized ? 'h-[60vh]' : 'min-h-[100px] max-h-[300px]'} ${disabled ? 'bg-gray-50/50 cursor-not-allowed' : ''}`,
            },
        },
    });

    useEffect(() => {
        if (editor && !isFocused) {
            const currentHTML = editor.getHTML();
            if (value !== currentHTML) {
                const { from, to } = editor.state.selection;
                editor.commands.setContent(value || '');
                try {
                     editor.commands.setTextSelection({ from, to });
                } catch (e) {}
            }
        }
    }, [value, editor, isFocused]);

    useEffect(() => {
        if (editor) {
            editor.setEditable(!disabled);
        }
    }, [disabled, editor]);

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

    // GESTIONE LINK
    const openLinkModal = () => {
        const previousUrl = editor.getAttributes('link').href;
        setLinkUrl(previousUrl || '');
        setShowLinkInput(true);
    };

    const setLink = () => {
        if (linkUrl === null || linkUrl.trim() === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
            // Aggiunge https:// se l'utente non lo ha digitato
            const formattedUrl = /^https?:\/\//i.test(linkUrl) ? linkUrl : `https://${linkUrl}`;
            editor.chain().focus().extendMarkRange('link').setLink({ href: formattedUrl }).run();
        }
        setShowLinkInput(false);
        setLinkUrl('');
    };

    const removeLink = () => {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
        setShowLinkInput(false);
        setLinkUrl('');
    };

    return (
        <div className={`flex flex-col border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden transition-all ${isMaximized ? 'fixed inset-4 z-[1000] shadow-2xl' : 'relative w-full h-full'}`}>
            {!disabled && (
                <div className="flex flex-col border-b border-gray-100 bg-gray-50/50 print:hidden relative">
                    <div className="flex flex-wrap items-center justify-between p-1.5 gap-1">
                        <div className="flex items-center gap-0.5 relative">
                            <button onClick={toggleBold} className={`p-1 rounded ${editor.isActive('bold') ? 'bg-gray-200' : 'hover:bg-gray-100'}`} title="Grassetto"><Bold size={15} /></button>
                            <button onClick={toggleItalic} className={`p-1 rounded ${editor.isActive('italic') ? 'bg-gray-200' : 'hover:bg-gray-100'}`} title="Corsivo"><Italic size={15} /></button>
                            <button onClick={toggleUnderline} className={`p-1 rounded ${editor.isActive('underline') ? 'bg-gray-200' : 'hover:bg-gray-100'}`} title="Sottolineato"><UnderlineIcon size={15} /></button>
                            <div className="w-px h-4 bg-gray-300 mx-1" />
                            <button onClick={toggleBulletList} className={`p-1 rounded ${editor.isActive('bulletList') ? 'bg-gray-200' : 'hover:bg-gray-100'}`} title="Elenco puntato"><List size={15} /></button>
                            <button onClick={toggleOrderedList} className={`p-1 rounded ${editor.isActive('orderedList') ? 'bg-gray-200' : 'hover:bg-gray-100'}`} title="Elenco numerato"><ListOrdered size={15} /></button>
                            <div className="w-px h-4 bg-gray-300 mx-1" />
                            
                            {/* BOTTONE LINK */}
                            <button onClick={openLinkModal} className={`p-1 rounded transition-colors ${editor.isActive('link') ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`} title="Inserisci Link">
                                <LinkIcon size={15} />
                            </button>

                            {/* BOTTONE UNLINK (compare solo se il cursore è su un link esistente) */}
                            {editor.isActive('link') && (
                                <button onClick={removeLink} className="p-1 rounded hover:bg-red-100 text-red-600 transition-colors ml-0.5" title="Rimuovi Link">
                                    <Unlink size={15} />
                                </button>
                            )}

                            {/* MINI POP-UP PER INSERIMENTO URL */}
                            {showLinkInput && (
                                <div className="absolute top-[110%] left-0 mt-1 p-2 bg-white border border-gray-200 shadow-xl rounded-lg z-50 flex items-center gap-2 animate-fadeIn">
                                    <input 
                                        type="url" 
                                        value={linkUrl}
                                        onChange={(e) => setLinkUrl(e.target.value)}
                                        placeholder="https://..."
                                        className="border border-gray-300 rounded-md px-2.5 py-1 text-xs w-48 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') setLink();
                                            if (e.key === 'Escape') setShowLinkInput(false);
                                        }}
                                        autoFocus
                                    />
                                    <button onClick={setLink} className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"><Check size={14}/></button>
                                    <button onClick={() => setShowLinkInput(false)} className="p-1.5 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"><X size={14}/></button>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setIsMaximized(!isMaximized)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md"><Maximize size={15} /></button>
                        </div>
                    </div>
                </div>
            )}
            <div className="relative flex-grow flex flex-col [&>div]:flex-grow" onClick={() => { if(showLinkInput) setShowLinkInput(false) }}>
                <EditorContent editor={editor} className="flex-grow flex flex-col" />
                {(!editor.getHTML() || editor.getHTML() === '<p></p>') && (
                    <div className="absolute top-4 left-4 text-gray-400 pointer-events-none text-xs italic">{placeholder}</div>
                )}
            </div>
            {/* CSS INIETTATO PER STILIZZARE I LINK NELL'EDITOR */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .prose p { margin: 0; }
                .prose ul { list-style-type: disc; padding-left: 1.25rem; }
                .prose ol { list-style-type: decimal; padding-left: 1.25rem; }
                .prose a { color: #2563eb; text-decoration: underline; cursor: pointer; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .tiptap { flex-grow: 1; outline: none; }
            `}} />
        </div>
    );
};

export default AdvancedEditor;
