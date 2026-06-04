import React, { useState } from "react";
import { 
  Users, 
  Calendar, 
  ShieldAlert, 
  CreditCard, 
  Building, 
  Upload, 
  UserPlus, 
  X, 
  Info,
  MapPin,
  CheckCircle,
  Briefcase,
  Layers,
  Sparkles,
  Server,
  UserX
} from "lucide-react";
import { Employee, ViewState } from "../types";
import * as XLSX from "xlsx";
// @ts-ignore
import sscoLogo from "../assets/images/ssco_logo_1779881766509.png";

interface DashboardScreenProps {
  employees: Employee[];
  onSelectEmployee: (id: string) => void;
  onScreenChange: (screen: ViewState) => void;
  onTriggerWhatsApp: (employee: Employee) => void;
  onImportExcel: (imported: Employee[]) => void;
  isVacationsExpanded: boolean;
  setIsVacationsExpanded: (isExpanded: boolean) => void;
  isAbsencesExpanded: boolean;
  setIsAbsencesExpanded: (isExpanded: boolean) => void;
}

export default function DashboardScreen({
  employees,
  onSelectEmployee,
  onScreenChange,
  onTriggerWhatsApp,
  onImportExcel
}: DashboardScreenProps) {
  const [showImportModal, setShowImportModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Quick statistics calculation
  const totalEmployees = employees.length;
  const activeCount = employees.filter(e => e.status === "active").length;
  const leaveCount = employees.filter(e => e.status === "on_leave").length;
  const absentCount = employees.filter(e => e.status === "absent").length;
  const duesCount = employees.filter(e => e.leaveDuesRequested && e.leaveDuesStatus !== "received").length;
  const terminatedCount = employees.filter(e => e.status === "terminated").length;

  // Split admin vs branch count for the Locations metrics
  const adminCount = employees.filter(e => {
    const d = (e.department || "").trim();
    return d === "الإدارة" || d === "الادارة" || d.toLowerCase().includes("ادارة") || d.toLowerCase().includes("إدارة");
  }).length;
  const branchCount = totalEmployees - adminCount;

  // Excel Upload Logic - Exact conversion to keep spreadsheet feature intact
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const max_size = 15 * 1024 * 1024; // 15MB
    if (file.size > max_size) {
      alert("عذراً، حجم الملف يتجاوز الحد الأقصى المسموح به (15 ميجابايت).");
      e.target.value = "";
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const val = event.target?.result;
        if (!val) {
          alert("خطأ في قراءة محتوى الملف.");
          setIsUploading(false);
          return;
        }
        const data = new Uint8Array(val as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) {
          alert("خطأ: لم نتمكن من العثور على أي ورقة عمل داخل ملف الـ Excel.");
          setIsUploading(false);
          return;
        }

        const jsonData = XLSX.utils.sheet_to_json<any>(sheet);
        if (jsonData.length === 0) {
          alert("تنبيه: ملف Excel فارغ أو لا يحتوي على صفوف بيانات صالحة.");
          setIsUploading(false);
          return;
        }

        // Helper to find loosely matching keys
        const findValue = (row: any, searchKeys: string[], excludeKeys: string[] = []): any => {
          const keys = Object.keys(row);
          for (const key of keys) {
            const normKey = key.trim().toLowerCase();
            const hasExclude = excludeKeys.some(ek => normKey.includes(ek));
            if (!hasExclude && searchKeys.some(sk => normKey === sk)) {
              return row[key];
            }
          }
          for (const key of keys) {
            const normKey = key.trim().toLowerCase();
            const hasExclude = excludeKeys.some(ek => normKey.includes(ek));
            if (!hasExclude && searchKeys.some(sk => normKey.includes(sk) || sk.includes(normKey))) {
              return row[key];
            }
          }
          return undefined;
        };

        const parseExcelDate = (val: any): string => {
          if (!val) return "";
          if (typeof val === "number") {
            const excelEpoch = new Date(1899, 11, 30);
            const date = new Date(excelEpoch.getTime() + val * 86400000);
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, "0");
            const d = String(date.getDate()).padStart(2, "0");
            return `${y}-${m}-${d}`;
          }
          return String(val).trim().replace(/\//g, "-");
        };

        const formatExcelPhone = (val: any): string => {
          if (val === undefined || val === null) return "+966 50 000 0000";
          const str = String(val).replace(/[\s\-\(\)\+]/g, "").trim();
          if (/^\d+$/.test(str)) {
            if (str.startsWith("966")) {
              const inside = str.substring(3);
              return `+966 ${inside.substring(0, 2)} ${inside.substring(2, 5)} ${inside.substring(5)}`;
            }
            if (str.startsWith("05")) {
              const inside = str.substring(1);
              return `+966 ${inside.substring(0, 2)} ${inside.substring(2, 5)} ${inside.substring(5)}`;
            }
            if (str.startsWith("5") && str.length === 9) {
              return `+966 ${str.substring(0, 2)} ${str.substring(2, 5)} ${str.substring(5)}`;
            }
          }
          return String(val).trim();
        };

        const parseExcelStatus = (val: any): any => {
          if (!val) return "active";
          const str = String(val).trim().toLowerCase();
          if (str.includes("نشط") || str.includes("مناوب") || str.includes("مستمر") || str.includes("active")) return "active";
          if (str.includes("إجازة") || str.includes("اجازه") || str.includes("leave") || str.includes("مجاز")) return "on_leave";
          if (str.includes("غياب") || str.includes("absent") || str.includes("غايب")) return "absent";
          if (str.includes("استق") || str.includes("resigned")) return "resigned";
          if (str.includes("إنهاء") || str.includes("انهاء") || str.includes("terminated")) return "terminated";
          if (str.includes("محول") || str.includes("منقول") || str.includes("transferred")) return "transferred";
          return "active";
        };

        const parsedEmployees: Employee[] = jsonData.map((row) => {
          const nameVal = findValue(row, ["الاسم", "name", "العضو", "اسم"], ["الهوية", "رقم", "id", "جوال", "هاتف", "phone"]);
          const idVal = findValue(row, ["الرقم الوظيفي", "رقم الموظف", "الكود", "الرقم", "id", "employee id"], ["جوال", "اسم", "phone"]);
          const roleVal = findValue(row, ["الوظيفة", "المسمى", "role", "المنصب"], ["اسم", "رقم", "id"]);
          const nationalIdVal = findValue(row, ["الهوية", "nationalid", "البطاقة", "رقم الهوية", "national id"], ["جوال", "اسم"]);
          const expiryVal = findValue(row, ["انتهاء", "expiry", "تاريخ الانتهاء"], ["اسم"]);
          const phoneVal = findValue(row, ["رقم الجوال", "الجوال", "جوال", "الهاتف", "phone", "mobile"], ["رقم الموظف", "رقم الهوية", "اسم"]);
          const joinVal = findValue(row, ["تعيين", "انضمام", "joindate", "المباشرة"], ["انتهاء"]);
          const deptVal = findValue(row, ["القسم", "الفرع", "department", "الادارة"], ["اسم"]);
          const statusVal = findValue(row, ["الحالة", "status"], ["اسم"]);
          const certifiedVal = findValue(row, ["معتمد", "certified"], ["اسم"]);

          return {
            id: idVal ? String(idVal).trim() : `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
            name: nameVal ? String(nameVal).trim() : "موظف مستورد",
            avatar: sscoLogo,
            role: roleVal ? String(roleVal).trim() : "حارس أمن",
            nationalId: nationalIdVal ? String(nationalIdVal).trim() : "1000000000",
            nationalIdExpiry: parseExcelDate(expiryVal) || "2029-05-26",
            phone: formatExcelPhone(phoneVal),
            joinDate: parseExcelDate(joinVal) || "2024-01-01",
            status: parseExcelStatus(statusVal),
            department: deptVal ? String(deptVal).trim() : "العمليات الميدانية",
            certified: certifiedVal ? String(certifiedVal).toLowerCase().includes("نعم") : false
          };
        });

        onImportExcel(parsedEmployees);
        setIsUploading(false);
        setShowImportModal(false);
        e.target.value = ""; 
      } catch (err) {
        console.error("Error reading file:", err);
        alert("فشل استيراد الملف. يرجى التأكد من أن صيغة ملف Excel سليمة ومحميته.");
        setIsUploading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="pb-28 pt-4 px-4 bg-[#f8f9fa] min-h-screen text-right font-sans" dir="rtl">
      
      {/* 1. TOP PORTAL HEADER */}
      <header className="flex flex-row justify-between items-center h-20 w-full mb-6 border-b border-gray-150 pb-4">
        {/* Quick Utilities: Add Employee & Excel Import to preserve capabilities */}
        <div className="flex gap-2.5">
          <button 
            type="button"
            onClick={() => setShowImportModal(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 transition-all border border-amber-250/20 active:scale-95 shadow-2xs"
            title="استيراد موظفين من إكسل"
          >
            <Upload className="w-5 h-5" />
          </button>
          
          <button 
            type="button"
            onClick={() => onScreenChange("add")}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1e3a8a] transition-all border border-blue-250/20 active:scale-95 shadow-2xs"
            title="إضافة موظف جديد"
          >
            <UserPlus className="w-5 h-5" />
          </button>

          <button 
            type="button"
            onClick={() => onScreenChange("app-info")}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all border border-gray-250/20 active:scale-95 shadow-2xs"
            title="معلومات النظام الموحد"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>

        {/* Corporate Title & Brand Logo */}
        <div className="flex items-center gap-3 flex-row-reverse text-right">
          <div className="w-11 h-11 bg-white rounded-xl border border-gray-150 p-1 flex items-center justify-center shadow-xs">
            <img 
              src={sscoLogo} 
              alt="SSCo Logo" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain" 
            />
          </div>
          <div>
            <h1 className="text-sm font-black text-[#1e3a8a] tracking-tight">شركة الأمن والأمان</h1>
            <p className="text-[10px] text-gray-400 font-bold mt-0.5">بوابة نظم الموارد البشرية والسيطرة</p>
          </div>
        </div>
      </header>

      {/* 2. SECURITY HERO CARD */}
      <div className="bg-gradient-to-l from-[#1e3a8a] to-[#2563eb] text-white p-5 rounded-2xl mb-6 shadow-sm flex items-center justify-between flex-row-reverse">
        <div className="space-y-1 text-right">
          <span className="text-[9px] bg-blue-500/80 hover:bg-blue-500 text-white px-2.5 py-0.5 rounded-full font-black tracking-wider block w-fit ml-auto">
            النظام المركزي الموحد
          </span>
          <h2 className="text-xs font-black">لوحة الفرز والسيطرة الرئيسية</h2>
          <p className="text-[10px] text-blue-100 font-bold">
            انقر على أحد القطاعات لتصفح العمليات والبيانات المتكاملة بشكل مستقل.
          </p>
        </div>
        <div className="hidden sm:block">
          <CheckCircle className="w-12 h-12 text-blue-200 opacity-20" />
        </div>
      </div>

      {/* 3. SQUARE CARD DEPARTMENTS GRID */}
      <main className="grid grid-cols-2 md:grid-cols-3 gap-4">
        
        {/* CARD 1: EMPLOYEES (الموظفين) */}
        <button
          onClick={() => onScreenChange("employee-data")}
          className="aspect-square bg-white border border-gray-150 rounded-2xl p-5 flex flex-col justify-between text-right hover:border-blue-500 hover:scale-[1.02] shadow-sm transition-all active:scale-95 group"
        >
          {/* Accent Plate */}
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-[#1e3a8a] group-hover:bg-[#1e3a8a] group-hover:text-white transition-all">
            <Users className="w-6 h-6" />
          </div>
          
          <div className="space-y-1 my-2">
            <h3 className="text-xs font-black text-gray-900 group-hover:text-[#1e3a8a] transition-colors">إدارة الموظفين</h3>
            <p className="text-[9px] text-gray-400 font-bold leading-tight">سجلات الكوادر الكاملة والترتيب التسلسلي والبيانات الشخصية</p>
          </div>

          <div className="pt-2 border-t border-gray-50 flex items-center justify-between flex-row-reverse">
            <span className="text-[10px] font-black text-[#1e3a8a] bg-blue-50/70 px-2.5 py-1 rounded-md border border-blue-100/50">
              {totalEmployees} ملف نشط
            </span>
            <span className="text-[9px] text-gray-400 group-hover:text-[#1e3a8a] font-bold">تصفح ←</span>
          </div>
        </button>

        {/* CARD 2: VACATIONS (الاجازات) */}
        <button
          onClick={() => onScreenChange("vacations")}
          className="aspect-square bg-white border border-gray-150 rounded-2xl p-5 flex flex-col justify-between text-right hover:border-amber-500 hover:scale-[1.02] shadow-sm transition-all active:scale-95 group"
        >
          {/* Accent Plate */}
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all">
            <Calendar className="w-6 h-6" />
          </div>
          
          <div className="space-y-1 my-2">
            <h3 className="text-xs font-black text-gray-900 group-hover:text-amber-600 transition-colors">قسم الإجازات</h3>
            <p className="text-[9px] text-gray-400 font-bold leading-tight">جدولة وتعديل فترات إجازة الحراس مع إشعارات العودة</p>
          </div>

          <div className="pt-2 border-t border-gray-50 flex items-center justify-between flex-row-reverse">
            <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/50">
              {leaveCount} في الإجازة
            </span>
            <span className="text-[9px] text-gray-400 group-hover:text-amber-600 font-bold">تصفح ←</span>
          </div>
        </button>

        {/* CARD 3: ABSENCES (الغيابات) */}
        <button
          onClick={() => onScreenChange("absences")}
          className="aspect-square bg-white border border-gray-150 rounded-2xl p-5 flex flex-col justify-between text-right hover:border-rose-500 hover:scale-[1.02] shadow-sm transition-all active:scale-95 group"
        >
          {/* Accent Plate */}
          <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 group-hover:bg-rose-500 group-hover:text-white transition-all">
            <ShieldAlert className="w-6 h-6" />
          </div>
          
          <div className="space-y-1 my-2">
            <h3 className="text-xs font-black text-gray-900 group-hover:text-rose-600 transition-colors">الغيابات والإنذارات</h3>
            <p className="text-[9px] text-gray-400 font-bold leading-tight">حصر كشوفات الغياب وتطبيق مستويات الإنذار الإدارية</p>
          </div>

          <div className="pt-2 border-t border-gray-50 flex items-center justify-between flex-row-reverse">
            <span className="text-[10px] font-black text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200/50">
              {absentCount || 0} غياب اليوم
            </span>
            <span className="text-[9px] text-gray-400 group-hover:text-rose-500 font-bold">تصفح ←</span>
          </div>
        </button>

        {/* CARD 4: LEAVE DUES (المستحقات) */}
        <button
          onClick={() => onScreenChange("leave-dues")}
          className="aspect-square bg-white border border-gray-150 rounded-2xl p-5 flex flex-col justify-between text-right hover:border-emerald-500 hover:scale-[1.02] shadow-sm transition-all active:scale-95 group"
        >
          {/* Accent Plate */}
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
            <CreditCard className="w-6 h-6" />
          </div>
          
          <div className="space-y-1 my-2">
            <h3 className="text-xs font-black text-gray-900 group-hover:text-emerald-600 transition-colors">تصفية المستحقات</h3>
            <p className="text-[9px] text-gray-400 font-bold leading-tight">تصفية وحصر مبالغ الإجازات وقرارات استلام الحقوق المالية</p>
          </div>

          <div className="pt-2 border-t border-gray-50 flex items-center justify-between flex-row-reverse">
            <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/50">
              {duesCount || 0} معلقة للتصفية
            </span>
            <span className="text-[9px] text-gray-400 group-hover:text-emerald-500 font-bold">تصفح ←</span>
          </div>
        </button>

        {/* CARD 5: LOCATIONS (المواقع) */}
        <button
          onClick={() => onScreenChange("locations")}
          className="aspect-square bg-white border border-gray-150 rounded-2xl p-5 flex flex-col justify-between text-right hover:border-indigo-500 hover:scale-[1.02] shadow-sm transition-all active:scale-95 group col-span-1"
        >
          {/* Accent Plate */}
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
            <Building className="w-6 h-6" />
          </div>
          
          <div className="space-y-1 my-2">
            <h3 className="text-xs font-black text-gray-900 group-hover:text-indigo-600 transition-colors">توزيع المواقع</h3>
            <p className="text-[9px] text-gray-400 font-bold leading-tight">فرز إداري وجغرافي مستقل - قسم الإدارة العامة مقابل الفروع الميدانية</p>
          </div>

          <div className="pt-2 border-t border-gray-50 flex items-center justify-between flex-row-reverse">
            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-200/50">
              {adminCount} إدارة / {branchCount} فروع
            </span>
            <span className="text-[9px] text-gray-400 group-hover:text-indigo-500 font-bold">تصفح ←</span>
          </div>
        </button>

        {/* CARD 6: TERMINATION (إنهاء الخدمات) */}
        <button
          onClick={() => onScreenChange("termination")}
          className="aspect-square bg-white border border-gray-150 rounded-2xl p-5 flex flex-col justify-between text-right hover:border-slate-800 hover:scale-[1.02] shadow-sm transition-all active:scale-95 group col-span-1"
          id="termination_dashboard_card"
        >
          {/* Accent Plate */}
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-800 group-hover:bg-slate-700 group-hover:text-white transition-all">
            <UserX className="w-6 h-6" />
          </div>
          
          <div className="space-y-1 my-2">
            <h3 className="text-xs font-black text-gray-900 group-hover:text-slate-800 transition-colors">إنهاء الخدمات</h3>
            <p className="text-[9px] text-gray-400 font-bold leading-tight">متابعة غيابات الموظفين والفرز الميداني لإنهاء خدماتهم المتسلسلة</p>
          </div>

          <div className="pt-2 border-t border-gray-50 flex items-center justify-between flex-row-reverse">
            <span className="text-[10px] font-black text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-350">
              {terminatedCount} موظفين
            </span>
            <span className="text-[9px] text-gray-400 group-hover:text-slate-700 font-bold">فرز ←</span>
          </div>
        </button>

      </main>

      {/* 4. TOTAL METRICS SUMMARY PANEL */}
      <section className="mt-8 bg-white rounded-2xl p-4 border border-gray-150 shadow-xs space-y-3.5">
        <h3 className="text-xs font-black text-[#1e3a8a] flex items-center gap-2 flex-row-reverse border-b pb-2">
          <Server className="w-4 h-4 text-blue-500" />
          <span>ملخص تعداد القوة البشرية النشطة</span>
        </h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
            <span className="text-sm font-black text-[#1e3a8a] block font-sans">{totalEmployees}</span>
            <span className="text-[8.5px] text-gray-550 font-bold block">إجمالي المسجلين</span>
          </div>
          <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
            <span className="text-sm font-black text-emerald-700 block font-sans">{activeCount}</span>
            <span className="text-[8.5px] text-gray-550 font-bold block">نشط ومناوب</span>
          </div>
          <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
            <span className="text-sm font-black text-amber-700 block font-sans">{leaveCount}</span>
            <span className="text-[8.5px] text-gray-550 font-bold block">في إجازة رسمية</span>
          </div>
        </div>
      </section>

      {/* Excel Import Floating dialogue/Modal Overlay */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 pointer-events-auto">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-right space-y-4 shadow-2xl border border-gray-150">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <button 
                onClick={() => setShowImportModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
              <h4 className="text-sm font-bold text-[#1e3a8a] flex items-center gap-1.5 flex-row-reverse">
                <Upload className="w-4 h-4" />
                <span>استيراد جماعي من ملف Excel</span>
              </h4>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed font-bold">
              يرجى اختيار ملف Excel يحتوي على بيانات الموظفين لتضمينهم في شؤون الموظفين بشكل تلقائي وفوري.
            </p>

            <div className="border-2 border-dashed border-gray-200 hover:border-[#1e3a8a] transition-colors rounded-xl p-8 flex flex-col items-center justify-center gap-2 text-center cursor-pointer relative mb-4">
              <input 
                type="file" 
                accept=".xlsx, .xls"
                onChange={handleExcelUpload}
                disabled={isUploading}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-gray-400" />
              <span className="text-xs font-bold text-gray-700 mt-2">اسحب الملف هنا أو اختر لتصفح جهازك</span>
              <span className="text-[10px] text-gray-400">ملفات Excel (بحد أقصى 15MB)</span>
            </div>

            {isUploading && (
              <div className="flex justify-center items-center gap-2 text-xs text-[#1e3a8a] font-sans">
                <span className="animate-spin text-lg">⏳</span>
                <span>جاري معالجة الملف وإدراج الموظفين البدلاء...</span>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
