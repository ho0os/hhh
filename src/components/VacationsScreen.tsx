import React, { useState } from "react";
import { 
  Calendar, 
  Plus, 
  Search, 
  ArrowRight, 
  UserX, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  ChevronDown, 
  CalendarDays, 
  MessageSquareText, 
  Users,
  Backpack, 
  ShieldAlert,
  Home
} from "lucide-react";
import { Employee, ViewState, AuditLogEntry } from "../types";

interface VacationsScreenProps {
  employees: Employee[];
  onUpdateEmployee: (updatedEmp: Employee, originalId: string) => void;
  onScreenChange: (screen: ViewState) => void;
  onTriggerWhatsApp: (emp: Employee) => void;
}

export default function VacationsScreen({
  employees,
  onUpdateEmployee,
  onScreenChange,
  onTriggerWhatsApp
}: VacationsScreenProps) {
  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [leaveType, setLeaveType] = useState("سنوية");
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    return nextMonth.toISOString().split("T")[0];
  });
  const [leaveReason, setLeaveReason] = useState("");
  const [employeeSearchKey, setEmployeeSearchKey] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Constants
  const LEAVE_TYPES = [
    { value: "سنوية", label: "إجازة سنوية" },
    { value: "مرضية", label: "إجازة مرضية" },
    { value: "اضطرارية", label: "إجازة اضطرارية" },
    { value: "وضع/أمومة", label: "إجازة وضع / أمومة" },
    { value: "بدون راتب", label: "إجازة بدون راتب" },
    { value: "أخرى", label: "إجازة أخرى / استثنائية" }
  ];

  // Filters
  const currentLeaveEmployees = employees.filter(emp => emp.status === "on_leave");
  
  const filteredLeaves = currentLeaveEmployees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (emp.role && emp.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (emp.department && emp.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Available employees for assigning a new leave (exclude resigned, terminated, on_leave)
  const availableEmployees = employees.filter(emp => 
    emp.status !== "resigned" && 
    emp.status !== "terminated" && 
    emp.status !== "on_leave"
  );

  const filteredAvailableForSelect = availableEmployees.filter(emp => 
    emp.name.toLowerCase().includes(employeeSearchKey.toLowerCase()) ||
    emp.id.includes(employeeSearchKey)
  );

  // Helper date countdown
  const getRemainingDaysCount = (endDateStr: string | undefined): number | null => {
    if (!endDateStr) return null;
    try {
      const end = new Date(endDateStr);
      const today = new Date("2026-05-27"); // Current dynamic platform day
      const diffTime = end.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  };

  // WhatsApp Alert Reminder
  const handleAlertWhatsApp = (emp: Employee) => {
    const days = getRemainingDaysCount(emp.leaveEndDate);
    let remainingStr = "";
    if (days === 0) remainingStr = "اليوم";
    else if (days === 1) remainingStr = "غداً";
    else if (days === 2) remainingStr = "يومان";
    else if (days !== null && days < 0) remainingStr = `منتهية بـ ${Math.abs(days)} أيام`;
    else remainingStr = `${days} أيام`;

    const msg = `السلام عليكم ورحمة الله وبركاته، الزميل العزيز ${emp.name}. نأمل أن تكونوا بقضاء إجازة سعيدة. نود تذكيركم بأن إجازتكم الرسمية الممنوحة أوشكت على الانتهاء بتاريخ ${emp.leaveEndDate || "المحدد"} ومتبقي عليها (${remainingStr}). نرجو منكم تأكيد موعد العودة والاستعداد لمباشرة العمل. نسعد بلقائكم مجدداً وتمنياتنا لكم بعودة موفقة.`;
    
    const whatsappUrl = `https://wa.me/${emp.phone.replace(/\+/g, "")}?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, "_blank");
  };

  // Submit Leave Action
  const handleRegisterLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) {
      alert("الرجاء اختيار الموظف أولاً");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert("تاريخ بدء الإجازة لا يمكن أن يكون بعد تاريخ الانتهاء");
      return;
    }

    const employeeToUpdate = employees.find(emp => emp.id === selectedEmpId);
    if (!employeeToUpdate) return;

    // Build the updated employee with state update
    const updatedEmployee: Employee = {
      ...employeeToUpdate,
      status: "on_leave",
      leaveStartDate: startDate,
      leaveEndDate: endDate
    };

    // Logging & Audit trail entries
    const newLogs: AuditLogEntry[] = employeeToUpdate.auditLog ? [...employeeToUpdate.auditLog] : [];
    newLogs.push({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      field: "status|leave",
      fieldNameAr: "منح إجازة رسمية جديدة",
      oldValue: employeeToUpdate.status === "active" ? "على رأس العمل" : employeeToUpdate.status,
      newValue: `إجازة (${leaveType}) من ${startDate} إلى ${endDate}`,
      timestamp: new Date().toISOString(),
      updatedBy: "hosan66@gmail.com"
    });

    updatedEmployee.auditLog = newLogs;

    // Save and callback
    onUpdateEmployee(updatedEmployee, employeeToUpdate.id);
    
    // Reset inputs
    setSelectedEmpId("");
    setEmployeeSearchKey("");
    setLeaveReason("");
    setShowAddForm(false);
  };

  // End Leave early and return to Active Duty
  const handleEndLeaveEarly = (emp: Employee) => {
    const updatedEmployee: Employee = {
      ...emp,
      status: "active"
    };

    const newLogs: AuditLogEntry[] = emp.auditLog ? [...emp.auditLog] : [];
    newLogs.push({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      field: "status|leave_end",
      fieldNameAr: "إنهاء الإجازة والعودة للعمل",
      oldValue: `إجازة منتهية مبكراً (${emp.leaveEndDate})`,
      newValue: "على رأس العمل (نشط ومناوب)",
      timestamp: new Date().toISOString(),
      updatedBy: "hosan66@gmail.com"
    });

    updatedEmployee.auditLog = newLogs;

    onUpdateEmployee(updatedEmployee, emp.id);
  };

  return (
    <div className="pb-24 pt-4 px-4 bg-[#f8f9fa] min-h-screen text-right font-sans" dir="rtl">
      {/* Top Header Section */}
      <header className="flex flex-row justify-between items-center h-16 w-full mb-4">
        {/* Quick action back to Home dashboard */}
        <button 
          onClick={() => onScreenChange("dashboard")}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 transition-transform active:scale-95 shadow-xs"
          title="الرئيسية"
        >
          <Home className="w-5 h-5 text-[#1e3a8a]" />
        </button>

        <h1 className="text-base font-extrabold text-[#1e3a8a] font-sans">إدارة الإجازات المستقلة</h1>
        
        <button 
          onClick={() => onScreenChange("dashboard")}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 transition-transform active:scale-95 shadow-xs"
          title="رجوع"
        >
          <ArrowRight className="w-5 h-5 text-[#1e3a8a]" />
        </button>
      </header>

      {/* KPI Stats overview card row */}
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-xs text-center flex flex-col justify-center">
          <span className="text-[9px] text-gray-400 font-bold">في إجازة حالياً</span>
          <span className="text-lg font-black text-amber-600 mt-1">{currentLeaveEmployees.length}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-xs text-center flex flex-col justify-center">
          <span className="text-[9px] text-gray-400 font-bold">جاهزية التعيين</span>
          <span className="text-lg font-black text-blue-800 mt-1">{availableEmployees.length}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-xs text-center flex flex-col justify-center">
          <span className="text-[9px] text-gray-400 font-bold">إجمالي طاقم العمل</span>
          <span className="text-lg font-black text-gray-800 mt-1">{employees.length}</span>
        </div>
      </div>

      {/* Register/Grant Leave Toggle Trigger Card */}
      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full mb-5 bg-[#1e3a8a] text-white p-4 rounded-xl flex items-center justify-between shadow-xs hover:bg-[#1a3275] transition-all active:scale-[0.99]"
        >
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <Plus className="w-4 h-4 text-white" />
          </div>
          <div className="text-right">
            <h3 className="text-xs font-black">تسجيل منح إجازة رسمية جديدة</h3>
            <p className="text-[9px] text-blue-200 mt-0.5">منح الموظفين النشطين إجازات سنوية، مرضية، أو اضطرارية مسبقة.</p>
          </div>
        </button>
      ) : (
        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-md mb-5 animate-scaleUp">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <button
              onClick={() => {
                setShowAddForm(false);
                setSelectedEmpId("");
                setEmployeeSearchKey("");
              }}
              className="text-xs font-bold text-gray-400 hover:text-rose-600 transition-colors"
            >
              إلغاء التعبئة
            </button>
            <h3 className="text-xs font-black text-[#1e3a8a] flex items-center gap-1.5 flex-row-reverse">
              <CalendarDays className="w-4 h-4 text-amber-500" />
              <span>نموذج طلب منح إجازة رسمية</span>
            </h3>
          </div>

          <form onSubmit={handleRegisterLeave} className="space-y-4">
            {/* Employee Searchable Selection */}
            <div>
              <label className="block text-[10px] font-bold text-gray-600 mb-1.5">اختر الموظف المستفيد</label>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="ابحث باسم الموظف أو رقمه الوظيفي..."
                  value={employeeSearchKey}
                  onChange={(e) => {
                    setEmployeeSearchKey(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="w-full text-right bg-gray-50 text-xs font-semibold px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#1e3a8a] focus:bg-white"
                />
                <ChevronDown className="absolute left-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />

                {/* Dropdown Items list */}
                {isDropdownOpen && (
                  <div className="absolute z-20 top-12 left-0 right-0 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg mt-1 divide-y divide-gray-50 custom-scrollbar">
                    {filteredAvailableForSelect.length === 0 ? (
                      <div className="p-3 text-center text-xs text-gray-400 font-bold">لا يوجد موظف مطابق نشط</div>
                    ) : (
                      filteredAvailableForSelect.map(emp => (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => {
                            setSelectedEmpId(emp.id);
                            setEmployeeSearchKey(emp.name);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-right p-3 hover:bg-blue-50/50 flex items-center justify-between text-xs transition-colors ${selectedEmpId === emp.id ? 'bg-blue-50/70 font-black text-[#1e3a8a]' : ''}`}
                        >
                          <span className="text-[10px] text-gray-400 font-sans"># {emp.id}</span>
                          <div>
                            <span className="block font-black text-gray-850">{emp.name}</span>
                            <span className="block text-[9px] text-gray-400 font-bold">{emp.role} - {emp.department}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Leave type dropdown */}
            <div>
              <label className="block text-[10px] font-bold text-gray-600 mb-1.5">نوع الإجازة المطلوبة</label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                className="w-full text-right bg-gray-50 text-xs font-extrabold px-3 py-3 rounded-lg border border-gray-205 focus:outline-none focus:border-[#1e3a8a] focus:bg-white cursor-pointer"
              >
                {LEAVE_TYPES.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Start and End date row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-600 mb-1.5">تاريخ بدء الإجازة</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-center font-sans text-xs font-black px-2 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#1e3a8a] focus:bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600 mb-1.5">تاريخ انتهاء الإجازة</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-center font-sans text-xs font-black px-2 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#1e3a8a] focus:bg-white"
                  required
                />
              </div>
            </div>

            {/* Notes / Leave reasons */}
            <div>
              <label className="block text-[10px] font-bold text-gray-600 mb-1.5">أسباب الإجازة وملاحظات إضافية (اختياري)</label>
              <textarea
                placeholder="يرجى كتابة أي أسباب خاصة أو معلومات تأمين المباشرة هنا..."
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                rows={2}
                className="w-full text-right text-xs px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#1e3a8a] focus:bg-white resize-none"
              />
            </div>

            {/* Submit btn */}
            <button
              type="submit"
              className="w-full py-3 px-4 bg-green-600 text-white rounded-xl text-xs font-black hover:bg-green-700 transition-all shadow-xs active:scale-[0.98]"
            >
              تأكيد تسجيل ومنح الإجازة للموظف
            </button>
          </form>
        </div>
      )}

      {/* Leave List Main search card container */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
        {/* Search header inside the list */}
        <div className="flex items-center justify-between mb-4 flex-row-reverse">
          <h3 className="text-xs font-black text-gray-850">المستفيدون بالإجازات حالياً</h3>
          <span className="text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full">
            {filteredLeaves.length} موظفاً
          </span>
        </div>

        {/* Quick Search */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="ابحث باسم الموظف أو مسماه أو قسمه الإداري..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-right bg-gray-50 hover:bg-gray-100/50 text-xs px-4 py-2.5 rounded-xl border border-gray-150 focus:outline-none focus:border-[#1e3a8a] focus:bg-white"
          />
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Leaves Table list */}
        <div className="space-y-3">
          {filteredLeaves.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400 font-bold flex flex-col items-center gap-1">
              <AlertCircle className="w-5 h-5 text-gray-300" />
              <span>لا يوجد أي موظف في إجازة حالياً.</span>
            </div>
          ) : (
            filteredLeaves.map(emp => {
              const days = getRemainingDaysCount(emp.leaveEndDate);
              const isEndingSoon = days !== null && days >= 0 && days <= 3;
              const isOverdue = days !== null && days < 0;

              return (
                <div 
                  key={emp.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isOverdue 
                      ? 'bg-rose-50/40 border-rose-100' 
                      : isEndingSoon 
                        ? 'bg-amber-50/40 border-amber-200' 
                        : 'bg-gray-50/50 border-gray-100'
                  }`}
                >
                  {/* Row header: Name and avatar */}
                  <div className="flex items-start justify-between">
                    {/* Return Action / End Leave Early */}
                    <div className="flex flex-col items-end gap-1.5" dir="ltr">
                      <button
                        type="button"
                        onClick={() => handleEndLeaveEarly(emp)}
                        className="px-2.5 py-1 text-[9px] font-black bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md border border-blue-200 transition-all active:scale-95"
                      >
                        مباشرة وتحضير فوراً
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => handleAlertWhatsApp(emp)}
                        className="px-2.5 py-1 text-[9px] font-black bg-green-50 text-green-700 hover:bg-green-100 rounded-md border border-green-200 transition-all flex items-center gap-1 active:scale-95"
                      >
                        <MessageSquareText className="w-3 h-3 fill-current" />
                        <span>تذكير العودة</span>
                      </button>
                    </div>

                    {/* Emp detail right-aligned */}
                    <div className="flex items-center gap-2.5 text-right flex-row-reverse">
                      <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 text-[#1e3a8a] text-[10px] font-extrabold flex items-center justify-center font-sans tracking-tight shrink-0 select-none">
                        {emp.name.split(" ").slice(0, 2).map((n) => n[0]).join(" ")}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-gray-800">{emp.name}</h4>
                        <span className="text-[10px] text-gray-400 block font-bold mt-0.5">{emp.role} • {emp.department}</span>
                      </div>
                    </div>
                  </div>

                  {/* Date specs and countdown grid */}
                  <div className="mt-3 pt-3 border-t border-dashed border-gray-150/60 grid grid-cols-3 gap-1 text-center font-sans">
                    <div>
                      <span className="text-[8px] text-gray-400 block">تاريخ البدء</span>
                      <span className="text-[10px] font-black text-gray-800 font-sans">{emp.leaveStartDate || "—"}</span>
                    </div>

                    <div>
                      <span className="text-[8px] text-gray-400 block">تاريخ الانتهاء</span>
                      <span className="text-[10px] font-black text-gray-800 font-sans">{emp.leaveEndDate || "—"}</span>
                    </div>

                    <div>
                      <span className="text-[8px] text-gray-400 block">أيام متبقية</span>
                      {isOverdue ? (
                        <span className="text-[10px] font-black text-rose-600 block bg-rose-50 px-1 py-0.5 rounded border border-rose-200 animate-pulse">
                          منتهية {Math.abs(days || 0)} أيام
                        </span>
                      ) : (
                        <span className={`text-[10px] font-black block px-1 py-0.5 rounded border ${
                          isEndingSoon 
                            ? 'bg-amber-100 text-amber-700 border-amber-300 font-extrabold' 
                            : 'bg-green-50 text-green-700 border-green-100'
                        }`}>
                          {days === 0 ? "اليوم" : days === 1 ? "غداً" : `${days} يوم`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Advisory stability banner block */}
      <div className="bg-gradient-to-l from-amber-50 to-orange-50/30 p-4 rounded-xl border border-amber-100 shadow-xs mt-5 text-right flex flex-col gap-1">
        <h4 className="text-xs font-black text-amber-800 flex items-center gap-1 flex-row-reverse text-right">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          ملاحظة جدولة الإجازات
        </h4>
        <p className="text-[10px] text-gray-600 leading-relaxed font-bold">
          إن تسجيل وتأمين بديل مؤهل للموظف في فترة إجازته يساهم بشكل وقائي في تلافي عوارض الغياب أو اضطراب تغطيات تشغيل الأقسام الإدارية والوحدات الميدانية.
        </p>
      </div>
    </div>
  );
}
