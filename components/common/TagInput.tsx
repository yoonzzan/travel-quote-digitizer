import React from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
    label: string;
    tags: string[];
    onAdd: (tag: string) => void;
    onRemove: (index: number) => void;
    placeholder: string;
    colorClass?: string;
}

const TagInput: React.FC<TagInputProps> = ({ label, tags = [], onAdd, onRemove, placeholder, colorClass = "bg-blue-100 text-blue-700" }) => {
    const [input, setInput] = React.useState("");

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.nativeEvent.isComposing) return; // Prevent duplicate tags during IME composition
        if (e.key === 'Enter' && input.trim()) {
            e.preventDefault();
            onAdd(input.trim());
            setInput("");
        }
    };

    return (
        <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{label}</label>
            <div className="flex flex-wrap items-center gap-2 p-2 border border-slate-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-hana-mint focus-within:border-hana-mint transition-all min-h-[42px]">
                {tags.map((tag, index) => (
                    <span key={index} className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 ${colorClass}`}>
                        {tag}
                        <button
                            onClick={() => onRemove(index)}
                            className="hover:text-red-600 transition-colors bg-white/50 rounded-full p-0.5"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 min-w-[120px] text-sm bg-transparent border-none outline-none text-slate-900 placeholder-slate-400"
                    placeholder={tags.length === 0 ? placeholder : ""}
                />
            </div>
        </div>
    );
};

export default TagInput;
