import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import {
    Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Maximize
} from 'lucide-react';

const AdvancedEditor = ({ value, onChange, placeholder, disabled = false }) => {
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
                        </div>
                    </div>
                </div>
            )}
            <div className="relative flex-grow flex flex-col [&>div]:flex-grow">
                <EditorContent editor={editor} className="flex-grow flex flex-col" />
                {(!editor.getHTML() || editor.getHTML() === '<p></p>') && (
                    <div className="absolute top-4 left-4 text-gray-400 pointer-events-none text-xs italic">{placeholder}</div>
                )}
            </div>
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
