import React, { useCallback } from 'react';
import { UploadCloud, FileText, FileSpreadsheet } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  selectedFileName?: string | null;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, isProcessing, selectedFileName }) => {
  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (isProcessing) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onFileSelect(file);
    }
  }, [onFileSelect, isProcessing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isProcessing) return;
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <label 
        className={`
          flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer 
          transition-colors duration-200 relative overflow-hidden
          ${isProcessing 
            ? 'bg-slate-100 border-slate-300' 
            : 'bg-white border-slate-300 hover:bg-hana-light hover:border-hana-purple'}
        `}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 px-2 text-center z-10">
          {selectedFileName ? (
            <>
              {selectedFileName.endsWith('.xlsx') || selectedFileName.endsWith('.xls') || selectedFileName.endsWith('.csv') ? (
                <FileSpreadsheet className="w-10 h-10 mb-3 text-emerald-600" />
              ) : (
                <FileText className="w-10 h-10 mb-3 text-hana-purple" />
              )}
              <p className="text-sm text-slate-700 font-medium truncate max-w-[200px]">{selectedFileName}</p>
              <p className="text-xs text-slate-500 mt-1">변경하려면 클릭</p>
            </>
          ) : (
            <>
              <UploadCloud className={`w-10 h-10 mb-3 ${isProcessing ? 'text-slate-400' : 'text-hana-purple'}`} />
              <p className="text-sm text-slate-600 font-medium">
                <span className="font-semibold text-hana-purple">클릭하여 업로드</span> 또는 드래그
              </p>
              <div className="text-xs text-slate-500 mt-3 space-y-1 leading-relaxed">
                <p>📄 PDF, 이미지 (.pdf, .jpg, .png)</p>
                <p>📊 엑셀, CSV (.xlsx, .xls, .csv)</p>
                <p>📝 텍스트 (.txt)</p>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">*워드/PPT는 PDF로 변환 후 업로드 권장</p>
            </>
          )}
        </div>
        <input 
          type="file" 
          className="hidden" 
          onChange={handleChange} 
          accept="image/*,.pdf,.csv,.txt,.xlsx,.xls"
          disabled={isProcessing}
        />
      </label>
    </div>
  );
};

export default FileUploader;