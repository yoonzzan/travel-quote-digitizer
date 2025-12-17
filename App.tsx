
import React, { useState } from 'react';
import { ParsingStatus, TravelQuoteData } from './types';
import { extractDataFromDocument } from './services/aiService';
import { generateQuoteHtml } from './utils/htmlGenerator';
import FileUploader from './components/FileUploader';
import JsonViewer from './components/JsonViewer';
import DocumentPreview from './components/DocumentPreview';
import DataEditor from './components/DataEditor';
import HanatourLogo from './components/HanatourLogo';
import { ArrowRight, AlertCircle, Loader2, Edit3, Code, Printer, Download } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<ParsingStatus>(ParsingStatus.IDLE);
  const [data, setData] = useState<TravelQuoteData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'json'>('editor');

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setStatus(ParsingStatus.IDLE);
    setErrorMsg(null);
    setData(null);
    setActiveTab('editor');
  };

  const handleConvert = async () => {
    if (!selectedFile) return;

    setStatus(ParsingStatus.PROCESSING);
    setErrorMsg(null);

    try {
      const extractedData = await extractDataFromDocument(selectedFile);
      setData(extractedData);
      setStatus(ParsingStatus.SUCCESS);
      setActiveTab('editor');
    } catch (error: any) {
      setStatus(ParsingStatus.ERROR);
      setErrorMsg(error.message || "문서 분석에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handlePrintPreview = () => {
    if (!data) return;

    const htmlContent = generateQuoteHtml(data);
    const printWindow = window.open('', '_blank', 'width=1000,height=900');

    if (!printWindow) {
      alert("팝업 차단이 설정되어 있습니다. 차단을 해제하고 다시 시도해주세요.");
      return;
    }

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    };
  };

  const handleDownloadHtml = () => {
    if (!data) return;
    const htmlContent = generateQuoteHtml(data);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Quote_${data.quote_info.code || 'Draft'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex flex-col lg:flex-row overflow-hidden lg:overflow-visible">

      {/* Sidebar (Mobile: Top / Desktop: Left) */}
      <aside className="w-full lg:w-96 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex-shrink-0 flex flex-col h-auto lg:h-screen lg:sticky lg:top-0 z-30 overflow-y-auto custom-scrollbar shadow-sm lg:shadow-none">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between lg:block">
          <div>
            <div className="mb-1">
              <HanatourLogo />
            </div>
            <p className="text-xs text-slate-500 font-medium pl-1">AI 스마트 견적 비서</p>
          </div>
        </div>

        <div className="p-6 space-y-6 flex-1">
          {/* 1. Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-hana-light text-hana-purple flex items-center justify-center text-xs">1</span>
              문서 업로드
            </label>
            <FileUploader
              onFileSelect={handleFileSelect}
              isProcessing={status === ParsingStatus.PROCESSING}
              selectedFileName={selectedFile?.name}
            />
          </div>

          {/* 2. Convert Action */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-hana-light text-hana-purple flex items-center justify-center text-xs">2</span>
              변환 실행
            </label>
            <button
              onClick={handleConvert}
              disabled={!selectedFile || status === ParsingStatus.PROCESSING}
              className={`
                w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all
                ${!selectedFile || status === ParsingStatus.PROCESSING
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-hana-purple to-[#7c3aed] hover:to-[#6d28d9] text-white shadow-lg hover:shadow-xl shadow-purple-200 transform active:scale-[0.98]'}
              `}
            >
              {status === ParsingStatus.PROCESSING ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI가 분석 중입니다...
                </>
              ) : (
                <>
                  AI 분석 시작
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {status === ParsingStatus.ERROR && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex gap-2 items-start animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* 3. Original Document Preview (Moved Here) */}
          {selectedFile && (
            <div className="pt-4 border-t border-slate-100 space-y-2 animate-in fade-in slide-in-from-bottom-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">원본 문서 미리보기</label>
              <div className="rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                <DocumentPreview file={selectedFile} />
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area (Right) */}
      <main className="flex-1 flex flex-col min-w-0 h-[calc(100vh-80px)] lg:h-screen">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 lg:px-8 flex-shrink-0 sticky top-0 z-20">
          <h2 className="font-bold text-lg text-slate-800 hidden lg:block">작업 공간</h2>

          {data ? (
            <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
              <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                <button
                  onClick={() => setActiveTab('editor')}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all
                    ${activeTab === 'editor'
                      ? 'bg-white text-hana-purple shadow-sm ring-1 ring-black/5'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}
                  `}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  데이터 편집
                </button>
                <button
                  onClick={() => setActiveTab('json')}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all
                    ${activeTab === 'json'
                      ? 'bg-white text-hana-mint shadow-sm ring-1 ring-black/5'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}
                  `}
                >
                  <Code className="w-3.5 h-3.5" />
                  JSON
                </button>
              </div>

              <button
                onClick={handleDownloadHtml}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-hana-purple text-sm font-bold shadow-sm transition-all hover:shadow-md transform active:scale-95"
                title="HTML 파일로 다운로드"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">HTML 저장</span>
              </button>

              <button
                onClick={handlePrintPreview}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-hana-purple hover:bg-[#4a227a] text-white text-sm font-bold shadow-md transition-all hover:shadow-lg transform active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">견적서 인쇄</span>
              </button>
            </div>
          ) : (
            <div className="text-sm text-slate-400 italic">파일을 업로드해주세요</div>
          )}
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
          {!data && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
              <div className="max-w-md text-center">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
                  <ArrowRight className="w-10 h-10 text-hana-light" />
                </div>
                <h3 className="text-xl font-bold text-slate-700 mb-2">데이터가 없습니다</h3>
                <p className="text-slate-500 leading-relaxed">
                  좌측 메뉴에서 파일을 업로드하고<br />
                  <span className="font-bold text-hana-purple">AI 분석 시작</span> 버튼을 눌러주세요.
                </p>
              </div>
            </div>
          )}

          {data && activeTab === 'editor' && (
            <div className="p-4 lg:p-8 pb-20 lg:pb-20 max-w-5xl mx-auto">
              <DataEditor
                data={data}
                onChange={(newData) => setData(newData)}
              />
            </div>
          )}

          {data && activeTab === 'json' && (
            <div className="p-4 lg:p-8 pb-20 lg:pb-20 max-w-5xl mx-auto">
              <JsonViewer data={data} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
