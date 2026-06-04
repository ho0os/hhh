import React, { useState } from "react";
import { Home, SlidersHorizontal, Search, UserPlus, TableProperties, ShieldAlert, Check, X, CreditCard, ChevronLeft, Save, Upload, Camera, User } from "lucide-react";
import { Employee } from "../types";
// @ts-ignore
import sscoLogo from "../assets/images/ssco_logo_1779881766509.png";

interface AddEmployeeScreenProps {
  onAdd: (newEmployee: Employee) => void;
  onCancel: () => void;
}

export default function AddEmployeeScreen({ onAdd, onCancel }: AddEmployeeScreenProps) {
  // Inputs state
  const [name, setName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [joinDate, setJoinDate] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState(""); // Used representationally for Branch (الفرع)
  const [department2, setDepartment2] = useState(""); // Secondary branch/department
  const [phone, setPhone] = useState("+966 5");
  const [avatar, setAvatar] = useState(sscoLogo);

  const avatarsList: string[] = [sscoLogo];

  const handleNextAvatar = () => {
    const currentIndex = avatar ? avatarsList.indexOf(avatar) : -1;
    const nextIndex = (currentIndex + 1) % avatarsList.length;
    setAvatar(avatarsList[nextIndex]);
  };

  // Actual Upload scans and status state
  const [hasIdDoc, setHasIdDoc] = useState(false);
  const [idDocName, setIdDocName] = useState("");
  const [hasSecurityDoc, setHasSecurityDoc] = useState(false);
  const [securityDocName, setSecurityDocName] = useState("");
  const [nationalIdImage, setNationalIdImage] = useState("");
  const [securityDocImage, setSecurityDocImage] = useState("");
  const [status, setStatus] = useState("active");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setHasIdDoc(true);
      setIdDocName(file.name);

      const reader = new FileReader();
      reader.onloadend = () => {
        setNationalIdImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSecurityUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setHasSecurityDoc(true);
      setSecurityDocName(file.name);

      const reader = new FileReader();
      reader.onloadend = () => {
        setSecurityDocImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !nationalId || !idNumber) {
      alert("يرجى تعبئة كافة المربعات الرئيسية المطلوبة.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const generatedEmpId = idNumber;
      onAdd({
        id: generatedEmpId,
        name,
        avatar: avatar || sscoLogo,
        role: role || "حارس أمن",
        nationalId,
        nationalIdExpiry: "2029-05-26", // default in future
        phone: phone || "+966 50 000 0000",
        joinDate: joinDate || new Date().toISOString().split("T")[0],
        status: status as any,
        department,
        department2: department2 || undefined,
        certified: false,
        nationalIdImage: nationalIdImage || undefined,
        securityDocImage: securityDocImage || undefined
      });
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="pb-24 pt-4 px-4 bg-[#f8f9fa] min-h-screen">
      {/* Top Header */}
      <header className="flex flex-row justify-between items-center h-16 w-full mb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onCancel}
            title="الرئيسية"
            aria-label="الرئيسية"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 transition-colors active:scale-95 shadow-sm"
          >
            <Home className="w-5 h-5 text-[#1e3a8a]" />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 transition-colors active:scale-95 shadow-sm">
            <Search className="w-5 h-5 text-[#1e3a8a]" />
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto text-right space-y-4">
        {/* Screen Description Header */}
        <div className="flex flex-col gap-1 px-1">
          <h2 className="text-base font-bold text-gray-800">إضافة موظف جديد</h2>
          <p className="text-xs text-gray-400 font-medium">قم بتعبئة البيانات الأساسية للموظف الجديد في النظام.</p>
        </div>

        {/* Excel quick onboarding banner */}
        <div className="bg-blue-50/60 p-4 rounded-xl flex items-center justify-between border border-blue-100/70 shadow-sm gap-2">
          <button 
            onClick={() => {
              setName("خالد عبدالملك الخالد");
              setNationalId("1077651023");
              setIdNumber("4922");
              setPhone("+966 50 111 2222");
              setJoinDate("22/05/2026");
              setRole("مشرف استقبال");
            }}
            className="bg-[#1e3a8a] text-white text-[10px] font-bold px-3 py-2 rounded-lg hover:bg-[#152a63] transition-colors active:scale-95 flex-shrink-0"
          >
            تعبئة بيانات تلقائياً
          </button>
          <div className="flex items-center gap-3 justify-end text-right">
            <div className="mr-auto text-right">
              <h3 className="text-xs font-bold text-[#1e3a8a]">استيراد بيانات جماعي</h3>
              <p className="text-[10px] text-gray-400 leading-tight">أسرع وسيلة لإضافة عدة موظفين</p>
            </div>
            <div className="w-10 h-10 bg-[#e1e3e4]/40 flex items-center justify-center text-[#1e3a8a] rounded-lg">
              <TableProperties className="w-5 h-5 text-[#1e3a8a]" />
            </div>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            
            {/* Avatar picker segment */}
            <div className="flex flex-col items-center border-b border-gray-50 pb-4 mb-4 select-none">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden shadow-sm flex items-center justify-center bg-gray-50">
                  {avatar ? (
                    <img 
                      src={avatar} 
                      alt="Avatar Preview" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User className="w-8 h-8 text-gray-300" />
                  )}
                </div>
                
                {/* hidden file uploader input */}
                <input 
                  type="file"
                  id="avatar-addon-upload"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setAvatar(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />

                <label 
                  htmlFor="avatar-addon-upload"
                  className="absolute bottom-0 left-0 bg-[#1e3a8a] text-white p-1.5 rounded-full shadow border border-white cursor-pointer hover:bg-[#152a63] transition-colors"
                  title="تحميل صورة من جهازك"
                >
                  <Camera className="w-3.5 h-3.5" />
                </label>
              </div>

              {/* URL input and selection buttons */}
              <div className="w-full mt-3 space-y-2 text-right">
                <div className="flex justify-between items-center text-[10px] font-bold text-[#1e3a8a] px-1">
                  {avatar ? (
                    <button 
                      type="button" 
                      onClick={() => setAvatar("")}
                      className="text-rose-600 hover:underline font-bold"
                    >
                      حذف الصورة ×
                    </button>
                  ) : <span />}
                  <span>الصورة الرمزية (اختياري)</span>
                </div>
                <input 
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="أدخل رابط صورة الموظف من مصدر خارجي..."
                  className="w-full text-right bg-gray-50 border border-gray-100 focus:bg-white focus:border-[#1e3a8a] rounded-md px-3 py-2 text-[11px] font-semibold outline-none transition-all"
                />
                <div className="flex justify-between items-center px-1">
                  <label 
                    htmlFor="avatar-addon-upload" 
                    className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded font-bold transition-colors cursor-pointer"
                  >
                    تحميل ملف صورة
                  </label>
                  <button 
                    type="button"
                    onClick={handleNextAvatar}
                    className="text-[9px] text-[#1e3a8a] hover:underline font-extrabold"
                  >
                    اختر من الوجوه المسبقة ↻
                  </button>
                </div>
              </div>
            </div>

            {/* Quadrilateral full name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 px-1">اسم الموظف الرباعي</label>
              <input 
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: خالد محمد العبدالله الصالح"
                className="w-full text-right bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-medium focus:bg-white focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all outline-none"
              />
            </div>

            {/* National ID & Mobile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Phone number */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 px-1">رقم الجوال</label>
                <input 
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+966 50 123 4567"
                  className="w-full text-right bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-medium focus:bg-white focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all outline-none"
                  style={{ direction: "ltr" }}
                />
              </div>

              {/* National ID or Iqama number */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 px-1">رقم الهوية / الإقامة</label>
                <input 
                  type="number"
                  required
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="10XXXXXXXX"
                  className="w-full text-right bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-medium focus:bg-white focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all outline-none appearance-none"
                />
              </div>
            </div>

            {/* Employee ID Number Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 px-1">الرقم الوظيفي</label>
              <input 
                type="text"
                required
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="أرقام فقط (مثال: 4922)"
                className="w-full text-right bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-medium focus:bg-white focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all outline-none"
              />
            </div>

            {/* Join date & Job title select fields grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 px-1 mb-1 block">تاريخ الانضمام</label>
                <input 
                  type="date"
                  required
                  value={joinDate}
                  onChange={(e) => setJoinDate(e.target.value)}
                  className="w-full text-right bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-medium focus:bg-white focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 px-1 mb-1 block">المسمى الوظيفي</label>
                <select 
                  value={role}
                  required
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full text-right bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-medium focus:bg-white focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all outline-none appearance-none"
                >
                  <option value="">اختر المسمى الوظيفي</option>
                  <option value="حارس أمن">حارس أمن</option>
                  <option value="مشرف استقبال">مشرف استقبال</option>
                  <option value="حارس استقبال">حارس استقبال</option>
                  <option value="كنترول">كنترول</option>
                  <option value="مشرف وردية">مشرف وردية</option>
                  <option value="مشرفة">مشرفة</option>
                  <option value="حارسة">حارسة</option>
                  <option value="منسق">منسق</option>
                  <option value="مشرف عام الإدارة">مشرف عام الإدارة</option>
                  <option value="مشرف عام المشروع">مشرف عام المشروع</option>
                </select>
              </div>
            </div>

            {/* Branch & Status Selector block */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 px-1 block font-arabic">الفرع الأول / الموقع التشغيلي الرئيسي</label>
                  <input 
                    type="text"
                    required
                    list="branches-datalist"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="ابحث أو اختر اسم الفرع الأول"
                    className="w-full text-right bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-semibold focus:bg-white focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-700 px-1 block font-arabic">الفرع الثاني / وردية إضافية (اختياري)</label>
                  <input 
                    type="text"
                    list="branches-datalist"
                    value={department2}
                    onChange={(e) => setDepartment2(e.target.value)}
                    placeholder="اسم الفرع الإضافي إن وجد"
                    className="w-full text-right bg-amber-50/20 border border-amber-100/50 rounded-xl px-4 py-3 text-xs font-semibold focus:bg-white focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all outline-none text-amber-950 placeholder-amber-700/40"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 px-1 block">الحالة</label>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full text-right bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold text-gray-700 focus:bg-white focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all outline-none appearance-none"
                >
                  <option value="active">نشط ومناوب</option>
                  <option value="on_leave">في إجازة</option>
                  <option value="resigned">استقالة</option>
                  <option value="terminated">إنهاء خدمات</option>
                  <option value="transferred">حول</option>
                  <option value="transferred_from">محول</option>
                </select>
              </div>

              <datalist id="branches-datalist">
                <option value="الادارة" />
                <option value="العقارية" />
                <option value="الهاتف الجديد" />
                <option value="الهاتف الناس سيدات" />
                <option value="العقارية وقفات" />
                <option value="النفل" />
                <option value="النفل التميز" />
                <option value="مركز المبيعات" />
                <option value="الملقا" />
                <option value="الملقاستان" />
                <option value="التحلية" />
                <option value="النرجس" />
                <option value="القيروان" />
                <option value="التخصصي الجديد" />
                <option value="التخصصي سيدات" />
                <option value="ظهرة البديعة" />
                <option value="البديعة سيدات" />
                <option value="الضباب" />
                <option value="الشفاء" />
                <option value="المرسلات" />
                <option value="استثمار المرسلات" />
                <option value="الرائد" />
                <option value="الشميسي" />
                <option value="الخليج" />
                <option value="الربوة" />
                <option value="اشبيليا" />
                <option value="ظهرة لبن" />
                <option value="الريان" />
                <option value="حوالات الصناعية الثانية" />
                <option value="حوالات فيلاجيو" />
                <option value="حوالات العارض" />
                <option value="النسيم" />
                <option value="مساندة المشروع" />
              </datalist>
            </div>
          </div>

          {/* Associated Documents Upload Fields */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#1e3a8a]">الوثائق والمرفقات</h3>
            <div className="grid grid-cols-2 gap-3">
              
              {/* National ID file upload Area */}
              <div className={`group relative border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer text-center ${
                hasIdDoc 
                  ? "border-green-500 bg-green-50/50" 
                  : "border-gray-200 hover:border-[#1e3a8a] bg-white"
              }`}>
                <input 
                  type="file" 
                  accept=".pdf, image/*"
                  onChange={handleIdUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                {hasIdDoc ? (
                  <>
                    <Check className="w-8 h-8 text-green-600" />
                    <span className="text-[10px] font-bold text-green-800">صورة الهوية مضافة</span>
                    <span className="text-[9px] text-green-600 truncate max-w-full block px-2">{idDocName}</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-8 h-8 text-gray-400 group-hover:text-[#1e3a8a] transition-colors" />
                    <span className="text-[10px] font-bold text-gray-700">صورة الهوية</span>
                    <span className="text-[8px] text-gray-400">PDF أو صور (بحد أقصى 5MB)</span>
                  </>
                )}
              </div>

              {/* Security Scan File upload area */}
              <div className={`group relative border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer text-center ${
                hasSecurityDoc 
                  ? "border-green-500 bg-green-50/50" 
                  : "border-gray-200 hover:border-[#1e3a8a] bg-white"
              }`}>
                <input 
                  type="file" 
                  accept=".pdf, image/*"
                  onChange={handleSecurityUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                {hasSecurityDoc ? (
                  <>
                    <Check className="w-8 h-8 text-green-600" />
                    <span className="text-[10px] font-bold text-green-800">الملف الأمني مضاف</span>
                    <span className="text-[9px] text-green-600 truncate max-w-full block px-2">{securityDocName}</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-8 h-8 text-gray-400 group-hover:text-[#1e3a8a] transition-colors" />
                    <span className="text-[10px] font-bold text-gray-700">الملف الأمني</span>
                    <span className="text-[8px] text-gray-400">PDF أو صور (بحد أقصى 5MB)</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Submitting Actions footer */}
          <div className="flex flex-col gap-2 pt-4">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full text-white font-bold text-sm h-14 rounded-xl shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 bg-[#1e3a8a] disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>جاري حفظ البيانات...</span>
              ) : (
                <>
                  <Save className="w-4 h-4 ml-1" />
                  <span>حفظ بيانات الموظف الجديد</span>
                </>
              )}
            </button>

            <button 
              type="button"
              onClick={onCancel}
              className="w-full bg-[#e1e3e4]/70 hover:bg-[#e1e3e4] text-gray-600 font-bold text-xs py-3 rounded-xl transition-all"
            >
              إلغاء العملية والعودة
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
