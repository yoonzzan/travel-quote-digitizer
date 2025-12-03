import React, { useEffect, useState } from 'react';
import { FileSpreadsheet, FileText, Image as ImageIcon, File as FileIcon, FileQuestion, Eye, EyeOff } from 'lucide-react';
import { parseSpreadsheet } from '../services/geminiService';

interface DocumentPreviewProps {
  file: File | null;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ file }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'pdf' | 'binary' | 'text' | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [showExtractedText, setShowExtractedText] = useState(false);
  const [isLoadingText, setIsLoadingText] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setTextContent(null);
      setFileType(null);
      setShowExtractedText(false);
      return;
    }

    const fileName = file.name.toLowerCase();

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setFileType('image');
      return () => URL.revokeObjectURL(url);
    } else if (file.type === 'application/pdf') {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setFileType('pdf');
      return () => URL.revokeObjectURL(url);
    } else if (
      fileName.endsWith('.txt') || 
      fileName.endsWith('.csv') || 
      fileName.endsWith('.json')
    ) {
      setFileType('text');
      const reader = new FileReader();
      reader.onload = (e) => {
        setTextContent(e.target?.result as string);
      };
      reader.readAsText(file);
    } else {
      setFileType('binary');
      setPreviewUrl(null);
      setTextContent(null); // Reset text content for binary files
      setShowExtractedText(false);
    }
  }, [file]);

  const handleToggleText = async () => {
    if (showExtractedText) {
      setShowExtractedText(false);
      return;
    }

    if (textContent) {
      setShowExtractedText(true);
      return;
    }

    if (!file) return;

    setIsLoadingText(true);
    try {
      const text = await parseSpreadsheet(file);
      setTextContent(text);
      setShowExtractedText(true);
    } catch (e) {
      alert("데이터를 읽을 수 없습니다. 파일이 손상되었거나 암호가 걸려있을 수 있습니다.");
    } finally {
      setIsLoadingText(false);
    }
  };

  // Helper to determine icon based on extension
  const getFileIcon = () => {
    if (!file) return null;
    const name = file.name.toLowerCase();
    if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) {
      return <FileSpreadsheet className="w-12 h-12 text-green-600" />;
    }
    return <FileQuestion className="w-12 h-12 text-slate-400" />;
  };

  const getFileLabel = () => {
    if (!file) return "";
    const name = file.name.toLowerCase();
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) return "엑셀 파일 확인됨";
    if (name.endsWith('.ppt') || name.endsWith('.pptx')) return "프레젠테이션 파일";
    if (name.endsWith('.doc') || name.endsWith('.docx')) return "워드 문서";
    return "파일 확인됨";
  };

  if (!file) return null;

  return (
    <div className="bg-slate-50 rounded-lg overflow-hidden relative flex flex-col min-h-[300px] border border-slate-200">
        
      {fileType === 'image' && previewUrl && (
        <img 
          src={previewUrl} 
          alt="Preview" 
          className="w-full h-full object-contain bg-slate-100"
        />
      )}
      
      {fileType === 'pdf' && previewUrl && (
        <iframe
          src={previewUrl}
          title="PDF Preview"
          className="w-full h-full"
        />
      )}
      
      {fileType === 'binary' && !showExtractedText && (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-white absolute inset-0">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
            {getFileIcon()}
          </div>
          <h4 className="text-base font-bold text-slate-800 mb-1">{getFileLabel()}</h4>
          <p className="text-xs text-slate-500 mb-4 max-w-[200px] truncate font-mono bg-slate-100 px-2 py-1 rounded border border-slate-200">
            {file.name}
          </p>
          
          <div className="text-[10px] text-slate-400 max-w-xs leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3">
            <p>AI에게 전송될 데이터를 미리 확인해보세요.</p>
          </div>

          {(file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) && (
            <button 
              onClick={handleToggleText}
              className="text-xs flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 hover:text-hana-purple text-slate-600 px-3 py-1.5 rounded-full transition-colors shadow-sm"
            >
              {isLoadingText ? (
                 <span className="animate-pulse">데이터 읽는 중...</span>
              ) : (
                 <>
                   <Eye className="w-3.5 h-3.5" />
                   추출된 텍스트 데이터 보기
                 </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Text Preview Overlay */}
      {(fileType === 'text' || showExtractedText) && textContent && (
        <div className="absolute inset-0 flex flex-col bg-white z-10">
           <div className="flex items-center justify-between px-3 py-2 bg-slate-100 border-b border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Raw Data Preview</span>
              {fileType === 'binary' && (
                <button onClick={() => setShowExtractedText(false)} className="text-xs flex items-center gap-1 text-slate-500 hover:text-red-500">
                  <EyeOff className="w-3 h-3" /> 닫기
                </button>
              )}
           </div>
           <div className="flex-1 overflow-auto p-3 custom-scrollbar">
             <pre className="text-[10px] font-mono text-slate-600 whitespace-pre-wrap">{textContent}</pre>
           </div>
        </div>
      )}
    </div>
  );
};

export default DocumentPreview;