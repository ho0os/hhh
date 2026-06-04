import React, { useState, useEffect } from "react";
import { 
  ArrowRight, 
  Trash2, 
  UserPlus, 
  FileSpreadsheet, 
  UserX, 
  Check, 
  AlertCircle,
  Clock,
  Sparkles,
  HelpCircle,
  Filter,
  UserCheck
} from "lucide-react";
import { Employee, ViewState, AuditLogEntry } from "../types";

interface TrackedAbsence {
  employeeId: string;
  name: string;
  location: string;
  shift: string;
  highlightColor?: string; // row custom highlighting: "none" | "yellow" | "gold" | "orange"
  dailyStatuses: Record<string, string>; // date string key -> status value
  dateAdded: string;
}

interface TerminationScreenProps {
  employees: Employee[];
  onUpdateEmployee: (updatedEmp: Employee, originalId: string) => void;
  onScreenChange: (screen: ViewState) => void;
  triggerToast?: (msg: string, type?: "success" | "info") => void;
}

// 19 days sequence representing the spreadsheet mockup
const SHEET_DATES = [
  "15/5/2026",
  "14/5/2026",
  "13/5/2026",
  "12/5/2026",
  "11/5/2026",
  "10/5/2026",
  "9/5/2026",
  "8/5/2026",
  "7/5/2026",
  "6/5/2026",
  "5/5/2026",
  "4/5/2026",
  "3/5/2026",
  "2/5/2026",
  "1/5/2026",
  "30/4/2026",
  "29/4/2026",
  "28/4/2026",
  "27/4/2026"
];

// Presets for faster entry
const STATUS_OPTIONS = [
  { value: "", label: "فارغ" },
  { value: "غياب م 1", label: "غياب متصل 1", color: "bg-red-50 text-red-700 border-red-200" },
  { value: "غياب م 2", label: "غياب متصل 2", color: "bg-red-100 text-red-800 border-red-350" },
  { value: "غياب م 3", label: "غياب متصل 3", color: "bg-red-150 text-red-900 border-red-400" },
  { value: "غياب م 4", label: "غياب متصل 4", color: "bg-amber-100 text-amber-800 border-amber-300" },
  { value: "غياب م 5", label: "غياب متصل 5", color: "bg-amber-200 text-amber-900 border-amber-400" },
  { value: "غياب م 6", label: "غياب متصل 6", color: "bg-[#fdba74] text-orange-950" },
  { value: "غياب م 7", label: "غياب متصل 7", color: "bg-orange-200 text-orange-900" },
  { value: "غياب م 8", label: "غياب متصل 8", color: "bg-orange-300 text-orange-950" },
  { value: "غياب م 9", label: "غياب متصل 9", color: "bg-orange-400 text-white" },
  { value: "غياب م 10", label: "غياب متصل 10", color: "bg-[#f97316] text-white" },
  { value: "غياب م 11", label: "غياب متصل 11", color: "bg-[#6366f1] text-white" },
  { value: "غياب م 12", label: "غياب متصل 12", color: "bg-[#2563eb] text-white" },
  { value: "غياب م 13", label: "غياب متصل 13", color: "bg-[#1d4ed8] text-white" },
  { value: "غياب م 14", label: "غياب متصل 14", color: "bg-[#1e40af] text-white" },
  { value: "غياب م 15", label: "غياب متصل 15", color: "bg-[#1e3a8a] text-white font-bold" },
  { value: "اذن 1", label: "إذن رسمي 1", color: "bg-blue-50 text-blue-800 border-blue-200" },
  { value: "اذن 2", label: "إذن رسمي 2", color: "bg-blue-100 text-blue-900" },
  { value: "اذن 3", label: "إذن رسمي 3", color: "bg-blue-200 text-blue-950" },
  { value: "محضر غياب", label: "محضر غياب رسمي", color: "bg-gray-150 text-gray-800 border-gray-300" },
  { value: "انهاء خدمات", label: "إنهاء خدمات", color: "bg-red-600 text-white font-black animate-pulse" }
];

