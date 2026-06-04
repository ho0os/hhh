import React, { useState, useRef } from "react";
import { 
  ArrowRight, 
  Sparkles, 
  Heart, 
  Download, 
  Upload, 
  Database, 
  AlertTriangle, 
  Check, 
  FileJson,
  RefreshCw 
} from "lucide-react";
import { ViewState, Employee, EmployeeDocument } from "../types";

interface AppInfoScreenProps {
  onBack: () => void;
  employees: Employee[];
  documents: EmployeeDocument[];
  onRestoreBackup: (employees: Employee[], documents: EmployeeDocument[]) => void;
  triggerToast: (msg: string, type?: "success" | "info") => void;
}

export default function AppInfoScreen({ 
  onBack, 
  employees, 
  documents, 
  onRestoreBackup,
  triggerToast 
}: AppInfoScreenProps) {
  
  const [isDragging, setIsDragging] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [pendingBackup, setPendingBackup] = useState<{ 
    employees: Employee[]; 
    documents: EmployeeDocument[]; 
    backupDate?: string;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export current data to absolute JSON snapshot
  const handleExportBackup = () => {
    try {
      const backupData = {
        version: "2.1.0",
        backupDate: new Date().toISOString(),
        app: "SSCO-HRMS",
        createdBy: "hosan66@gmail.com",
        employees: employees,
        documents: documents
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const downloadAnchor = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      downloadAnchor.href = url;
      downloadAnchor.download = `ssco_hrms_backup_${dateStr}.json`;
      
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      
      // Clean up
      document.body.removeChild(downloadAnchor);
      URL.revokeObjectURL(url);

      triggerToast("تم بنجاح تصدير وحفظ النسخة الاحتياطية لحساب الموظفين!", "success");
    } catch (err) {
      console.error(err);
      triggerToast("حدث فشل أثناء محاولة تصدير البيانات.", "info");
    }
  };

  // Process selected file
  const processFile = (file: File) => {
    setImportError(null);
    if (!file.name.endsWith(".json")) {
      setImportError("عذراً، يجب اختيار ملف صالح بصيغة JSON فقط.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed || typeof parsed !== "object") {
          throw new Error("بنية الملف غير صالحة أو فارغة.");
        }

        // Validation checks
        if (!Array.isArray(parsed.employees)) {
          throw new Error("لا يحتوي الملف المرفق على سجلات موظفين صحيحة.");
        }

        const validEmployees = parsed.employees.every(
          (emp: any) => emp && typeof emp === "object" && emp.id && emp.name
        );
        
        if (!validEmployees && parsed.employees.length > 0) {
          throw new Error("تحذير: بعض سجلات الموظفين تفتقر إلى حقول أساسية كالإسم أو الرقم الوظيفي.");
        }

        const validDocuments = Array.isArray(parsed.documents) ? parsed.documents : [];

        setPendingBackup({
          employees: parsed.employees,
          documents: validDocuments,
          backupDate: parsed.backupDate
        });
      } catch (err: any) {
        setImportError(err.message || "عجز النظام عن تحميل هذا الملف. الرجاء التأكد من بنية الـ JSON للملف المسحوب.");
      }
    };
    reader.onerror = () => {
      setImportError("حدث خطأ تقني في قراءة الملف من جهازك.");
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  // Apply parsed backup structures back into React State via callback and LocalStorage
  const handleConfirmImport = () => {
    if (!pendingBackup) return;
    
    try {
      onRestoreBackup(pendingBackup.employees, pendingBackup.documents);
      triggerToast(`تم استيراد نسخة احتياطية بنجاح! تم تحميل ${pendingBackup.employees.length} موظفاً.`, "success");
      setPendingBackup(null);
    } catch (err) {
      console.error(err);
      triggerToast("حدث خطأ أثناء تطبيق النسخة الاحتياطية.", "info");
    }
  };

  const handleCancelImport = () => {
    setPendingBackup(null);
    setImportError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="pb-24 pt-6 px-5 bg-[#f8f9fa] min-h-screen text-[#191c1d] flex flex-col justify-between animate-fade-in text-right">
      {/* Top Navigation */}
      <div>
        <div className="flex items-center justify-between mb-6 flex-row-reverse border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5 flex-row-reverse">
            <div className="w-9 h-9 bg-blue-50 text-[#1e3a8a] rounded-xl flex items-center justify-center border border-blue-100/50">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-gray-800">معلومات التطبيق والمستندات</h2>
          </div>
          
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 text-gray-600 shadow-sm transition-transform active:scale-95 border border-gray-100"
            title="رجوع"
            id="back_to_dashboard_btn"
          >
            <ArrowRight className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Info Area */}
        <div className="space-y-6 mt-4">
          
          {/* Main design signature of building application with AI assistance */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden flex flex-col items-center justify-center text-center">
            
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#1e3a8a] to-blue-600 text-white flex items-center justify-center mb-4 shadow-md shadow-blue-500/10">
              <Sparkles className="w-8 h-8 animate-pulse text-white" />
            </div>

            <h3 className="text-base font-extrabold text-[#1e3a8a] mb-2 font-sans">
              نظام تنظيم الموظفين الذكي
            </h3>
            <span className="text-[10px] font-mono text-gray-400 font-bold tracking-wider bg-gray-50 px-2.5 py-1 rounded-full border border-gray-150 mb-4">
              V 2.2.0 • بأحدث تقنيات حفظ البيانات
            </span>

            <p style={{ fontFamily: "system-ui", fontSize: "12px", borderStyle: "solid", borderRadius: "16px" }} className="text-gray-700 leading-relaxed max-w-sm mt-1 border-gray-200 border p-4 flex flex-col items-center gap-3">
              <span>"قام بتصميم هذا التطبيق <span style={{ textDecorationLine: "none", color: "#417f8e", borderColor: "#b06363" }} className="font-extrabold pb-0.5">حسين محمد هاشمي</span> بمساعدة الذكاء الاصطناعي."</span>
              
              <a 
                href="https://wa.me/966562438878" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 font-bold bg-green-50/70 hover:bg-green-100 px-3.5 py-2 rounded-full transition-all border border-green-250 shadow-2xs"
                title="تواصل عبر الواتساب"
              >
                <svg className="w-4 h-4 text-[#25D366] fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.012 12.008.012c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24zm5.835-4.117c1.62.962 3.377 1.47 5.176 1.471 5.511 0 9.993-4.482 9.997-9.995.002-2.671-1.039-5.181-2.924-7.07C16.257 2.4 13.747 1.358 11.076 1.357c-5.516 0-10.002 4.484-10.006 10.002-.001 1.839.48 3.633 1.393 5.2l-.304 1.11L5.892 19.88zM16.52 13.56c-.247-.125-1.464-.722-1.692-.806-.227-.083-.393-.125-.558.125-.165.249-.64.806-.784.97-.144.166-.289.187-.536.062-.248-.125-1.044-.384-1.99-1.229-.735-.656-1.232-1.465-1.377-1.714-.144-.249-.015-.383.109-.507.112-.111.247-.289.37-.434.124-.145.165-.249.247-.415.083-.166.041-.311-.02-.435-.062-.124-.558-1.344-.764-1.838-.2-.486-.403-.412-.558-.42-.144-.007-.31-.007-.475-.007a.91.91 0 0 0-.66.309c-.227.249-.867.848-.867 2.071 0 1.222.888 2.4 1.011 2.567.124.166 1.748 2.67 4.234 3.74.591.255 1.053.408 1.411.521.595.19 1.137.163 1.565.101.477-.072 1.464-.598 1.671-1.178.207-.58.207-1.077.144-1.178-.061-.101-.227-.142-.474-.268z" />
                </svg>
                <span className="font-sans text-xs tracking-wider" dir="ltr">+966 56 243 8878</span>
              </a>
            </p>
          </div>

          {/* Backup and Data recovery module card */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 flex-row-reverse">
              <div className="flex items-center gap-2 flex-row-reverse">
                <Database className="w-5 h-5 text-[#1e3a8a]" />
                <h4 className="text-sm font-bold text-gray-800">إدارة سلامة البيانات والنسخ الاحتياطي</h4>
              </div>
              <span className="text-xs text-gray-500 font-medium">البيانات المحلية</span>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              لحماية بيانات الموظفين وسجلات المستندات الحساسة من الفقدان أو الحذف في متصفحك، يمكنك حفظ نسخة مادية من قاعدة البيانات في ملف خارجي واستعادتها في أي وقت.
            </p>

            {/* Current State Indicator */}
            <div className="grid grid-cols-2 gap-3 pb-2 text-center" style={{ direction: "rtl" }}>
              <div className="bg-blue-50/50 border border-blue-100/40 rounded-xl p-3">
                <span className="block text-[10px] font-semibold text-gray-500">حسابات الموظفين حالياً</span>
                <span className="text-base font-bold text-[#1e3a8a]">{employees.length} موظف</span>
              </div>
              <div className="bg-indigo-50/50 border border-indigo-100/40 rounded-xl p-3">
                <span className="block text-[10px] font-semibold text-gray-500">مستندات الهوية الحالية</span>
                <span className="text-base font-bold text-indigo-800">{documents.length} ملف</span>
              </div>
            </div>

            {/* Interactive Actions Grid */}
            <div className="pt-2 space-y-3">
              
              {/* BUTTON EXPORT */}
              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full h-11 bg-[#1e3a8a] hover:bg-blue-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all duration-200 cursor-pointer active:scale-[0.99]"
                id="export_backup_button"
              >
                <Download className="w-4 h-4" />
                <span>تصدير نسخة احتياطية (.json)</span>
              </button>

              {/* DRAG & DROP IMPORT AREA */}
              {!pendingBackup ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                    isDragging 
                      ? "border-blue-600 bg-blue-50/50 scale-[1.01]" 
                      : "border-gray-200 hover:border-blue-400 hover:bg-gray-50/50"
                  }`}
                  id="import_dropzone"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json"
                    className="hidden"
                  />
                  
                  <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 transition-colors">
                    <Upload className="w-4.5 h-4.5 text-blue-800" />
                  </div>
                  
                  <div>
                    <span className="block text-xs font-bold text-gray-700">اسحب ملف النسخة الاحتياطية هنا</span>
                    <span className="text-[10px] text-gray-400 mt-1 block">أو انقر لتصفح ملفات جهازك (.json)</span>
                  </div>
                </div>
              ) : (
                /* CONFIRMATION DRAWER OF BACKUP FILE FOUND */
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 space-y-3 text-right">
                  <div className="flex items-start gap-2.5 flex-row-reverse text-amber-800">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-extrabold">تأكيد استعادة البيانات</h5>
                      <p className="text-[11px] leading-relaxed mt-1 text-gray-700">
                        استيراد هذا الملف سيؤدي إلى <span className="text-red-600 font-bold underline">حذف واستبدال</span> كافة بيانات الموظفين والمستندات المخزنة حالياً في متصفحك بالكامل.
                      </p>
                    </div>
                  </div>

                  {/* Summary of what will be imported */}
                  <div className="bg-white/80 rounded-lg p-2.5 border border-amber-200/50 space-y-1.5 text-xs text-gray-700">
                    <div className="flex justify-between items-center flex-row-reverse">
                      <span className="text-[10px] font-bold text-gray-550">تاريخ إنشاء النسخة:</span>
                      <span className="font-mono text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                        {pendingBackup.backupDate ? new Date(pendingBackup.backupDate).toLocaleDateString("ar-EG") : "غير محدد"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center flex-row-reverse">
                      <span className="text-[10px] font-medium">عدد الموظفين المرشحين:</span>
                      <span className="font-semibold text-gray-900">{pendingBackup.employees.length} موظف</span>
                    </div>
                    <div className="flex justify-between items-center flex-row-reverse">
                      <span className="text-[10px] font-medium">عدد ملفات الهويات والمستندات:</span>
                      <span className="font-semibold text-gray-900">{pendingBackup.documents.length} مستند</span>
                    </div>
                  </div>

                  {/* Confirmation Buttons */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleConfirmImport}
                      className="flex-1 h-9 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-sm transition-colors active:scale-95 cursor-pointer"
                      id="confirm_restore_btn"
                    >
                      تأكيد استبدال البيانات
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelImport}
                      className="px-3.5 h-9 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold text-xs transition-colors active:scale-95 cursor-pointer"
                      id="cancel_restore_btn"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}

              {/* Show error notification if bad parsing */}
              {importError && (
                <div className="bg-red-50 border border-red-150 rounded-xl p-3 text-red-800 text-[11px] leading-relaxed font-semibold">
                  ⚠️ {importError}
                </div>
              )}

            </div>
          </div>

          {/* Standard app feature details */}
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-150/50 space-y-3">
            <h4 className="text-xs font-bold text-[#1e3a8a] mb-1">مميزات هذا النظام الفني:</h4>
            
            <div className="space-y-2 text-xs text-gray-600 font-medium">
              <div className="flex items-center gap-2 justify-end flex-row-reverse">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1e3a8a]" />
                <span className="text-right">متابعة ومراقبة مستندات الهويات الوطنية والتحذير قبل انتهائها</span>
              </div>
              <div className="flex items-center gap-2 justify-end flex-row-reverse">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1e3a8a]" />
                <span className="text-right">سجل تغييرات تفصيلي (Audit Log) يسجل كافة تعديلات الموظفين لزيادة الشفافية والرقابة</span>
              </div>
              <div className="flex items-center gap-2 justify-end flex-row-reverse">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1e3a8a]" />
                <span className="text-right">قسم الإجازات اليومية والغيابات لتعزيز المتابعة الميدانية</span>
              </div>
              <div className="flex items-center gap-2 justify-end flex-row-reverse">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1e3a8a]" />
                <span className="text-right">تصميم واجهة متطورة، متجاوبة ومريحة بالكامل باللغة العربية</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Branding Area */}
      <div className="text-center pb-4 text-[10px] font-sans text-gray-400 font-semibold select-none">
        جميع الحقوق محفوظة © ٢٠٢٦ م • حسين هاشمي
      </div>
    </div>
  );
}
