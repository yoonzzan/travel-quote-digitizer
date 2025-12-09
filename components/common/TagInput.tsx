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
            <div className="flex flex-wrap gap-2 mb-2 min-h-[26px]">
                {tags.length > 0 ? (
                    tags.map((tag, index) => (
                        <span key={index} className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${colorClass}`}>
                            {tag}
                            <button onClick={() => onRemove(index)} className="hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                        </span>
                    ))
                ) : (
                    <span className="text-xs text-slate-300 py-1">등록된 태그가 없습니다.</span>
                )}
            </div>
            <div className="relative">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-hana-mint focus:border-hana-mint outline-none bg-white text-slate-900 placeholder-slate-400 transition-all"
                    placeholder={placeholder}
                />
            </div>
        </div>
    );
};

export default TagInput;
