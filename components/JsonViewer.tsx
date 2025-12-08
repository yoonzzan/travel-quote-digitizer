
import React from 'react';
import { Copy, Check } from 'lucide-react';

interface JsonViewerProps {
  data: object | null;
}

const JsonViewer: React.FC<JsonViewerProps> = ({ data }) => {
  const [copied, setCopied] = React.useState(false);

  if (!data) return <div className="text-slate-400 text-center py-10 italic">아직 데이터가 생성되지 않았습니다.</div>;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-lg overflow-hidden border border-slate-700 bg-[#1e293b] shadow-inner">
      <div className="absolute top-3 right-3 z-10">
        <button
          onClick={handleCopy}
          className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors flex items-center gap-2 text-xs font-medium"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? '복사됨' : 'JSON 복사'}
        </button>
      </div>
      <pre className="p-4 text-xs md:text-sm font-mono text-slate-200 overflow-auto custom-scrollbar max-h-[600px]">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};

export default JsonViewer;
