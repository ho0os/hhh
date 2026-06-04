import React, { useState } from "react";
import { ArrowLeft, ArrowRight, Share2, Shield, Lock, FileText, Info, Printer, X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { EmployeeDocument, Employee } from "../types";

interface DocPreviewScreenProps {
  document: EmployeeDocument;
  employee?: Employee;
  onBack: () => void;
}

export default function DocPreviewScreen({ document, employee, onBack }: DocPreviewScreenProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomScale, setZoomScale] = useState(1.0);

  const previewName = employee && document.badgeType === "id_card" ? employee.name : document.previewName;
  const previewId = employee && document.badgeType === "id_card" ? employee.nationalId : document.previewId;
  const previewExpiry = employee && document.badgeType === "id_card" ? employee.nationalIdExpiry : document.previewExpiry;
  
  // The small avatar on the simulated digital ID Card
  const avatarImage = employee?.avatar || document.previewImage || null;

  // The actual uploaded attachment of this document
  const uploadedImageSrc = document.badgeType === "id_card" 
    ? employee?.nationalIdImage 
    : employee?.securityDocImage;

  const hasUploadedImage = !!uploadedImageSrc;

  // View mode of the document preview: defaults to 'uploaded' if the attachment exists, fallback to 'digital'
  const [viewMode, setViewMode] = useState<"uploaded" | "digital">(hasUploadedImage ? "uploaded" : "digital");
  
  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    alert("تم نسخ رابط مشاركة الوثيقة المشفرة بنجاح!");
  };

  return (
    <div className="pb-28 pt-4 px-4 bg-[#f8f9fa] min-h-screen text-[#191c1d] flex flex-col justify-between">
      {/* Top Header Navigation */}
      <header className="flex flex-row justify-between items-center h-16 w-full mb-4">
        <div>
          <button 
            type="button"
            onClick={handleShare}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 text-[#1e3a8a] shadow-sm transition-transform active:scale-95"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
        <h1 className="font-sans text-base font-bold text-[#1e3a8a]">معاينة المستند</h1>
        <button 
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 text-[#1e3a8a] shadow-sm transition-transform active:scale-95"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-sm mx-auto w-full space-y-5 text-right select-none">
        
        {/* Document type meta */}
        <div className="flex flex-col gap-1 items-start text-right w-full pr-1">
          <span className="bg-[#d6e0f1] text-[#191c1d] px-3 py-1 rounded-full font-sans text-[10px] font-bold">
            ملف أمني • هوية موظف
          </span>
          <h2 className="text-base font-extrabold mt-2 text-gray-800">{document.title}</h2>
          <p className="text-[10px] text-gray-400 font-medium font-sans">آخر تحديث: {document.lastUpdated}</p>
        </div>

        {/* View Mode Toggle Switch */}
        {hasUploadedImage && (
          <div className="flex justify-center bg-gray-150 p-0.5 rounded-xl w-full border border-gray-200">
            <button
              type="button"
              onClick={() => setViewMode("digital")}
              className={`flex-1 py-2 text-[11px] font-extrabold rounded-lg transition-all ${
                viewMode === "digital" 
                  ? "bg-white text-[#1e3a8a] shadow-xs" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              النسخة الرقمية الموّلدة
            </button>
            <button
              type="button"
              onClick={() => setViewMode("uploaded")}
              className={`flex-1 py-2 text-[11px] font-extrabold rounded-lg transition-all ${
                viewMode === "uploaded" 
                  ? "bg-white text-[#1e3a8a] shadow-xs" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              صورة المستند المرفوع
            </button>
          </div>
        )}

        {/* Document Viewer Frame */}
        {viewMode === "uploaded" && uploadedImageSrc ? (
          /* Render Uploaded Scanning image/PDF attachment */
          <div 
            onClick={() => {
              setIsZoomed(true);
              setZoomScale(1.3);
            }}
            className="w-full aspect-[3/2] relative group select-none cursor-zoom-in active:scale-[0.98] transition-all bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex items-center justify-center p-2"
            title="انقر لتكبير المرفق ومعاينته"
          >
            {/* Visual Hover Tag */}
            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all pointer-events-none z-10 duration-150">
              <div className="bg-white/95 backdrop-blur-sm text-[#1e3a8a] text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 transform translate-y-3 group-hover:translate-y-0 transition-transform">
                <ZoomIn className="w-4 h-4 text-[#1e3a8a] animate-pulse" />
                <span>انقر لتكبير الوثيقة</span>
              </div>
            </div>

            {uploadedImageSrc.startsWith("data:application/pdf") ? (
              <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center text-center p-3 gap-1">
                <FileText className="w-10 h-10 text-rose-500" />
                <span className="text-[10px] font-bold text-gray-700">مستند PDF مرفق</span>
                <span className="text-[8px] text-gray-400 font-sans truncate max-w-full px-4">{document.fileName}</span>
                <div className="text-[9px] text-[#1e3a8a] font-bold mt-1 bg-blue-50 px-2 py-0.5 rounded">اضغط لتكبير ومعاينة الصفحة الكاملة</div>
              </div>
            ) : (
              <img 
                src={uploadedImageSrc} 
                alt="Uploaded Document" 
                className="w-full h-full object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
        ) : document.badgeType === "id_card" ? (
          <div 
            onClick={() => {
              setIsZoomed(true);
              setZoomScale(1.3); // Starts with premium zoomed state automatically
            }}
            className="w-full aspect-[3/2] relative group select-none cursor-zoom-in active:scale-[0.98] transition-transform"
            title="انقر لتكبير الهوية الوطنية وفحصها"
          >
            {/* Ambient Shadow glow container */}
            <div className="absolute inset-0 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col transform transition-all duration-300 group-hover:scale-[1.01] p-4 justify-between">
              
              {/* Micro-Interaction Zoom Help Badge */}
              <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all pointer-events-none z-10 duration-350">
                <div className="bg-white/95 backdrop-blur-sm text-[#1e3a8a] text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 transform translate-y-3 group-hover:translate-y-0 transition-transform">
                  <ZoomIn className="w-4 h-4 text-[#1e3a8a] animate-pulse" />
                  <span>انقر للتكبير وفحص البيانات</span>
                </div>
              </div>

              <div className="flex justify-between items-start gap-3">
                {/* Photo frame */}
                <div className="w-[74px] h-[98px] bg-gray-50 rounded-lg overflow-hidden border border-gray-150 shadow-inner flex-shrink-0 flex items-center justify-center">
                  {avatarImage ? (
                    <img 
                      src={avatarImage} 
                      alt="Employee"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400 gap-1 select-none">
                      <div className="w-8 h-8 rounded-full bg-blue-50 border border-[#1e3a8a]/20 flex items-center justify-center text-[10px] font-black text-[#1e3a8a] font-sans">
                        {previewName ? previewName.split(" ").slice(0, 2).map((n) => n[0]).join("") : "إ م"}
                      </div>
                      <span className="text-[7px] font-bold text-gray-400 select-none">بدون صورة</span>
                    </div>
                  )}
                </div>

                {/* State Logo metadata details */}
                <div className="flex flex-col items-end gap-1 text-right flex-1 select-none">
                  <div className="w-10 h-10 bg-blue-50 text-[#1e3a8a] rounded-full flex items-center justify-center border border-blue-100 mb-1">
                    <Shield className="w-5 h-5 text-[#1e3a8a]" />
                  </div>
                  <p className="text-[8px] font-bold text-gray-400">وزارة الموارد البشرية</p>
                  <p className="text-[11px] font-extrabold text-[#1e3a8a] tracking-tight leading-none">المملكة العربية السعودية</p>
                </div>
              </div>

              {/* ID Details Text Section */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-right mt-3 text-gray-800">
                <div>
                  <p className="text-[8px] font-bold text-gray-400">الاسم الكامل</p>
                  <p className="text-[10px] font-bold text-gray-800 leading-tight">{previewName}</p>
                </div>
                <div>
                  <p className="text-[8px] font-bold text-gray-400">رقم الهوية</p>
                  <p className="text-[10px] font-extrabold text-[#1a56db] font-sans tracking-wide leading-none">{previewId}</p>
                </div>
                <div>
                  <p className="text-[8px] font-bold text-gray-400">تاريخ الميلاد</p>
                  <p className="text-[10px] font-bold text-gray-800">{document.previewBirthdate}</p>
                </div>
                <div>
                  <p className="text-[8px] font-bold text-gray-400">تاريخ الانتهاء</p>
                  <p className="text-[10px] font-bold text-amber-700">{previewExpiry}</p>
                </div>
              </div>

              {/* Security Background Micro dot pattern */}
              <div 
                className="absolute bottom-0 right-0 left-0 h-10 opacity-[0.03] pointer-events-none" 
                style={{
                  backgroundImage: "radial-gradient(#1e3a8a 0.5px, transparent 0.5px)", 
                  backgroundSize: "8px 8px"
                }}
              />
            </div>
          </div>
        ) : (
          /* Alternate Document preview render style */
          <div 
            onClick={() => {
              setIsZoomed(true);
              setZoomScale(1.3);
            }}
            className="w-full aspect-[3/2] relative group select-none cursor-zoom-in active:scale-[0.98] transition-all"
            title="انقر لتكبير ومعاينة المستند"
          >
            {/* Visual Hover Tag */}
            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all pointer-events-none z-10 duration-350">
              <div className="bg-white/95 backdrop-blur-sm text-[#1e3a8a] text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 transform translate-y-3 group-hover:translate-y-0 transition-transform">
                <ZoomIn className="w-4 h-4 text-[#1e3a8a]" />
                <span>انقر للتكبير والتصفح</span>
              </div>
            </div>

            <div className="absolute inset-0 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col p-6 items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <Shield className="w-8 h-8 fill-amber-50" />
              </div>
              <h4 className="text-xs font-bold text-gray-800">{document.title}</h4>
              <p className="text-[10px] text-gray-400 select-all font-mono tracking-wider">{document.fileName}</p>
              <div className="p-2 border border-gray-100 bg-gray-50 rounded-lg text-center text-[9px] text-gray-500 max-w-[200px]">
                مستند مسح الأمان عالي الخصوصية مشفر بواسطة خوارزميات HRMS
              </div>
            </div>
          </div>
        )}

        {/* Info detail cells */}
        <div className="grid grid-cols-1 gap-2.5 pt-2">
          
          {/* File type box */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <Info className="w-4 h-4 text-gray-400" />
            <div className="flex items-center gap-3 flex-row-reverse">
              <div className="w-9 h-9 bg-[#d6e0f1] rounded-lg flex items-center justify-center text-[#1e3a8a] flex-shrink-0">
                <FileText className="w-5 h-5 text-[#1e3a8a]" />
              </div>
              <div className="text-right">
                <p className="text-[8px] text-gray-400">نوع الملف والمساحة</p>
                <p className="text-[10px] font-bold text-gray-700 leading-tight">PDF ({document.fileSize})</p>
              </div>
            </div>
          </div>

          {/* Privacy limit box */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <Shield className="w-4 h-4 text-amber-700" />
            <div className="flex items-center gap-3 flex-row-reverse">
              <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center text-amber-700 flex-shrink-0 border border-amber-100">
                <Lock className="w-5 h-5 text-amber-700" />
              </div>
              <div className="text-right">
                <p className="text-[8px] text-gray-400">مستوى السرية والوصول</p>
                <p className="text-[10px] font-bold text-amber-700 leading-tight">{document.securityLevel}</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Fixed bottom action controls */}
      <footer className="fixed bottom-0 left-0 w-full z-40 bg-white border-t border-gray-100 px-4 py-4 flex flex-row-reverse gap-3 items-center shadow-[0_-4px_12px_rgba(0,0,0,0.03)] rounded-t-xl max-w-sm mx-auto left-1/2 -translate-x-1/2 font-sans">
        <button 
          onClick={handlePrint}
          className="flex-1 h-12 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform bg-[#1e3a8a] hover:bg-[#152a63]"
        >
          <Printer className="w-4 h-4" />
          <span>{document.badgeType === "id_card" ? "طباعة الهوية الوطنية" : "طباعة المستند"}</span>
        </button>

        <button 
          onClick={onBack}
          className="flex-1 h-12 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform bg-white hover:bg-gray-50"
        >
          <X className="w-4 h-4" />
          <span>إغلاق المعاينة</span>
        </button>
      </footer>

      {/* Zoom-in Interactive Modal Overlay */}
      {isZoomed && (
        <div 
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in cursor-default select-none"
          onClick={() => setIsZoomed(false)}
        >
          {/* Prevent back clicks when clicking on the modal inner card or actions tray */}
          <div 
            className="w-full max-w-sm flex flex-col items-center justify-center relative z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Header Stats */}
            <div className="w-full flex justify-between items-center mb-4 text-white">
              <button
                onClick={() => setIsZoomed(false)}
                className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-full transition-all border border-white/15"
                title="إغلاق التكبير"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 flex-row-reverse text-right">
                <span className="text-xs font-bold font-mono bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30">
                  {Math.round(zoomScale * 100)}%
                </span>
                <span className="text-sm font-semibold tracking-wide font-sans">{document.title}</span>
              </div>
            </div>

            {/* Visual Simulated Zoomable Workspace */}
            <div className="w-full aspect-[3/2] bg-zinc-950/40 rounded-2xl border border-white/10 overflow-hidden relative shadow-2xl flex items-center justify-center select-text">
              <div 
                style={{
                  transform: `scale(${zoomScale})`,
                  transition: "transform 150ms cubic-bezier(0.16, 1, 0.3, 1)"
                }}
                className="w-[90%] h-[90%] transform origin-center flex flex-col animate-fade-in"
              >
                {viewMode === "uploaded" && uploadedImageSrc ? (
                  uploadedImageSrc.startsWith("data:application/pdf") ? (
                    <div className="w-full h-full bg-white rounded-xl p-2 flex flex-col items-center justify-center text-center gap-1.5 overflow-hidden">
                      <FileText className="w-10 h-10 text-rose-500 flex-shrink-0" />
                      <span className="text-[10px] font-bold text-gray-800 leading-none">مستند PDF المرفق</span>
                      <iframe src={uploadedImageSrc} className="w-full h-full border rounded-lg bg-white" title="PDF Document Zoom View" />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-white rounded-xl p-1 flex items-center justify-center shadow-lg relative">
                      <img 
                        src={uploadedImageSrc} 
                        alt="Uploaded Document"
                        className="w-full h-full object-contain rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )
                ) : document.badgeType === "id_card" ? (
                  <div className="w-full h-full bg-white rounded-xl p-4 flex flex-col justify-between shadow-lg relative text-right">
                    <div className="flex justify-between items-start gap-3">
                      {/* Photo frame */}
                      <div className="w-[74px] h-[98px] bg-gray-50 rounded-lg overflow-hidden border border-gray-150 shadow-inner flex-shrink-0 flex items-center justify-center">
                        {avatarImage ? (
                          <img 
                            src={avatarImage} 
                            alt="Employee"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-gray-400 gap-1 select-none">
                            <div className="w-8 h-8 rounded-full bg-blue-50 border border-[#1e3a8a]/20 flex items-center justify-center text-[10px] font-black text-[#1e3a8a] font-sans">
                              {previewName ? previewName.split(" ").slice(0, 2).map((n) => n[0]).join("") : "إ م"}
                            </div>
                            <span className="text-[7px] font-bold text-gray-400 select-none">بدون صورة</span>
                          </div>
                        )}
                      </div>

                      {/* State Logo metadata details */}
                      <div className="flex flex-col items-end gap-1 text-right flex-1 select-none">
                        <div className="w-10 h-10 bg-blue-50 text-[#1e3a8a] rounded-full flex items-center justify-center border border-blue-100 mb-1">
                          <Shield className="w-5 h-5 text-[#1e3a8a] fill-blue-50" />
                        </div>
                        <p className="text-[8px] font-bold text-gray-400 font-sans">وزارة الموارد البشرية</p>
                        <p className="text-[11px] font-extrabold text-[#1e3a8a] tracking-tight leading-none font-sans">المملكة العربية السعودية</p>
                      </div>
                    </div>

                    {/* ID Details Text Section */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-right mt-3 text-gray-800">
                      <div>
                        <p className="text-[8px] font-bold text-gray-400 font-sans">الاسم الكامل</p>
                        <p className="text-[10px] font-bold text-gray-800 leading-tight font-sans">{previewName}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-gray-400 font-sans">رقم الهوية</p>
                        <p className="text-[10px] font-extrabold text-[#1a56db] font-sans tracking-wide leading-none">{previewId}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-gray-400 font-sans">تاريخ الميلاد</p>
                        <p className="text-[10px] font-bold text-gray-800 font-sans">{document.previewBirthdate}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-gray-400 font-sans">تاريخ الانتهاء</p>
                        <p className="text-[10px] font-bold text-amber-700 font-sans">{previewExpiry}</p>
                      </div>
                    </div>

                    {/* Security Micro pattern background */}
                    <div 
                      className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-xl" 
                      style={{
                        backgroundImage: "radial-gradient(#1e3a8a 0.5px, transparent 0.5px)", 
                        backgroundSize: "8px 8px"
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full bg-white rounded-xl p-6 flex flex-col items-center justify-center gap-3 shadow-lg relative text-right font-sans">
                    <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                      <Shield className="w-8 h-8 fill-amber-50" />
                    </div>
                    <h4 className="text-xs font-bold text-gray-800">{document.title}</h4>
                    <p className="text-[10px] text-gray-400 select-all font-mono tracking-wider">{document.fileName}</p>
                    <div className="p-2 border border-gray-100 bg-gray-50 rounded-lg text-center text-[9px] text-gray-500 max-w-[200px]">
                      مستند مسح الأمان عالي الخصوصية مشفر بواسطة خوارزميات HRMS
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Scale Control Desk Panel (Float bar) */}
            <div className="mt-6 flex items-center gap-3 bg-zinc-900/90 border border-white/10 px-5 py-3 rounded-full shadow-2xl z-20">
              <button
                type="button"
                onClick={() => setZoomScale(prev => Math.min(3.0, prev + 0.2))}
                className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-full transition-all border border-white/5"
                title="تكبير"
              >
                <ZoomIn className="w-5 h-5 text-gray-200" />
              </button>

              <button
                type="button"
                onClick={() => setZoomScale(prev => Math.max(1.0, prev - 0.2))}
                className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-full transition-all border border-white/5"
                title="تصغير"
              >
                <ZoomOut className="w-5 h-5 text-gray-200" />
              </button>

              <div className="h-6 w-px bg-white/10" />

              <button
                type="button"
                onClick={() => setZoomScale(1.3)}
                className="px-4 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 text-xs text-blue-300 font-bold rounded-full transition-all border border-white/5"
                title="إعادة تعيين للتكبير الافتراضي"
              >
                <RotateCcw className="w-3.5 h-3.5 ml-1.5" />
                <span>إعادة ضبط</span>
              </button>
            </div>

            {/* Arabic helpful user instruction */}
            <p className="text-[10px] text-gray-400 mt-4 text-center font-medium">
              * يمكنك النقر في أي مساحة فارغة أو الضغط على زر الإغلاق للعودة لمعاينة الملف الرئيسية.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
