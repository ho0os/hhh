import React, { useState } from "react";
import { 
  Coins, 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  AlertCircle, 
  Home, 
  FileCheck, 
  PlusCircle, 
  DollarSign, 
  Check, 
  Briefcase,
  History,
  TrendingUp,
  Sliders,
  Calculator,
  RefreshCw,
  Printer,
  X,
  FileText
} from "lucide-react";
import { Employee, ViewState, AuditLogEntry } from "../types";
// @ts-ignore
import sscoLogo from "../assets/images/ssco_logo_1779881766509.png";

interface LeaveDuesScreenProps {
  employees: Employee[];
  onUpdateEmployee: (updatedEmp: Employee, originalId: string) => void;
  onScreenChange: (screen: ViewState) => void;
}

export default function LeaveDuesScreen({
  employees,
  onUpdateEmployee,
  onScreenChange
}: LeaveDuesScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmpForRequest, setSelectedEmpForRequest] = useState<string | null>(null);
  const [requestDate, setRequestDate] = useState("2026-05-27"); // Current dynamic system date
  const [activeSegment, setActiveSegment] = useState<"eligible" | "previous">("eligible");

  // States for printing form preview
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printEmpId, setPrintEmpId] = useState<string | null>(null);
  const [printFormDays, setPrintFormDays] = useState<number>(30);
  const [printStartDate, setPrintStartDate] = useState<string>("");
  const [printEndDate, setPrintEndDate] = useState<string>("");
  const [printNotes, setPrintNotes] = useState<string>("");
  const [printEidFitr, setPrintEidFitr] = useState<boolean>(true);
  const [printEidAdha, setPrintEidAdha] = useState<boolean>(true);
  const [printNationalDay, setPrintNationalDay] = useState<boolean>(true);
  const [printFoundingDay, setPrintFoundingDay] = useState<boolean>(true);
  const [printYear, setPrintYear] = useState<string>("2026");

  const openPrintPreview = (empId: string, days: number, reqDateStr: string) => {
    setPrintEmpId(empId);
    setPrintFormDays(Math.ceil(days));
    setPrintStartDate(reqDateStr);
    
    // Auto-calculate end date by adding 'days' to start date
    try {
      const start = new Date(reqDateStr);
      start.setDate(start.getDate() + Math.ceil(days));
      setPrintEndDate(start.toISOString().split("T")[0]);
    } catch {
      setPrintEndDate(reqDateStr);
    }
    
    // Notes suggestion
    const emp = employees.find(e => e.id === empId);
    if (emp) {
      const dues = getSmartDuesDetails(empId, emp.joinDate);
      setPrintNotes(`تصفية رصيد مستحقات الإجازة السنوية بموجب المادة 111 من نظام العمل السعودي بقيمة {${dues.totalDues}} ر.س للأيام المذكورة.`);
    } else {
      setPrintNotes(`تصفية رصيد مستحقات الإجازة السنوية بموجب المادة 111 من نظام العمل.`);
    }
    
    setPrintEidFitr(true);
    setPrintEidAdha(true);
    setPrintNationalDay(true);
    setPrintFoundingDay(true);
    try {
      setPrintYear(new Date(reqDateStr).getFullYear().toString() || "2026");
    } catch {
      setPrintYear("2026");
    }
    setShowPrintModal(true);
  };

  // State to custom configure salaries and days per employee ID
  const [employeeSalaries, setEmployeeSalaries] = useState<Record<string, number>>(() => {
    const salts: Record<string, number> = {};
    employees.forEach(emp => {
      if (emp.leaveDuesSalary !== undefined) {
        salts[emp.id] = emp.leaveDuesSalary;
      }
    });
    return salts;
  });
  const [employeeCustomDays, setEmployeeCustomDays] = useState<Record<string, number>>(() => {
    const days: Record<string, number> = {};
    employees.forEach(emp => {
      if (emp.leaveDuesDays !== undefined) {
        days[emp.id] = emp.leaveDuesDays;
      }
    });
    return days;
  });

  // Helper: check completion of one year
  const hasCompletedOneYear = (joinDateStr: string | undefined): boolean => {
    if (!joinDateStr) return false;
    try {
      const join = new Date(joinDateStr);
      const today = new Date("2026-05-27");
      const diffTime = today.getTime() - join.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 365;
    } catch {
      return false;
    }
  };

  // Helper: Calculate days count since requested date
  const getDaysSinceRequest = (requestDateStr: string | undefined): number => {
    if (!requestDateStr) return 0;
    try {
      const reqDate = new Date(requestDateStr);
      const today = new Date("2026-05-27");
      const diffTime = today.getTime() - reqDate.getTime();
      return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    } catch {
      return 0;
    }
  };

  // Helper: Calculate tenure details in years & months
  const getTenureString = (joinDateStr: string | undefined): string => {
    if (!joinDateStr) return "غير محدد";
    try {
      const join = new Date(joinDateStr);
      const today = new Date("2026-05-27");
      const diffTime = today.getTime() - join.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      const years = Math.floor(diffDays / 365);
      const remainingDays = diffDays % 365;
      const months = Math.floor(remainingDays / 30);

      if (years > 0) {
        return `سنة (${years}) و (${months}) شهر`;
      }
      return `(${months}) شهر`;
    } catch {
      return "غير معروف";
    }
  };

  // Helper: Get calculated accrued vacation days based on Saudi labor law
  const getAccruedVacationDays = (joinDateStr: string | undefined): number => {
    if (!joinDateStr) return 0;
    try {
      const join = new Date(joinDateStr);
      const today = new Date("2026-05-27");
      const diffTime = today.getTime() - join.getTime();
      const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
      const years = diffDays / 365.25;

      let days = 0;
      if (years < 5) {
        days = years * 21; // 21 days leave per year for first 5 years
      } else {
        days = (5 * 21) + ((years - 5) * 30); // 30 days leave per year after 5 years
      }
      return parseFloat(days.toFixed(1));
    } catch {
      return 0;
    }
  };

  // Helper: Perform smart dues calculation
  const getSmartDuesDetails = (empId: string, joinDate: string | undefined) => {
    const emp = employees.find(e => e.id === empId);
    const salary = employeeSalaries[empId] ?? emp?.leaveDuesSalary ?? 5000;
    const days = employeeCustomDays[empId] ?? emp?.leaveDuesDays ?? getAccruedVacationDays(joinDate);
    const dailyRate = salary / 30;
    const totalDues = Math.round(days * dailyRate);

    return {
      salary,
      days,
      dailyRate: parseFloat(dailyRate.toFixed(2)),
      totalDues
    };
  };

  // Categorize Employees:
  // 1. Eligible for dues (completed > 1 year)
  const eligibleEmployees = employees.filter(emp => {
    return (
      hasCompletedOneYear(emp.joinDate) &&
      emp.status !== "resigned" &&
      emp.status !== "terminated"
    );
  });

  // 2. Previously requested dues
  const requestedDuesEmployees = employees.filter(emp => emp.leaveDuesRequested === true);

  // Apply search filtering
  const filteredEligible = eligibleEmployees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.id.includes(searchQuery) ||
    (emp.department && emp.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredRequested = requestedDuesEmployees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.id.includes(searchQuery) ||
    (emp.department && emp.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Action: Create Leave dues request
  const handleCreateRequest = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;

    const duesData = getSmartDuesDetails(empId, emp.joinDate);

    const updatedEmp: Employee = {
      ...emp,
      leaveDuesRequested: true,
      leaveDuesRequestedDate: requestDate,
      leaveDuesStatus: "not_received",
      leaveDuesSalary: duesData.salary,
      leaveDuesDays: duesData.days
    };

    // Add Audit Log Entry
    const newLogs: AuditLogEntry[] = emp.auditLog ? [...emp.auditLog] : [];
    newLogs.push({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      field: "leaveDuesRequested",
      fieldNameAr: "طلب مستحقات الإجازة",
      oldValue: "لم يتم الطلب",
      newValue: `تم طلب مستحقات الإجازة بتاريخ ${requestDate} (الراتب: ${duesData.salary} ر.س، الأيام: ${duesData.days} يوم، إجمالي: ${duesData.totalDues} ر.س)`,
      timestamp: new Date().toISOString(),
      updatedBy: "hosan66@gmail.com"
    });

    updatedEmp.auditLog = newLogs;

    onUpdateEmployee(updatedEmp, emp.id);
    setSelectedEmpForRequest(null);
    setTimeout(() => {
      openPrintPreview(emp.id, duesData.days, requestDate);
    }, 150);
  };

  // Action: Toggle Status between Received & Not Received Yet
  const handleUpdateStatus = (empId: string, status: "received" | "not_received", year?: string) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;

    const defaultYear = year || emp.leaveDuesReceivedYear || "2026";

    const updatedEmp: Employee = {
      ...emp,
      leaveDuesStatus: status,
      leaveDuesReceivedYear: status === "received" ? defaultYear : undefined
    };

    // Add Audit Log Entry
    const newLogs: AuditLogEntry[] = emp.auditLog ? [...emp.auditLog] : [];
    newLogs.push({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      field: "leaveDuesStatus",
      fieldNameAr: "حالة استلام مستحقات الإجازة",
      oldValue: emp.leaveDuesStatus === "received" ? `تم الاستلام (سنة ${emp.leaveDuesReceivedYear || "—"})` : "لم يستلم بعد",
      newValue: status === "received" ? `تم استلام المستحقات (سنة ${defaultYear})` : "لم يستلم بعد",
      timestamp: new Date().toISOString(),
      updatedBy: "hosan66@gmail.com"
    });

    updatedEmp.auditLog = newLogs;

    onUpdateEmployee(updatedEmp, emp.id);
  };

  // Action: Cancel/Delete Request
  const handleCancelRequest = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;

    const updatedEmp: Employee = {
      ...emp,
      leaveDuesRequested: false,
      leaveDuesRequestedDate: undefined,
      leaveDuesStatus: undefined,
      leaveDuesSalary: undefined,
      leaveDuesDays: undefined,
      leaveDuesReceivedYear: undefined
    };

    // Add Audit Log Entry
    const newLogs: AuditLogEntry[] = emp.auditLog ? [...emp.auditLog] : [];
    newLogs.push({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      field: "leaveDuesRequested",
      fieldNameAr: "إلغاء طلب مستحقات الإجازة",
      oldValue: "تم تقديم الطلب سابقا",
      newValue: "تم إلغاء طلب مستحقات الإجازة وإرجاعه لقائمة الانتظار",
      timestamp: new Date().toISOString(),
      updatedBy: "hosan66@gmail.com"
    });

    updatedEmp.auditLog = newLogs;

    onUpdateEmployee(updatedEmp, emp.id);
  };

  return (
    <div className="pb-28 pt-4 px-4 bg-[#f8f9fa] min-h-screen text-right font-sans" dir="rtl">
      {/* Header Container */}
      <header className="flex flex-row justify-between items-center h-16 w-full mb-4">
        {/* Quick action back to Home dashboard */}
        <button 
          onClick={() => onScreenChange("dashboard")}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 transition-transform active:scale-95 shadow-xs"
          title="الرئيسية"
        >
          <Home className="w-5 h-5 text-[#1e3a8a]" />
        </button>

        <h1 className="text-sm font-extrabold text-[#1e3a8a] font-sans flex items-center gap-2 flex-row-reverse">
          <Coins className="w-5 h-5 text-amber-500 shrink-0 animate-bounce" />
          <span>مستحقات إجازات الموظفين</span>
        </h1>
        
        <button 
          onClick={() => onScreenChange("dashboard")}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 transition-transform active:scale-95 shadow-xs"
          title="رجوع"
        >
          <ArrowRight className="w-5 h-5 text-[#1e3a8a]" />
        </button>
      </header>

      {/* KPI stats overview card row */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-xs text-center flex flex-col justify-center">
          <span className="text-[9px] text-gray-400 font-bold">المستحقون الإجماليون</span>
          <span className="text-lg font-black text-[#1e3a8a] mt-0.5">{eligibleEmployees.length}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-xs text-center flex flex-col justify-center">
          <span className="text-[9px] text-gray-400 font-bold">طلبات سابقة معلقة</span>
          <span className="text-lg font-black text-amber-600 mt-0.5">
            {requestedDuesEmployees.filter(e => e.leaveDuesStatus !== "received").length}
          </span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-xs text-center flex flex-col justify-center">
          <span className="text-[9px] text-gray-400 font-bold">تم الاستلام بنجاح</span>
          <span className="text-lg font-black text-green-600 mt-0.5">
            {requestedDuesEmployees.filter(e => e.leaveDuesStatus === "received").length}
          </span>
        </div>
      </div>

      {/* Segment view switcher */}
      <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 mb-5 gap-1">
        <button
          onClick={() => setActiveSegment("eligible")}
          className={`flex-1 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeSegment === "eligible"
              ? "bg-[#1e3a8a] text-white shadow-xs"
              : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span>مستحقو المستحقات ({filteredEligible.length})</span>
        </button>
        <button
          onClick={() => setActiveSegment("previous")}
          className={`flex-1 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeSegment === "previous"
              ? "bg-[#1e3a8a] text-white shadow-xs"
              : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
          }`}
        >
          <History className="w-4 h-4 text-amber-400" />
          <span>طلبات سابقة ({filteredRequested.length})</span>
        </button>
      </div>

      {/* Live search input text */}
      <div className="relative mb-5">
        <input
          type="text"
          placeholder="ابحث باسم الموظف أو مسمى الوظيفة أو فرعه..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-right bg-white text-xs px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#1e3a8a] shadow-xs animate-fade-in"
        />
        <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Display Form for Registering/Requesting Leave Dues Date on selected user */}
      {selectedEmpForRequest && (
        <div className="bg-white p-5 rounded-2xl border-2 border-amber-300 shadow-md mb-5 animate-scaleUp">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <button
              onClick={() => setSelectedEmpForRequest(null)}
              className="text-xs font-bold text-rose-500 hover:underline"
            >
              إلغاء لغرض الإغلاق
            </button>
            <h3 className="text-xs font-black text-[#1e3a8a] flex items-center gap-1 flex-row-reverse">
              <PlusCircle className="w-4.5 h-4.5 text-amber-500" />
              <span>تقديم طلب مستحقات جديد</span>
            </h3>
          </div>

          <div className="mb-4">
            <span className="text-[10px] text-gray-400 font-bold block mb-1">الموظف المستفيد</span>
            <span className="font-extrabold text-sm text-gray-800">
              {employees.find(e => e.id === selectedEmpForRequest)?.name}
            </span>
            <span className="text-[10px] text-gray-500 block">
              {employees.find(e => e.id === selectedEmpForRequest)?.role} • {employees.find(e => e.id === selectedEmpForRequest)?.department}
            </span>
          </div>

          <div className="space-y-4">
            {/* Display Dues Calculator preview directly in form */}
            {(() => {
              const emp = employees.find(e => e.id === selectedEmpForRequest);
              if (!emp) return null;
              const calc = getSmartDuesDetails(emp.id, emp.joinDate);
              return (
                <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100 space-y-2 text-right">
                  <div className="flex items-center justify-between flex-row-reverse">
                    <span className="text-[10px] font-bold text-amber-800">الحاسبة التقديرية</span>
                    <Calculator className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[9px] text-gray-400 block font-bold">الراتب الأساسي الافتراضي</span>
                      <span className="font-extrabold text-[#111827]">{calc.salary} ر.س</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 block font-bold">أيام الإجازة المتراكمة</span>
                      <span className="font-extrabold text-[#111827]">{calc.days} يوم</span>
                    </div>
                  </div>
                  <div className="border-t border-amber-200/50 pt-1.5 flex justify-between items-center flex-row-reverse">
                    <span className="text-[10px] font-bold text-amber-900">المبلغ الإجمالي المستحق:</span>
                    <span className="text-xs font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                      {calc.totalDues} ر.س
                    </span>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-2 gap-3" dir="rtl">
              <div>
                <label className="block text-[10px] font-bold text-gray-600 mb-1.5">الراتب الأساسي (ر.س)</label>
                <input
                  type="number"
                  value={employeeSalaries[selectedEmpForRequest] ?? employees.find(e => e.id === selectedEmpForRequest)?.leaveDuesSalary ?? 5000}
                  onChange={(e) => {
                    const val = Math.max(0, parseInt(e.target.value) || 0);
                    setEmployeeSalaries(prev => ({ ...prev, [selectedEmpForRequest]: val }));
                  }}
                  className="w-full text-center font-sans font-extrabold text-xs px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#1e3a8a]"
                  placeholder="الراتب الأساسي"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600 mb-1.5">أيام الإجازة المتراكمة</label>
                <input
                  type="number"
                  step="0.1"
                  value={employeeCustomDays[selectedEmpForRequest] ?? employees.find(e => e.id === selectedEmpForRequest)?.leaveDuesDays ?? (hasCompletedOneYear(employees.find(e => e.id === selectedEmpForRequest)?.joinDate) ? getAccruedVacationDays(employees.find(e => e.id === selectedEmpForRequest)?.joinDate) : 0)}
                  onChange={(e) => {
                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                    setEmployeeCustomDays(prev => ({ ...prev, [selectedEmpForRequest]: val }));
                  }}
                  className="w-full text-center font-sans font-extrabold text-xs px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#1e3a8a]"
                  placeholder="عدد الأيام"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-600 mb-1.5">تاريخ تقديم طلب مستحقات الإجازة</label>
              <input
                type="date"
                value={requestDate}
                onChange={(e) => setRequestDate(e.target.value)}
                className="w-full text-center font-sans font-black text-xs px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#1e3a8a]"
              />
            </div>
            
            <button
              onClick={() => handleCreateRequest(selectedEmpForRequest)}
              className="w-full bg-[#1e3a8a] text-white py-3 px-4 rounded-xl text-xs font-black hover:bg-[#1a3275] transition-all"
            >
              تأكيد تسجيل الطلب (مستحق ولم يستلم بعد)
            </button>
          </div>
        </div>
      )}

      {/* Main Container Content */}
      <main className="space-y-4">
        
        {/* 1. Eligible Employees Tab segment */}
        {activeSegment === "eligible" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2 px-1 flex-row-reverse">
              <h3 className="text-xs font-bold text-gray-500">مستحقو تسليّم مستحقات الإجازات</h3>
              <span className="text-[10px] text-gray-400 font-black">إجمالي: {filteredEligible.length} موظف</span>
            </div>

            {filteredEligible.length === 0 ? (
              <div className="bg-white p-8 text-center rounded-2xl border border-gray-100 flex flex-col items-center justify-center gap-1.5 shadow-xs">
                <AlertCircle className="w-6 h-6 text-gray-300" />
                <span className="text-xs text-gray-400 font-bold">لا يوجد أي موظف مطابق مستحق للمستحقات</span>
              </div>
            ) : (
              filteredEligible.map(emp => {
                const isAlreadyRequested = emp.leaveDuesRequested === true;
                const dues = getSmartDuesDetails(emp.id, emp.joinDate);

                return (
                  <div 
                    key={emp.id}
                    className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-3"
                  >
                    {/* Upper row */}
                    <div className="flex items-start justify-between">
                      {/* Left: Button Action and Estimated Amount */}
                      <div className="flex flex-col items-start gap-1">
                        {isAlreadyRequested ? (
                          <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-200 font-extrabold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>مطلوب سلفاً</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedEmpForRequest(emp.id);
                              setRequestDate("2026-05-27");
                            }}
                            className="px-3 py-1.5 text-[10px] font-black bg-[#1e3a8a] text-white hover:bg-blue-800 rounded-lg shadow-xs transition-all active:scale-95"
                          >
                            طلب مستحقات
                          </button>
                        )}
                        
                        {/* Interactive Dues Amount Output Badge */}
                        <div className="mt-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md border border-emerald-100 text-[10px] font-black flex items-center gap-1">
                          <span>المبلغ:</span>
                          <span className="font-mono text-xs">{dues.totalDues}</span>
                          <span>ر.س</span>
                        </div>
                      </div>

                      {/* Right: Employee Profile */}
                      <div className="flex items-center gap-2.5 text-right flex-row-reverse">
                        <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-black flex items-center justify-center border border-emerald-150 shrink-0">
                          {emp.name.split(" ").slice(0, 2).map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-gray-800">{emp.name}</h4>
                          <span className="text-[10px] text-gray-400 block font-bold mt-0.5">{emp.role} • {emp.department}</span>
                        </div>
                      </div>
                    </div>

                    {/* Salary & Vacation Days Editing / Smart Calculation block */}
                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold border-b border-gray-200/50 pb-1 flex-row-reverse">
                        <span className="flex items-center gap-1 flex-row-reverse">
                          <Sliders className="w-3.5 h-3.5 text-gray-400" />
                          <span>إعدادات راتب وحساب مستحقات الموظف</span>
                        </span>
                        <span className="text-[9px] bg-white border px-1.5 py-0.5 rounded text-gray-400 font-sans font-bold">
                          المحاسبة الذكية (السعودية)
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3" dir="rtl">
                        {/* Interactive Salary Input */}
                        <div>
                          <label className="block text-[9px] text-[#2563eb] font-bold mb-1">الراتب الأساسي (ر.س)</label>
                          <input 
                            type="number" 
                            value={dues.salary}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              setEmployeeSalaries(prev => ({ ...prev, [emp.id]: val }));
                            }}
                            placeholder="5000"
                            className="bg-white w-full text-center text-xs font-bold font-sans py-1 rounded-md border border-gray-200 focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        {/* Interactive Custom Days input */}
                        <div>
                          <label className="block text-[9px] text-[#2563eb] font-bold mb-1">أيام الإجازة المتراكمة</label>
                          <div className="relative">
                            <input 
                              type="number" 
                              step="0.1"
                              value={dues.days}
                              onChange={(e) => {
                                const val = Math.max(0, parseFloat(e.target.value) || 0);
                                setEmployeeCustomDays(prev => ({ ...prev, [emp.id]: val }));
                              }}
                              className="bg-white w-full text-center text-xs font-bold font-sans py-1 rounded-md border border-gray-200 focus:outline-none focus:border-blue-500"
                            />
                            {employeeCustomDays[emp.id] !== undefined && (
                              <button
                                onClick={() => {
                                  const updated = { ...employeeCustomDays };
                                  delete updated[emp.id];
                                  setEmployeeCustomDays(updated);
                                }}
                                title="إعادة التحرير للمقترح النظامي"
                                className="absolute left-1 top-1 text-[8px] bg-gray-100 text-gray-400 hover:text-red-500 hover:bg-red-50 px-1 rounded active:scale-95"
                              >
                                <RefreshCw className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Lower specs row */}
                    <div className="pt-1 border-t border-dashed border-gray-100 grid grid-cols-2 gap-2 text-right">
                      <div className="p-1 rounded-lg">
                        <span className="text-[9px] text-gray-400 block font-bold">تاريخ التعيين</span>
                        <span className="text-xs font-extrabold text-[#111827] font-sans">{emp.joinDate || "—"}</span>
                      </div>
                      <div className="p-1 rounded-lg mr-1">
                        <span className="text-[9px] text-gray-400 block font-bold">مدة الخدمة في المؤسسة</span>
                        <span className="text-[11px] font-extrabold text-[#111827]">{getTenureString(emp.joinDate)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 2. Previous Requests Tab Segment */}
        {activeSegment === "previous" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2 px-1 flex-row-reverse">
              <h3 className="text-xs font-bold text-gray-500">سجل طلبات مستحقات الإجازة المسجلة</h3>
              <span className="text-[10px] text-gray-400 font-black">عدد الطلبات: {filteredRequested.length}</span>
            </div>

            {filteredRequested.length === 0 ? (
              <div className="bg-white p-8 text-center rounded-2xl border border-gray-100 flex flex-col items-center justify-center gap-1.5 shadow-xs">
                <AlertCircle className="w-6 h-6 text-gray-300" />
                <span className="text-xs text-gray-400 font-bold">لم تسجل أي طلبات لمستحقات إجازة سابقة بعد</span>
              </div>
            ) : (
              filteredRequested.map(emp => {
                const daysSince = getDaysSinceRequest(emp.leaveDuesRequestedDate);
                const isReceived = emp.leaveDuesStatus === "received";
                const dues = getSmartDuesDetails(emp.id, emp.joinDate);

                return (
                  <div 
                    key={emp.id}
                    className={`p-4 rounded-xl border shadow-sm transition-all ${
                      isReceived ? "bg-white border-green-150" : "bg-white border-amber-150"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      {/* Left Side: Status Toggle & Reset option */}
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center bg-gray-100/80 rounded-lg p-0.5 border border-gray-200">
                          {/* Received Option Button */}
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(emp.id, "received")}
                            className={`px-2.5 py-1 text-[9px] font-black rounded-md transition-all ${
                              isReceived 
                                ? "bg-green-600 text-white shadow-xs" 
                                : "text-gray-500 hover:text-gray-800"
                            }`}
                          >
                            تم الاستلام
                          </button>

                          {/* Not Received Yet Option Button */}
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(emp.id, "not_received")}
                            className={`px-2.5 py-1 text-[9px] font-black rounded-md transition-all ${
                              !isReceived 
                                ? "bg-amber-600 text-white shadow-xs" 
                                : "text-gray-500 hover:text-gray-800"
                            }`}
                          >
                            لم يستلم بعد
                          </button>
                        </div>

                        {/* Dropdown to select/record the year of receipt if isReceived is true */}
                        {isReceived && (
                          <div className="flex items-center gap-1.5 flex-row-reverse text-right mt-1">
                            <span className="text-[9px] text-gray-500 font-bold">سنة الاستلام:</span>
                            <select
                              value={emp.leaveDuesReceivedYear || "2026"}
                              onChange={(e) => handleUpdateStatus(emp.id, "received", e.target.value)}
                              className="text-[10px] bg-white border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:border-green-600 font-sans font-bold"
                            >
                              <option value="2026">2026</option>
                              <option value="2025">2025</option>
                              <option value="2024">2024</option>
                              <option value="2023">2023</option>
                              <option value="2022">2022</option>
                              <option value="2021">2021</option>
                            </select>
                          </div>
                        )}

                        {/* Quick cancel button */}
                        <div className="flex gap-2.5 items-center mt-1">
                          <button
                            onClick={() => openPrintPreview(emp.id, dues.days, emp.leaveDuesRequestedDate || "2026-05-27")}
                            className="text-[10px] font-bold text-[#1e3a8a] bg-blue-50/50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded-lg flex items-center gap-1 transition-all"
                            title="معاينة وطباعة نموذج الإجازة المعبأ"
                          >
                            <Printer className="w-3 h-3 text-[#1e3a8a]" />
                            <span>معاينة نموذج الإجازة 🖨️</span>
                          </button>
                          
                          <button
                            onClick={() => handleCancelRequest(emp.id)}
                            className="text-[9px] text-gray-400 hover:text-rose-600 font-bold"
                          >
                            إلغاء الطلب بالكامل
                          </button>
                        </div>
                      </div>

                      {/* Right: profile section */}
                      <div className="flex items-center gap-2.5 text-right flex-row-reverse">
                        <div className={`w-9 h-9 rounded-full text-[10px] font-black flex items-center justify-center border shrink-0 ${
                          isReceived 
                            ? "bg-green-50 border-green-200 text-green-800"
                            : "bg-amber-50 border-amber-200 text-amber-800"
                        }`}>
                          {emp.name.split(" ").slice(0, 2).map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-gray-800">{emp.name}</h4>
                          <div className="flex items-center gap-1 flex-row-reverse justify-end mt-0.5">
                            <span className="text-[9px] text-gray-400 font-bold">{emp.role}</span>
                            <span className="text-gray-300">•</span>
                            {isReceived ? (
                              <span className="text-[9px] font-extrabold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-150">
                                تم استلام المستحقات سنة {emp.leaveDuesReceivedYear || "2026"}
                              </span>
                            ) : (
                              <span className="text-[9px] font-extrabold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-150">لم يستلم بعد</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Monetary Dues summary details */}
                    <div className="my-2 p-2 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-150/70 grid grid-cols-3 gap-1.5 text-center font-sans">
                      <div>
                        <span className="text-[8px] text-gray-400 block font-bold">الراتب الأساسي</span>
                        <span className="text-[10px] font-black text-[#111827]">{dues.salary} ر.س</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-gray-400 block font-bold">أيام المستحقات</span>
                        <span className="text-[10px] font-black text-[#111827]">{dues.days} يوم</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-gray-400 block font-bold">المبلغ المقدر التقديري</span>
                        <span className="text-[10.5px] font-black text-emerald-600">{dues.totalDues} ر.س</span>
                      </div>
                    </div>

                    {/* Lower grid calculating Days elapsed since request date */}
                    <div className="pt-2.5 border-t border-dashed border-gray-150/60 grid grid-cols-3 gap-1.5 text-center font-sans">
                      <div>
                        <span className="text-[8px] text-gray-400 block font-bold">تاريخ تقديم الطلب</span>
                        <span className="text-[10px] font-black text-[#111827] font-sans">{emp.leaveDuesRequestedDate || "—"}</span>
                      </div>

                      <div>
                        <span className="text-[8px] text-gray-400 block font-bold">المدة المنقضية (طلب)</span>
                        <span className="text-[10px] font-black text-blue-700 font-sans block bg-blue-50 px-1 py-0.5 rounded border border-blue-100">
                          {daysSince === 0 ? "اليوم نفسه" : `منذ ${daysSince} أيام`}
                        </span>
                      </div>

                      <div>
                        <span className="text-[8px] text-gray-400 block font-bold">حالة الصرف الحالية</span>
                        {isReceived ? (
                          <span className="text-[9px] font-black text-green-700 bg-green-50 rounded border border-green-100 block px-1 py-0.5">
                            تم استلام المستحقات سنة {emp.leaveDuesReceivedYear || "2026"}
                          </span>
                        ) : (
                          <span className="text-[9px] font-black text-amber-700 bg-amber-50 rounded border border-amber-100 block px-1 py-0.5 animate-pulse">
                            بالانتظار للمالية
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

      </main>

      {/* Persistent advisory warning for compliance */}
      <footer className="mt-6 bg-[#1e3a8a]/5 border border-blue-150 p-4 rounded-xl flex flex-col gap-1 text-right">
        <h5 className="text-xs font-bold text-[#1e3a8a] flex items-center gap-1.5 flex-row-reverse leading-none">
          <FileCheck className="w-4 h-4 text-[#1e3a8a]" />
          إجراء نظام العمل السعودي للمستحقات
        </h5>
        <p className="text-[10px] text-gray-650 leading-relaxed font-bold">
          معادلة الحساب الذكية المقترحة تعتمد على إقرار المادة 111 من نظام العمل والتي تمنح الموظف تعويضًا نقديًا للأيام المتراكمة من الإجازات السنوية المستحقة (21 يومًا سنويًا للسنوات الـ5 الأولى، و30 يومًا للسنوات اللاحقة) بناءً على آخر أجر أساسي تقاضاه، مقسومًا على 30 يومًا للأجر اليومي.
        </p>
      </footer>

      {/* Print Form Preview Modal */}
      {showPrintModal && (() => {
        const emp = employees.find(e => e.id === printEmpId);
        if (!emp) return null;
        
        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto p-4 flex flex-col items-center">
            {/* Control bar / screen editor - Hidden during print! */}
            <div className="print-hidden-element w-full max-w-[210mm] bg-white rounded-2xl border border-gray-150 p-4 mb-4 shadow-xl text-right flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-[#1e3a8a] flex items-center gap-1.5 flex-row-reverse">
                  <Printer className="w-5 h-5" />
                  <span>معاينة وتحرير المسودة الرقمية لاستمارة الإجازة</span>
                </h3>
                <p className="text-[10px] text-gray-500 mt-0.5">يمكنك تعديل حقول المسودة أدناه، حيث تنعكس التعديلات فورا على النموذج المرفق الجاهز للطباعة.</p>
              </div>
              
              <div className="flex items-center gap-2 flex-row-reverse">
                <button
                  onClick={() => window.print()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة النموذج المعتمد 🖨️</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs px-4 py-2.5 rounded-xl border border-gray-200 transition-all active:scale-95 cursor-pointer"
                >
                  إغلاق المعاينة
                </button>
              </div>
            </div>

            {/* Live customizer inputs panel - Hidden during print! */}
            <div className="print-hidden-element w-full max-w-[210mm] bg-gray-50 rounded-2xl border border-gray-150 p-4 mb-4 shadow-sm text-right grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-gray-600 mb-1">أيام الإجازة المطلوبة</label>
                <input 
                  type="number" 
                  value={printFormDays} 
                  onChange={(e) => {
                    const d = Math.max(1, parseInt(e.target.value) || 1);
                    setPrintFormDays(d);
                    try {
                      const start = new Date(printStartDate);
                      start.setDate(start.getDate() + d);
                      setPrintEndDate(start.toISOString().split("T")[0]);
                    } catch {}
                  }}
                  className="w-full text-center px-2 py-1.5 bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-500 font-bold"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-600 mb-1">من تاريخ (بدء الإجازة)</label>
                <input 
                  type="date" 
                  value={printStartDate} 
                  onChange={(e) => {
                    setPrintStartDate(e.target.value);
                    try {
                      const start = new Date(e.target.value);
                      start.setDate(start.getDate() + printFormDays);
                      setPrintEndDate(start.toISOString().split("T")[0]);
                    } catch {}
                  }}
                  className="w-full text-center px-2 py-1 bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-600 mb-1">إلى تاريخ (الانتهاء المقدر)</label>
                <input 
                  type="date" 
                  value={printEndDate} 
                  onChange={(e) => setPrintEndDate(e.target.value)}
                  className="w-full text-center px-2 py-1 bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-600 mb-1">سنة دوام الأعياد</label>
                <input 
                  type="text" 
                  value={printYear} 
                  onChange={(e) => setPrintYear(e.target.value)}
                  className="w-full text-center px-2 py-1 bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-500 font-bold"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-gray-600 mb-1">ملاحظات النموذج المطبوعة</label>
                <input 
                  type="text" 
                  value={printNotes} 
                  onChange={(e) => setPrintNotes(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded focus:outline-none focus:border-[#1e3a8a]"
                  placeholder="ملاحظات تظهر على النموذج المطبوع..."
                />
              </div>

              <div className="col-span-2 flex items-center justify-around bg-white p-2 rounded border border-gray-200 mt-2 h-[38px] flex-row-reverse">
                <label className="flex items-center gap-1 font-bold cursor-pointer">
                  <input type="checkbox" checked={printEidFitr} onChange={(e) => setPrintEidFitr(e.target.checked)} className="accent-[#1e3a8a] w-4 h-4" />
                  <span>عيد الفطر</span>
                </label>
                <label className="flex items-center gap-1 font-bold cursor-pointer">
                  <input type="checkbox" checked={printEidAdha} onChange={(e) => setPrintEidAdha(e.target.checked)} className="accent-[#1e3a8a] w-4 h-4" />
                  <span>عيد الأضحى</span>
                </label>
                <label className="flex items-center gap-1 font-bold cursor-pointer">
                  <input type="checkbox" checked={printNationalDay} onChange={(e) => setPrintNationalDay(e.target.checked)} className="accent-[#1e3a8a] w-4 h-4" />
                  <span>اليوم الوطني</span>
                </label>
                <label className="flex items-center gap-1 font-bold cursor-pointer">
                  <input type="checkbox" checked={printFoundingDay} onChange={(e) => setPrintFoundingDay(e.target.checked)} className="accent-[#1e3a8a] w-4 h-4" />
                  <span>يوم التأسيس</span>
                </label>
              </div>
            </div>

            {/* High fidelity printable form (ID: "printable-leave-form") */}
            <div 
              id="printable-leave-form"
              className="bg-white text-black p-6 md:p-10 rounded-sm shadow-2xl border border-gray-300 max-w-[210mm] w-full text-right flex flex-col justify-between font-sans min-h-[297mm] select-text"
              style={{ boxSizing: "border-box" }}
            >
              {/* Header section matching scanned report */}
              <div>
                <div className="flex justify-between items-center pb-4 border-b-2 border-[#1e3a8a] flex-row-reverse mb-4">
                  {/* Right Header: Arabic SSCO */}
                  <div className="text-right">
                    <h2 className="text-xs md:text-sm font-black font-sans text-gray-900 leading-tight">شركة الأمن والأمان للحراسات الأمنية المدنية</h2>
                    <h3 className="text-[10px] md:text-[11px] font-bold text-[#1e3a8a] font-sans">قسم شؤون الموظفين والموارد البشرية</h3>
                    <p className="text-[8px] md:text-[9px] text-gray-500 font-sans mt-0.5">ترخيص رقم: ٣٥٤ / أمن مخصصة</p>
                  </div>

                  {/* Center Logo */}
                  <div className="flex flex-col items-center">
                    <img 
                      src={sscoLogo} 
                      alt="SSCO Logo" 
                      className="w-14 h-14 md:w-16 md:h-16 object-contain" 
                    />
                    <span className="text-[7px] md:text-[8px] font-black text-[#1e3a8a] tracking-widest font-sans mt-1">S. S. C. O</span>
                  </div>

                  {/* Left Header: English SSCO name */}
                  <div className="text-left font-sans">
                    <h2 className="text-xs md:text-sm font-black text-gray-900 leading-tight">Safety & Security Company (SSCO)</h2>
                    <h3 className="text-[9px] md:text-[10px] text-gray-500 font-semibold tracking-wide">HR & Civil Protection Department</h3>
                    <p className="text-[7px] md:text-[8px] text-gray-400 mt-1">Official Digital System Generated</p>
                  </div>
                </div>

                {/* Form Tag Document Title */}
                <div className="text-center my-4">
                  <h1 className="text-base md:text-lg font-black underline underline-offset-8 tracking-widest text-slate-900 font-sans">طلب اجازة</h1>
                  <span className="text-[8px] md:text-[9px] text-gray-400 block mt-1">نموذج معبأ تلقائياً لمستحقات نهاية الإجازة السنوية</span>
                </div>

                {/* Patient / Employee Info Card Header */}
                <div className="space-y-4">
                  {/* Grid layout matching the physical scan */}
                  <div className="border border-black rounded-sm overflow-hidden text-xs">
                    <div className="bg-gray-100 p-1.5 border-b border-black font-black text-[11px] md:text-[12px] flex flex-row-reverse justify-between items-center text-gray-900">
                      <span>• معلومات الموظف :</span>
                      <span className="text-[8px] md:text-[9px] font-bold text-gray-500 font-mono">ID: {emp.id}</span>
                    </div>

                    {/* Employee full name */}
                    <div className="grid grid-cols-1 border-b border-black">
                      <div className="p-2 flex gap-2 flex-row-reverse text-right">
                        <span className="font-extrabold text-gray-850 min-w-[100px]">الاسم رباعي :</span>
                        <span className="font-extrabold text-[#1e3a8a]">{emp.name}</span>
                      </div>
                    </div>

                    {/* Job specifications row */}
                    <div className="grid grid-cols-3 border-b border-black divide-x divide-x-reverse divide-black">
                      <div className="p-2 flex gap-1.5 flex-row-reverse text-right">
                        <span className="font-extrabold text-gray-850">المسمى الوظيفي :</span>
                        <span className="font-bold text-gray-900">{emp.role}</span>
                      </div>
                      <div className="p-2 flex gap-1.5 flex-row-reverse text-right">
                        <span className="font-extrabold text-gray-850">الرقم الوظيفي :</span>
                        <span className="font-extrabold text-[#1a56db] font-sans">{emp.id}</span>
                      </div>
                      <div className="p-2 flex gap-1.5 flex-row-reverse text-right">
                        <span className="font-extrabold text-gray-850">الموقع :</span>
                        <span className="font-bold text-gray-950">{emp.department || "الفرع الرئيسي"}</span>
                      </div>
                    </div>

                    {/* Government specs row */}
                    <div className="grid grid-cols-3 divide-x divide-x-reverse divide-black">
                      <div className="p-2 flex gap-1.5 flex-row-reverse text-right">
                        <span className="font-extrabold text-gray-850">تاريخ المباشرة :</span>
                        <span className="font-bold font-sans text-gray-900">{emp.joinDate || "—"}</span>
                      </div>
                      <div className="p-2 flex gap-1.5 flex-row-reverse text-right">
                        <span className="font-extrabold text-gray-850">الهوية :</span>
                        <span className="font-bold font-sans text-gray-900">{emp.nationalId || "—"}</span>
                      </div>
                      <div className="p-2 flex gap-1.5 flex-row-reverse text-right">
                        <span className="font-bold text-gray-850">رقم الجوال :</span>
                        <span className="font-bold font-sans text-gray-900">{emp.phone || "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Checkboxes selection: Leave classification type */}
                  <div className="grid grid-cols-2 p-2 border border-black rounded-sm bg-gray-50/50">
                    <div className="flex items-center gap-2 flex-row-reverse text-right justify-start">
                      <input type="checkbox" checked={true} readOnly className="w-4 h-4 accent-black" />
                      <span className="font-extrabold text-[#1e3a8a] text-[11px] md:text-xs">إجازة سنوية (مستحقة الراتب) ☑</span>
                    </div>
                    <div className="flex items-center gap-2 flex-row-reverse text-right justify-start">
                      <input type="checkbox" checked={false} readOnly className="w-4 h-4 accent-black" />
                      <span className="font-semibold text-gray-400 text-[11px] md:text-xs">إجازة بدون راتب ☐</span>
                    </div>
                  </div>

                  {/* Days & Calculations Section */}
                  <div className="border border-black p-3 rounded-sm space-y-3">
                    <table className="w-full text-right" dir="rtl">
                      <tbody>
                        <tr className="text-[11px] md:text-xs font-bold text-gray-850">
                          <td className="py-1">
                            <span className="font-extrabold text-gray-700">عدد الأيام المطلوبة:</span>
                            <span className="font-black text-[#1e3a8a] underline underline-offset-4 decoration-2 px-1 font-sans">{printFormDays} يوم</span>
                          </td>
                          <td className="py-1">
                            <span className="font-extrabold text-gray-700">من تاريخ:</span>
                            <span className="font-black text-gray-900 font-sans underline underline-offset-4 px-1">{printStartDate} م</span>
                          </td>
                          <td className="py-1">
                            <span className="font-extrabold text-gray-700">الى تاريخ:</span>
                            <span className="font-black text-gray-900 font-sans underline underline-offset-4 px-1">{printEndDate} م</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Legal Commitments Paragraph */}
                    <div className="bg-slate-50 p-2.5 rounded-sm border border-gray-200 text-[10px] md:text-[10.5px] space-y-1.5 leading-relaxed text-right text-gray-800 font-medium">
                      <p className="flex gap-1.5 flex-row-reverse text-right">
                        <span className="text-[#10b981] font-bold">•</span>
                        <span>أقر بأنني اطلعت على ما جاء أعلاه وأتعهد بالحضور بعد انتهاء الاجازة علما بأن عدم الحضور بعد الاجازة يحسب غياب ويطبق بحقي كامل الإجراءات النظامية.</span>
                      </p>
                      <p className="flex gap-1.5 flex-row-reverse text-right">
                        <span className="text-[#10b981] font-bold">•</span>
                        <span>كما نأمل تحويل قيمة راتب الاجازة المستحق على حسابي البنكي المعتمد لديكم ولكم الشكر والتقدير لإدارة السلامة بالشركة.</span>
                      </p>
                    </div>

                    {/* Signature block for employee */}
                    <div className="grid grid-cols-2 pt-2 border-t border-dashed border-gray-250 text-xs" dir="rtl">
                      <div className="flex items-center gap-1.5 flex-row-reverse">
                        <span className="font-bold text-gray-800">توقيع الموظف :</span>
                        <span className="inline-block w-40 border-b border-black border-dotted h-4" />
                      </div>
                      <div className="flex items-center gap-1.5 flex-row-reverse justify-end pr-4">
                        <span className="font-bold text-gray-800">بصمة الموظف :</span>
                        <div className="inline-block w-24 h-8 border border-gray-300 bg-white/25 rounded text-center text-[7px] text-gray-400 font-sans pt-1 select-none">
                          محل إبهام وبصمة الموظف
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Holidays column (دوام الاعياد إن وجد) */}
                  <div className="border border-black overflow-hidden rounded-sm text-xs mt-2">
                    <div className="bg-gray-100 p-1.5 border-b border-black font-black text-[10px] md:text-[11px] text-gray-900">
                      دوام الاعياد إن وجد:
                    </div>
                    <table className="w-full text-center text-[10px] md:text-[11px] border-collapse" dir="rtl">
                      <thead>
                        <tr className="bg-gray-50 border-b border-black text-gray-700 font-extrabold">
                          <th className="p-1.5 border-l border-black font-black w-1/5">السنة</th>
                          <th className="p-1.5 border-l border-black font-black w-1/5">عيد الفطر</th>
                          <th className="p-1.5 border-l border-black font-black w-1/5">عيد الأضحى</th>
                          <th className="p-1.5 border-l border-black font-black w-1/5">اليوم الوطني</th>
                          <th className="p-1.5 font-black w-1/5">يوم التأسيس</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="text-gray-900 font-bold">
                          <td className="p-1.5 border-l border-black font-sans">{printYear}</td>
                          <td className="p-1.5 border-l border-black text-center">
                            <span className="text-[11px] font-black">{printEidFitr ? "☑ نعم" : "☐ لا"}</span>
                          </td>
                          <td className="p-1.5 border-l border-black text-center">
                            <span className="text-[11px] font-black">{printEidAdha ? "☑ نعم" : "☐ لا"}</span>
                          </td>
                          <td className="p-1.5 border-l border-black text-center">
                            <span className="text-[11px] font-black">{printNationalDay ? "☑ نعم" : "☐ لا"}</span>
                          </td>
                          <td className="p-1.5 text-center">
                            <span className="text-[11px] font-black">{printFoundingDay ? "☑ نعم" : "☐ لا"}</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Notes & Authority Approval (ملاحظات وموافقة المرجع) */}
                  <div className="grid grid-cols-2 gap-3 mt-2 text-xs" dir="rtl">
                    <div className="border border-black p-2.5 rounded-sm flex flex-col justify-between min-h-[90px] text-right">
                      <span className="font-extrabold text-gray-900 border-b pb-1">ملاحظات :</span>
                      <p className="text-[10px] md:text-[11px] mt-1 text-slate-800 leading-relaxed font-semibold">
                        {printNotes || "مستند مستحقات الإجازة والبدلات الميدانية السنوية جاهز للمراجعة المالية."}
                      </p>
                    </div>

                    <div className="border border-black p-2.5 rounded-sm flex flex-col justify-between min-h-[90px] text-right space-y-1">
                      <div className="flex justify-between items-center border-b pb-1">
                        <div className="flex gap-2 text-[10px] md:text-[11px]">
                          <span className="font-black text-emerald-700">☑ نعم (موافق)</span>
                          <span className="font-semibold text-gray-300">☐ لا</span>
                        </div>
                        <span className="font-extrabold text-gray-900">موافقة المرجع:</span>
                      </div>
                      <div className="space-y-0.5 text-[10px] md:text-[11px] text-gray-800 leading-normal">
                        <div>
                          <span className="font-bold text-gray-650">مدير المشروع / المشرف العام :</span>
                          <span className="font-black text-gray-950 underline ml-1">م. تركي القحطاني</span>
                        </div>
                        <div className="flex justify-between font-sans text-[10px] pt-1">
                          <div>
                            <span className="font-bold">التوقيع:</span>
                            <span className="font-serif italic text-blue-900 ml-1">Turki...</span>
                          </div>
                          <div>
                            <span className="font-bold">التاريخ:</span>
                            <span className="font-sans font-black text-gray-900">{printStartDate} م</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Accreditation Table (الاعتماد الإداري) */}
                  <div className="border border-black rounded-sm overflow-hidden text-xs mt-2">
                    <div className="bg-gray-100 p-2 border-b border-black font-black text-[11px] md:text-[12px] text-gray-900">
                      • الاعتماد الإداري :
                    </div>
                    <table className="w-full text-right border-collapse text-[10px] md:text-[11px]" dir="rtl">
                      <thead>
                        <tr className="bg-gray-50 border-b border-black text-center font-bold text-gray-800">
                          <th className="p-1.5 border-l border-black font-black w-1/4 text-center">الجهة</th>
                          <th className="p-1.5 border-l border-black font-black w-2/5">الاسم والبيانات المعتمدة</th>
                          <th className="p-1.5 font-black w-1/3">التوقيع والمصادقة</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-900">
                        <tr className="border-b border-black">
                          <td className="p-1.5 border-l border-black font-extrabold text-gray-850 bg-gray-50/20 text-center">شؤون الموظفين بالمنطقة</td>
                          <td className="p-1.5 border-l border-black font-bold">الأستاذ / عبد الرحمن الحربي</td>
                          <td className="p-1.5 text-center text-[10px] text-gray-400 font-serif">مُعتمد إلكترونياً</td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className="p-1.5 border-l border-black font-extrabold text-gray-850 bg-gray-50/20 text-center">ملاحظات شؤون الموظفين</td>
                          <td className="p-1.5 font-semibold text-gray-600 leading-normal" colSpan={2}>
                            تم حصر رصيد الإجازة البالغ <span className="font-black text-blue-900 font-sans">{printFormDays} يوماً</span> وتدقيق آخر أجر أساسي تقاضاه الموظف وهو <span className="font-black text-blue-900 font-sans">{emp.leaveDuesSalary || 5000} ر.س</span>. وبناء عليه تم اعتماد صرف مستحقات الإجازة السنوية بموجب المادة 111 وتصفية الاستحقاق المالي.
                          </td>
                        </tr>
                        <tr>
                          <td className="p-1.5 border-l border-black font-extrabold text-[#111827] bg-gray-50/20 text-center">مدير شؤون الموظفين</td>
                          <td className="p-1.5 border-l border-black font-bold">الأستاذ / ماجد الخالدي</td>
                          <td className="p-1.5 text-center text-[10px] text-gray-400 font-serif">مُعتمد إلكترونياً</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Bottom official footer */}
              <div className="mt-6 pt-2 border-t border-gray-300 flex justify-between items-center text-[8px] md:text-[9px] text-gray-400 font-medium font-sans">
                <span>شركة الأمن والأمان للحراسات الأمنية © الموارد البشرية</span>
                <span>تاريخ التوليد: {new Date().toISOString().split("T")[0]} • النظام الذكي للشركة</span>
                <span>صفحة ١ من ١</span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