export default function TerminationScreen({
  employees,
  onUpdateEmployee,
  onScreenChange,
  triggerToast
}: TerminationScreenProps) {
  
  // Local active tracking state, sync to localStorage to make persistent
  const [trackedList, setTrackedList] = useState<TrackedAbsence[]>(() => {
    try {
      const saved = localStorage.getItem("ssco_absences_termination");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.error(err);
    }
    
    // Fallback beautiful initial mock records that match the requested spreadsheet image!
    return [
      {
        employeeId: "EMP-8024",
        name: "طلال طارق صالح الصبياني",
        location: "الضباب",
        shift: "1",
        highlightColor: "peach",
        dailyStatuses: {
          "15/5/2026": "انهاء خدمات",
          "14/5/2026": "غياب م 15",
          "13/5/2026": "غياب م 14",
          "12/5/2026": "غياب م 13",
          "11/5/2026": "غياب م 12"
        },
        dateAdded: new Date().toISOString()
      },
      {
        employeeId: "EMP-4594",
        name: "سامي احمد محمد نجمي",
        location: "اشبيليا",
        shift: "2",
        highlightColor: "orange",
        dailyStatuses: {
          "10/5/2026": "انهاء خدمات",
          "9/5/2026": "غياب م 15",
          "8/5/2026": "غياب م 14",
          "7/5/2026": "غياب م 13",
          "6/5/2026": "غياب م 12",
          "5/5/2026": "غياب م 10",
          "4/5/2026": "غياب م 8",
          "3/5/2026": "غياب م 7"
        },
        dateAdded: new Date().toISOString()
      },
      {
        employeeId: "EMP-2024-089",
        name: "عادل يحيى يحيى هزازي",
        location: "اللبن",
        shift: "2",
        highlightColor: "yellow",
        dailyStatuses: {
          "28/4/2026": "غياب م 3",
          "29/4/2026": "اذن 1",
          "30/4/2026": "اذن 2",
          "1/5/2026": "اذن 3",
          "2/5/2026": "غياب م 4",
          "3/5/2026": "غياب م 5",
          "4/5/2026": "انهاء خدمات"
        },
        dateAdded: new Date().toISOString()
      },
      {
        employeeId: "EMP-8021",
        name: "خالد سامي عواد مزين",
        location: "مساندة",
        shift: "1",
        highlightColor: "gold",
        dailyStatuses: {
          "27/4/2026": "غياب م 5",
          "28/4/2026": "غياب م 4",
          "29/4/2026": "اذن 3",
          "30/4/2026": "اذن 2",
          "1/5/2026": "اذن 1"
        },
        dateAdded: new Date().toISOString()
      }
    ];
  });

  // State for adding a new tracking entry
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [customName, setCustomName] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [customShift, setCustomShift] = useState("1");
  const [showAddForm, setShowAddForm] = useState(false);

  // Active click modal for individual cell selection
  const [activeCellEdit, setActiveCellEdit] = useState<{
    rowIdx: number;
    date: string;
    currentValue: string;
  } | null>(null);

  // Save to localStorage on changes
  useEffect(() => {
    localStorage.setItem("ssco_absences_termination", JSON.stringify(trackedList));
  }, [trackedList]);

  // Handle adding a candidate to the tracking list
  const handleAddTracked = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalId = selectedCandidateId;
    let finalName = "";
    let finalLocation = customLocation;
    
    if (finalId === "custom") {
      finalId = `NEW-ABS-${Date.now()}`;
      finalName = customName.trim();
    } else {
      const emp = employees.find(e => e.id === finalId);
      if (emp) {
        finalName = emp.name;
        if (!finalLocation) {
          finalLocation = emp.department || "العمليات";
        }
      }
    }

    if (!finalName) {
      alert("الرجاء تحديد موظف أو إدخال اسمه.");
      return;
    }

    // Verify duplication
    if (trackedList.some(item => item.employeeId === finalId)) {
      alert("هذا الموظف مدرج بالفعل في جدول المتابعة.");
      return;
    }

    const newTracked: TrackedAbsence = {
      employeeId: finalId,
      name: finalName,
      location: finalLocation || "الفرع الرئيسي",
      shift: customShift || "1",
      highlightColor: "none",
      dailyStatuses: {},
      dateAdded: new Date().toISOString()
    };

    setTrackedList(prev => [newTracked, ...prev]);
    setSelectedCandidateId("");
    setCustomName("");
    setCustomLocation("");
    setCustomShift("1");
    setShowAddForm(false);
    
    if (triggerToast) {
      triggerToast(`تمت إضافة الموظف "${finalName}" لجدول المتابعة والإنهاء بنجاح.`, "success");
    }
  };

  // Remove element from tracking lists
  const handleDeleteTracked = (idToDelete: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من إزالة الموظف "${name}" من جدول السيطرة والغياب المبرر؟`)) {
      setTrackedList(prev => prev.filter(item => item.employeeId !== idToDelete));
      if (triggerToast) {
        triggerToast("تمت إزالة الموظف من جدول السيطرة.", "info");
      }
    }
  };

  // Set row background highlighting color (like in the main spreadsheet)
  const handleSetHighlight = (rowIdx: number, color: string) => {
    setTrackedList(prev => prev.map((item, idx) => {
      if (idx === rowIdx) {
        return { ...item, highlightColor: color };
      }
      return item;
    }));
  };

  // Quick helper to fill cell statuses
  const handleUpdateCell = (rowIdx: number, date: string, val: string) => {
    setTrackedList(prev => prev.map((item, idx) => {
      if (idx === rowIdx) {
        const updatedStatuses = { ...item.dailyStatuses, [date]: val };
        return { ...item, dailyStatuses: updatedStatuses };
      }
      return item;
    }));
    setActiveCellEdit(null);
  };

  // Trigger main HR termination update for an employee when they hit the criteria
  const handleApplyTerminationToCore = (tracked: TrackedAbsence) => {
    // Look up employee in core DB
    const coreEmp = employees.find(e => e.id === tracked.employeeId);
    if (!coreEmp) {
      alert("هذا الموظف مسجل كعضو جديد/خارجي. لا يمكن تغيير حالته إلا إذا كان مسجلاً بالملفات الأساسية بقاعدة البيانات.");
      return;
    }

    if (coreEmp.status === "terminated") {
      alert("إن هذا الموظف معلن كإنهاء خدمات بالفعل في النظام الأساسي.");
      return;
    }

    if (window.confirm(`تأكيد الإجراء الرئيسي: هل ترغب في تحويل الموظف "${tracked.name}" رسمياً إلى حالة (إنهاء خدمات) في شؤون الموظفين وتوليد سجل تدقيق؟`)) {
      const updated: Employee = {
        ...coreEmp,
        status: "terminated"
      };
      
      onUpdateEmployee(updated, coreEmp.id);
      
      if (triggerToast) {
        triggerToast(`تم تحويل حالة ملف الموظف "${tracked.name}" بنجاح إلى (إنهاء خدمات) في النظام الإداري الموحد!`, "success");
      }
    }
  };

  // Retrieve style classes for daily cell text
  const getCellClassName = (val: string) => {
    if (!val) return "bg-white hover:bg-gray-50 text-gray-300";
    
    if (val.includes("انهاء خدمات")) {
      return "bg-slate-700 text-white font-extrabold text-[9px] border-slate-600";
    }
    if (val.includes("غياب م")) {
      const num = parseInt(val.replace(/\D/g, ""));
      if (num >= 11) {
        return "bg-blue-600 text-white font-bold text-[9px] border-blue-500";
      } else if (num >= 7) {
        return "bg-orange-200 text-orange-900 text-[9px] border-orange-350";
      } else if (num >= 4) {
        return "bg-amber-100 text-amber-800 text-[10px] border-amber-250";
      }
      return "bg-red-50 text-red-700 text-[10px] border-red-200";
    }
    if (val.includes("اذن")) {
      return "bg-[#e0f2fe] text-[#0369a1] text-[10px] border-[#bae6fd]";
    }
    if (val.includes("محضر غياب")) {
      return "bg-[#f1f5f9] text-[#475569] font-bold text-[9px] border-slate-250";
    }
    if (val.includes("لم يصدر رقم")) {
      return "bg-yellow-100 text-amber-800 text-[9.5px] border-amber-200";
    }
    if (val.includes("تحويل من")) {
      return "bg-purple-50 text-purple-700 text-[9px] border-purple-200";
    }
    return "bg-gray-100 text-gray-700";
  };

  // Row highlight style classes
  const getRowHighlightClass = (color?: string) => {
    switch (color) {
      case "yellow":
        return "bg-yellow-100/70 border-r-4 border-r-yellow-500";
      case "gold":
        return "bg-amber-100/60 border-r-4 border-r-amber-500";
      case "orange":
        return "bg-orange-500/10 border-r-4 border-r-orange-500";
      case "peach":
        return "bg-rose-500/10 border-r-4 border-r-rose-400";
      default:
        return "hover:bg-gray-50/50";
    }
  };

  return (
    <div className="pb-28 pt-4 px-4 bg-[#f8f9fa] min-h-screen text-right font-sans" dir="rtl">
      
      {/* HEADER SECTION */}
      <header className="flex flex-row justify-between items-center h-20 w-full mb-6 border-b border-gray-150 pb-4">
        <div className="flex gap-2.5">
          <button 
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1e3a8a] transition-all border border-blue-200 active:scale-95 shadow-2xs"
            title="إضافة موظف للمتابعة"
          >
            <UserPlus className="w-5 h-5" />
          </button>
          
          <button
            type="button"
            onClick={() => onScreenChange("dashboard")}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all border border-gray-250/20 active:scale-95 shadow-2xs"
            title="رجوع للوحة التحكم"
            id="back_btn_termination"
          >
            <ArrowRight className="w-5 h-5 text-gray-750" />
          </button>
        </div>

        <div className="flex items-center gap-2.5 flex-row-reverse text-right">
          <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-700 border border-rose-250/30">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-[#1e3a8a] tracking-tight">متابعة غيابات وإنهاء الخدمات</h1>
            <p className="text-[10px] text-gray-400 font-bold mt-0.5">سجل الموظفين المنقطعين والمخالفين - جدول السيطرة</p>
          </div>
        </div>
      </header>

      {/* QUICK INSTRUCTION ALERT */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-xs text-amber-900 leading-relaxed font-semibold flex items-start gap-2.5 flex-row-reverse text-right">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-extrabold block text-amber-950 mb-0.5">تعليمات جدول إنهاء الخدمات:</span>
          أنشئ أو اختر موظفًا، ثم حدد خانات الأيام بالجدول لإثبات تسلسل أيام الغياب المتصل <span className="text-red-650">(غياب م ١، غياب م ٢، ...)</span> أو التراخيص الرسمية والمحاضر. بمجرد ثبوت المخالفة، انقر على <span className="bg-slate-700 text-white px-1.5 py-0.5 rounded text-[10px]">تضمين إنهاء خدمات</span> بالأسفل ليتم فصله رسميًا بالنظام.
        </div>
      </div>

      {/* ADD TRACKED CANDIDATE FORM (Collapsible) */}
      {showAddForm && (
        <form onSubmit={handleAddTracked} className="bg-white border text-right border-gray-150 rounded-2xl p-5 mb-6 shadow-xs space-y-4">
          <h3 className="text-xs font-black text-[#1e3a8a] flex items-center gap-1.5 flex-row-reverse border-b pb-2.5">
            <UserPlus className="w-4.5 h-4.5" />
            <span>تسجيل موظف مخالف في قائمة إنهاء الخدمات</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Candidate Selector */}
            <div className="space-y-1.5 text-right">
              <label className="block text-[10.5px] font-extrabold text-[#191c1d]">اختر الموظف السجل بالملفات</label>
              <select
                value={selectedCandidateId}
                onChange={(e) => {
                  setSelectedCandidateId(e.target.value);
                  if (e.target.value !== "custom") {
                    const found = employees.find(emp => emp.id === e.target.value);
                    if (found) {
                      setCustomLocation(found.department || "");
                    }
                  }
                }}
                className="w-full text-xs font-bold h-10 px-3 bg-[#f8f9fa] border border-gray-200 rounded-xl focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] text-right"
              >
                <option value="">-- حدد من الموظفين المسجلين --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.department} - {emp.id})
                  </option>
                ))}
                <option value="custom">+ إدخال موظف جديد يدويًا</option>
              </select>
            </div>

            {/* Custom Manual entry if user wants to add outside employee */}
            {selectedCandidateId === "custom" && (
              <div className="space-y-1.5 text-right">
                <label className="block text-[10.5px] font-extrabold text-[#191c1d]">اسم الموظف الجديد</label>
                <input
                  type="text"
                  placeholder="مثال: طارق عبدالرحيم الشمراني"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full text-xs font-bold h-10 px-3 bg-[#f8f9fa] border border-gray-200 rounded-xl focus:border-blue-500 text-right"
                />
              </div>
            )}

            {/* Location input */}
            <div className="space-y-1.5 text-right">
              <label className="block text-[10.5px] font-extrabold text-[#191c1d]">موقع العمل / الفرع</label>
              <input
                type="text"
                placeholder="مثال: الضباب / اشبيليا / الريان"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                className="w-full text-xs font-bold h-10 px-3 bg-[#f8f9fa] border border-gray-200 rounded-xl focus:border-blue-500 text-right"
              />
            </div>

            {/* Shift input */}
            <div className="space-y-1.5 text-right">
              <label className="block text-[10.5px] font-extrabold text-[#191c1d]">الوردية</label>
              <select
                value={customShift}
                onChange={(e) => setCustomShift(e.target.value)}
                className="w-full text-xs font-bold h-10 px-3 bg-[#f8f9fa] border border-gray-200 rounded-xl focus:border-[#1e3a8a] text-right"
              >
                <option value="1">وردية 1</option>
                <option value="2">وردية 2</option>
                <option value="3">وردية 3</option>
              </select>
            </div>

          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="submit"
              className="px-5 h-10 bg-[#1e3a8a] hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              إضافة للقائمة الميدانية
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      {/* DETAILED SPREADSHEET REPRESENTATION */}
      <div className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Table Controls (Search/Actions Header) */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-3 bg-gray-50/50">
          <div className="flex items-center gap-2 flex-row-reverse">
            <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
            <span className="text-[11px] font-bold text-gray-700">تحديث فوري • نظام مراقبة الغياب والفرز</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>تنسيق مطابق تماماً لدفتر السيطرة الإكسل لشركة SSCO</span>
          </div>
        </div>

        {/* Outer scroll wrapper for excel grid */}
        <div className="overflow-x-auto text-right w-full custom-scrollbar" style={{ direction: "rtl" }}>
          
          <table className="w-full border-collapse min-w-[1200px]" style={{ direction: "rtl" }}>
            
            {/* Header Dates row */}
            <thead>
              {/* Row 1: Group columns header */}
              <tr className="bg-[#e2e8f0] text-gray-800 text-[10.5px] border-b border-gray-300">
                <th className="px-3 py-2 border-l border-gray-300 font-black text-center bg-gray-250 sticky right-0 z-10 w-[200px]" style={{ background: "#e2e8f0" }}>اسم الموظف</th>
                <th className="px-2 py-2 border-l border-gray-300 font-black text-center text-gray-800 bg-[#e2e8f0] font-sans text-xs w-[110px]">الرقم الوظيفي</th>
                <th className="px-2 py-2 border-l border-gray-300 font-black text-center w-[120px]">الموقع</th>
                <th className="px-1 py-2 border-l border-gray-300 font-black text-center w-[70px]">الوردية</th>
                
                {SHEET_DATES.map((date, idx) => {
                  // Replicate some color accents of the dates as seen in the users Excel screenshot!
                  // 13/5 reaches deep red, 3/5 is green, 27/4 is yellow, others lighter yellow
                  let thColor = "bg-[#fef08a]"; // default yellow header for spreadsheet style
                  let textColor = "text-gray-950";
                  
                  if (date.startsWith("13/5")) {
                    thColor = "bg-red-700";
                    textColor = "text-white";
                  } else if (date.startsWith("3/5")) {
                    thColor = "bg-green-600";
                    textColor = "text-white";
                  } else if (date.startsWith("27/4")) {
                    thColor = "bg-yellow-400";
                    textColor = "text-gray-950 font-black";
                  }
                  
                  return (
                    <th 
                      key={date} 
                      className={`px-1 py-2 border-l border-gray-300 text-center font-bold font-mono text-[10px] ${thColor} ${textColor} min-w-[64px]`}
                    >
                      {date}
                    </th>
                  );
                })}
                <th className="px-2 py-2 font-black text-center text-gray-800 z-10 w-[140px]">إجراءات السيطرة</th>
              </tr>
            </thead>

            {/* Bodies list */}
            <tbody>
              {trackedList.length === 0 ? (
                <tr>
                  <td colSpan={SHEET_DATES.length + 5} className="text-center py-12 text-xs font-bold text-gray-400">
                    لا يوجد أي موظفين مدرجين تحت بند المراقبة لإنهاء الخدمات حالياً. انقر على زر الإضافة لتضمين الكوادر المخالفة.
                  </td>
                </tr>
              ) : (
                trackedList.map((tracked, rowIdx) => (
                  <tr 
                    key={tracked.employeeId} 
                    className={`border-b border-gray-250 text-right transition-colors ${getRowHighlightClass(tracked.highlightColor)}`}
                  >
                    
                    {/* Name column - sticky at right of spreadsheet */}
                    <td className="px-3 py-2.5 border-l border-gray-300 font-bold text-xs sticky right-0 z-10 text-right flex items-center justify-between gap-2" style={{ backgroundColor: "#ffffff" }}>
                      <div className="truncate flex-1 font-black text-gray-900">{tracked.name}</div>
                      
                      {/* Highlight color picker */}
                      <div className="flex gap-1">
                        <button 
                          type="button"
                          onClick={() => handleSetHighlight(rowIdx, "yellow")}
                          className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-yellow-500 active:scale-125"
                          title="تمييز بالأصفر"
                        />
                        <button 
                          type="button"
                          onClick={() => handleSetHighlight(rowIdx, "orange")}
                          className="w-2.5 h-2.5 rounded-full bg-orange-400 border border-orange-500 active:scale-125"
                          title="تمييز بالبرتقالي"
                        />
                        <button 
                          type="button"
                          onClick={() => handleSetHighlight(rowIdx, "peach")}
                          className="w-2.5 h-2.5 rounded-full bg-rose-400 border border-rose-500 active:scale-125"
                          title="تمييز بالوردي"
                        />
                        <button 
                          type="button"
                          onClick={() => handleSetHighlight(rowIdx, "none")}
                          className="w-2.5 h-2.5 rounded-full bg-gray-200 border border-gray-400 active:scale-125"
                          title="إزالة التمييز"
                        />
                      </div>
                    </td>

                    {/* Employee ID column */}
                    <td className="px-2 py-2.5 border-l border-gray-300 text-center font-bold font-mono text-xs text-[#1e3a8a] truncate bg-slate-50">
                      {tracked.employeeId}
                    </td>

                    {/* Location column */}
                    <td className="px-2 py-2.5 border-l border-gray-300 text-center font-bold text-xs text-gray-700 truncate">
                      {tracked.location}
                    </td>

                    {/* Shift column */}
                    <td className="px-1 py-2.5 border-l border-gray-300 text-center font-black font-sans text-xs text-gray-800">
                      {tracked.shift}
                    </td>

                    {/* Interactive Spreadsheet cells dates columns */}
                    {SHEET_DATES.map((date) => {
                      const val = tracked.dailyStatuses[date] || "";
                      return (
                        <td 
                          key={date}
                          onClick={() => setActiveCellEdit({ rowIdx, date, currentValue: val })}
                          className={`px-1 py-1.5 border-l border-gray-300 text-center cursor-pointer font-bold text-[10px] select-none text-gray-950 font-sans border-b transition-all duration-100 ${getCellClassName(val)}`}
                        >
                          <div className="truncate max-w-[70px] mx-auto min-h-[16px] flex items-center justify-center">
                            {val || ""}
                          </div>
                        </td>
                      );
                    })}

                    {/* Action columns to apply HR end-of-service */}
                    <td className="px-2 py-2 text-center flex items-center justify-center gap-1.5">
                      
                      <button
                        type="button"
                        onClick={() => handleApplyTerminationToCore(tracked)}
                        className="px-2 py-1 bg-slate-700 hover:bg-slate-800 text-white font-black text-[10px] rounded-md shadow-xs active:scale-95 transition-transform flex items-center gap-1 cursor-pointer"
                        title="تحويل لإنهاء خدمات معتمد بقاعدة البيانات"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>إنهاء رسمي</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteTracked(tracked.employeeId, tracked.name)}
                        className="p-1 text-red-650 hover:bg-red-50 hover:text-red-700 rounded-lg active:scale-90 transition-colors"
                        title="إزالة المتابعة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                    </td>

                  </tr>
                ))
              )}
            </tbody>

          </table>

        </div>

        {/* Footer info counts info */}
        <div className="p-3 bg-gray-50 border-t border-gray-150 flex justify-between items-center text-xs text-gray-500 font-bold" style={{ direction: "rtl" }}>
          <div>
            <span>إجمالي الموظفين تحت المراقبة: </span>
            <span className="text-[#1e3a8a] font-black">{trackedList.length} موظفين</span>
          </div>

          <div className="flex gap-4">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-slate-700 rounded-sm inline-block" /> إنهاء خدمات</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-blue-600 rounded-sm inline-block" /> غياب طويل (١١+)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#fcf] rounded-sm inline-block animate-pulse" /> إذن إداري</span>
          </div>
        </div>

      </div>

      {/* RECORD OF CURRENTLY TERMINATED EMPLOYEES */}
      <div className="mt-8 bg-white border border-red-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-red-100 flex justify-between items-center bg-rose-50/40 flex-row-reverse text-right">
          <div className="flex items-center gap-2 flex-row-reverse">
            <div className="w-2.5 h-2.5 rounded-full bg-red-650 animate-pulse" />
            <h3 className="text-xs font-black text-rose-900">سجل الكوادر المعتمد إنهاء خدماتهم رسمياً بالنظام (من تم إنهاء خدماته)</h3>
          </div>
          <span className="text-[10px] bg-red-100 text-red-850 font-black px-2.5 py-0.5 rounded-md border border-red-200">
            {employees.filter(emp => emp.status === "terminated").length} موظف مفصل
          </span>
        </div>

        <div className="overflow-x-auto text-right w-full custom-scrollbar" style={{ direction: "rtl" }}>
          <table className="w-full border-collapse" style={{ direction: "rtl" }}>
            <thead>
              <tr className="bg-gray-50 text-gray-800 text-[10.5px] border-b border-gray-150 text-right">
                <th className="px-4 py-3 font-black text-right">اسم الموظف</th>
                <th className="px-4 py-3 font-black text-center">الرقم الوظيفي</th>
                <th className="px-4 py-3 font-black text-center">رقم الهوية / الإقامة</th>
                <th className="px-4 py-3 font-black text-center">الفرع / الموقع</th>
                <th className="px-4 py-3 font-black text-center">المسمى الوظيفي</th>
                <th className="px-4 py-3 font-black text-center">رقم الجوال</th>
                <th className="px-4 py-3 font-black text-center">إجراءات السيطرة</th>
              </tr>
            </thead>
            <tbody>
              {employees.filter(emp => emp.status === "terminated").length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-xs font-bold text-gray-400">
                    لا يوجد حالياً أي موظفين مدرجين تحت حالة (إنهاء خدمات) بالملفات الإدارية الأساسية بقاعدة البيانات.
                  </td>
                </tr>
              ) : (
                employees
                  .filter(emp => emp.status === "terminated")
                  .map((emp) => (
                    <tr key={emp.id} className="border-b border-gray-100 hover:bg-rose-50/20 text-xs text-gray-800">
                      <td className="px-4 py-3 font-black text-gray-900 text-right">{emp.name}</td>
                      <td className="px-4 py-3 font-mono font-bold text-center text-[#1e3a8a]">{emp.id}</td>
                      <td className="px-4 py-3 font-mono text-center text-gray-500">{emp.nationalId || "---"}</td>
                      <td className="px-4 py-3 text-center text-gray-650">{emp.department || "العمليات"}</td>
                      <td className="px-4 py-3 text-center text-gray-650">{emp.role || "حارس أمن مخلص"}</td>
                      <td className="px-4 py-3 font-mono text-center text-gray-600">{emp.phone || "---"}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`تأكيد الاسترداد المالي والعملي: هل ترغب في تراجع فصل وإعادة تفعيل الموظف "${emp.name}" في كشوف العمل الميداني؟`)) {
                              onUpdateEmployee(
                                {
                                  ...emp,
                                  status: "active"
                                },
                                emp.id
                              );
                              if (triggerToast) {
                                triggerToast(`تمت إعادة الموظف "${emp.name}" لحالة (على رأس العمل) بنجاح.`, "success");
                              }
                            }
                          }}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] rounded-lg active:scale-95 transition-transform cursor-pointer shadow-sm"
                        >
                          إلغاء الفصل وإعادة تفعيل
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CELL EDIT DRAWER POPUP INLINE EDIT */}
      {activeCellEdit && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 text-right space-y-4 shadow-2xl border border-gray-200">
            
            <div className="border-b border-gray-100 pb-2.5 flex justify-between items-center">
              <button 
                type="button" 
                onClick={() => setActiveCellEdit(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ×
              </button>
              <h4 className="text-xs font-black text-[#1e3a8a]">
                تعديل حالة الخلية للتاريخ: <span className="font-mono text-red-650">{activeCellEdit.date}</span>
              </h4>
            </div>

            <p className="text-[11px] text-gray-400 font-bold">
              اختر القيمة المناسبة من خيارات السيطرة والغياب المعتمدة لإدراجها في ورقة الإكسل:
            </p>

            {/* Selection Grid for options */}
            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar p-1 text-right" style={{ direction: "rtl" }}>
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleUpdateCell(activeCellEdit.rowIdx, activeCellEdit.date, opt.value)}
                  className={`px-2 py-2 rounded-xl text-[10px] font-bold border text-right transition-all duration-100 flex items-center justify-between flex-row-reverse ${
                    activeCellEdit.currentValue === opt.value
                      ? "border-[#1e3a8a] bg-blue-50 text-[#1e3a8a]"
                      : "border-gray-150 bg-gray-50 text-gray-705 hover:bg-gray-100"
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full inline-block ${opt.color ? opt.color.split(" ")[0] : "bg-gray-300"}`} />
                  <span className="truncate">{opt.label || "(فارغ)"}</span>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-gray-100 flex justify-end gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => handleUpdateCell(activeCellEdit.rowIdx, activeCellEdit.date, "")}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors cursor-pointer"
              >
                مسح الخلية
              </button>
              <button
                type="button"
                onClick={() => setActiveCellEdit(null)}
                className="px-4 py-2 bg-[#1e3a8a] text-white rounded-xl hover:bg-blue-800 transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* GENERAL HIGHLIGHT INFORMATION ACCORDION FOR EXCEL LAYOUT */}
      <footer className="mt-8 bg-white border border-gray-150 rounded-2xl p-5 space-y-3 shadow-2xs">
        <h4 className="text-xs font-black text-[#1e3a8a] flex items-center gap-1 flex-row-reverse">
          <Sparkles className="w-4 h-4" />
          <span>القاعدة القانونية لإجراء إنهاء الخدمات:</span>
        </h4>
        
        <p className="text-[11px] text-gray-550 leading-relaxed font-bold">
          بموجب المادة (٨٠) من قانون الموارد البشرية والعمل السعودي، يحق لشركة الأمن والأمان (SSCO) إنهاء خدمات الموظف بدون مكافأة أو إشعار مسبق في حال غيابه المستمر لأكثر من <span className="text-red-600 font-black">١٥ يومًا متصلاً</span> أو <span className="text-red-650 font-black">٣٠ يومًا متفرقة</span> خلال السنة العقدية الواحدة، بشرط توجيه إنذار كتابي بعد ١٠ أيام غياب متصل. يساعدكم هذا الجدول في رصد التتابع المباشر وحساب المدد بدقة متناهية.
        </p>
      </footer>

    </div>
  );
}
