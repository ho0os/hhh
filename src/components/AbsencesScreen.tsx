import React, { useState } from "react";
import { 
  ArrowRight, Search, ShieldAlert, Bell, UserX, Trash2, Phone, 
  Smile, CheckCircle2, RefreshCw, Plus, UserCheck, X, AlertOctagon, HelpCircle, Sparkles,
  TrendingUp, BarChart2, CalendarRange, Info, Sliders, LayoutGrid, ListFilter, AlertTriangle, Minus, Mail, FileSpreadsheet, ShieldAlert as AlertIcon
} from "lucide-react";
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar 
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { Employee, ViewState } from "../types";

interface AbsencesScreenProps {
  employees: Employee[];
  onUpdateEmployee: (updated: Employee, originalId: string) => void;
  onSelectEmployee: (id: string) => void;
  onScreenChange: (screen: ViewState) => void;
  onTriggerWhatsApp: (employee: Employee) => void;
}

export default function AbsencesScreen({
  employees,
  onUpdateEmployee,
  onSelectEmployee,
  onScreenChange,
  onTriggerWhatsApp
}: AbsencesScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("الكل");
  const [warnedEmployees, setWarnedEmployees] = useState<string[]>([]); // track warned emps in this session

  // States for interactive Drag-and-Drop View
  const [screenMode, setScreenMode] = useState<"standard" | "dragdrop">("standard");
  const [dragTab, setDragTab] = useState<"status" | "department">("status");
  const [draggedEmpId, setDraggedEmpId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null); // highlights currently hovered drop zones
  const [dragSearchQuery, setDragSearchQuery] = useState("");

  const handleStateTransitionByDrag = (empId: string, newStatus: "active" | "absent") => {
    const targetEmp = employees.find(emp => emp.id === empId);
    if (!targetEmp) return;
    if (targetEmp.status === newStatus) return;

    // Safety limit: if they are resigned or terminated, don't allow changing status via drag
    if (targetEmp.status === "resigned" || targetEmp.status === "terminated") {
      return;
    }

    const updated = {
      ...targetEmp,
      status: newStatus,
      auditLog: [
        ...(targetEmp.auditLog || []),
        {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          field: "status",
          fieldNameAr: "الحالة الوظيفية (سحب وإفلات)",
          oldValue: targetEmp.status,
          newValue: newStatus,
          timestamp: new Date().toISOString(),
          updatedBy: "مدير النظام (السحب لـ " + (newStatus === "active" ? "نشط" : "غياب") + ")"
        }
      ]
    };
    onUpdateEmployee(updated, targetEmp.id);
  };

  const handleDepartmentTransitionByDrag = (empId: string, newDept: string) => {
    const targetEmp = employees.find(emp => emp.id === empId);
    if (!targetEmp) return;
    if (targetEmp.department === newDept) return;

    const updated = {
      ...targetEmp,
      department: newDept,
      auditLog: [
        ...(targetEmp.auditLog || []),
        {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          field: "department",
          fieldNameAr: "القسم الإداري (سحب وإفلات)",
          oldValue: targetEmp.department || "غير محدد",
          newValue: newDept,
          timestamp: new Date().toISOString(),
          updatedBy: "مدير النظام (السحب للنقل اليدوي)"
        }
      ]
    };
    onUpdateEmployee(updated, targetEmp.id);
  };
  
  // State for registering a new absence
  const [showAddAbsence, setShowAddAbsence] = useState(false);
  const [newAbsenceEmpId, setNewAbsenceEmpId] = useState("");
  const [newAbsenceReason, setNewAbsenceReason] = useState("");

  // States for excuse Modal
  const [excusingEmp, setExcusingEmp] = useState<Employee | null>(null);
  const [excuseStatus, setExcuseStatus] = useState<"active" | "on_leave">("active");

  // Report Tab and Email Simulation States
  const [activeReportTab, setActiveReportTab] = useState<"monthly" | "annual">("monthly");
  const [emailSendingEmp, setEmailSendingEmp] = useState<Employee | null>(null);
  const [emailSendingStatus, setEmailSendingStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // Get absent employees
  const absentEmployees = employees.filter(emp => emp.status === "absent");

  // Lists and stats
  const totalEmployees = employees.length;
  const absentCount = absentEmployees.length;
  const activeCount = employees.filter(e => e.status === "active").length;
  const leaveCount = employees.filter(e => e.status === "on_leave").length;
  const attendancePercentage = totalEmployees > 0 
    ? Math.round(((totalEmployees - absentCount) / totalEmployees) * 100) 
    : 100;

  // Get unique departments
  const uniqueDepartments = ["الكل", ...Array.from(new Set(employees.map(emp => emp.department || "غير محدد").filter(Boolean)))];

  // Candidates for marking as absent (must not be currently absent, resigned, or terminated)
  const candidateEmployees = employees.filter(
    emp => emp.status !== "absent" && emp.status !== "resigned" && emp.status !== "terminated"
  );

  // Filter absent employees list based on search and department
  const filteredAbsents = absentEmployees.filter(emp => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || 
      emp.name.toLowerCase().includes(q) ||
      emp.id.toLowerCase().includes(q) ||
      emp.role.toLowerCase().includes(q);
    
    const matchesDept = selectedDept === "الكل" || emp.department === selectedDept;
    
    return matchesQuery && matchesDept;
  });

  // Action: Register new absence
  const handleRegisterAbsence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAbsenceEmpId) return;

    const targetEmp = employees.find(emp => emp.id === newAbsenceEmpId);
    if (targetEmp) {
      const updated = {
        ...targetEmp,
        status: "absent" as const,
        auditLog: [
          ...(targetEmp.auditLog || []),
          {
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            field: "status",
            fieldNameAr: "الحالة الوظيفية",
            oldValue: targetEmp.status,
            newValue: "absent",
            timestamp: new Date().toISOString(),
            updatedBy: "مدير النظام"
          }
        ]
      };
      onUpdateEmployee(updated, targetEmp.id);
      setNewAbsenceEmpId("");
      setNewAbsenceReason("");
      setShowAddAbsence(false);
    }
  };

  // Action: excuse / justify absence
  const handleExcuseAbsence = () => {
    if (!excusingEmp) return;
    
    const updated = {
      ...excusingEmp,
      status: excuseStatus,
      auditLog: [
        ...(excusingEmp.auditLog || []),
        {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          field: "status",
          fieldNameAr: "الحالة الوظيفية - تبرير غياب",
          oldValue: "absent",
          newValue: excuseStatus,
          timestamp: new Date().toISOString(),
          updatedBy: "مدير النظام (مبرر غياب)"
        }
      ]
    };
    onUpdateEmployee(updated, excusingEmp.id);
    setExcusingEmp(null);
  };

  // Action: send WhatsApp reminder warning
  const handleSendWhatsAppWarning = (emp: Employee) => {
    const defaultMsg = `السلام عليكم ورحمة الله وبركاته، الزميل العزيز ${emp.name}.\nنفيدكم بأنه تم رصد وتسجيل غيابكم وانقطاعكم غير المبرر عن العمل لهذا اليوم بدون إذن أو إجازة رسمية مسجلة سابقاً.\n\nيرجى التواصل فوراً مع إدارة شؤون الموظفين لتقديم التبرير وتفادي اتخاذ الإجراءات النظامية.\nودمتم بخير.`;
    const encoded = encodeURIComponent(defaultMsg);
    const cleanPhone = emp.phone.replace(/[\s+-]/g, "");
    
    // Mark as warned
    if (!warnedEmployees.includes(emp.id)) {
      setWarnedEmployees([...warnedEmployees, emp.id]);
    }
    
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, "_blank", "noopener,noreferrer");
  };

  // Helper to obtain accumulated absence count with visual logic fallback
  const getAccumulatedAbsences = (emp: Employee): number => {
    if (emp.accumulatedAbsences !== undefined) {
      return emp.accumulatedAbsences;
    }
    // Determinate fallbacks so that we represent realistic demo data
    if (emp.id === "EMP-4594") return 7; // high severity
    if (emp.name.includes("أحمد")) return 3;
    if (emp.name.includes("محمد")) return 5;
    return emp.status === "absent" ? 2 : 0;
  };

  // Adjust accumulated absence days reactively
  const adjustAccumulatedAbsences = (emp: Employee, change: number) => {
    const current = getAccumulatedAbsences(emp);
    const newVal = Math.max(0, current + change);
    const updated = {
      ...emp,
      accumulatedAbsences: newVal,
      auditLog: [
        ...(emp.auditLog || []),
        {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          field: "accumulatedAbsences",
          fieldNameAr: "الغياب المتراكم",
          oldValue: String(current),
          newValue: String(newVal),
          timestamp: new Date().toISOString(),
          updatedBy: "مدير النظام (تحديث يدوي)"
        }
      ]
    };
    onUpdateEmployee(updated, emp.id);
  };

  // Comparative annual absence rate by department (Avg. days per employee)
  const annualDeptData = [
    { name: "الأمن والسلامة", "العام السابق (٢٠٢٥)": 6.5, "العام الجاري (٢٠٢٦)": 5.4 },
    { name: "العمليات والتشغيل", "العام السابق (٢٠٢٥)": 7.1, "العام الجاري (٢٠٢٦)": 6.2 },
    { name: "الموارد البشرية", "العام السابق (٢٠٢٥)": 5.8, "العام الجاري (٢٠٢٦)": 4.9 },
    { name: "تقنية المعلومات", "العام السابق (٢٠٢٥)": 4.2, "العام الجاري (٢٠٢٦)": 3.5 },
  ];

  const handleInitiateEmailWarning = (emp: Employee) => {
    const days = getAccumulatedAbsences(emp);
    const subject = `إنذار بالفصل النهائي وتنبيه بانقطاع الخدمة - الكود الوظيفي ${emp.id}`;
    
    const body = `المكرم الزميل/ ${emp.name} المحترم،

نفيدكم بموجب هذا التنبيه الرسمي الصادر من إدارة الموارد البشرية والعمليات الفنية بقسم شؤون الموظفين، بأنه نظراً لتجاوز عدد أيام غيابكم وانقطاعكم المتراكم بدون عذر مشروع أو إجازة معتمدة لـ (${days}) أيام متتالية/متفرقة خلال العام الوظيفي الحالي، فإن هذا يعتبر خطوة نهائية ومكتملة للمساءلة القانونية بموجب المادة ٨٠ من نظام العمل السعودي.

يرجى المبادرة بتقديم الإفادة مبررة لغيابكم فوراً وقبل انقضاء المهلة الرسمية (٢٤ ساعة) لتلافي إنهاء الخدمات والربط الإلكتروني بوزارة الموارد البشرية والتنمية الاجتماعية.

وتفضلوا بقبول التقدير،
إدارة شؤون الموظفين والعمليات`;

    setEmailSubject(subject);
    setEmailBody(body);
    setEmailSendingEmp(emp);
    setEmailSendingStatus("idle");
  };

  const handleSendSimulatedEmail = () => {
    if (!emailSendingEmp) return;
    setEmailSendingStatus("sending");
    setTimeout(() => {
      setEmailSendingStatus("sent");
      
      // Update employee with email log in auditLog
      const days = getAccumulatedAbsences(emailSendingEmp);
      const updated = {
        ...emailSendingEmp,
        auditLog: [
          ...(emailSendingEmp.auditLog || []),
          {
            id: `log-email-${Date.now()}`,
            field: "email_warning",
            fieldNameAr: "إنذار نهائي بالإيميل",
            oldValue: "—",
            newValue: `تم إرسال تنبيه نهائي إلكتروني بتجاوز نظامي لغياب ${days} يوم`,
            timestamp: new Date().toISOString(),
            updatedBy: "مدير النظام (محاكاة إلكترونية)"
          }
        ]
      };
      onUpdateEmployee(updated, emailSendingEmp.id);
    }, 1500);
  };

  // Helper to resolve severity state details
  const getSeverityDetails = (days: number) => {
    if (days >= 6) {
      return {
        label: "خطورة حرجة جداً (إشعار بالفصل)",
        bgGradient: "from-rose-600 to-red-700",
        badgeBg: "bg-rose-100 text-rose-800 border-rose-200",
        ringColor: "ring-rose-500",
        severityLevel: "critical"
      };
    } else if (days >= 3) {
      return {
        label: "خطورة متوسطة (إنذار رسمي أول/ثانٍ)",
        bgGradient: "from-amber-600 to-orange-600",
        badgeBg: "bg-amber-100 text-amber-800 border-amber-200",
        ringColor: "ring-amber-500",
        severityLevel: "medium"
      };
    } else {
      return {
        label: "خطورة منخفضة (تنبيه شفهي مبدئي)",
        bgGradient: "from-[#0d9488] to-[#0f766e]", // teal-600 to teal-700
        badgeBg: "bg-teal-50 text-teal-800 border-teal-150",
        ringColor: "ring-teal-500",
        severityLevel: "low"
      };
    }
  };

  // Monthly absences metrics trend data for May 2026
  const monthlyTrendData = [
    { day: "05/01", count: 2, label: "١ مايو" },
    { day: "05/05", count: 3, label: "٥ مايو" },
    { day: "05/10", count: 1, label: "١٠ مايو" },
    { day: "05/15", count: 4, label: "١٥ مايو" },
    { day: "05/20", count: 2, label: "٢٠ مايو" },
    { day: "05/25", count: 5, label: "٢٥ مايو" },
    { day: "05/27", count: Math.max(1, absentCount), label: "٢٧ مايو (اليوم)" }
  ];

  return (
    <div className="pb-28 pt-6 px-4 bg-[#f8f9fa] min-h-screen text-[#191c1d] animate-fade-in text-right">
      
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6 flex-row-reverse border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2.5 flex-row-reverse">
          <div className="w-10 h-10 bg-rose-50 text-rose-700 rounded-xl flex items-center justify-center border border-rose-150 shadow-xs">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#1e3a8a]">إدارة الغيابات اليومية</h2>
            <p className="text-[10px] text-gray-400 font-bold font-sans mt-0.5">متابعة الحضور، تسوية الانقطاعات والإنذارات</p>
          </div>
        </div>
        
        <button
          type="button"
          onClick={() => onScreenChange("dashboard")}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 text-gray-600 shadow-xs transition-all active:scale-95 border border-gray-100"
          title="العودة للرئيسية"
        >
          <ArrowRight className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Metrics Dashboard Row */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm text-right space-y-1 relative overflow-hidden">
          <div className="absolute left-3 top-3 bg-rose-50 p-1.5 rounded-lg text-rose-600">
            <ShieldAlert className="w-4 h-4 animate-pulse" />
          </div>
          <span className="text-[10px] font-bold text-gray-400 block">منقطعون اليوم</span>
          <span className="text-xl font-black text-rose-700 font-sans block">{absentCount}</span>
          <p className="text-[9px] text-rose-600 font-bold leading-none">غياب بدون عذر مسبق</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-50 shadow-sm text-right space-y-1 relative overflow-hidden">
          <div className="absolute left-3 top-3 bg-blue-50 p-1.5 rounded-lg text-blue-600">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-gray-400 block">نسبة الالتزام الإجمالية</span>
          <span className="text-xl font-black text-[#1e3a8a] font-sans block">{attendancePercentage}%</span>
          <p className="text-[9px] text-[#1e3a8a] font-bold leading-none">معدل الانضباط والدوام</p>
        </div>
      </div>

      {/* Navigation Banner for the Spreadsheet excel view */}
      <div 
        onClick={() => onScreenChange("termination")}
        className="w-full bg-[#1e3a8a] hover:bg-slate-800 text-white rounded-2xl p-4.5 mb-6 shadow-xs border border-blue-800 relative cursor-pointer overflow-hidden flex items-center justify-between flex-row-reverse text-right transition-all transform hover:scale-[1.01] active:translate-y-0.5 group"
      >
        <div className="absolute top-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center gap-3 flex-row-reverse">
          <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-white backdrop-blur-xs group-hover:scale-110 transition-transform">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black">فتح دفتر السيطرة وجدول إنهاء الخدمات الرئيسي</h4>
            <p className="text-[9px] text-blue-100 font-medium mt-0.5">رصد غيابات الموظفين المتتالية وتحديث السجلات حسب المادة ٨٠</p>
          </div>
        </div>
        <div className="text-white font-bold text-[10px] bg-white/10 px-2 py-0.5 rounded border border-white/20">عرض الجدول ←</div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs text-right space-y-0.5">
          <span className="text-[9px] font-bold text-gray-400 block">الإشعارات المرسلة اليوم</span>
          <div className="flex items-baseline gap-1.5 flex-row-reverse">
            <span className="text-base font-black text-amber-600 font-sans">{warnedEmployees.length}</span>
            <span className="text-[9px] text-gray-400 font-medium">إنذار فعال</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs text-right space-y-0.5">
          <span className="text-[9px] font-bold text-gray-400 block">منسوبي الموارد البشرية</span>
          <div className="flex items-baseline gap-1.5 flex-row-reverse">
            <span className="text-base font-black text-gray-800 font-sans">{activeCount}</span>
            <span className="text-[9px] text-gray-400 font-medium">موجود على رأس العمل</span>
          </div>
        </div>
      </div>

      {/* Navigation Switcher: Standard vs Drag-and-Drop Control Board */}
      <div className="flex bg-gray-150 p-1.5 rounded-2xl border border-gray-200 mb-6 gap-1" dir="rtl">
        <button
          type="button"
          onClick={() => setScreenMode("standard")}
          className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
            screenMode === "standard"
              ? "bg-[#1e3a8a] text-white shadow-sm border border-blue-900"
              : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>التقارير وسجلات الحضور</span>
        </button>
        <button
          type="button"
          onClick={() => setScreenMode("dragdrop")}
          className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
            screenMode === "dragdrop"
              ? "bg-[#1e3a8a] text-white shadow-sm border border-blue-900"
              : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>غرفة السحب والإفلات التفاعلية</span>
        </button>
      </div>

      {screenMode === "standard" && (
        <>
          {/* Monthly & Annual Comparative Reports Section */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-right space-y-4 mb-6">
        <div className="flex flex-col gap-3">
          {/* Header & Badges */}
          <div className="flex items-center justify-between flex-row-reverse pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2 flex-row-reverse text-blue-900">
              <TrendingUp className="w-4 h-4 text-[#1e3a8a]" />
              <h3 className="text-xs font-black select-none">المؤشرات التحليليّة للغياب ومعدلات الالتزام</h3>
            </div>
            <span className="text-[8px] bg-red-50 text-rose-800 px-2 py-0.5 rounded-md font-extrabold border border-red-150 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
              تحديث فوري تلقائي
            </span>
          </div>

          {/* Tab buttons */}
          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200" dir="rtl">
            <button
              type="button"
              onClick={() => setActiveReportTab("monthly")}
              className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeReportTab === "monthly"
                  ? "bg-white text-[#1e3a8a] shadow-xs"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>التقرير الشهري (خطي)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveReportTab("annual")}
              className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeReportTab === "annual"
                  ? "bg-white text-[#1e3a8a] shadow-xs"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>الغياب السنوي للأقسام (أعمدة)</span>
            </button>
          </div>
        </div>

        {activeReportTab === "monthly" ? (
          <div className="space-y-4">
            <p className="text-[10px] text-gray-400 font-bold leading-relaxed">
              يوضح الرسم البياني التالي منحنى غياب منسوبي الأمن والخدمات المسجلين خلال الشهر الجاري لشهر مايو ٢٠٢٦ لتحديد الفترات والأيام الأكثر تسرباً للسيطرة عليها ومراقبتها.
            </p>

            {/* Recharts Line Chart with custom styles */}
            <div className="h-44 w-full select-none font-sans mt-2" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="absenceLineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    stroke="#94a3b8" 
                    fontSize={8} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={8} 
                    tickLine={false} 
                    axisLine={false} 
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      direction: "rtl", 
                      textAlign: "right",
                      fontSize: "10px", 
                      borderRadius: "12px", 
                      borderColor: "#f1f5f9",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                    }}
                    formatter={(value: any) => [`${value} حالات غياب`, "العدد الإجمالي"]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#ef4444" 
                    strokeWidth={2.5} 
                    activeDot={{ r: 6, fill: "#be123c" }}
                    dot={{ r: 3, fill: "#ef4444" }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-[#f8f9fa] p-3 rounded-xl border border-gray-150 text-center">
              <div className="space-y-0.5">
                <span className="text-[8px] font-bold text-gray-400 block">أعلى مستوى رُصد</span>
                <span className="text-xs font-black text-rose-700 font-sans">٥ غيابات / يوم</span>
              </div>
              <div className="space-y-0.5 border-r border-gray-200">
                <span className="text-[8px] font-bold text-gray-400 block">المتوسط العام</span>
                <span className="text-xs font-black text-amber-700 font-sans">٢.٧ يوم</span>
              </div>
              <div className="space-y-0.5 border-r border-gray-200">
                <span className="text-[8px] font-bold text-gray-400 block">أكواد الإنذارات</span>
                <span className="text-xs font-black text-blue-900 font-sans">سجل فعال</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[10px] text-gray-400 font-bold leading-relaxed">
              تحليل مقارن يوضح متوسط عدد أيام الغياب المتراكمة للأقسام الإدارية مقارنةً بالعام الماضي ٢٠٢٥، لتسهيل رصد الفترات وتحديد الأقسام الأكثر فاقداً للالتزام.
            </p>

            {/* Recharts Bar Chart with comparative styles */}
            <div className="h-44 w-full select-none font-sans mt-2 shadow-xs rounded-xl" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={annualDeptData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={7.5} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={8} 
                    tickLine={false} 
                    axisLine={false} 
                    allowDecimals={true}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      direction: "rtl", 
                      textAlign: "right",
                      fontSize: "10px", 
                      borderRadius: "12px", 
                      borderColor: "#f1f5f9",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                    }}
                  />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: "9px", paddingTop: "6px" }} />
                  <Bar dataKey="العام السابق (٢٠٢٥)" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="العام الجاري (٢٠٢٦)" fill="#0d9488" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-[#f8f9fa] p-3 rounded-xl border border-gray-150 text-center">
              <div className="space-y-0.5">
                <span className="text-[8px] font-bold text-gray-400 block">القسم الأكثر تحسناً</span>
                <span className="text-xs font-black text-teal-800">تقنية المعلومات (انخفاض ١٦٪)</span>
              </div>
              <div className="space-y-0.5 border-r border-gray-200">
                <span className="text-[8px] font-bold text-gray-400 block">مؤشر التحسن السنوي</span>
                <span className="text-xs font-black text-[#1e3a8a] font-sans">انخفاض متوسط بـ 1.1 يوم</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Register New Absence Button & Section */}
      <div className="mb-6">
        {!showAddAbsence ? (
          <button
            type="button"
            onClick={() => setShowAddAbsence(true)}
            className="w-full h-11 bg-[#1e3a8a] hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm border border-blue-900 active:scale-95"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>تسجيل حالة غياب فورية جديدة</span>
          </button>
        ) : (
          <form 
            onSubmit={handleRegisterAbsence} 
            className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm text-right space-y-3.5 animate-scaleUp"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 flex-row-reverse">
              <span className="text-xs font-black text-[#1e3a8a]">تسجيل غياب موظف</span>
              <button
                type="button"
                onClick={() => setShowAddAbsence(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-gray-500 block">اختر الموظف المنقطع</label>
              <select
                required
                value={newAbsenceEmpId}
                onChange={(e) => setNewAbsenceEmpId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl text-xs bg-gray-50 border border-gray-150 focus:border-[#1e3a8a] outline-none text-right font-sans font-bold text-gray-700"
              >
                <option value="">-- اختر من القائمة --</option>
                {candidateEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} (ID: #{emp.id} - {emp.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-gray-500 block">السبب المبدئي للغياب (اختياري)</label>
              <input
                type="text"
                placeholder="مثال: لم يحضر للوردية الصباحية ولم يرد على الاتصالات"
                value={newAbsenceReason}
                onChange={(e) => setNewAbsenceReason(e.target.value)}
                className="w-full h-11 px-3 rounded-xl text-xs bg-gray-50 border border-gray-150 focus:border-[#1e3a8a] outline-none text-right font-medium text-gray-700"
              />
            </div>

            <div className="flex gap-2.5 flex-row-reverse">
              <button
                type="submit"
                disabled={!newAbsenceEmpId}
                className="flex-1 h-10 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all"
              >
                تأكيد وبدء الغياب
              </button>
              <button
                type="button"
                onClick={() => setShowAddAbsence(false)}
                className="flex-1 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all"
              >
                إلغاء
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Main Filter Section */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3 mb-6">
        {/* Search input field */}
        <div className="relative">
          <input
            type="text"
            placeholder="البحث في قائمة المنقطعين..."
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

        {/* Department select filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-gray-400 block">تصفية حسب إدارة القسم</label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full h-10 px-3 rounded-lg text-xs bg-gray-50 border border-gray-150 focus:border-[#1e3a8a] outline-none text-right font-bold text-gray-650"
          >
            {uniqueDepartments.map((dept, index) => (
              <option key={index} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Absences List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-row-reverse pb-1">
          <h3 className="text-xs font-black text-gray-800">قائمة المنقطعين بدون عذر اليوم</h3>
          <span className="text-[10px] text-gray-400 font-bold font-sans">عدد النتائج: {filteredAbsents.length}</span>
        </div>

        {filteredAbsents.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-xs space-y-3 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600 border border-green-100 animate-bounce">
              <Smile className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-extrabold text-green-800">✓ لا توجد حالات غياب مسجلة مطابقة</h4>
              <p className="text-[10px] text-gray-400 font-bold leading-relaxed max-w-xs mx-auto">
                ممتاز! كافة الموظفين ملتزمون بحضور نوباتهم اليوم أو خيارات التصفية لا تطابق أي متخلفين.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Desktop Table-Like Headers Column (Hidden on mobile) */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 px-5 py-3 bg-gray-100 rounded-xl text-right text-[10px] font-black text-gray-500 flex-row-reverse border border-gray-150">
              <div className="col-span-3 text-right">الموظف والبيانات الأساسية</div>
              <div className="col-span-2 text-center">القسم الإداري</div>
              <div className="col-span-2 text-center">أيام الغياب المتراكمة</div>
              <div className="col-span-2 text-center">درجة خطورة الحالة</div>
              <div className="col-span-3 text-left pl-3">الإنذارات والعمليات الفورية</div>
            </div>

            <AnimatePresence mode="popLayout">
              {filteredAbsents.map((emp) => {
                const isWarned = warnedEmployees.includes(emp.id);
                const days = getAccumulatedAbsences(emp);
                const severity = getSeverityDetails(days);
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.2 } }}
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                    key={emp.id}
                    className="bg-white rounded-2xl border border-gray-150 hover:shadow-md transition-all duration-200 overflow-hidden relative"
                  >
                    {/* Colorful Severity Ribbon (Right Side Accent) */}
                    <div className={`absolute top-0 bottom-0 right-0 w-2.5 bg-gradient-to-b ${severity.bgGradient}`} />

                    {/* Flexible Responsive Grid Rows */}
                    <div className="p-4 pr-6 grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
                      
                      {/* Col 1: Photo and Details */}
                      <div className="md:col-span-3 text-right flex items-center gap-3 flex-row-reverse justify-end md:justify-start">
                        {emp.avatar ? (
                          <img
                            src={emp.avatar}
                            alt={emp.name}
                            referrerPolicy="no-referrer"
                            className="w-11 h-11 rounded-xl object-cover ring-2 ring-gray-100 shrink-0"
                          />
                        ) : (
                          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${severity.bgGradient} text-white font-black text-xs flex items-center justify-center shadow-sm select-none shrink-0`}>
                            {emp.name.substring(0, 2)}
                          </div>
                        )}
                        <div className="text-right">
                          <h4 className="text-xs font-black text-gray-800 flex items-center gap-1.5 flex-row-reverse justify-end md:justify-start">
                            <span>{emp.name}</span>
                            {emp.certified && (
                              <span className="w-3.5 h-3.5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100" title="موظف معتمد">
                                <Sparkles className="w-2 h-2 text-blue-600" />
                              </span>
                            )}
                          </h4>
                          <p className="text-[9px] text-gray-400 mt-0.5 font-bold">
                            {emp.role} • <span className="font-sans">ID: #{emp.id}</span>
                          </p>
                        </div>
                      </div>

                      {/* Col 2: Department */}
                      <div className="md:col-span-2 text-right md:text-center flex justify-between md:justify-center items-center flex-row-reverse md:flex-row border-t md:border-t-0 border-gray-100 pt-2.5 md:pt-0">
                        <span className="text-[9px] font-bold text-gray-400 md:hidden block">القسم الإداري</span>
                        <span className="text-[10px] text-gray-700 font-extrabold bg-blue-50/50 text-[#1e3a8a] px-2.5 py-1 rounded-lg border border-blue-100/30">
                          {emp.department || "الموارد البشرية"}
                        </span>
                      </div>

                      {/* Col 3: Accumulated Absence Days Column */}
                      <div className="md:col-span-2 text-right md:text-center flex justify-between md:justify-center items-center flex-row-reverse md:flex-row border-t md:border-t-0 border-gray-100 pt-2.5 md:pt-0">
                        <span className="text-[9px] font-bold text-gray-400 md:hidden block">أيام الغياب المتراكمة</span>
                        <div className="flex items-center gap-2 justify-center">
                          <button
                            type="button"
                            onClick={() => adjustAccumulatedAbsences(emp, 1)}
                            className="w-6 h-6 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg flex items-center justify-center font-black text-xs shadow-xs border border-rose-150 transition-all active:scale-90"
                            title="زيادة يوم غياب متراكم"
                          >
                            +
                          </button>
                          <div className="px-3 py-1 bg-gray-50 rounded-lg border border-gray-200 min-w-[50px] text-center">
                            <span className="font-sans font-black text-xs text-gray-800 unit-ar text-center">
                              {days} يوم
                            </span>
                          </div>
                          <button
                            type="button"
                            disabled={days <= 0}
                            onClick={() => adjustAccumulatedAbsences(emp, -1)}
                            className="w-6 h-6 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 text-gray-650 rounded-lg flex items-center justify-center font-black text-xs shadow-xs border border-gray-150 transition-all active:scale-90"
                            title="إنقاص يوم غياب متراكم"
                          >
                            -
                          </button>
                        </div>
                      </div>

                      {/* Col 4: Severity & Indicator */}
                      <div className="md:col-span-2 text-right md:text-center flex justify-between md:justify-center items-center flex-row-reverse md:flex-col border-t md:border-t-0 border-gray-100 pt-2.5 md:pt-0">
                        <span className="text-[9px] font-bold text-gray-400 md:hidden block">مستوى خطورة الانقطاع</span>
                        <div className="flex flex-col items-end md:items-center gap-1.5">
                          <span className={`text-[9px] font-black border rounded-md px-2 py-0.5 select-all text-center leading-tight ${severity.badgeBg}`}>
                            {severity.label}
                          </span>
                          {isWarned && (
                            <span className="text-[8px] font-bold text-amber-700 flex items-center gap-0.5 justify-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              تم إرسال تنبيه اليوم
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Col 5: Operations/Actions */}
                      <div className="md:col-span-3 text-left flex md:justify-end gap-1.5 pt-3 md:pt-0 border-t md:border-t-0 border-gray-150 flex-wrap justify-center">
                        {/* WhatsApp Alert Button */}
                        <button
                          type="button"
                          onClick={() => handleSendWhatsAppWarning(emp)}
                          className={`px-2.5 h-9 rounded-xl text-[10px] font-black text-white flex items-center justify-center gap-1 shadow-xs transition-all bg-gradient-to-r ${severity.bgGradient} hover:brightness-110 active:scale-95`}
                          title="إرسال رسالة إنذار رسمية سريعة بالكامل للمنقطع"
                        >
                          <Bell className="w-3.5 h-3.5 text-white" />
                          <span>تنبيه واتساب</span>
                        </button>

                        {/* Simulated Official Email Warning TriggerButton if days >= 7 */}
                        {days >= 7 && (
                          <button
                            type="button"
                            onClick={() => handleInitiateEmailWarning(emp)}
                            className="px-2.5 h-9 bg-rose-50 hover:bg-[#ffe4e6] border border-rose-200 text-rose-700 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 shadow-xs transition-all active:scale-95 hover:border-rose-300"
                            title="إرسال إيميل إنذار نهائي"
                          >
                            <Mail className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                            <span>إنذار نهائي</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setExcusingEmp(emp);
                            setExcuseStatus("active");
                          }}
                          className="px-2.5 h-9 bg-teal-50 hover:bg-teal-100 border border-teal-150 text-teal-800 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-colors active:scale-95"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-teal-700" />
                          <span>تسوية</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onSelectEmployee(emp.id);
                            onScreenChange("profile");
                          }}
                          className="px-2 h-9 bg-gray-50 hover:bg-gray-100 border border-gray-150 text-gray-700 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 active:scale-95"
                        >
                          <span>التفاصيل</span>
                        </button>
                      </div>

                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
      </>
      )}

      {/* TAB 2 / MODE 2: INTERACTIVE DRAG AND DROP WORKSPACE */}
      {screenMode === "dragdrop" && (
        <div className="space-y-6 animate-scaleUp text-right" dir="rtl">
          
          {/* Inner Navigation tabs: Attendance vs Departments */}
          <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <div className="flex items-center gap-1.5 flex-row-reverse text-right">
                <Sliders className="w-4 h-4 text-[#1e3a8a]" />
                <h3 className="text-xs font-black text-gray-850">غرفة التحكم والعمليات السريعة</h3>
              </div>
              <span className="text-[9px] bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full font-black font-sans border border-green-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                تزامن فوري تلقائي
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDragTab("status")}
                className={`py-3 px-2 text-[10.5px] font-black rounded-xl transition-all border text-center ${
                  dragTab === "status"
                    ? "bg-[#1e3a8a] border-[#13285c] text-white shadow-sm"
                    : "bg-gray-50 border-gray-200 text-gray-650 hover:bg-gray-100"
                }`}
              >
                تحديث الحضور اليومي السريع (حاضر ⇄ غائب)
              </button>
              <button
                type="button"
                onClick={() => setDragTab("department")}
                className={`py-3 px-2 text-[10.5px] font-black rounded-xl transition-all border text-center ${
                  dragTab === "department"
                    ? "bg-[#1e3a8a] border-[#13285c] text-white shadow-sm"
                    : "bg-gray-50 border-gray-200 text-gray-650 hover:bg-gray-100"
                }`}
              >
                نقل الموظفين وإعادة توزيع الأقسام
              </button>
            </div>

            {/* Educational advice line */}
            <div className="text-[10px] text-gray-500 font-bold bg-amber-50/40 p-3 rounded-xl border border-amber-100/70 flex items-start gap-2 flex-row-reverse">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed text-right md:text-right">
                {dragTab === "status" 
                  ? "قم بسحب بطاقة الموظف من عمود إلى آخر لتبديل حالته وتوثيق التغيير تلقائياً مع تحديث تقارير الالتزام ونقاط ومقاييس الأداء فوراً." 
                  : "ابدأ بالبحث عن الموظف في المخزن الأفقي أدناه، ثم اسحبه وأسقطه مباشرة داخل مربع القسم لتغيير انتمائه الإداري بلحظة."}
              </span>
            </div>
          </div>

          {/* TAB 1: ATTENDANCE (ACTIVE ⇄ ABSENT) */}
          {dragTab === "status" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Column 1: On duty / Active */}
              <div 
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverTarget("dropzone-status-active");
                }}
                onDragLeave={() => setDragOverTarget(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverTarget(null);
                  const empId = e.dataTransfer.getData("text/plain");
                  if (empId) handleStateTransitionByDrag(empId, "active");
                }}
                className={`rounded-2xl border-2 border-dashed p-5 transition-all duration-200 min-h-[450px] flex flex-col ${
                  dragOverTarget === "dropzone-status-active"
                    ? "border-green-500 bg-green-50/50 scale-[1.01] shadow-lg"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between border-b pb-3 mb-4 border-gray-150">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-black text-green-900">
                      القوى القائمة على رأس العمل ({employees.filter(e => e.status !== "absent").length})
                    </span>
                  </div>
                  <span className="text-[9px] bg-green-50 border border-green-250 text-green-800 px-2 py-0.5 rounded-md font-extrabold select-none">اسحب هنا لتأكيد الحضور</span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[500px] pl-1" dir="rtl">
                  {employees.filter(e => e.status !== "absent").length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-400 space-y-2.5 select-none border border-gray-150 bg-gray-50/45 rounded-2xl my-auto">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 text-gray-400">
                        <UserX className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-black text-gray-400">لا يوجد موظفون نشطون حالياً</span>
                    </div>
                  ) : (
                    employees.filter(e => e.status !== "absent").map(emp => {
                      const initials = emp.name.split(" ").slice(0, 2).map(n => n[0]).join("");
                      return (
                        <div
                          key={emp.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", emp.id);
                            setDraggedEmpId(emp.id);
                          }}
                          onDragEnd={() => {
                            setDraggedEmpId(null);
                          }}
                          className={`p-3.5 bg-white border rounded-xl cursor-grab active:cursor-grabbing transition-all flex items-center justify-between text-right ${
                            draggedEmpId === emp.id 
                              ? "opacity-40 border-dashed border-[#1e3a8a] bg-blue-50/20 shadow-inner scale-95" 
                              : "border-gray-200 hover:border-blue-400 hover:shadow-xs active:shadow-md"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {emp.avatar ? (
                              <img
                                src={emp.avatar}
                                alt={emp.name}
                                className="w-9 h-9 rounded-xl object-cover border border-gray-150 shadow-xs shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1e3a8a] text-[10px] font-extrabold flex items-center justify-center border border-gray-150 shrink-0 font-sans">
                                {initials}
                              </div>
                            )}
                            <div className="text-right">
                              <div className="text-xs font-black text-gray-800 leading-tight">{emp.name}</div>
                              <div className="text-[9px] text-gray-400 font-bold mt-0.5">
                                {emp.department || "الموارد البشرية"} • {emp.role}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-row-reverse">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-[9px] font-black font-sans text-gray-400">ID: #{emp.id}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Column 2: Absent today */}
              <div 
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverTarget("dropzone-status-absent");
                }}
                onDragLeave={() => setDragOverTarget(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverTarget(null);
                  const empId = e.dataTransfer.getData("text/plain");
                  if (empId) handleStateTransitionByDrag(empId, "absent");
                }}
                className={`rounded-2xl border-2 border-dashed p-5 transition-all duration-200 min-h-[450px] flex flex-col ${
                  dragOverTarget === "dropzone-status-absent"
                    ? "border-rose-500 bg-rose-50/50 scale-[1.01] shadow-lg"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between border-b pb-3 mb-4 border-gray-150">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-xs font-black text-rose-900">
                      قائمة المنقطعين الغائبين اليوم ({employees.filter(e => e.status === "absent").length})
                    </span>
                  </div>
                  <span className="text-[9px] bg-rose-50 border border-rose-200 text-rose-800 px-2 py-0.5 rounded-md font-extrabold select-none">اسحب هنا لتأكيد غياب</span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[500px] pl-1" dir="rtl">
                  {employees.filter(e => e.status === "absent").length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-405 space-y-3 select-none border border-gray-150 bg-gray-50/45 rounded-2xl my-auto">
                      <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center border border-green-150 text-green-600 animate-bounce">
                        <Smile className="w-6 h-6" />
                      </div>
                      <div className="space-y-1 text-center">
                        <span className="text-xs font-black text-green-850 block">انضباط رائع! لا توجد حالات غياب اليوم</span>
                        <p className="text-[9.5px] text-gray-400 max-w-[200px] mx-auto font-medium leading-relaxed">كافة طواقم العمل وكادر الحراسة والتشغيل والتقنية مسجلين قيد الحضور والعمل الحركي.</p>
                      </div>
                    </div>
                  ) : (
                    employees.filter(e => e.status === "absent").map(emp => {
                      const days = getAccumulatedAbsences(emp);
                      const severity = getSeverityDetails(days);
                      const initials = emp.name.split(" ").slice(0, 2).map(n => n[0]).join("");
                      return (
                        <div
                          key={emp.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", emp.id);
                            setDraggedEmpId(emp.id);
                          }}
                          onDragEnd={() => {
                            setDraggedEmpId(null);
                          }}
                          className={`p-3.5 bg-white border rounded-xl cursor-grab active:cursor-grabbing transition-all flex items-center justify-between text-right relative overflow-hidden ${
                            draggedEmpId === emp.id 
                              ? "opacity-40 border-dashed border-[#1e3a8a] bg-blue-50/20 shadow-inner scale-95" 
                              : "border-gray-200 hover:border-red-400 hover:shadow-xs active:shadow-md"
                          }`}
                        >
                          <div className={`absolute top-0 bottom-0 right-0 w-1.5 bg-gradient-to-b ${severity.bgGradient}`} />
                          <div className="flex items-center gap-2.5 pr-1.5 text-right">
                            {emp.avatar ? (
                              <img
                                src={emp.avatar}
                                alt={emp.name}
                                className="w-9 h-9 rounded-xl object-cover border border-gray-150 shadow-xs shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-850 text-[10px] font-extrabold flex items-center justify-center border border-rose-150 shrink-0 font-sans">
                                {initials}
                              </div>
                            )}
                            <div className="text-right">
                              <div className="text-xs font-black text-gray-805 leading-tight">{emp.name}</div>
                              <div className="text-[9px] text-[#ef4444] font-bold mt-0.5">
                                {emp.department || "غير محدد"} • {emp.role}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-left flex flex-col items-end justify-center">
                            <span className={`text-[8.5px] font-black border rounded px-1.5 py-0.5 leading-none ${severity.badgeBg}`}>
                              {days} أيام غياب
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: DEPARTMENTS TRANSFER */}
          {dragTab === "department" && (
            <div className="space-y-6">
              
              {/* Filter and Deck Search Tray */}
              <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#1e3a8a]">١. منصة الكادر الإداري العام (اسحب الموظف من هنا)</span>
                  <span className="text-[9px] text-gray-400 font-bold">اسحب الموظف من المخزن التفاعلي</span>
                </div>
                
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ابحث بالاسم، الكود، أو المسمى الوظيفي لنقله..."
                    value={dragSearchQuery}
                    onChange={(e) => setDragSearchQuery(e.target.value)}
                    className="w-full h-11 pr-11 pl-4 rounded-xl text-xs bg-gray-50 border border-gray-150 focus:border-[#1e3a8a] outline-none text-right transition-all font-sans font-medium"
                  />
                  <span className="absolute right-3.5 top-3 text-gray-400">
                    <Search className="w-5 h-5 text-gray-400" />
                  </span>
                </div>

                {/* Horizontal Deck tray */}
                <div className="flex gap-3 overflow-x-auto p-2 bg-gray-50 rounded-2xl border border-gray-200 min-h-[105px] max-h-[140px] items-center" dir="rtl">
                  {employees
                    .filter(emp => {
                      const q = dragSearchQuery.toLowerCase().trim();
                      return !q || emp.name.toLowerCase().includes(q) || emp.id.toLowerCase().includes(q) || emp.role.toLowerCase().includes(q);
                    })
                    .map(emp => {
                      const initials = emp.name.split(" ").slice(0, 2).map(n => n[0]).join("");
                      return (
                        <div
                          key={emp.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", emp.id);
                            setDraggedEmpId(emp.id);
                          }}
                          onDragEnd={() => {
                            setDraggedEmpId(null);
                          }}
                          className={`p-3 bg-white border rounded-xl min-w-[170px] max-w-[210px] cursor-grab active:cursor-grabbing transition-all flex items-center gap-2.5 shadow-xs select-none ${
                            draggedEmpId === emp.id
                              ? "opacity-35 border-dashed border-blue-400 scale-90"
                              : "border-gray-150 hover:border-blue-400 hover:shadow-sm"
                          }`}
                        >
                          {emp.avatar ? (
                            <img
                              src={emp.avatar}
                              alt={emp.name}
                              className="w-7 h-7 rounded-lg object-cover border border-gray-100 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1e3a8a] text-[8.5px] font-black flex items-center justify-center border border-gray-150 shrink-0 font-sans">
                              {initials}
                            </div>
                          )}
                          <div className="overflow-hidden text-right flex-1">
                            <div className="text-[10px] font-black text-gray-800 truncate leading-tight">{emp.name}</div>
                            <div className="text-[8px] text-gray-400 truncate mt-0.5 leading-none">{emp.role}</div>
                            <div className="text-[8px] font-black text-blue-900 bg-blue-50 text-center rounded px-1.5 mt-1 truncate inline-block">
                              {emp.department || "غير محدد"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  {employees.filter(emp => {
                    const q = dragSearchQuery.toLowerCase().trim();
                    return !q || emp.name.toLowerCase().includes(q) || emp.id.toLowerCase().includes(q) || emp.role.toLowerCase().includes(q);
                  }).length === 0 && (
                    <div className="text-xs text-gray-400 font-bold mx-auto">لا توجد منسوبين يطابقون تصفية البحث الحالية</div>
                  )}
                </div>
              </div>

              {/* Grid Target Dropzones (Departments cards) */}
              <div className="space-y-3">
                <div className="text-xs font-black text-gray-800">٢. كادر الأقسام الإدارية والوحدات (أسقط بطاقة الموظف داخل المربع المطلوب)</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {["الأمن والسلامة", "العمليات والتشغيل", "الموارد البشرية", "تقنية المعلومات"].map((dept) => {
                    const deptCount = employees.filter(e => e.department === dept).length;
                    const isOver = dragOverTarget === `dept-${dept}`;
                    return (
                      <div
                        key={dept}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverTarget(`dept-${dept}`);
                        }}
                        onDragLeave={() => setDragOverTarget(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverTarget(null);
                          const empId = e.dataTransfer.getData("text/plain");
                          if (empId) {
                            handleDepartmentTransitionByDrag(empId, dept);
                          }
                        }}
                        className={`p-5 rounded-2xl border-2 border-dashed transition-all duration-200 min-h-[220px] flex flex-col justify-between ${
                          isOver 
                            ? "border-emerald-500 bg-emerald-50/50 scale-[1.02] shadow-md" 
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        {/* Dept Head */}
                        <div>
                          <div className="flex items-center justify-between pb-3 border-b border-gray-150">
                            <span className="text-xs font-black text-gray-800 flex items-center gap-2">
                              <span>قسم {dept}</span>
                              <span className="text-[9px] font-black bg-blue-50 border border-blue-105 text-blue-900 px-2 py-0.5 rounded-full font-sans">
                                {deptCount} موظف
                              </span>
                            </span>
                            <span className="text-[8px] font-black text-gray-400">إسقاط وتعميد النقل هنا</span>
                          </div>

                          {/* Dept Current Mini Deck list of emps */}
                          <div className="flex flex-wrap gap-2 mt-4 max-h-[140px] overflow-y-auto pr-1">
                            {employees.filter(e => e.department === dept).length === 0 ? (
                              <div className="text-[9.5px] text-gray-400 font-bold p-3 text-center w-full bg-gray-50/40 rounded-xl border border-gray-150">هذا القسم لا يحتضن موظفين حالياً</div>
                            ) : (
                              employees.filter(e => e.department === dept).map(emp => (
                                <div 
                                  key={emp.id}
                                  draggable
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData("text/plain", emp.id);
                                    setDraggedEmpId(emp.id);
                                  }}
                                  onDragEnd={() => {
                                    setDraggedEmpId(null);
                                  }}
                                  className={`px-2.5 py-1.5 bg-gray-50 hover:bg-white hover:border-blue-400 border border-gray-200 rounded-lg text-[9px] font-black text-gray-750 flex items-center gap-1.5 cursor-grab shadow-xs transition-colors ${
                                    draggedEmpId === emp.id ? "opacity-35 scale-90" : ""
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${emp.status === "active" ? "bg-green-500" : emp.status === "absent" ? "bg-rose-500" : "bg-amber-500"}`} />
                                  <span>{emp.name.split(" ").slice(0, 2).join(" ")}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Interactive Dynamic Help footer indicator */}
                        {isOver && (
                          <div className="mt-3.5 text-[9px] text-emerald-800 font-black bg-emerald-100/50 p-2 border border-emerald-200 rounded-xl text-center select-none animate-pulse">
                            ✓ ممتاز! ارفع يدك عن زر الفأرة لحفظ التوزيع الإداري ونقل الموظف لقسم {dept}!
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* Justification settling Modal */}
      {excusingEmp && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-gray-100 p-5 text-right space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-gray-150 pb-3 flex-row-reverse">
              <h3 className="text-xs font-black text-teal-900">تسوية وتبرير غياب موظف</h3>
              <button
                type="button"
                onClick={() => setExcusingEmp(null)}
                className="text-gray-400 hover:text-gray-650"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
              يرجى تحديد الحالة الجديدة للموظف <span className="font-extrabold text-gray-800">{excusingEmp.name}</span> لتسوية غيابه وإثبات العذر المناسب له في سجلات الموارد البشرية.
            </p>

            <div className="space-y-3">
              <label className="text-[10px] font-extrabold text-gray-400 block">اختر الحالة الجديدة:</label>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setExcuseStatus("active")}
                  className={`h-11 rounded-xl border flex flex-col items-center justify-center text-xs font-extrabold transition-all ${
                    excuseStatus === "active"
                      ? "border-[#1e3a8a] bg-blue-50/50 text-[#1e3a8a] ring-1 ring-[#1e3a8a]"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-[10px]">مباشرة العمل</span>
                  <span className="text-[8px] font-medium text-gray-400 mt-0.5">تبديل لحالة نشط ومناوب</span>
                </button>

                <button
                  type="button"
                  onClick={() => setExcuseStatus("on_leave")}
                  className={`h-11 rounded-xl border flex flex-col items-center justify-center text-xs font-extrabold transition-all ${
                    excuseStatus === "on_leave"
                      ? "border-amber-600 bg-amber-50/50 text-amber-700 ring-1 ring-amber-600"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-[10px]">إجازة رسمية بعذر</span>
                  <span className="text-[8px] font-medium text-gray-400 mt-0.5">تسجيل إجازة مبررة</span>
                </button>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2 flex-row-reverse">
              <button
                type="button"
                onClick={handleExcuseAbsence}
                className="flex-1 h-10 bg-[#1e3a8a] hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-all"
              >
                تحديث وحفظ التسوية
              </button>
              <button
                type="button"
                onClick={() => setExcusingEmp(null)}
                className="flex-1 h-10 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-xl transition-all"
              >
                إلغاء التغيير
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Email Warning Modal */}
      {emailSendingEmp && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 p-5 text-right space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-gray-150 pb-3 flex-row-reverse">
              <div className="flex items-center gap-2 flex-row-reverse">
                <Mail className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs font-black text-rose-950">توجيه إنذار رسمي بالفصل النهائي عبر الإيميل</h3>
              </div>
              <button
                type="button"
                onClick={() => setEmailSendingEmp(null)}
                className="text-gray-400 hover:text-gray-650"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 text-[10px] text-amber-800 font-bold leading-relaxed flex items-start gap-2 flex-row-reverse">
              <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>محاكاة النظام:</strong> سيقوم النظام الآن بإرسال إيميل رسمي مباشر للموظف تماشياً مع اللائحة التنفيذية ونظام العمل السعودي لتسجيل تغيبه الذي تجاوز ٧ أيام متراكمة مع رصدها بالملف الوظيفي فورياً.
              </span>
            </div>

            <div className="space-y-3 font-sans">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-400 block text-right">مرسل إلى (البريد الرسمي):</span>
                <input
                  type="text"
                  readOnly
                  value={`${emailSendingEmp.id.toLowerCase()}@smartoperations.sa`}
                  className="w-full h-9 px-3 text-[11px] bg-gray-50 border border-gray-200 rounded-lg outline-none text-left"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-400 block text-right">عنوان الرسالة الإلكترونية:</span>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-white border border-gray-250 rounded-lg outline-none text-right font-bold text-gray-700 focus:border-[#1e3a8a]"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-400 block text-right">محتوى الإنذار والمستند القانوني:</span>
                <textarea
                  rows={8}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full p-3 text-[10px] bg-white border border-gray-250 rounded-lg outline-none text-right text-gray-650 leading-relaxed focus:border-[#1e3a8a]"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2 flex-row-reverse">
              {emailSendingStatus === "idle" && (
                <button
                  type="button"
                  onClick={handleSendSimulatedEmail}
                  className="flex-1 h-10 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Mail className="w-4 h-4 text-white" />
                  <span>إرسال الإنذار النهائي بالبريد</span>
                </button>
              )}

              {emailSendingStatus === "sending" && (
                <div className="flex-1 h-10 bg-gray-100 text-gray-500 text-xs font-black rounded-xl flex items-center justify-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  <span>جاري إرسال البريد الإلكتروني للموظف...</span>
                </div>
              )}

              {emailSendingStatus === "sent" && (
                <div className="flex-1 h-10 bg-green-600 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2">
                  <span>تم إرسال الإيميل وتسجيل الحدث في السجل بنجاح! ✓</span>
                </div>
              )}

              <button
                type="button"
                disabled={emailSendingStatus === "sending"}
                onClick={() => setEmailSendingEmp(null)}
                className="px-4 h-10 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-xl transition-all"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
