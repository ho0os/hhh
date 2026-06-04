import React, { useState, useEffect } from "react";
import { Employee, EmployeeDocument, ViewState, AuditLogEntry } from "./types";
import { initialEmployees, initialDocuments } from "./data";
// @ts-ignore
import sscoLogo from "./assets/images/ssco_logo_1779881766509.png";

// Firebase integrations
import { db, OperationType, handleFirestoreError } from "./firebase";
import { collection, doc, setDoc, deleteDoc, writeBatch, onSnapshot } from "firebase/firestore";

// Sub components import
import DashboardScreen from "./components/DashboardScreen";
import ProfileScreen from "./components/ProfileScreen";
import EditProfileScreen from "./components/EditProfileScreen";
import AddEmployeeScreen from "./components/AddEmployeeScreen";
import DocPreviewScreen from "./components/DocPreviewScreen";
import AppInfoScreen from "./components/AppInfoScreen";
import AllEmployeesScreen from "./components/AllEmployeesScreen";
import AbsencesScreen from "./components/AbsencesScreen";
import VacationsScreen from "./components/VacationsScreen";
import LeaveDuesScreen from "./components/LeaveDuesScreen";
import EmployeeDataScreen from "./components/EmployeeDataScreen";
import LocationsScreen from "./components/LocationsScreen";
import TerminationScreen from "./components/TerminationScreen";
import StatisticsScreen from "./components/StatisticsScreen";
import BottomNavBar from "./components/BottomNavBar";
import WhatsAppSheet from "./components/WhatsAppSheet";
import { Check, Info, BellRing, Cloud, CloudCheck, CloudLightning } from "lucide-react";

