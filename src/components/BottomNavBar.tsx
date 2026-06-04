import React from 'react';
import { Home, Calendar, User, BarChart3, UserPlus, UserX, Coins, UserMinus } from "lucide-react";
import { ViewState } from "../types";

interface BottomNavBarProps {
  activeScreen: ViewState;
  onScreenChange: (screen: ViewState) => void;
  selectedEmployeeId: string;
}

export default function BottomNavBar({ 
  activeScreen, 
  onScreenChange, 
  selectedEmployeeId
}: BottomNavBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-40 flex flex-row-reverse justify-around items-center px-1.5 py-2 bg-white border-t border-gray-150 shadow-[0_-4px_15px_rgba(0,0,0,0.05)] rounded-t-2xl">
      {/* Home tab */}
      <button 
        onClick={() => onScreenChange("dashboard")}
        className={`flex flex-col items-center justify-center py-1 px-1 transition-all duration-150 active:scale-95 ${
          activeScreen === "dashboard"
            ? "text-[#1e3a8a] bg-[#f0f4ff] rounded-xl font-bold px-2.5"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        <Home className={`w-4.5 h-4.5 ${activeScreen === "dashboard" ? "fill-current text-[#1e3a8a]" : ""}`} />
        <span className="text-[9px] mt-1 font-black select-none">الرئيسية</span>
      </button>

      {/* Vacations Tab */}
      <button 
        onClick={() => onScreenChange("vacations")}
        className={`flex flex-col items-center justify-center py-1 px-1 transition-all duration-150 active:scale-95 ${
          activeScreen === "vacations"
            ? "text-amber-700 bg-amber-50 rounded-xl font-bold px-2.5"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        <Calendar className={`w-4.5 h-4.5 ${activeScreen === "vacations" ? "text-amber-700 font-bold" : ""}`} />
        <span className="text-[9px] mt-1 font-black select-none">الإجازات</span>
      </button>

      {/* Absences Tab */}
      <button 
        onClick={() => onScreenChange("absences")}
        className={`flex flex-col items-center justify-center py-1 px-1 transition-all duration-150 active:scale-95 ${
          activeScreen === "absences"
            ? "text-rose-700 bg-rose-50 rounded-xl font-bold px-2.5"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        <UserX className={`w-4.5 h-4.5 ${activeScreen === "absences" ? "text-rose-700 font-bold" : ""}`} />
        <span className="text-[9px] mt-1 font-black select-none">الغيابات</span>
      </button>

      {/* Leave Dues "مستحقات" Tab */}
      <button 
        onClick={() => onScreenChange("leave-dues")}
        className={`flex flex-col items-center justify-center py-1 px-1 transition-all duration-150 active:scale-95 ${
          activeScreen === "leave-dues"
            ? "text-emerald-700 bg-emerald-50 rounded-xl font-bold px-2.5"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        <Coins className={`w-4.5 h-4.5 ${activeScreen === "leave-dues" ? "text-emerald-700 font-bold" : ""}`} />
        <span className="text-[9px] mt-1 font-black select-none">المستحقات</span>
      </button>

      {/* Add Employee Tab */}
      <button 
        onClick={() => onScreenChange("add")}
        className={`flex flex-col items-center justify-center py-1 px-1 transition-all duration-150 active:scale-95 ${
          activeScreen === "add"
            ? "text-[#1e3a8a] bg-[#f0f4ff] rounded-xl font-bold px-2.5"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        <UserPlus className={`w-4.5 h-4.5 ${activeScreen === "add" ? "fill-current text-[#1e3a8a]" : ""}`} />
        <span className="text-[9px] mt-1 font-black select-none">جديد</span>
      </button>

      {/* Termination tab */}
      <button 
        onClick={() => onScreenChange("termination")}
        className={`flex flex-col items-center justify-center py-1 px-1 transition-all duration-150 active:scale-95 ${
          activeScreen === "termination"
            ? "text-red-700 bg-red-50 rounded-xl font-bold px-2.5"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        <UserMinus className={`w-4.5 h-4.5 ${activeScreen === "termination" ? "text-red-700 font-bold" : ""}`} />
        <span className="text-[9px] mt-1 font-black select-none">إنهاء الخدمات</span>
      </button>

      {/* Statistics tab */}
      <button 
        onClick={() => onScreenChange("statistics")}
        className={`flex flex-col items-center justify-center py-1 px-1 transition-all duration-150 active:scale-95 ${
          activeScreen === "statistics"
            ? "text-[#1e3a8a] bg-[#f0f4ff] rounded-xl font-bold px-2.5"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        <BarChart3 className="w-4.5 h-4.5" />
        <span className="text-[9px] mt-1 font-black select-none">الإحصائيات</span>
      </button>
    </nav>
  );
}
