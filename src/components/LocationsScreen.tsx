import React, { useState } from "react";
import { 
  ArrowRight, 
  MapPin, 
  Building, 
  Layers, 
  Search, 
  Briefcase, 
  Phone, 
  Calendar, 
  FileText, 
  Home, 
  ShieldAlert,
  Users,
  User,
  CheckCircle2,
  GitCommit,
  Grid,
  Filter,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Employee, ViewState } from "../types";

// Official 32 branches requested by the user
export const BRANCHES_LIST = [
  "العقارية",
  "الهاتف الجديد",
  "الهاتف الناس سيدات",
  "العقارية وقفات",
  "النفل",
  "النفل التميز",
  "مركز المبيعات",
  "الملقا",
  "الملقاستان",
  "التحلية",
  "النرجس",
  "القيروان",
  "التخصصي الجديد",
  "التخصصي سيدات",
  "ظهرة البديعة",
  "البديعة سيدات",
  "الضباب",
  "الشفاء",
  "المرسلات",
  "استثمار المرسلات",
  "الرائد",
  "الشميسي",
  "الخليج",
  "الربوة",
  "اشبيليا",
  "ظهرة لبن",
  "الريان",
  "حوالات الصناعية الثانية",
  "حوالات فيلاجيو",
  "حوالات العارض",
  "النسيم",
  "مساندة المشروع"
];

interface LocationsScreenProps {
  employees: Employee[];
  onScreenChange: (screen: ViewState) => void;
  onSelectEmployee: (id: string) => void;
}

