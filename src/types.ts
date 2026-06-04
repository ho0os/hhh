export interface AuditLogEntry {
  id: string;
  field: string; // The edited field, e.g., "department", "role", "status", etc.
  fieldNameAr: string; // Arabic name of high-level field
  oldValue: string;
  newValue: string;
  timestamp: string; // ISO String 
  updatedBy: string; // E.g., "hosan66@gmail.com" from user metadata
}

export interface EmployeeAttachment {
  id: string;
  name: string;
  url?: string; // base64 or file preview URI
  fileType: string;
  fileSize?: string;
  uploadDate: string;
}

export interface Employee {
  id: string; // e.g. "EMP-2024-089" or "4829"
  name: string;
  avatar: string | null;
  role: string;
  nationalId: string;
  nationalIdExpiry: string; // ISO date "YYYY-MM-DD" or similar representation
  phone: string;
  joinDate: string; // ISO date "YYYY-MM-DD"
  status: "active" | "on_leave" | "resigned" | "terminated" | "transferred" | "transferred_from" | "absent";
  department: string;
  department2?: string; // Secondary branch/department for double shift
  certified: boolean;
  accumulatedAbsences?: number;
  leaveStartDate?: string;
  leaveEndDate?: string;
  nationalIdImage?: string;
  securityDocImage?: string;
  leaveDuesRequested?: boolean;
  leaveDuesRequestedDate?: string;
  leaveDuesStatus?: "received" | "not_received";
  leaveDuesSalary?: number;
  leaveDuesDays?: number;
  leaveDuesReceivedYear?: string;
  auditLog?: AuditLogEntry[];
  attachments?: EmployeeAttachment[];
}

export interface EmployeeDocument {
  id: string;
  title: string;
  fileName: string;
  fileSize: string;
  securityLevel: string;
  badgeType: "id_card" | "security_file" | "doc";
  lastUpdated: string;
  previewName: string; // Name for ID card representation
  previewId: string; // ID for representation
  previewBirthdate: string;
  previewExpiry: string;
  previewImage: string;
}

export interface MessageTemplate {
  id: string;
  title: string;
  textTemplate: string; // placeholder [اسم الموظف] and [تاريخ انتهاء الهوية]
}

export type ViewState = "dashboard" | "profile" | "add" | "edit" | "preview-doc" | "app-info" | "all-employees" | "absences" | "vacations" | "leave-dues" | "employee-data" | "locations" | "locations-admin" | "locations-branches" | "termination" | "statistics";
