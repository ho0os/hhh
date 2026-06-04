import React, { useState } from "react";
import { 
  ArrowRight, 
  Search, 
  Layers, 
  Home, 
  Briefcase, 
  Calendar, 
  Phone, 
  CheckCircle, 
  Filter, 
  FileText,
  Building,
  Hash,
  Download,
  Award,
  Trash2,
  Check,
  AlertTriangle,
  X,
  Users
} from "lucide-react";
import { Employee, ViewState } from "../types";

interface EmployeeDataScreenProps {
  employees: Employee[];
  onScreenChange: (screen: ViewState) => void;
  onSelectEmployee?: (id: string) => void;
  onDeleteMultipleEmployees?: (ids: string[]) => void;
}

export default function EmployeeDataScreen({
  employees,
  onScreenChange,
  onSelectEmployee,
  onDeleteMultipleEmployees
}: EmployeeDataScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Helper mapping of statuses to localized Arabic texts and badge colors
  const statusConfigAr: Record<string, { label: string; colorClass: string }> = {
    active: { label: "نشط ومناوب", colorClass: "bg-green-50 text-green-700 border-green-200" },
    on_leave: { label: "في إجازة", colorClass: "bg-amber-50 text-amber-700 border-amber-200" },
    absent: { label: "غياب", colorClass: "bg-rose-50 text-rose-700 border-rose-200" },
    resigned: { label: "مستقيل", colorClass: "bg-gray-100 text-gray-600 border-gray-200" },
    terminated: { label: "تم إنهاء الخدمة", colorClass: "bg-rose-100 text-rose-800 border-rose-200" },
    transferred: { label: "منقول من القسم", colorClass: "bg-purple-50 text-purple-700 border-purple-200" },
    transferred_from: { label: "منقول إلى القسم", colorClass: "bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]" }
  };

  const getStatusLabel = (status: string) => {
    return statusConfigAr[status] || { label: status, colorClass: "bg-gray-50 text-gray-600 border-gray-200" };
  };

  // Sort and filter strategy:
  // Sort primarily by Department/Branch (الترتيب بحسب القسم/الفرع), then by Name
  const sortedEmployees = [...employees].sort((a, b) => {
    const deptA = a.department || "";
    const deptB = b.department || "";
    if (deptA !== deptB) {
      return deptA.localeCompare(deptB, "ar");
    }
    return a.name.localeCompare(b.name, "ar");
  });

  // Normalize Arabic letters and accents for exact, accurate, and highly robust matching
  const normalizeArabic = (text: string): string => {
    if (!text) return "";
    return text
      .trim()
      .toLowerCase()
      .replace(/[أإآا]/g, "ا")
      .replace(/[ةه]/g, "ه")
      .replace(/[ىي]/g, "ي")
      .replace(/[\u064B-\u065F]/g, ""); // remove diacritics
  };

  // Filter based on optimized match search
  const filteredEmployees = sortedEmployees.filter(emp => {
    if (!searchQuery.trim()) return true;

    // Normalizing the search query
    const queryNormalized = normalizeArabic(searchQuery);

    // Normalize employee details
    const nameNorm = normalizeArabic(emp.name);
    const idNorm = normalizeArabic(emp.id);
    const roleNorm = normalizeArabic(emp.role || "");
    const nationalIdNorm = normalizeArabic(emp.nationalId || "");
    const phoneNorm = normalizeArabic(emp.phone || "");
    const deptNorm = normalizeArabic(emp.department || "");

    return (
      nameNorm.includes(queryNormalized) ||
      idNorm.includes(queryNormalized) ||
      roleNorm.includes(queryNormalized) ||
      nationalIdNorm.includes(queryNormalized) ||
      phoneNorm.includes(queryNormalized) ||
      deptNorm.includes(queryNormalized)
    );
  });

  // Checkbox interactions
  const isSelected = (id: string) => selectedIds.includes(id);

  const toggleSelectEmployee = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const allFilteredIds = filteredEmployees.map(emp => emp.id);
  const areAllFilteredSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedIds.includes(id));

  const toggleSelectAll = () => {
    if (areAllFilteredSelected) {
      // Remove all elements of the filtered list from state
      setSelectedIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      // Add all currently filtered IDs to selection state
      setSelectedIds(prev => {
        const next = [...prev];
        allFilteredIds.forEach(id => {
          if (!next.includes(id)) {
            next.push(id);
          }
        });
        return next;
      });
    }
  };

  // Execute actual bulk deletion
  const handleBulkDeleteExecute = () => {
    if (onDeleteMultipleEmployees && selectedIds.length > 0) {
      onDeleteMultipleEmployees(selectedIds);
      setSelectedIds([]);
      setShowConfirmModal(false);
    }
  };

  // Human names of selected employees for presentation in the verification modal
  const selectedNames = employees
    .filter(emp => selectedIds.includes(emp.id))
    .map(emp => emp.name);

  return (
    <div className="pb-28 pt-4 px-4 bg-[#f8f9fa] min-h-screen text-right font-sans relative" dir="rtl">
      
      {/* Upper Navigation Header */}
      <header className="flex flex-row justify-between items-center h-16 w-full mb-4 border-b border-gray-100 pb-3">
        {/* Quick action back to Home dashboard */}
        <button 
          onClick={() => onScreenChange("dashboard")}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 transition-transform active:scale-95 shadow-xs border border-gray-100"
          title="الرئيسية"
        >
          <Home className="w-5 h-5 text-[#1e3a8a]" />
        </button>

        <h1 className="text-sm font-extrabold text-[#1e3a8a] flex items-center gap-2 flex-row-reverse">
          <Building className="w-5 h-5 text-blue-600 shrink-0" />
          <span>بيانات الموظفين التفصيلية</span>
        </h1>
        
        <button 
          onClick={() => onScreenChange("dashboard")}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 transition-transform active:scale-95 shadow-xs border border-gray-100"
          title="رجوع"
        >
          <ArrowRight className="w-5 h-5 text-[#1e3a8a]" />
        </button>
      </header>

      {/* Intro info box */}
      <div className="bg-[#1e3a8a] text-white p-4 rounded-2xl mb-5 space-y-1 shadow-sm">
        <h3 className="text-xs font-black flex items-center gap-1.5 flex-row-reverse">
          <Hash className="w-4 h-4 text-amber-400" />
          <span>ترتيب تسلسلي منظم طبقاً للأقسام والبحث الدقيق</span>
        </h3>
        <p className="text-[10px] text-blue-100 leading-relaxed font-bold">
          يعرض الكادر مرتباً هجائياً وإدارياً بفرز ميداني دقيق متطابق، مع إمكانية البحث الفوري عن أي موظف محدد.
        </p>
      </div>

      {/* Advanced search controls */}
      <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs mb-5">
        {/* Real-time search */}
        <div className="relative">
          <input
            type="text"
            placeholder="ابحث باسم الموظف، الرقم الوظيفي، الهوية، الجوال، أو المسمى..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-right bg-gray-50 text-xs px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#1e3a8a] focus:bg-white font-medium placeholder-gray-400"
          />
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-450 pointer-events-none" />
        </div>
      </div>

      {/* Select All, Deselect and Bulk Action Menu Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-gray-150 shadow-xs mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-right" dir="rtl">
        <div className="flex items-center gap-2.5 flex-row-reverse w-full sm:w-auto">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-2 flex-row-reverse text-xs font-black text-gray-700 hover:text-black focus:outline-none"
          >
            <span className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
              areAllFilteredSelected 
                ? "bg-[#1e3a8a] border-[#1e3a8a] text-white" 
                : "border-gray-300 bg-white"
            }`}>
              {areAllFilteredSelected && <Check className="w-3.5 h-3.5 text-white" />}
            </span>
            <span>تحديد جميع الموظفين في العرض ({filteredEmployees.length})</span>
          </button>
          
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-[10px] text-gray-400 hover:text-rose-600 font-bold underline mr-2"
            >
              إلغاء التحديد الحالي ({selectedIds.length})
            </button>
          )}
        </div>

        {/* Floating / Active deletion prompt when 1 or more are selected */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto p-2 bg-rose-50/70 border border-rose-100 rounded-lg animate-fade-in">
            <div className="text-right">
              <span className="text-[9px] text-rose-600 block font-bold">جراء متاح جماعي</span>
              <span className="text-xs font-extrabold text-rose-800">تحديد ({selectedIds.length}) من الملفات</span>
            </div>
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="px-3 py-2 bg-rose-600 text-white rounded-lg text-[10.5px] font-black hover:bg-rose-700 active:scale-95 transition-all flex items-center gap-1.5 flex-row-reverse shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span>حذف الملفات نهائياً</span>
            </button>
          </div>
        )}
      </div>

      {/* Table grid headers / Record totals count */}
      <div className="flex justify-between items-center mb-3 px-1 flex-row-reverse">
        <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-100 px-2.5 py-1 rounded-full font-black">
          عدد القيود النشطة في العرض: {filteredEmployees.length} موظفاً
        </span>
        <span className="text-[10px] text-gray-400 font-bold">بيانات الموظفين المرتبة هجائياً وإدارياً</span>
      </div>

      {/* Main Serial (تسلسلي) table component list */}
      <main className="space-y-3.5">
        
        {filteredEmployees.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center gap-2">
            <Search className="w-8 h-8 text-gray-300" />
            <span className="text-xs text-gray-400 font-bold">لا توجد بيانات تطابق الفلترة المحددة برقم البحث</span>
          </div>
        ) : (
          filteredEmployees.map((emp, index) => {
            const statusConfig = getStatusLabel(emp.status);
            const activeSelection = isSelected(emp.id);
            
            return (
              <div 
                key={emp.id}
                onClick={() => {
                  if (onSelectEmployee) {
                    onSelectEmployee(emp.id);
                  }
                  onScreenChange("profile");
                }}
                className={`bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col hover:border-blue-400 transition-all cursor-pointer relative ${
                  activeSelection ? "border-rose-300 bg-rose-50/5" : "border-gray-100"
                }`}
              >
                {/* Visual side marker indicating status color */}
                <div className={`absolute top-0 right-0 w-1 h-full ${
                  activeSelection ? "bg-rose-500" : "bg-[#1e3a8a]"
                }`} />

                {/* Top bar container with selection checkbox, sequential label index and name */}
                <div className="px-4 py-3 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between flex-row-reverse">
                  {/* Serial Number & Checkbox & Employee Name */}
                  <div className="flex items-center gap-2.5 flex-row-reverse text-right">
                    {/* Visual Checkbox element */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // Avoid triggering route navigation to profile
                        toggleSelectEmployee(emp.id);
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-250/20 active:scale-90 transition-all border border-gray-200 shadow-xs"
                      title={activeSelection ? "إلغاء التحديد" : "تحديد لحذف مسار الموظف"}
                    >
                      <span className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                        activeSelection 
                          ? "bg-rose-600 border-rose-600 text-white shadow-xs" 
                          : "border-gray-300 bg-white"
                      }`}>
                        {activeSelection && <Check className="w-3 h-3 text-white" />}
                      </span>
                    </button>

                    {/* Numeric sequence indicator */}
                    <span className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center border shrink-0 font-sans shadow-xs ${
                      activeSelection 
                        ? "bg-rose-100 text-rose-700 border-rose-350" 
                        : "bg-blue-100 text-[#1e3a8a] border-blue-200"
                    }`} title="الرقم التسلسلي للفرز العلمي">
                      {index + 1}
                    </span>

                    <div>
                      <h4 className="text-xs font-black text-[#111827] flex items-center gap-1.5 flex-row-reverse">
                        <span>{emp.name}</span>
                        {emp.certified && (
                          <span className="text-[8px] bg-amber-100 text-amber-800 px-1 rounded font-black border border-amber-200 animate-pulse">معتمد</span>
                        )}
                      </h4>
                      <p className="text-[9px] text-gray-400 font-bold mt-0.5 font-sans">ID: #{emp.id}</p>
                    </div>
                  </div>

                  {/* Status badge & Section Department */}
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded border ${statusConfig.colorClass}`}>
                      {statusConfig.label}
                    </span>
                    <span className="text-[9px] text-[#1e3a8a] bg-blue-50/50 px-2 py-0.5 rounded-md border border-blue-100 font-extrabold flex items-center gap-1">
                      <Building className="w-3 h-3 text-blue-500" />
                      <span>{emp.department || "غير محدد"}{emp.department2 ? ` + ${emp.department2}` : ""}</span>
                    </span>
                  </div>
                </div>

                {/* Grid layout for comprehensive information fields */}
                <div className="p-3.5 grid grid-cols-2 md:grid-cols-3 gap-3 text-right">
                  {/* Job title */}
                  <div className="space-y-0.5">
                    <span className="text-[8px] text-gray-400 block font-bold">المسمى الوظيفي</span>
                    <span className="text-[11px] font-bold text-gray-800 flex items-center gap-1 flex-row-reverse justify-end">
                      <Briefcase className="w-3 h-3 text-gray-400 shrink-0" />
                      <span>{emp.role}</span>
                    </span>
                  </div>

                  {/* Phone number */}
                  <div className="space-y-0.5">
                    <span className="text-[8px] text-gray-400 block font-bold">الهاتف الجوال</span>
                    <span className="text-[11px] font-bold text-gray-800 font-sans flex items-center gap-1 flex-row-reverse justify-end">
                      <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span>{emp.phone || "—"}</span>
                    </span>
                  </div>

                  {/* National ID */}
                  <div className="space-y-0.5">
                    <span className="text-[8px] text-gray-400 block font-bold">رقم الهوية / الإقامة</span>
                    <span className="text-[11px] font-extrabold text-gray-800 font-mono flex items-center gap-1 flex-row-reverse justify-end">
                      <FileText className="w-3 h-3 text-gray-400 shrink-0" />
                      <span>{emp.nationalId || "—"}</span>
                    </span>
                  </div>

                  {/* Branch (الفرع) */}
                  <div className="space-y-0.5">
                    <span className="text-[8px] text-gray-400 block font-bold">الفرع / الموقع</span>
                    <div className="flex flex-col gap-0.5 text-right items-end justify-end">
                      <span className="text-[11.5px] font-extrabold text-gray-800 flex items-center gap-1 flex-row-reverse justify-end font-sans">
                        <Building className="w-3 h-3 text-[#1e3a8a] shrink-0" />
                        <span>{emp.department || "الفرع الرئيسي"}</span>
                      </span>
                      {emp.department2 && (
                        <span className="text-[9.5px] font-black text-amber-800 flex items-center gap-1 flex-row-reverse justify-end leading-tight">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          <span>وردية 2: {emp.department2}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Join Date info */}
                  <div className="space-y-0.5 col-span-2 md:col-span-1">
                    <span className="text-[8px] text-gray-400 block font-bold">تاريخ المباشرة</span>
                    <span className="text-[11px] font-bold text-[#1e3a8a] font-sans flex items-center gap-1 flex-row-reverse justify-end">
                      <Calendar className="w-3 h-3 text-blue-500 shrink-0" />
                      <span>{emp.joinDate || "—"}</span>
                    </span>
                  </div>
                </div>

                {/* Action panel */}
                <div className="px-3.5 py-2 bg-gray-50/40 border-t border-gray-100 flex justify-between items-center flex-row-reverse">
                  <span className="text-[9px] text-gray-400 font-bold font-sans">تاريخ التقرير: 2026-05-27</span>
                  <span className="text-[9px] font-black text-[#1e3a8a] hover:underline flex items-center gap-1 flex-row-reverse">
                    <span>عرض الملف الوظيفي الكامل ←</span>
                  </span>
                </div>

              </div>
            );
          })
        )}

      </main>

      {/* Confirmation Overlay Modal HUD */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs animate-fade-in" dir="rtl">
          <div className="bg-white rounded-2xl border-2 border-rose-100 shadow-2xl p-5 max-w-md w-full animate-scaleUp text-right space-y-4">
            
            {/* Modal Heading Header */}
            <div className="flex items-center justify-between border-b pb-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-gray-400 hover:text-black transition-colors"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-sm font-extrabold text-rose-700 flex items-center gap-1.5 flex-row-reverse">
                <AlertTriangle className="w-5 h-5 text-rose-600 animate-pulse" />
                <span>حذف ملفات الموظفين نهائياً</span>
              </h3>
            </div>

            {/* Warn description */}
            <p className="text-xs text-gray-650 leading-relaxed font-bold">
              هل أنت متأكد من حذف عدد <span className="text-rose-650 font-black">({selectedIds.length})</span> من ملفات الكوادر نهائياً؟ 
              سيتم محو جميع بياناتهم وسجلات مستحقاتهم وغياباتهم فوراً من خوادم النظام بشكل دائم، <span className="text-rose-700 underline font-black">ولا يمكن الرجوع أو استعادة الملفات المحذوفة مطلقاً بعد التأكيد.</span>
            </p>

            {/* List of employee names preview */}
            <div className="bg-rose-50/50 rounded-xl p-3 border border-rose-100/50 max-h-32 overflow-y-auto space-y-1">
              <span className="text-[9px] text-rose-500 block font-bold mb-1">الموظفون المحددون للإزالة:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedNames.map((name, i) => (
                  <span 
                    key={i} 
                    className="inline-block text-[9.5px] bg-rose-100 text-rose-800 border border-rose-200 px-2.5 py-1 rounded font-extrabold"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Form Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleBulkDeleteExecute}
                className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5 flex-row-reverse"
              >
                <Trash2 className="w-4 h-4" />
                <span>تأكيد الحذف النهائي للملفات</span>
              </button>
              
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-black transition-all"
              >
                تراجع وإلغاء
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Bottom Legal / HR Standard box */}
      <footer className="mt-6 bg-[#1e3a8a]/5 border border-blue-150 p-4 rounded-xl text-right">
        <h5 className="text-xs font-bold text-[#1e3a8a] flex items-center gap-1.5 flex-row-reverse leading-none mb-1">
          <Award className="w-4 h-4 text-[#1e3a8a]" />
          إقرار صحة معلومات بيانات هيئة الموظفين
        </h5>
        <p className="text-[9px] text-gray-650 leading-relaxed font-bold">
          تعتبر هذه المستندات سرية ومدرجة بموجب بيانات الإدارة لشؤون الموظفين ويحظر تداولها خارج النطاق الإداري المؤتمن.
        </p>
      </footer>
    </div>
  );
}