export default function LocationsScreen({
  employees,
  onScreenChange,
  onSelectEmployee
}: LocationsScreenProps) {
  // Navigation internal state: "menu" | "admin" | "branches"
  const [activeTab, setActiveTab] = useState<"menu" | "admin" | "branches">("menu");
  // If in branches view, which branch is selected to view its employees. If null, show branches list grid.
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [branchSearchQuery, setBranchSearchQuery] = useState("");

  // Normalize check for administration
  const isAdministration = (emp: Employee) => {
    const dept = (emp.department || "").trim();
    return dept === "الإدارة" || dept === "الادارة" || dept.toLowerCase().includes("ادارة") || dept.toLowerCase().includes("إدارة");
  };

  // Split into admin vs branches (all other employees)
  const adminEmployees = employees.filter(isAdministration);
  const branchEmployees = employees.filter(emp => !isAdministration(emp));

  // Helper matching function that maps employees to branches based on name variations
  const getEmployeeBranchMatched = (emp: Employee): string => {
    const dept = (emp.department || "").trim().toLowerCase();
    if (!dept) return "أخرى";

    // Direct check from requested branches list
    for (const b of BRANCHES_LIST) {
      if (dept === b.toLowerCase()) return b;
    }

    // Loose check
    for (const b of BRANCHES_LIST) {
      if (dept.includes(b.toLowerCase()) || b.toLowerCase().includes(dept)) return b;
    }

    // Equivalent alternate names used in previous prompts or shorthand spellings:
    if (dept.includes("عقارية") || dept.includes("العقارية")) {
      if (dept.includes("مواقف") || dept.includes("وقفات") || dept.includes("موقف")) return "العقارية وقفات";
      return "العقارية";
    }
    if (dept.includes("ملقا") || dept.includes("الملقا")) {
      if (dept.includes("مواقف") || dept.includes("موقف") || dept.includes("ستان")) return "الملقاستان";
      return "الملقا";
    }
    if (dept.includes("هاتف") || dept.includes("الهاتف")) {
      if (dept.includes("سيدات")) return "الهاتف الناس سيدات";
      return "الهاتف الجديد";
    }
    if (dept.includes("تخصصي") || dept.includes("التخصصي")) {
      if (dept.includes("سيدات")) return "التخصصي سيدات";
      return "التخصصي الجديد";
    }
    if (dept.includes("بديعة") || dept.includes("البديعة")) {
      if (dept.includes("سيدات")) return "البديعة سيدات";
      return "ظهرة البديعة";
    }
    if (dept.includes("نفل") || dept.includes("النفل")) {
      if (dept.includes("تميز") || dept.includes("التميز")) return "النفل التميز";
      return "النفل";
    }
    if (dept.includes("مرسلات") || dept.includes("المرسلات")) {
      if (dept.includes("استثمار")) return "استثمار المرسلات";
      return "المرسلات";
    }
    if (dept.includes("مبيعات") || dept.includes("المبيعات")) {
      return "مركز المبيعات";
    }

    return "أخرى";
  };

  // Group employees by branch to count them for indicators
  const getBranchEmployeeCount = (branchName: string) => {
    if (branchName === "أخرى") {
      return branchEmployees.filter(emp => getEmployeeBranchMatched(emp) === "أخرى").length;
    }
    return branchEmployees.filter(emp => getEmployeeBranchMatched(emp) === branchName).length;
  };

  // Get employees actually belonging to a selected branch
  const getEmployeesInBranch = (branchName: string) => {
    return branchEmployees.filter(emp => getEmployeeBranchMatched(emp) === branchName);
  };

  // Human friendly Arabic label configured mapping for statuses
  const statusConfigAr: Record<string, { label: string; colorClass: string }> = {
    active: { label: "نشط ومناوب", colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    on_leave: { label: "في إجازة", colorClass: "bg-amber-50 text-amber-700 border-amber-200" },
    absent: { label: "غياب", colorClass: "bg-rose-50 text-rose-700 border-rose-220" },
    resigned: { label: "مستقيل", colorClass: "bg-gray-100 text-gray-700 border-gray-200" },
    terminated: { label: "تم إنهاء الخدمة", colorClass: "bg-rose-100 text-rose-800 border-rose-200" },
    transferred: { label: "منقول من القسم", colorClass: "bg-purple-50 text-purple-700 border-purple-200" },
    transferred_from: { label: "منقول إلى القسم", colorClass: "bg-blue-50 text-blue-700 border-blue-200" }
  };

  const getStatusLabel = (status: string) => {
    return statusConfigAr[status] || { label: status, colorClass: "bg-gray-50 text-gray-600 border-gray-100" };
  };

  // Search filter loop for employees lists
  const filterList = (list: Employee[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(emp => 
      emp.name.toLowerCase().includes(q) ||
      emp.id.includes(q) ||
      emp.role.toLowerCase().includes(q) ||
      (emp.phone && emp.phone.includes(q)) ||
      (emp.department && emp.department.toLowerCase().includes(q))
    );
  };

  const filteredAdmins = filterList(adminEmployees);

  // Filter the actual 32 branches based on user search query on the branches selector list
  const filteredBranchesList = BRANCHES_LIST.filter(branch => 
    branch.toLowerCase().includes(branchSearchQuery.toLowerCase().trim())
  );

  // Append 'Other' if there are employees assigned to raw branches not matching the official ones
  const otherCount = getBranchEmployeeCount("أخرى");
  const showOtherBranch = otherCount > 0 || branchSearchQuery === "";

  return (
    <div className="pb-28 pt-4 px-4 bg-[#f8f9fa] min-h-screen text-right font-sans" dir="rtl">
      
      {/* HEADER SECTION */}
      <header className="flex flex-row justify-between items-center h-16 w-full mb-5 border-b border-gray-150 pb-3">
        {/* Back Button with Hierarchy Handling */}
        <button 
          onClick={() => {
            if (activeTab === "branches" && selectedBranch !== null) {
              setSelectedBranch(null);
              setSearchQuery("");
            } else if (activeTab !== "menu") {
              setActiveTab("menu");
              setSearchQuery("");
              setBranchSearchQuery("");
            } else {
              onScreenChange("dashboard");
            }
          }}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 transition-transform active:scale-95 shadow-xs border border-gray-150"
          title="رجوع"
        >
          <ArrowRight className="w-5 h-5 text-[#1e3a8a]" />
        </button>

        <h1 className="text-sm font-black text-[#1e3a8a] flex items-center gap-2 flex-row-reverse">
          <MapPin className="w-5 h-5 text-red-500 animate-bounce" />
          <span>
            {activeTab === "menu" ? "توزيع مواقع ونظم الموظفين" : ""}
            {activeTab === "admin" ? "كوادر الإدارة العامة" : ""}
            {activeTab === "branches" && selectedBranch === null ? "الكوادر العاملة بالفروع" : ""}
            {activeTab === "branches" && selectedBranch !== null ? `موظفي فرع: ${selectedBranch}` : ""}
          </span>
        </h1>

        <button 
          onClick={() => onScreenChange("dashboard")}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 transition-transform active:scale-95 shadow-xs border border-gray-150"
          title="الرئيسية"
        >
          <Home className="w-5 h-5 text-[#1e3a8a]" />
        </button>
      </header>

      {/* VIEW 1: MAIN MENU (TWO MASSIVE SQUARE CARDS) */}
      {activeTab === "menu" && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Welcome Info Board */}
          <div className="bg-[#1e3a8a] text-white p-5 rounded-2xl shadow-sm text-right space-y-1.5">
            <h4 className="text-xs font-black flex items-center gap-1.5 flex-row-reverse">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>فصل الهيكل والتوزيع الميداني والاداري كلياً</span>
            </h4>
            <p className="text-[10px] text-blue-100 font-medium leading-relaxed">
              اختر أحد الأقسام المستقلة أدناه لمتابعة العاملين فيها بحسب تصنيف الإدارة العامة أو الفروع والمشاريع التابعة والتمتع بفرز مستقل لكل فرع تماماً.
            </p>
          </div>

          {/* Independent Square Sections Grid Layout */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* CARD 1: ADMINISTRATION (الإدارة) */}
            <button
              onClick={() => {
                setActiveTab("admin");
                setSearchQuery("");
              }}
              className="aspect-square bg-white border border-gray-150 rounded-2xl p-5 flex flex-col justify-between text-right hover:border-blue-500 hover:shadow-md transition-all active:scale-95 group shadow-xs"
            >
              <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center text-[#1e3a8a] group-hover:bg-[#1e3a8a] group-hover:text-white transition-all">
                <Building className="w-6 h-6" />
              </div>
              <div className="space-y-1 mt-3">
                <h3 className="text-xs font-black text-gray-900 group-hover:text-[#1e3a8a] transition-colors">قسم الإدارة</h3>
                <p className="text-[9px] text-gray-400 font-bold leading-tight">الموظفون المسجلون بالإدارة العامة لشؤون المكتب والتنفيذ</p>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-50 flex items-center justify-between flex-row-reverse">
                <span className="text-xs font-black text-[#1e3a8a] bg-blue-50/70 px-2.5 py-1 rounded-full border border-blue-100">
                  {adminEmployees.length} موظفاً
                </span>
                <span className="text-[9px] text-gray-400 font-bold group-hover:text-[#1e3a8a] transition-colors font-sans">عرض ←</span>
              </div>
            </button>

            {/* CARD 2: BRANCHES (الفروع) */}
            <button
              onClick={() => {
                setActiveTab("branches");
                setSelectedBranch(null);
                setSearchQuery("");
                setBranchSearchQuery("");
              }}
              className="aspect-square bg-white border border-gray-150 rounded-2xl p-5 flex flex-col justify-between text-right hover:border-emerald-500 hover:shadow-md transition-all active:scale-95 group shadow-xs"
            >
              <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="space-y-1 mt-3">
                <h3 className="text-xs font-black text-gray-900 group-hover:text-emerald-600 transition-colors">الفروع الميدانية</h3>
                <p className="text-[9px] text-gray-400 font-bold leading-tight">متابعة الفروع الناشئة الـ ٣٢ بشكل مستقل لكل موقع تشغيلي</p>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-50 flex items-center justify-between flex-row-reverse">
                <span className="text-xs font-black text-emerald-700 bg-emerald-50/70 px-2.5 py-1 rounded-full border border-emerald-100">
                  {branchEmployees.length} موظفاً
                </span>
                <span className="text-[9px] text-gray-400 font-bold group-hover:text-emerald-600 transition-colors font-sans font-arabic">عرض ←</span>
              </div>
            </button>

          </div>

          {/* Quick Statistics Overview Card */}
          <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs space-y-3">
            <h5 className="text-[10px] font-black text-[#1e3a8a] border-b pb-1.5 flex items-center gap-1.5 flex-row-reverse">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>النسبة المئوية الحالية لتوزيع الكادر</span>
            </h5>
            <div className="flex gap-2.5 items-center">
              {/* Simple beautiful progress bar */}
              <div className="flex-1 h-3.5 bg-gray-150 rounded-full overflow-hidden flex flex-row-reverse">
                <div 
                  style={{ width: `${(adminEmployees.length / Math.max(1, employees.length)) * 100}%` }} 
                  className="bg-[#1e3a8a] h-full" 
                  title="الإدارة"
                />
                <div 
                  style={{ width: `${(branchEmployees.length / Math.max(1, employees.length)) * 100}%` }} 
                  className="bg-emerald-500 h-full" 
                  title="الفروع"
                />
              </div>
              <span className="text-[9px] font-extrabold text-gray-600 shrink-0 select-none">
                {(adminEmployees.length / Math.max(1, employees.length) * 100).toFixed(0)}% إدارة
              </span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: INDEPENDENT ADMIN SCREEN (قسم الإدارة فقط) */}
      {activeTab === "admin" && (
        <div className="space-y-4 animate-fade-in">
          
          <div className="flex items-center justify-between bg-blue-50/50 p-3 rounded-lg border border-blue-100 flex-row-reverse">
            <div className="text-right">
              <span className="text-[10px] text-[#1e3a8a] font-bold block">موقع الملفات النشط</span>
              <span className="text-xs font-black text-gray-800 font-sans">العاملون في المكاتب والمراكز القيادية المباشرة</span>
            </div>
            <span className="text-xs font-black bg-[#1e3a8a] text-white px-3 py-1.5 rounded-full shadow-xs">
              العدد: {filteredAdmins.length} من {adminEmployees.length} موظفاً
            </span>
          </div>

          {/* Special search input for this specific section */}
          <div className="relative">
            <input
              type="text"
              placeholder="ابحث باسم الموظف في الإدارة، هويته، جواله، أو مسمى وظيفي..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-right bg-white text-xs px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#1e3a8a] font-medium shadow-xs"
            />
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
          </div>

          {/* Administration Employee List rendering */}
          <div className="space-y-3">
            {filteredAdmins.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center gap-1.5">
                <Building className="w-8 h-8 text-gray-300" />
                <span className="text-xs text-gray-400 font-bold">لا يوجد نتائج تطابق بحث الإدارة</span>
              </div>
            ) : (
              filteredAdmins.map((emp) => {
                const statusInfo = getStatusLabel(emp.status);
                return (
                  <div
                    key={emp.id}
                    onClick={() => {
                      onSelectEmployee(emp.id);
                      onScreenChange("profile");
                    }}
                    className="bg-white p-3.5 rounded-xl border border-gray-150 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex justify-between items-center shadow-xs flex-row-reverse"
                  >
                    <div className="flex items-center gap-3 flex-row-reverse text-right">
                      <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center bg-blue-50 text-[#1e3a8a] font-black shrink-0 text-xs">
                        {emp.name.split(" ").slice(0, 2).map(n => n[0]).join("") || "م"}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-gray-900">{emp.name}</h4>
                        <div className="flex gap-1.5 mt-0.5 items-center flex-row-reverse justify-end">
                          <span className="text-[9px] text-[#1e3a8a] bg-blue-50 px-1.5 py-0.5 rounded font-extrabold border border-blue-100">
                            {emp.role}
                          </span>
                          <span className="text-[9px] text-gray-400 font-medium font-mono">ID: #{emp.id}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 text-right">
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${statusInfo.colorClass}`}>
                        {statusInfo.label}
                      </span>
                      <span className="text-[9px] text-[#1e3a8a] font-bold hover:underline">الملف الشخصي ←</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={() => {
              setActiveTab("menu");
              setSearchQuery("");
            }}
            className="w-full py-2.5 bg-gray-150 text-gray-700 hover:bg-gray-200 text-xs font-black rounded-xl transition-all"
          >
            ← عودة لقائمة المواقع الرئيسية
          </button>

        </div>
      )}

      {/* VIEW 3: INDEPENDENT BRANCHES SECTIONS (اسم الفرع له صفحة مستقلة) */}
      {activeTab === "branches" && selectedBranch === null && (
        <div className="space-y-4 animate-fade-in">
          
          {/* Section banner */}
          <div className="bg-emerald-600 text-white p-4 rounded-xl shadow-xs text-right space-y-1">
            <h4 className="text-xs font-black flex items-center gap-1 flex-row-reverse">
              <MapPin className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>قطاع الفروع وأفراد السيطرة والعمليات</span>
            </h4>
            <p className="text-[9px] text-emerald-100 font-bold leading-relaxed">
              انقر على أي من الفروع الميدانية الـ ٣٢ المدرجة أدناه لفتح صفحة مستقلة كلياً وحصر كادر الموظفين المتواجدين بها مباشرة.
            </p>
          </div>

          {/* Quick search specifically for filtering BRANCH names themselves */}
          <div className="relative">
            <input
              type="text"
              placeholder="ابحث عن اسم فرع محدد... (مثال: الملقا، التخصصي، العقارية)"
              value={branchSearchQuery}
              onChange={(e) => setBranchSearchQuery(e.target.value)}
              className="w-full text-right bg-white text-xs px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-semibold shadow-xs"
            />
            <Search className="absolute left-3.5 top-4 w-4 h-4 text-gray-400" />
          </div>

          {/* 32 Branches Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredBranchesList.map((branch, index) => {
              const count = getBranchEmployeeCount(branch);
              return (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedBranch(branch);
                    setSearchQuery("");
                  }}
                  className="bg-white border border-gray-150 rounded-xl p-3 text-right hover:border-emerald-500 hover:shadow-sm active:scale-95 transition-all flex flex-col justify-between min-h-24 shadow-xs group"
                >
                  <div className="flex justify-between items-start flex-row-reverse w-full">
                    <span className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center text-[10px] font-black group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      {index + 1}
                    </span>
                    <MapPin className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                  </div>

                  <div className="mt-2 text-right">
                    <h4 className="text-[11px] font-black text-gray-800 group-hover:text-emerald-700 transition-colors line-clamp-1">{branch}</h4>
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-gray-50 flex justify-between items-center w-full flex-row-reverse">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${count > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-gray-50 text-gray-400 border border-transparent'}`}>
                      {count} موظفين
                    </span>
                    <span className="text-[9px] text-gray-300 group-hover:text-emerald-600 transition-colors">عرض ←</span>
                  </div>
                </button>
              );
            })}

            {/* FALLBACK: Other/Unclassified Branch card if any exist */}
            {showOtherBranch && otherCount > 0 && (
              <button
                onClick={() => {
                  setSelectedBranch("أخرى");
                  setSearchQuery("");
                }}
                className="bg-purple-50/40 border border-purple-200 rounded-xl p-3 text-right hover:border-purple-500 hover:shadow-xs active:scale-95 transition-all flex flex-col justify-between min-h-24 shadow-xs group"
              >
                <div className="flex justify-between items-start flex-row-reverse w-full">
                  <span className="w-6 h-6 rounded-md bg-purple-50 text-purple-700 flex items-center justify-center text-[10px] font-black">
                    *
                  </span>
                  <AlertCircle className="w-4 h-4 text-purple-500" />
                </div>

                <div className="mt-2 text-right">
                  <h4 className="text-[11px] font-black text-purple-900">أخرى (غير مصنفين بالفروع)</h4>
                </div>

                <div className="mt-2 pt-1.5 border-t border-purple-100/40 flex justify-between items-center w-full flex-row-reverse">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                    {otherCount} أفراد
                  </span>
                  <span className="text-[9px] text-purple-400 group-hover:text-purple-600 transition-colors">عرض ←</span>
                </div>
              </button>
            )}
          </div>

          {filteredBranchesList.length === 0 && (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center gap-1.5">
              <Search className="w-8 h-8 text-gray-300" />
              <span className="text-xs text-gray-400 font-bold">لا توجد فروع تطابق مسمى البحث المدخل</span>
            </div>
          )}

          <button
            onClick={() => {
              setActiveTab("menu");
              setBranchSearchQuery("");
            }}
            className="w-full py-2.5 bg-gray-150 text-gray-700 hover:bg-gray-200 text-xs font-black rounded-xl transition-all"
          >
            ← عودة لشاشة المواقع الرئيسية
          </button>

        </div>
      )}

      {/* VIEW 4: DEDICATED INDEPENDENT BRANCH SUB-PAGE (تم فتح صفحة الفرع المستقلة كليا) */}
      {activeTab === "branches" && selectedBranch !== null && (
        <div className="space-y-4 animate-fade-in">
          
          {/* Back to branches list helper indicator */}
          <div className="flex items-center justify-between bg-emerald-50 p-3 rounded-lg border border-emerald-150 flex-row-reverse">
            <div className="text-right">
              <span className="text-[10px] text-emerald-700 font-bold block">موقع الملفات النشط بالفروع</span>
              <span className="text-xs font-black text-gray-800">{selectedBranch}</span>
            </div>
            <button
              onClick={() => {
                setSelectedBranch(null);
                setSearchQuery("");
              }}
              className="text-[10px] font-black bg-white hover:bg-emerald-100 text-emerald-700 border border-emerald-250 px-2.5 py-1.5 rounded-md shadow-2xs transition-all"
            >
              ← تغيير الفرع
            </button>
          </div>

          {/* Independent search within the specific branch's employees list */}
          <div className="relative">
            <input
              type="text"
              placeholder={`ابحث باسم موظف في فرع ${selectedBranch}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-right bg-white text-xs px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 font-semibold shadow-xs"
            />
            <Search className="absolute left-3.5 top-4 w-4 h-4 text-gray-400" />
          </div>

          {/* Employee list belonging to this specific branch */}
          <div className="space-y-3">
            {filterList(getEmployeesInBranch(selectedBranch)).length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center gap-2">
                <Users className="w-8 h-8 text-gray-300" />
                <span className="text-xs text-gray-400 font-bold">لا يوجد أفراد مسجلين أو يطابقون البحث في الفرع</span>
                <p className="text-[9px] text-gray-400 max-w-xs leading-relaxed font-semibold">
                  بإمكانك تعديل ملف الموظف أو تعيينه إلى هذا الفرع (كتابة "{selectedBranch}" في حقل الفرع ببيانات الموظف) ليظهر هنا تلقائياً.
                </p>
              </div>
            ) : (
              filterList(getEmployeesInBranch(selectedBranch)).map((emp) => {
                const statusInfo = getStatusLabel(emp.status);
                return (
                  <div
                    key={emp.id}
                    onClick={() => {
                      onSelectEmployee(emp.id);
                      onScreenChange("profile");
                    }}
                    className="bg-white p-3.5 rounded-xl border border-gray-150 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer flex justify-between items-center shadow-xs flex-row-reverse"
                  >
                    <div className="flex items-center gap-3 flex-row-reverse text-right">
                      <div className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center bg-emerald-50 text-emerald-700 font-extrabold text-xs">
                        {emp.name.split(" ").slice(0, 2).map(n => n[0]).join("") || "ح"}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-gray-900">{emp.name}</h4>
                        <div className="flex gap-1.5 mt-0.5 items-center flex-row-reverse justify-end">
                          <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-extrabold border border-emerald-100">
                            {emp.role}
                          </span>
                          <span className="text-[9px] text-gray-400 font-medium font-mono">ID: #{emp.id}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 text-right">
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${statusInfo.colorClass}`}>
                        {statusInfo.label}
                      </span>
                      <span className="text-[9px] text-emerald-600 font-bold">عرض مستندات الملف ←</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={() => {
              setSelectedBranch(null);
              setSearchQuery("");
            }}
            className="w-full py-2.5 bg-gray-150 text-gray-700 hover:bg-gray-200 text-xs font-black rounded-xl transition-all"
          >
            ← عودة لقائمة فروع الكوادر الـ ٣٢
          </button>
        </div>
      )}

      {/* FOOTER */}
      <footer className="mt-8 bg-gray-100 border border-gray-200 p-4 rounded-xl text-right">
        <h5 className="text-[10px] font-black text-[#1e3a8a] mb-1">الربط التلقائي والسيطرة السلسة</h5>
        <p className="text-[9px] text-gray-400 leading-relaxed font-bold">
          يتم فرز بطاقة المواقع تلقائياً بحسب الاسم المكتوب في حقل "الفرع" بملفات الموظفين الميدانيين، مما يسهل على الموارد البشرية وإدارة الميدان المتابعة اللحظية.
        </p>
      </footer>

    </div>
  );
}
