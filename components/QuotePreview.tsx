
import React, { useEffect, useState } from 'react';
import { TravelQuoteData } from '../types';
import { generateQuoteHtml } from '../utils/htmlGenerator';
import { Download, Printer, ExternalLink } from 'lucide-react';

interface QuotePreviewProps {
  data: TravelQuoteData;
}

const QuotePreview: React.FC<QuotePreviewProps> = ({ data }) => {
  const [htmlContent, setHtmlContent] = useState<string>('');

  useEffect(() => {
    if (data) {
      setHtmlContent(generateQuoteHtml(data));
    }
  }, [data]);

  const handleDownload = () => {
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

  const handlePrintPopup = () => {
    // 새 창(팝업) 열기
    const printWindow = window.open('', '_blank', 'width=1000,height=900');
    
    if (!printWindow) {
      alert("팝업 차단이 설정되어 있습니다. 차단을 해제하고 다시 시도해주세요.");
      return;
    }

    // HTML 내용 쓰기
    printWindow.document.write(htmlContent);
    printWindow.document.close(); // 문서 로딩 완료 신호

    // 약간의 딜레이 후 자동으로 인쇄 창 띄우기 (이미지/스타일 로딩 확보)
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    };
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between flex-shrink-0">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">실시간 미리보기</h3>
        <div className="flex gap-2">
          <button
            onClick={handlePrintPopup}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            인쇄 / PDF 저장
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-hana-purple hover:bg-[#4a227a] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            HTML 다운로드
          </button>
        </div>
      </div>

      <div className="flex-1 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden relative shadow-inner">
        <div className="absolute inset-0 flex flex-col">
          {/* Browser-like header */}
          <div className="bg-slate-200 px-4 py-2 flex items-center gap-2 border-b border-slate-300">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
            </div>
            <div className="flex-1 bg-white h-6 rounded-md mx-4 text-[10px] text-slate-400 flex items-center px-2 truncate">
              여행견적서-{data.quote_info.code}.html
            </div>
            <button onClick={handlePrintPopup} title="새 창에서 열기">
                <ExternalLink className="w-3 h-3 text-slate-500 hover:text-hana-purple" />
            </button>
          </div>
          
          {/* Iframe Container */}
          <iframe
            srcDoc={htmlContent}
            title="Quote Preview"
            className="w-full flex-1 bg-white"
            sandbox="allow-same-origin allow-scripts allow-modals allow-popups"
          />
        </div>
      </div>
      
      <p className="text-xs text-slate-400 text-center">
        '인쇄 / PDF 저장' 버튼을 누르면 새 창이 열리며, 인쇄 대화상자에서 <strong>[PDF로 저장]</strong>을 선택하세요.
      </p>
    </div>
  );
};

export default QuotePreview;
