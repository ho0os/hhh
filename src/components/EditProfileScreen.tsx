import React, { useState } from "react";
import { ArrowRight, Save, Camera, User, Briefcase, Calendar, MessageSquareText, Check, AlertCircle, CreditCard, Shield, Upload } from "lucide-react";
import { Employee } from "../types";

interface EditProfileScreenProps {
  employee: Employee;
  onSave: (updated: Employee, originalId: string) => void;
  onCancel: () => void;
  onTriggerWhatsApp: (employee: Employee) => void;
}

export default function EditProfileScreen({
  employee,
  onSave,
  onCancel,
  onTriggerWhatsApp
}: EditProfileScreenProps) {
  // Controlled fields state
  const [name, setName] = useState(employee.name);
  const [role, setRole] = useState(employee.role);
  const [joinDate, setJoinDate] = useState(employee.joinDate);
  const [nationalIdExpiry, setNationalIdExpiry] = useState(employee.nationalIdExpiry);
  const [department, setDepartment] = useState(employee.department);
  const [department2, setDepartment2] = useState(employee.department2 || "");
  const [status, setStatus] = useState<string>(employee.status);
  const [avatar, setAvatar] = useState(employee.avatar);
  const [phone, setPhone] = useState(employee.phone || "");
  const [leaveStartDate, setLeaveStartDate] = useState(employee.leaveStartDate || "");
  const [leaveEndDate, setLeaveEndDate] = useState(employee.leaveEndDate || "");
  
  // Custom uploaded scans state & editable employee ID state
  const [idNumber, setIdNumber] = useState(employee.id);
  const [nationalIdImage, setNationalIdImage] = useState(employee.nationalIdImage || "");
  const [securityDocImage, setSecurityDocImage] = useState(employee.securityDocImage || "");
  const [idDocName, setIdDocName] = useState(employee.nationalIdImage ? "ID_CARD_SCAN_UPLOADED.png" : "");
  const [securityDocName, setSecurityDocName] = useState(employee.securityDocImage ? "SECURITY_SCAN_UPLOADED.png" : "");
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Helper to switch avatars to test editing
  const avatarsList: string[] = [];

  const handleNextAvatar = () => {
    const currentIndex = avatar ? avatarsList.indexOf(avatar) : -1;
    const nextIndex = (currentIndex + 1) % avatarsList.length;
    setAvatar(avatarsList[nextIndex]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    setTimeout(() => {
      onSave({
        ...employee,
        id: idNumber,
        name,
        role,
        joinDate,
        nationalIdExpiry,
        department,
        department2: department2 || undefined,
        status: status as any,
        avatar,
        phone,
        leaveStartDate: status === "on_leave" ? leaveStartDate : undefined,
        leaveEndDate: status === "on_leave" ? leaveEndDate : undefined,
        nationalIdImage: nationalIdImage || undefined,
        securityDocImage: securityDocImage || undefined
      }, employee.id);
      setIsSaving(false);
      setSaveSuccess(true);
    }, 1200);
  };

  const initials = name.split(" ").slice(0, 2).map(n => n[0]).join(" ");

  return (
    <div className="pb-24 pt-4 px-4 bg-[#f8f9fa] min-h-screen">
      {/* Top Header Bar */}
      <header className="flex flex-row justify-between items-center h-16 w-full mb-4">
        <div>
          <button 
            type="button"
            onClick={handleSubmit}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-50 hover:bg-blue-100 text-[#1e3a8a] shadow-sm transition-transform active:scale-95 border border-blue-100"
          >
            <Save className="w-5 h-5" />
          </button>
        </div>
        <h1 className="font-sans text-base font-bold text-[#1e3a8a]">تعديل بيانات موظف</h1>
        <button 
          type="button"
          onClick={onCancel}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 text-[#1e3a8a] shadow-sm transition-transform active:scale-95"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </header>

      <main className="max-w-lg mx-auto">
        {/* Profile Header Image Area */}
        <section className="flex flex-col items-center mb-6">
          <div className="relative group select-none">
            <div className="w-24 h-24 rounded-full overflow-hidden shadow-md">
              {avatar ? (
                <img 
                  src={avatar} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-sky-100 text-[#1e3a8a] font-extrabold flex items-center justify-center text-lg">
                  {initials || "م و"}
                </div>
              )}
            </div>
            
            {/* hidden file uploader */}
            <input 
              type="file"
              id="avatar-upload-input"
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
              htmlFor="avatar-upload-input"
              className="absolute bottom-0 left-0 bg-[#1e3a8a] text-white p-2 rounded-full shadow-lg border-2 border-white active:scale-90 transition-all hover:bg-[#152a63] cursor-pointer"
              title="تحميل صورة من جهازك"
            >
              <Camera className="w-4 h-4" />
            </label>
          </div>

          {/* Add custom URL or local picker options */}
          <div className="mt-4 w-full bg-white p-3.5 rounded-xl border border-gray-100 space-y-2 text-right">
            <div className="flex justify-between items-center text-[10px] font-bold text-[#1e3a8a] px-1">
              <button 
                type="button" 
                onClick={() => setAvatar("")}
                className="text-rose-600 hover:underline font-bold"
              >
                إزالة الصورة الرمزية ×
              </button>
              <span>تعديل أو إلحاق صورة الموظف</span>
            </div>
            
            <div className="flex gap-2">
              <input 
                type="text"
                value={avatar || ""}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="أدخل رابط الصورة من مصدر خارجي..."
                className="w-full text-right bg-gray-50 border border-gray-100 focus:bg-white focus:border-[#1e3a8a] rounded-lg px-2.5 py-1.5 text-[11px] font-medium outline-none transition-all"
              />
            </div>
            <div className="flex justify-between items-center gap-1 px-1">
              <label 
                htmlFor="avatar-upload-input" 
                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md font-bold transition-colors cursor-pointer select-none"
              >
                تحميل ملف صورة جديد
              </label>
              <button 
                type="button"
                onClick={handleNextAvatar}
                className="text-[10px] text-gray-500 hover:text-[#1e3a8a] font-bold"
              >
                أو اختر من الوجوه المسبقة ↻
              </button>
            </div>
          </div>

          <div className="mt-3 text-center">
            <p className="font-sans text-base font-bold text-gray-800">{name || "اسم الموظف"}</p>
            <p className="text-[10px] text-gray-400 font-medium">رقم الموظف: #{employee.id}</p>
          </div>
        </section>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-right">
          
          {/* Section 1: Personal Info */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 space-y-4">
            <div className="flex items-center gap-2 mb-2 justify-end text-[#1e3a8a] border-b border-gray-50 pb-2">
              <h2 className="text-xs font-bold text-[#1e3a8a]">المعلومات الشخصية</h2>
              <User className="w-4 h-4 text-[#1e3a8a]" />
            </div>

            {/* Employee Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 px-1">الاسم الكامل</label>
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أدخل الاسم الرباعي"
                className="w-full text-right bg-gray-50/70 border-none focus:bg-white focus:ring-1 focus:ring-[#1e3a8a] rounded-xl px-4 py-3 text-xs font-medium transition-all"
                required
              />
            </div>

            {/* Mobile / Phone number editing */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 px-1">رقم الجوال</label>
              <input 
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+966 50 123 4567"
                className="w-full text-right bg-gray-50/70 border-none focus:bg-white focus:ring-1 focus:ring-[#1e3a8a] rounded-xl px-4 py-3 text-xs font-medium transition-all"
                style={{ direction: "ltr" }}
                required
              />
            </div>

            {/* Secondary fields row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 px-1">الرقم الوظيفي</label>
                <input 
                  type="text"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder="رقم فقط"
                  className="w-full text-right bg-gray-50/70 border-none focus:bg-white focus:ring-1 focus:ring-[#1e3a8a] rounded-xl px-4 py-3 text-xs font-medium transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 px-1 font-arabic">تاريخ الالتحاق</label>
                <input 
                  type="date"
                  value={joinDate}
                  onChange={(e) => setJoinDate(e.target.value)}
                  className="w-full text-right bg-gray-50/70 border-none focus:bg-white focus:ring-1 focus:ring-[#1e3a8a] rounded-xl px-4 py-3 text-xs font-medium transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Job Details */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 space-y-4">
            <div className="flex items-center gap-2 mb-2 justify-end text-[#1e3a8a] border-b border-gray-50 pb-2">
              <h2 className="text-xs font-bold text-[#1e3a8a]">تفاصيل الوظيفة والعمل</h2>
              <Briefcase className="w-4 h-4 text-[#1e3a8a]" />
            </div>

            {/* Job Title Select Option */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 px-1 font-arabic">المسمى الوظيفي</label>
              <select 
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full text-right bg-gray-50/70 border-none focus:bg-white focus:ring-1 focus:ring-[#1e3a8a] rounded-xl px-4 py-3 text-xs font-medium transition-all appearance-none"
              >
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

            {/* Primary & Secondary Branch (الفرع) inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 px-1 block">الفرع الرئيسي الأول</label>
                <input 
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="أدخل اسم الفرع الأول"
                  className="w-full text-right bg-gray-50/70 border-none focus:bg-white focus:ring-1 focus:ring-[#1e3a8a] rounded-xl px-4 py-3 text-xs font-semibold overflow-ellipsis transition-all"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-amber-700 px-1">الفرع الثاني / وردية إضافية (اختياري)</label>
                <input 
                  type="text"
                  value={department2}
                  onChange={(e) => setDepartment2(e.target.value)}
                  placeholder="اسم الفرع الإضافي إن وجد"
                  className="w-full text-right bg-amber-50/25 border-none focus:bg-white focus:ring-1 focus:ring-[#1e3a8a] rounded-xl px-4 py-3 text-xs font-semibold transition-all text-amber-950 placeholder-amber-700/40"
                />
              </div>
            </div>

            {/* Employment Status Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 px-1">الحالة</label>
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-right bg-gray-50/70 border-none focus:bg-white focus:ring-1 focus:ring-[#1e3a8a] rounded-xl px-4 py-3 text-xs font-bold text-gray-700 transition-all appearance-none"
              >
                <option value="active">نشط ومناوب</option>
                <option value="on_leave">في إجازة</option>
                <option value="resigned">استقالة</option>
                <option value="terminated">إنهاء خدمات</option>
                <option value="transferred">حول</option>
                <option value="transferred_from">محول</option>
              </select>

              {/* Vacation Dates from/to (الاجازة من تاريخ الى تاريخ) */}
              {status === "on_leave" && (
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 mt-3 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 px-1">من تاريخ</label>
                    <input 
                      type="date"
                      value={leaveStartDate}
                      onChange={(e) => setLeaveStartDate(e.target.value)}
                      className="w-full text-right bg-gray-50/70 border border-gray-100 focus:bg-white focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] rounded-xl px-3 py-2 text-xs font-medium transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 px-1">إلى تاريخ</label>
                    <input 
                      type="date"
                      value={leaveEndDate}
                      onChange={(e) => setLeaveEndDate(e.target.value)}
                      className="w-full text-right bg-gray-50/70 border border-gray-100 focus:bg-white focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] rounded-xl px-3 py-2 text-xs font-medium transition-all"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Associated Documents Upload Fields */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 space-y-4">
            <div className="flex items-center gap-2 mb-2 justify-end text-[#1e3a8a] border-b border-gray-50 pb-2">
              <h2 className="text-xs font-bold text-[#1e3a8a]">الوثائق والمرفقات</h2>
              <Upload className="w-4 h-4 text-[#1e3a8a]" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* National ID file upload Area */}
              <div className={`group relative border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer text-center ${
                nationalIdImage 
                  ? "border-green-500 bg-green-50/50" 
                  : "border-gray-200 hover:border-[#1e3a8a] bg-white"
              }`}>
                <input 
                  type="file" 
                  accept=".pdf, image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setIdDocName(file.name);
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setNationalIdImage(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                {nationalIdImage ? (
                  <>
                    <Check className="w-8 h-8 text-green-600" />
                    <span className="text-[10px] font-bold text-green-800">صورة الهوية الوطنية</span>
                    <span className="text-[9px] text-green-600 truncate max-w-full block px-2 leading-none">{idDocName}</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-8 h-8 text-gray-400 group-hover:text-[#1e3a8a] transition-colors" />
                    <span className="text-[10px] font-bold text-gray-700">تعديل صورة الهوية</span>
                    <span className="text-[8px] text-gray-400 font-sans">اختر ملف صورة أو PDF للرفع</span>
                  </>
                )}
              </div>

              {/* Security Scan File upload area */}
              <div className={`group relative border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer text-center ${
                securityDocImage 
                  ? "border-green-500 bg-green-50/50" 
                  : "border-gray-200 hover:border-[#1e3a8a] bg-white"
              }`}>
                <input 
                  type="file" 
                  accept=".pdf, image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSecurityDocName(file.name);
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setSecurityDocImage(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                {securityDocImage ? (
                  <>
                    <Check className="w-8 h-8 text-green-600" />
                    <span className="text-[10px] font-bold text-green-800">الملف الأمني المعتمد</span>
                    <span className="text-[9px] text-green-600 truncate max-w-full block px-2 leading-none">{securityDocName}</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-8 h-8 text-gray-400 group-hover:text-[#1e3a8a] transition-colors" />
                    <span className="text-[10px] font-bold text-gray-700">تعديل الملف الأمني</span>
                    <span className="text-[8px] text-gray-400 font-sans">اختر ملف صورة أو PDF للرفع</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action trigger buttons */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            <button 
              type="button"
              onClick={onCancel}
              className="py-4 rounded-xl border border-gray-200 text-gray-500 bg-white hover:bg-gray-50 font-bold text-sm active:scale-95 transition-all"
            >
              إلغاء العملية
            </button>
            <button 
              type="submit"
              disabled={isSaving}
              style={{ backgroundColor: "#1e3a8a" }} 
              className="py-4 rounded-xl text-white font-bold text-sm shadow-md hover:bg-[#152a63] transition-colors flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isSaving ? "جاري الحفظ..." : "تحديث البيانات المعتمدة"}
            </button>
          </div>

          {saveSuccess && (
            <div className="bg-green-50 p-4 border border-green-200 rounded-xl flex items-center justify-between text-green-800 text-xs">
              <Check className="w-5 h-5 text-green-600 font-bold" />
              <span>تم تحديث ملف الموظف بنجاح!</span>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
