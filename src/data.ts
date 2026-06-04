import { Employee, EmployeeDocument, MessageTemplate } from "./types";

export const initialEmployees: Employee[] = [
  {
    id: "EMP-2024-089",
    name: "أحمد محمود الكناني",
    avatar: null,
    role: "مدير نظم المعلومات",
    nationalId: "1098237456",
    nationalIdExpiry: "2028-10-14",
    phone: "+966 50 123 4567",
    joinDate: "2019-09-15",
    status: "active",
    department: "الادارة",
    certified: true,
    auditLog: [
      {
        id: "hist-1",
        field: "role",
        fieldNameAr: "المسمى الوظيفي",
        oldValue: "مهندس حلول تقنية أول",
        newValue: "مدير نظم المعلومات",
        timestamp: "2025-11-20T10:30:00Z",
        updatedBy: "hosan66@gmail.com"
      },
      {
        id: "hist-2",
        field: "department",
        fieldNameAr: "القسم / الإدارة",
        oldValue: "العمليات الفنية",
        newValue: "الإدارة",
        timestamp: "2025-11-20T10:30:00Z",
        updatedBy: "hosan66@gmail.com"
      }
    ]
  },
  {
    id: "EMP-4829",
    name: "أحمد محمد العلي",
    avatar: null,
    role: "مهندس برمجيات أول",
    nationalId: "1082349921",
    nationalIdExpiry: "2025-10-15",
    phone: "+966 55 987 6543",
    joinDate: "2021-05-12",
    status: "active",
    department: "الادارة",
    certified: true,
    auditLog: [
      {
        id: "hist-3",
        field: "status",
        fieldNameAr: "الحالة الوظيفية",
        oldValue: "في إجازة",
        newValue: "نشط ومناوب",
        timestamp: "2026-04-10T14:15:22Z",
        updatedBy: "hosan66@gmail.com"
      }
    ]
  },
  {
    id: "EMP-4592",
    name: "محمد أحمد علي",
    avatar: null,
    role: "مشرف استقبال",
    nationalId: "1043219876",
    nationalIdExpiry: "2026-07-20",
    phone: "+966 53 456 7891",
    joinDate: "2020-01-10",
    status: "active",
    department: "العقارية",
    certified: false
  },
  {
    id: "EMP-4593",
    name: "سارة خالد التميمي",
    avatar: null,
    role: "مشرفة استقبال",
    nationalId: "1034567890",
    nationalIdExpiry: "2026-03-30",
    phone: "+966 54 112 2334",
    joinDate: "2022-08-01",
    status: "active",
    department: "الهاتف الجديد",
    certified: false
  },
  {
    id: "EMP-4594",
    name: "عبدالله منصور",
    avatar: null,
    role: "كنترول",
    nationalId: "1078901234",
    nationalIdExpiry: "2026-06-15",
    phone: "+966 56 321 6549",
    joinDate: "2023-11-20",
    status: "absent",
    department: "الشفاء",
    certified: false
  },
  {
    id: "EMP-8021",
    name: "خالد بن محمد الحربي",
    avatar: null,
    role: "حارس أمن",
    nationalId: "1065432198",
    nationalIdExpiry: "2027-11-12",
    phone: "+966 50 111 2223",
    joinDate: "2024-02-15",
    status: "active",
    department: "الملقا",
    certified: true
  },
  {
    id: "EMP-8022",
    name: "فيصل سعد الدوسري",
    avatar: null,
    role: "مشرف وردية",
    nationalId: "1054321987",
    nationalIdExpiry: "2028-01-20",
    phone: "+966 55 222 3334",
    joinDate: "2023-05-10",
    status: "active",
    department: "الريان",
    certified: true
  },
  {
    id: "EMP-8023",
    name: "تركي فهد المطيري",
    avatar: null,
    role: "حارس أمن",
    nationalId: "1043219875",
    nationalIdExpiry: "2026-09-05",
    phone: "+966 54 333 4445",
    joinDate: "2022-10-01",
    status: "on_leave",
    department: "النرجس",
    leaveStartDate: "2026-05-20",
    leaveEndDate: "2026-06-20",
    certified: false
  },
  {
    id: "EMP-8024",
    name: "نواف صالح القحطاني",
    avatar: null,
    role: "حارس أمن",
    nationalId: "1032198765",
    nationalIdExpiry: "2027-04-18",
    phone: "+966 56 444 5556",
    joinDate: "2024-08-01",
    status: "active",
    department: "التخصصي الجديد",
    certified: true
  }
];

export const initialDocuments: EmployeeDocument[] = [
  {
    id: "DOC-001",
    title: "نسخة الهوية الوطنية",
    fileName: "ID_CARD_SCAN_2024.PDF",
    fileSize: "4.2 ميجابايت",
    securityLevel: "خاص ومحمي",
    badgeType: "id_card",
    lastUpdated: "12 أكتوبر 2023",
    previewName: "أحمد بن محمد العتيبي",
    previewId: "١٠٨٢٣٤٩٩٢١",
    previewBirthdate: "١٤٠٨/٠٥/١٢ هـ",
    previewExpiry: "١٤٤٧/٠٩/٠1 هـ",
    previewImage: null
  },
  {
    id: "DOC-002",
    title: "ملف المسح الأمني",
    fileName: "SECURITY_FILE_CONFIDENTIAL.PDF",
    fileSize: "5.1 ميجابايت",
    securityLevel: "خاص ومحمي",
    badgeType: "security_file",
    lastUpdated: "04 يناير 2024",
    previewName: "أحمد محمود الكناني",
    previewId: "١٠٩٨٢٣٧٤٥٦",
    previewBirthdate: "١٤١٠/٠٨/١٨ هـ",
    previewExpiry: "١٤٥٠/١٠/١٤ هـ",
    previewImage: null
  }
];

export const messageTemplates: MessageTemplate[] = [
  {
    id: "id_renewal",
    title: "تذكير بتجديد الهوية",
    textTemplate: "عزيزي [اسم الموظف]، نود تذكيركم بأن تاريخ صلاحية هويتكم الوطنية ينتهي بتاريخ [تاريخ انتهاء الهوية]. يرجى التكرم بتجديدها وتزويد قسم الموارد البشرية بنسخة محدثة."
  },
  {
    id: "missing_docs",
    title: "طلب مستندات ناقصة",
    textTemplate: "تحية طيبة [اسم الموظف]، يرجى تزويدنا بالمستندات الناقصة (شهادة التخرج، نسخة الجواز، شهادة الخبرة) في أقرب وقت ممكن لتحديث ملفكم الوظيفي."
  },
  {
    id: "update_info",
    title: "تحديث البيانات الشخصية",
    textTemplate: "عزيزي [اسم الموظف]، يرجى التكرم بتحديث بياناتك الشخصية (العنوان الحالي، رقم التواصل، جهة الاتصال في حالات الطوارئ) عبر بوابة الموظف لضمان دقة سجلاتنا."
  }
];