export default function App() {
  // Local storage caching as immediate loading state
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem("hrms_employees");
      const list = saved ? JSON.parse(saved) : initialEmployees;
      return list.map((emp: Employee) => ({ ...emp, avatar: emp.avatar || sscoLogo }));
    } catch {
      return initialEmployees.map((emp) => ({ ...emp, avatar: sscoLogo }));
    }
  });

  const [documents, setDocuments] = useState<EmployeeDocument[]>(() => {
    try {
      const saved = localStorage.getItem("hrms_documents");
      const list = saved ? JSON.parse(saved) : initialDocuments;
      return list.map((doc: EmployeeDocument) => ({ ...doc, previewImage: null }));
    } catch {
      return initialDocuments.map((doc) => ({ ...doc, previewImage: null }));
    }
  });

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("EMP-2024-089");
  const [selectedDocId, setSelectedDocId] = useState<string>("DOC-001");
  const [activeScreen, setActiveScreen] = useState<ViewState>("dashboard");
  const [isVacationsExpanded, setIsVacationsExpanded] = useState<boolean>(false);
  const [isAbsencesExpanded, setIsAbsencesExpanded] = useState<boolean>(false);

  // WhatsApp template overlay states
  const [whatsAppModalEmployee, setWhatsAppModalEmployee] = useState<Employee | null>(null);

  // Floating notifications/toasts states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "info">("success");

  // Firebase connection and sync monitoring states
  const [isFirebaseLoaded, setIsFirebaseLoaded] = useState<boolean>(false);
  const [isSyncingToCloud, setIsSyncingToCloud] = useState<boolean>(false);

  // ☁️ Real-time Firestore synchronizer
  useEffect(() => {
    let isInitialized = false;

    // 1. Subscribe to Employees collection
    const unsubEmployees = onSnapshot(collection(db, "employees"), async (snapshot) => {
      const list: Employee[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Employee);
      });

      if (list.length > 0) {
        // Feed Firestore cloud data into reactive state and local cache backup
        const cleanedList = list.map(emp => ({ ...emp, avatar: emp.avatar || sscoLogo }));
        setEmployees(cleanedList);
        localStorage.setItem("hrms_employees", JSON.stringify(cleanedList));
        setIsFirebaseLoaded(true);
      } else {
        // Cloud collection is empty! Perform mandatory offline-to-cloud automatic upload
        // This propagates the user's existing dataset of up to 145 employees!
        try {
          const savedLocal = localStorage.getItem("hrms_employees");
          const localList: Employee[] = savedLocal ? JSON.parse(savedLocal) : [];
          const uploadList = localList.length > 0 ? localList : initialEmployees;
          
          if (!isInitialized && uploadList.length > 0) {
            isInitialized = true; // Guard against multiple simultaneous initialization triggers
            setIsSyncingToCloud(true);
            const batch = writeBatch(db);
            uploadList.forEach((emp) => {
              const cleanedEmp = { ...emp, avatar: emp.avatar || sscoLogo };
              batch.set(doc(db, "employees", emp.id), cleanedEmp);
            });
            await batch.commit();
            setIsSyncingToCloud(false);
            triggerToast(`تم بنجاح رفع وتحديث عدد (${uploadList.length}) موظف سحابياً لمطابقة بياناتك!`, "success");
          }
        } catch (error) {
          console.error("Failed to auto-sync offline data to Firestore:", error);
          setIsSyncingToCloud(false);
        }
        setIsFirebaseLoaded(true);
      }
    }, (error) => {
      console.error("Firestore onSnapshot employees error:", error);
      handleFirestoreError(error, OperationType.LIST, "employees");
    });

    // 2. Subscribe to Documents collection
    const unsubDocuments = onSnapshot(collection(db, "documents"), async (snapshot) => {
      const list: EmployeeDocument[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as EmployeeDocument);
      });

      if (list.length > 0) {
        setDocuments(list);
        localStorage.setItem("hrms_documents", JSON.stringify(list));
      } else {
        // Seed documents collection from backup or defaults
        try {
          const savedDocsLocal = localStorage.getItem("hrms_documents");
          const localDocs: EmployeeDocument[] = savedDocsLocal ? JSON.parse(savedDocsLocal) : [];
          const uploadDocs = localDocs.length > 0 ? localDocs : initialDocuments;
          
          if (uploadDocs.length > 0) {
            const batch = writeBatch(db);
            uploadDocs.forEach((docItem) => {
              batch.set(doc(db, "documents", docItem.id), docItem);
            });
            await batch.commit();
          }
        } catch (error) {
          console.error("Failed to seed initial documents:", error);
        }
      }
    }, (error) => {
      console.error("Firestore onSnapshot documents error:", error);
      handleFirestoreError(error, OperationType.LIST, "documents");
    });

    return () => {
      unsubEmployees();
      unsubDocuments();
    };
  }, []);

  const triggerToast = (msg: string, type: "success" | "info" = "success") => {
    setToastType(type);
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Merging utility for duplicate employee profiles
  const mergeEmployeeRecord = (existing: Employee, incoming: Employee): Employee => {
    const cleanDepts = (deptStr: string) => {
      if (!deptStr) return [];
      return deptStr.split(/[،,/\\]/).map(s => s.trim()).filter(Boolean);
    };
    const existingDepts = cleanDepts(existing.department);
    const incomingDepts = cleanDepts(incoming.department);
    const uniqueDepts = Array.from(new Set([...existingDepts, ...incomingDepts]));
    const mergedDepartment = uniqueDepts.join(" ، ");

    const cleanRoles = (roleStr: string) => {
      if (!roleStr) return [];
      return roleStr.split(/[،,/\\]/).map(s => s.trim()).filter(Boolean);
    };
    const existingRoles = cleanRoles(existing.role);
    const incomingRoles = cleanRoles(incoming.role);
    const uniqueRoles = Array.from(new Set([...existingRoles, ...incomingRoles]));
    const mergedRole = uniqueRoles.join(" / ");

    const existingAttachments = existing.attachments || [];
    const incomingAttachments = incoming.attachments || [];
    const mergedAttachments = [...existingAttachments];
    incomingAttachments.forEach(att => {
      if (!mergedAttachments.some(a => a.name === att.name)) {
        mergedAttachments.push(att);
      }
    });

    return {
      ...existing,
      ...incoming,
      id: existing.id || incoming.id,
      nationalId: existing.nationalId || incoming.nationalId,
      name: existing.name || incoming.name,
      phone: existing.phone || incoming.phone,
      department: mergedDepartment || existing.department || incoming.department,
      department2: existing.department2 || incoming.department2,
      role: mergedRole || existing.role || incoming.role,
      attachments: mergedAttachments.length > 0 ? mergedAttachments : undefined,
      accumulatedAbsences: Math.max(existing.accumulatedAbsences || 0, incoming.accumulatedAbsences || 0) || undefined
    };
  };

  // Safe universal merging tool to consolidate any duplicates currently in state and sync with Firestore
  const handleMergeAllDuplicates = async (showNotifications: boolean = true) => {
    const mergedList: Employee[] = [];
    let mergedCount = 0;
    
    employees.forEach((emp) => {
      // Find if we already have this employee in mergedList
      const duplicateIndex = mergedList.findIndex((m) => {
        // Rule 1: check national ID
        if (emp.nationalId && m.nationalId && emp.nationalId === m.nationalId && emp.nationalId !== "1000000000") {
          return true;
        }
        // Rule 2: check employee ID
        if (emp.id && m.id && emp.id.trim().toLowerCase() === m.id.trim().toLowerCase()) {
          return true;
        }
        // Rule 3: check name
        const normalizeArabic = (str: string) => {
          return str
            .trim()
            .replace(/[أإآا]/g, "ا")
            .replace(/ة/g, "ه")
            .replace(/ى/g, "ي")
            .replace(/\s+/g, "");
        };
        if (normalizeArabic(emp.name) === normalizeArabic(m.name)) {
          return true;
        }
        return false;
      });

      if (duplicateIndex > -1) {
        // Merge with duplicate we already gathered
        mergedList[duplicateIndex] = mergeEmployeeRecord(mergedList[duplicateIndex], emp);
        mergedCount++;
      } else {
        mergedList.push(emp);
      }
    });

    if (showNotifications) {
      if (mergedCount > 0) {
        triggerToast(`تم رصد ودمج عدد (${mergedCount}) سجلات لموظفين مكررة وتوحيد فروعهم وتفاصيلهم بنجاح!`, "success");
      } else {
        triggerToast(`جميع ملفات الموظفين سليمة وموحدة الحسابات، لا يوجد أي تكرار حالي!`, "info");
      }
    }

    if (mergedCount > 0) {
      try {
        const batch = writeBatch(db);
        mergedList.forEach((emp) => {
          batch.set(doc(db, "employees", emp.id), emp);
        });
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, "employees/mergeDuplicates");
      }
    }
  };

  // Actions
  const handleAddEmployee = async (newEmp: Employee) => {
    const empWithAvatar = { ...newEmp, avatar: newEmp.avatar || sscoLogo };
    
    const duplicateIndex = employees.findIndex(
      (emp) => emp.nationalId === newEmp.nationalId || emp.id === newEmp.id
    );

    let finalEmp = empWithAvatar;
    if (duplicateIndex > -1) {
      finalEmp = mergeEmployeeRecord(employees[duplicateIndex], empWithAvatar);
      setTimeout(() => triggerToast(`تم دمج بيانات الموظف المضافة مع ملفه الحالي لتكرار الرقم الوظيفي أو الهوية!`), 100);
    } else {
      setTimeout(() => triggerToast(`تمت إضافة الموظف الجديد بنجاح وتسجيله بالسحابة!`), 100);
    }

    try {
      await setDoc(doc(db, "employees", finalEmp.id), finalEmp);
      setSelectedEmployeeId(finalEmp.id);
      setActiveScreen("profile");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `employees/${finalEmp.id}`);
    }
  };

  const handleUpdateEmployee = async (updatedEmp: Employee, originalId: string) => {
    const emp = employees.find(e => e.id === originalId);
    if (!emp) return;

    // Compare fields to detect modifications and generate audit logs
    const newLogs: AuditLogEntry[] = emp.auditLog ? [...emp.auditLog] : [];
    
    const checkChange = (field: string, fieldNameAr: string, oldVal: string, newVal: string) => {
      if (oldVal !== newVal) {
        newLogs.push({
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          field,
          fieldNameAr,
          oldValue: oldVal || "—",
          newValue: newVal || "—",
          timestamp: new Date().toISOString(),
          updatedBy: "hosan66@gmail.com" // Current User Email
        });
      }
    };

    const statusMap: Record<string, string> = {
      active: "نشط ومناوب",
      on_leave: "في إجازة",
      resigned: "استقالة",
      terminated: "إنهاء خدمات",
      transferred: "حول",
      transferred_from: "محول",
      absent: "غياب بدون عذر"
    };

    const getStatusText = (st: string) => statusMap[st] || st;

    checkChange("id", "الرقم الوظيفي", emp.id, updatedEmp.id);
    checkChange("name", "اسم الموظف", emp.name, updatedEmp.name);
    checkChange("role", "المسمى الوظيفي", emp.role, updatedEmp.role);
    checkChange("department", "الفرع / القسم", emp.department, updatedEmp.department);
    checkChange("status", "الحالة الوظيفية", getStatusText(emp.status), getStatusText(updatedEmp.status));
    checkChange("phone", "رقم الجوال", emp.phone, updatedEmp.phone);
    checkChange("nationalId", "رقم الهوية الوطنية", emp.nationalId, updatedEmp.nationalId);

    const finalEmp = {
      ...updatedEmp,
      avatar: updatedEmp.avatar || sscoLogo,
      auditLog: newLogs
    };

    try {
      if (originalId !== finalEmp.id) {
        await deleteDoc(doc(db, "employees", originalId));
      }
      await setDoc(doc(db, "employees", finalEmp.id), finalEmp);
      setSelectedEmployeeId(finalEmp.id);
      setActiveScreen("profile");
      triggerToast(`تم تحديث بيانات الموظف "${finalEmp.name}" بنجاح ومزامنته بالسحابة!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `employees/${finalEmp.id}`);
    }
  };

  const handleImportExcel = async (importedList: Employee[]) => {
    const listWithAvatar = importedList.map((emp) => ({ ...emp, avatar: emp.avatar || sscoLogo }));
    
    const employeeMap: Record<string, Employee> = {};
    employees.forEach(emp => {
      const key = emp.nationalId ? `NID-${emp.nationalId}` : `ID-${emp.id}`;
      employeeMap[key] = emp;
    });

    let mergedCount = 0;

    listWithAvatar.forEach(incoming => {
      const keyByNID = incoming.nationalId ? `NID-${incoming.nationalId}` : null;
      const keyByID = incoming.id ? `ID-${incoming.id}` : null;
      
      let matchKey: string | null = null;
      if (keyByNID && employeeMap[keyByNID]) {
        matchKey = keyByNID;
      } else if (keyByID && employeeMap[keyByID]) {
        matchKey = keyByID;
      } else if (keyByNID) {
        const found = employees.find(e => e.nationalId === incoming.nationalId);
        if (found) matchKey = found.nationalId ? `NID-${found.nationalId}` : `ID-${found.id}`;
      } else if (keyByID) {
        const found = employees.find(e => e.id === incoming.id);
        if (found) matchKey = found.nationalId ? `NID-${found.nationalId}` : `ID-${found.id}`;
      }

      if (matchKey && employeeMap[matchKey]) {
        employeeMap[matchKey] = mergeEmployeeRecord(employeeMap[matchKey], incoming);
        mergedCount++;
      } else {
        const targetKey = keyByNID || keyByID || `RAND-${Math.random()}`;
        employeeMap[targetKey] = incoming;
      }
    });

    const mergedList = Object.values(employeeMap);
    
    if (mergedCount > 0) {
      setTimeout(() => triggerToast(`تم دمج وتحديث عدد (${mergedCount}) موظف مكرر بنجاح وتفادي التكرار!`, "success"), 100);
    }

    try {
      const batch = writeBatch(db);
      mergedList.forEach((emp) => {
        batch.set(doc(db, "employees", emp.id), emp);
      });
      await batch.commit();
      triggerToast(`تم استيراد تفرقة وحفظ عدد (${mergedList.length}) موظف بنجاح في السحابة!`, "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "employees/batchImport");
    }
  };

  const handleDeleteEmployee = async (idToDelete: string) => {
    try {
      await deleteDoc(doc(db, "employees", idToDelete));
      triggerToast("تم حذف ملف الموظف بنجاح وإزالته من سجلات السحابة!");
      setActiveScreen("dashboard");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `employees/${idToDelete}`);
    }
  };

  const handleDeleteMultipleEmployees = async (idsToDelete: string[]) => {
    try {
      const batch = writeBatch(db);
      idsToDelete.forEach(id => {
        batch.delete(doc(db, "employees", id));
      });
      await batch.commit();
      triggerToast(`تم حذف عدد ${idsToDelete.length} من الموظفين بنجاح من السحابة!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, "employees/multipleDelete");
    }
  };

  const handleWhatsAppSendSuccess = (parsedMsg: string) => {
    triggerToast("تم فتح واتساب مباشرة وتجهيز تذكير المستند المحدد الموجه بنجاح!", "success");
  };

  // Select active employee
  const currentEmployee = employees.find((e) => e.id === selectedEmployeeId) || employees[0];
  const currentDocument = documents.find((d) => d.id === selectedDocId) || documents[0];

  return (
    <div className="min-h-screen bg-[#f8f9fa] custom-scrollbar selection:bg-blue-100 flex flex-col relative overflow-x-hidden select-text font-sans" style={{ direction: "rtl" }}>
      
      {/* Toast Notification HUD */}
      {toastMessage && (
        <div className="fixed top-6 left-4 right-4 z-50 animate-bounce-short pointer-events-auto">
          <div className="bg-[#1e3a8a] text-white p-4 rounded-xl shadow-2xl flex items-center justify-between border border-blue-800 gap-3 max-w-sm mx-auto">
            <button 
              onClick={() => setToastMessage(null)}
              className="text-blue-200 hover:text-white transition-colors"
            >
              ×
            </button>
            <div className="flex items-center gap-3 justify-end text-right flex-grow">
              <span className="text-xs font-semibold leading-relaxed">{toastMessage}</span>
              {toastType === "success" ? (
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 text-white shadow-md">
                  <Check className="w-4 h-4 font-bold" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-white shadow-md">
                  <Info className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Screen Routing HUD */}
      <div className="flex-1 w-full max-w-md mx-auto relative bg-white min-h-screen shadow-md border-x border-gray-100">
        
        {activeScreen === "dashboard" && (
          <DashboardScreen
            employees={employees}
            onSelectEmployee={setSelectedEmployeeId}
            onScreenChange={setActiveScreen}
            onTriggerWhatsApp={setWhatsAppModalEmployee}
            onImportExcel={handleImportExcel}
            isVacationsExpanded={isVacationsExpanded}
            setIsVacationsExpanded={setIsVacationsExpanded}
            isAbsencesExpanded={isAbsencesExpanded}
            setIsAbsencesExpanded={setIsAbsencesExpanded}
          />
        )}

        {activeScreen === "profile" && currentEmployee && (
          <ProfileScreen
            employee={currentEmployee}
            onScreenChange={setActiveScreen}
            onSelectDoc={setSelectedDocId}
            onTriggerWhatsApp={setWhatsAppModalEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            onUpdateEmployee={handleUpdateEmployee}
          />
        )}

        {activeScreen === "edit" && currentEmployee && (
          <EditProfileScreen
            employee={currentEmployee}
            onSave={handleUpdateEmployee}
            onCancel={() => setActiveScreen("profile")}
            onTriggerWhatsApp={setWhatsAppModalEmployee}
          />
        )}

        {activeScreen === "add" && (
          <AddEmployeeScreen
            onAdd={handleAddEmployee}
            onCancel={() => setActiveScreen("dashboard")}
          />
        )}

        {activeScreen === "preview-doc" && currentDocument && (
          <DocPreviewScreen
            document={currentDocument}
            employee={currentEmployee}
            onBack={() => {
              // Safe return fallback route
              if (selectedEmployeeId) {
                setActiveScreen("profile");
              } else {
                setActiveScreen("dashboard");
              }
            }}
          />
        )}

        {activeScreen === "app-info" && (
          <AppInfoScreen
            onBack={() => setActiveScreen("dashboard")}
            employees={employees}
            documents={documents}
            onRestoreBackup={(restoredEmployees, restoredDocs) => {
              setEmployees(restoredEmployees);
              if (restoredDocs) setDocuments(restoredDocs);
            }}
            triggerToast={triggerToast}
          />
        )}

        {activeScreen === "all-employees" && (
          <AllEmployeesScreen
            employees={employees}
            onSelectEmployee={setSelectedEmployeeId}
            onScreenChange={setActiveScreen}
            onTriggerWhatsApp={setWhatsAppModalEmployee}
            onBack={() => setActiveScreen("dashboard")}
            onMergeAllDuplicates={handleMergeAllDuplicates}
          />
        )}

        {activeScreen === "absences" && (
          <AbsencesScreen
            employees={employees}
            onUpdateEmployee={handleUpdateEmployee}
            onSelectEmployee={setSelectedEmployeeId}
            onScreenChange={setActiveScreen}
            onTriggerWhatsApp={setWhatsAppModalEmployee}
          />
        )}

        {activeScreen === "vacations" && (
          <VacationsScreen
            employees={employees}
            onUpdateEmployee={handleUpdateEmployee}
            onScreenChange={setActiveScreen}
            onTriggerWhatsApp={(emp) => setWhatsAppModalEmployee(emp)}
          />
        )}

        {activeScreen === "leave-dues" && (
          <LeaveDuesScreen
            employees={employees}
            onUpdateEmployee={handleUpdateEmployee}
            onScreenChange={setActiveScreen}
          />
        )}

        {activeScreen === "employee-data" && (
          <EmployeeDataScreen
            employees={employees}
            onScreenChange={setActiveScreen}
            onSelectEmployee={setSelectedEmployeeId}
            onDeleteMultipleEmployees={handleDeleteMultipleEmployees}
          />
        )}

        {activeScreen === "locations" && (
          <LocationsScreen
            employees={employees}
            onScreenChange={setActiveScreen}
            onSelectEmployee={setSelectedEmployeeId}
          />
        )}

        {activeScreen === "termination" && (
          <TerminationScreen
            employees={employees}
            onUpdateEmployee={handleUpdateEmployee}
            onScreenChange={setActiveScreen}
            triggerToast={triggerToast}
          />
        )}

        {activeScreen === "statistics" && (
          <StatisticsScreen
            employees={employees}
            onScreenChange={setActiveScreen}
          />
        )}

        {/* Global Tab Bar Persistent at the footer on all pages so that Home is always accessible */}
        {true && (
          <BottomNavBar
            activeScreen={activeScreen}
            onScreenChange={setActiveScreen}
            selectedEmployeeId={selectedEmployeeId}
          />
        )}
      </div>

      {/* WhatsApp sheet trigger element */}
      {whatsAppModalEmployee && (
        <WhatsAppSheet
          employee={whatsAppModalEmployee}
          onClose={() => setWhatsAppModalEmployee(null)}
          onSendSuccess={handleWhatsAppSendSuccess}
        />
      )}
    </div>
  );
}
