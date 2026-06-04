import React, { useState } from "react";
import { MessageSquareText, Send, X } from "lucide-react";
import { Employee, MessageTemplate } from "../types";
import { messageTemplates } from "../data";

interface WhatsAppSheetProps {
  employee: Employee;
  onClose: () => void;
  onSendSuccess: (message: string) => void;
}

export default function WhatsAppSheet({ employee, onClose, onSendSuccess }: WhatsAppSheetProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("id_renewal");
  const [isSending, setIsSending] = useState(false);

  // Helper to parse dates nicely in Arabic
  const formatExpiryDateArabic = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
      return date.toLocaleDateString("ar-EG", options);
    } catch {
      return dateStr;
    }
  };

  const getParsedMessage = (templateText: string) => {
    let text = templateText;
    text = text.replace("[اسم الموظف]", employee.name);
    
    const arExpiry = formatExpiryDateArabic(employee.nationalIdExpiry);
    text = text.replace("[تاريخ انتهاء الهوية]", arExpiry);
    return text;
  };

  const handleSend = () => {
    const template = messageTemplates.find(t => t.id === selectedTemplateId);
    if (!template) return;

    const message = getParsedMessage(template.textTemplate);
    
    setIsSending(true);
    setTimeout(() => {
      // Simulate WhatsApp trigger
      const encodedMsg = encodeURIComponent(message);
      const cleanPhone = employee.phone.replace(/[\s+]/g, "");
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
      
      // Attempt safe window opening
      try {
        window.open(waUrl, "_blank", "noopener,noreferrer");
      } catch (err) {
        console.log("iFrame blocked window.open, fallback to simulated execution:", err);
      }

      setIsSending(false);
      onSendSuccess(message);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-auto">
      {/* Overlay Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity" 
        id="backdrop"
        onClick={onClose}
      />

      {/* Bottom Sheet Container */}
      <div 
        className="relative z-10 w-full max-w-lg bg-white rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh] pb-8 animate-slide-up"
        id="bottomSheet"
      >
        {/* Drag Handle & Header */}
        <div className="flex flex-col items-center pt-3 pb-4 px-4 border-b border-gray-100">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-4"></div>
          <div className="flex items-center justify-between w-full">
            <button 
              className="p-2 hover:bg-gray-100 rounded-full transition-colors order-last"
              onClick={onClose}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <h1 className="font-sans text-lg font-bold text-[#00236f] text-right flex-1 select-none pr-1">
              نماذج رسائل واتساب
            </h1>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-4">
          <p className="text-sm font-medium text-gray-500 text-right pr-1">
            اختر نموذج الرسالة المناسب لإرساله للموظف:
          </p>

          {/* Template cards */}
          <div className="space-y-3">
            {messageTemplates.map((template) => {
              const parsedText = getParsedMessage(template.textTemplate);
              const isSelected = selectedTemplateId === template.id;

              return (
                <label 
                  key={template.id}
                  className={`relative flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all hover:bg-gray-50 active:scale-[0.99] ${
                    isSelected 
                      ? "border-[#1e3a8a] bg-[#f0f4ff] ring-1 ring-[#1e3a8a]" 
                      : "border-gray-200"
                  }`}
                >
                  <input 
                    type="radio" 
                    name="message_template" 
                    checked={isSelected}
                    onChange={() => setSelectedTemplateId(template.id)}
                    className="mt-1 h-4 w-4 text-[#1e3a8a] border-gray-300 focus:ring-[#1e3a8a]" 
                  />
                  <div className="flex flex-col text-right flex-1 pr-1">
                    <span className="text-sm font-bold text-[#00236f] mb-1">
                      {template.title}
                    </span>
                    <p className="text-xs text-gray-600 leading-relaxed font-normal">
                      {/* Highlight parameters in green */}
                      {template.textTemplate.split(/(\[اسم الموظف\]|\[تاريخ انتهاء الهوية\])/g).map((part, idx) => {
                        if (part === "[اسم الموظف]") {
                          return <span key={idx} className="font-bold text-green-700">{employee.name}</span>;
                        } else if (part === "[تاريخ انتهاء الهوية]") {
                          return <span key={idx} className="font-bold text-green-700">{formatExpiryDateArabic(employee.nationalIdExpiry)}</span>;
                        } else {
                          return part;
                        }
                      })}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Context Info */}
          <div className="bg-green-50/70 p-4 rounded-xl flex gap-3 items-center border border-green-100">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-[#25D366]">
              <MessageSquareText className="w-5 h-5 fill-current" />
            </div>
            <p className="text-xs text-green-800 font-medium text-right leading-relaxed flex-1">
              سيتم فتح تطبيق واتساب مباشرة مع النص المحدد الموجه للموظف.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 pt-4 border-t border-gray-100 bg-white grid grid-cols-1 gap-2">
          <button 
            disabled={isSending}
            onClick={handleSend}
            className="w-full h-12 bg-[#1e3a8a] hover:bg-[#152a63] text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
          >
            {isSending ? (
              <span className="animate-spin text-white">...</span>
            ) : (
              <Send className="w-5 h-5 rotate-180" />
            )}
            <span>إرسال عبر واتساب</span>
          </button>
          
          <button 
            onClick={onClose}
            className="w-full h-12 bg-transparent text-gray-500 font-bold border border-gray-200 rounded-xl active:scale-95 transition-transform hover:bg-gray-50"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
