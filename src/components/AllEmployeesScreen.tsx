import React, { useState } from "react";
import { ArrowRight, Search, Users, MessageSquareText, ChevronLeft, Calendar, UserCheck, UserX, ShieldAlert, ListFilter, Phone, Sparkles, Filter } from "lucide-react";
import { Employee, ViewState } from "../types";
import { motion } from "motion/react";

interface AllEmployeesScreenProps {
  employees: Employee[];
  onSelectEmployee: (id: string) => void;
  onScreenChange: (screen: ViewState) => void;
  onTriggerWhatsApp: (employee: Employee) => void;
  onBack: () => void;
  onMergeAllDuplicates?: () => void;
}

export default function AllEmployeesScreen({
  employees,
  onSelectEmployee,
  onScreenChange,
  onTriggerWhatsApp,
  onBack,
  onMergeAllDuplicates
}: AllEmployeesScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("الكل");
  const [selectedDept, setSelectedDept] = useState("الكل");

  // Status mapping to localized Arabic texts and styling
  const statusConfig: Record<string, { label: string; colorClass: string; bgClass: string; dotClass: string }> = {
    active: { label: "نشط ومناوب", colorClass: "text-green-700", bgClass: "bg-green-50 border-green-100", dotClass: "bg-green-500" },
    on_leave: { label: "في إجازة", colorClass: "text-[#d97706]", bgClass: "bg-amber-50 border-amber-100", dotClass: "bg-amber-500" },
    absent: { label: "غياب بدون عذر", colorClass: "text-rose-700", bgClass: "bg-rose-50 border-rose-100 animate-pulse", dotClass: "bg-rose-500 animate-pulse" },
    resigned: { label: "استقالة", colorClass: "text-gray-600", bgClass: "bg-gray-50 border-gray-150", dotClass: "bg-gray-400" },
    terminated: { label: "إنهاء خدمات", colorClass: "text-rose-600", bgClass: "bg-rose-50/50 border-rose-100", dotClass: "bg-rose-500" },
    transferred: { label: "حول", colorClass: "text-purple-700", bgClass: "bg-purple-50 border-purple-100", dotClass: "bg-purple-500" },
    transferred_from: { label: "محول", colorClass: "text-sky-700", bgClass: "bg-sky-50 border-sky-100", dotClass: "bg-sky-500" },
  };

  const getStatusInfo = (status: string) => {
    return statusConfig[status] || { label: status, colorClass: "text-gray-600", bgClass: "bg-gray-50 border-gray-150", dotClass: "bg-gray-300" };
  };

  // Get unique departments for dropdown
  const uniqueDepartments = ["الكل", ...Array.from(new Set(employees.map(emp => emp.department || "غير محدد").filter(Boolean)))];

  // Global counts for visual representation
  const totalCount = employees.length;
  const activeCount = employees.filter(e => e.status === "active").length;
  const leaveCount = employees.filter(e => e.status === "on_leave").length;
  const absentCount = employees.filter(e => e.status === "absent").length;

  // Filter employees
  const filteredList = employees.filter((emp) => {
    // Search querying
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery = !query || 
      emp.name.toLowerCase().includes(query) ||
      emp.id.toLowerCase().includes(query) ||
      emp.role.toLowerCase().includes(query) ||
      emp.phone.includes(query) ||
      (emp.department && emp.department.toLowerCase().includes(query));

    // Department fit
    const matchesDept = selectedDept === "الكل" || emp.department === selectedDept;

    // Status fit
    const matchesStatus = selectedStatus === "الكل" || emp.status === selectedStatus;

    return matchesQuery && matchesDept && matchesStatus;
  });

  return (
    <div className="pb-28 pt-6 px-4 bg-[#f8f9fa] min-h-screen text-[#191c1d] animate-fade-in text-right">
      
      {/* Upper Navigation Header */}
      <div className="flex items-center justify-between mb-6 flex-row-reverse border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2.5 flex-row-reverse">
          <div className="w-10 h-10 bg-blue-50 text-[#1e3a8a] rounded-xl flex items-center justify-center border border-blue-100/50 shadow-xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#1e3a8a]">جميع الموظفين</h2>
            <p className="text-[10px] text-gray-400 font-bold font-sans mt-0.5">البحث المتقدم وتصفية البيانات</p>
          </div>
        </div>
        
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 text-gray-600 shadow-xs transition-all active:scale-95 border border-gray-100"
          title="العودة للرئيسية"
        >
          <ArrowRight className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Top statistics overview block */}
      <div className="grid grid-cols-4 gap-2.5 mb-6 text-center">
        <div className="bg-white px-2 py-3.5 rounded-2xl border border-gray-100 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-gray-400 block">الإجمالي</span>
          <span className="text-sm font-black text-gray-800 font-sans block">{totalCount}</span>
        </div>
        <div className="bg-white px-2 py-3.5 rounded-2xl border border-[#bbf7d0]/30 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-green-600 block">النشطين</span>
          <span className="text-sm font-black text-green-700 font-sans block">{activeCount}</span>
        </div>
        <div className="bg-white px-2 py-3.5 rounded-2xl border border-[#fef3c7]/50 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-amber-600 block">الإجازات</span>
          <span className="text-sm font-black text-amber-600 font-sans block">{leaveCount}</span>
        </div>
        <div className="bg-white px-2 py-3.5 rounded-2xl border border-[#fecdd3]/40 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-rose-600 block">الغيابات</span>
          <span className="text-sm font-black text-rose-700 font-sans block">{absentCount}</span>
        </div>
      </div>

      {/* Advanced Filter Segment */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3 mb-6">
        
        {/* Search input field */}
        <div className="relative">
          <input
            type="text"
            placeholder="ابحث باسم الموظف أو الرقم الوظيفي..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pr-11 pl-4 rounded-xl text-xs bg-gray-50 border border-gray-150 focus:border-[#1e3a8a] focus:bg-white focus:ring-1 focus:ring-[#1e3a8a] outline-none text-right transition-all font-sans font-medium text-gray-800 placeholder-gray-400"
          />
          <span className="absolute right-3.5 top-3 text-gray-400">
            <Search className="w-5 h-5 text-gray-400" />
          </span>

          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute left-3.5 top-3.5 text-[9px] bg-gray-100 hover:bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-md font-sans font-bold transition-all"
            >
              مسح
            </button>
          )}
        </div>

        {/* Horizontal filters Grid for Status and Department */}
        <div className="grid grid-cols-2 gap-3" dir="rtl">
          <div>
            <label className="text-[10px] font-bold text-gray-400 block mb-1">تصفية حسب الحالة</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full h-10 px-3 rounded-lg text-xs bg-gray-50 border border-gray-150 text-gray-700 font-bold focus:bg-white outline-none"
            >
              <option value="الكل">كل الحالات الوظيفية</option>
              <option value="active">نشط ومناوب</option>
              <option value="on_leave">في إجازة</option>
              <option value="absent">غياب بدون عذر</option>
              <option value="resigned">استقالة</option>
              <option value="terminated">إنهاء خدمات</option>
              <option value="transferred">محول / منقول</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 block mb-1">تصفية حسب القسم</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full h-10 px-3 rounded-lg text-xs bg-gray-50 border border-gray-150 text-gray-700 font-bold focus:bg-white outline-none"
            >
              {uniqueDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === "الكل" ? "جميع الأقسام والفروع" : dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {onMergeAllDuplicates && (
          <div className="pt-3 border-t border-gray-100 flex justify-end">
            <button
              type="button"
              onClick={onMergeAllDuplicates}
              className="w-full text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-extrabold py-2.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              title="دمج ملفات الموظفين مكررة الهيئة أو الأرقام الوظيفية"
            >
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>دمج وتصفية الموظفين المكررين وتوحيد الفروع 🗃️</span>
            </button>
          </div>
        )}
      </div>

      {/* Section Divider & Results Counter */}
      <div className="flex items-center justify-between mb-4 flex-row-reverse px-1">
        <div className="flex items-center gap-1 text-xs text-gray-500 font-bold select-none">
          <ListFilter className="w-4 h-4 text-gray-400" />
          <span>قائمة النتائج</span>
        </div>
        <span className="text-[10px] bg-blue-50 text-[#1e3a8a] px-3 py-1 rounded-full font-black border border-blue-100">
          تم العثور على {filteredList.length} موظف
        </span>
      </div>

      {/* Main List Layout */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 text-center text-gray-400 text-xs flex flex-col items-center justify-center gap-3">
            <UserX className="w-10 h-10 text-gray-300" />
            <div className="space-y-1">
              <p className="font-bold text-gray-500">لا توجد نتائج مطابقة لخيارات البحث</p>
              <p className="text-[10px] text-gray-400">جرب تعديل الكلمات المدخلة أو فلاتر الحالة والأقسام.</p>
            </div>
            {(searchQuery || selectedStatus !== "الكل" || selectedDept !== "الكل") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedStatus("الكل");
                  setSelectedDept("الكل");
                }}
                className="mt-2 text-xs bg-blue-50 hover:bg-blue-100 text-[#1e3a8a] px-4 py-1.5 rounded-lg font-bold border border-blue-100 transition-all active:scale-95"
              >
                إعادة ضبط عوامل التصفية
              </button>
            )}
          </div>
        ) : (
          filteredList.map((emp) => {
            const initials = emp.name.split(" ").slice(0, 2).map(n => n[0]).join(" ");
            const statusInfo = getStatusInfo(emp.status);

            return (
              <motion.div
                key={emp.id}
                onClick={() => {
                  onSelectEmployee(emp.id);
                  onScreenChange("profile");
                }}
                whileHover={{ scale: 1.015, translateY: -2, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)" }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: "spring", stiffness: 450, damping: 25 }}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between cursor-pointer group"
              >
                
                {/* Left side actions (direct communication triggers) */}
                <div className="flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => onTriggerWhatsApp(emp)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-green-50/50 text-[#25D366] hover:bg-green-50 hover:text-green-600 transition-colors border border-green-100/35 active:scale-95"
                    title="مراسلة واتساب فورية"
                  >
                    <MessageSquareText className="w-4 h-4 fill-current" />
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      onSelectEmployee(emp.id);
                      onScreenChange("profile");
                    }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50/60 text-gray-400 group-hover:bg-blue-50 group-hover:text-[#1e3a8a] transition-all border border-gray-100 active:scale-95"
                    title="الاطلاع على الملف"
                  >
                    <ChevronLeft className="w-5 h-5 font-bold" />
                  </button>
                </div>

                {/* Right side employee summary */}
                <div className="flex items-center gap-3.5 text-right flex-row-reverse">
                  
                  {/* Avatar image without borders or ring outline, cleanly styled and responsive */}
                  <div className="relative flex-shrink-0">
                    {emp.avatar ? (
                      <img
                        className="w-12 h-12 rounded-full object-cover shadow-xs border border-gray-100 shrink-0"
                        src={emp.avatar}
                        alt={emp.name}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-50 text-[#1e3a8a] font-extrabold flex items-center justify-center border border-gray-100/30 shadow-xs text-xs shrink-0 select-none font-sans">
                        {initials}
                      </div>
                    )}
                    {/* Tiny green/amber/rose state dot */}
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${statusInfo.dotClass}`} />
                  </div>

                  {/* Text labels */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 justify-end">
                      {emp.certified && (
                        <span 
                          className="w-4.5 h-4.5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100" 
                          title="موظف معتمد"
                        >
                          <Sparkles className="w-2.5 h-2.5 text-blue-600 animate-pulse" />
                        </span>
                      )}
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-extrabold border uppercase ${statusInfo.bgClass} ${statusInfo.colorClass}`}>
                        {statusInfo.label}
                      </span>
                      <h4 className="text-xs font-black text-gray-800 leading-tight group-hover:text-[#1e3a8a] transition-colors">{emp.name}</h4>
                    </div>
                    
                    {/* Prominent Employee ID/Number tag */}
                    <div className="flex justify-end my-1">
                      <div className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200/70 border border-gray-200 rounded-lg px-2 py-0.5 select-all" title="الرقم الوظيفي">
                        <span className="text-[9px] font-bold text-gray-400 font-sans">#</span>
                        <span className="text-[10px] font-black font-mono text-gray-750 tracking-wider">
                          {emp.id}
                        </span>
                      </div>
                    </div>

                    <p className="text-[10px] text-gray-500 font-semibold">
                      {emp.role}
                    </p>

                    <div className="flex items-center gap-2 justify-end text-[9px] text-gray-400 font-medium font-sans">
                      <span>تاريخ الانضمام: {emp.joinDate}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-350" />
                      <span>القسم: {emp.department}{emp.department2 ? ` + ${emp.department2}` : ""}</span>
                    </div>
                  </div>

                </div>

              </motion.div>
            );
          })
        )}
      </div>

    </div>
  );
}
