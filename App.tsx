import React, { useState, useEffect, useCallback, useMemo, FormEvent } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import {
  ReportType,
  StaffInfo,
  StaffMember,
  DailyReportRecord,
  VehicleOperationType,
  VehicleEntry,
} from './types';
import EditableField from './components/EditableField';
import AdminLoginModal from './components/AdminLoginModal';
import AdminPanel from './components/AdminPanel';
import { PWAInstallButton } from './components/PWAInstallButton';
import { DEFAULT_STAFF_LIST, INITIAL_SAMPLE_RECORDS } from './utils/defaultData';

const STAFF_STORAGE_KEY = 'rfl_khulna_staff_v2';
const RECORDS_STORAGE_KEY = 'rfl_khulna_daily_records_v1';
const ADMIN_AUTH_KEY = 'rfl_admin_session_auth';
const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/E6vzilAfUAz9qHzApY7aQO?s=cl&p=a&mlu=0';

// Helper to format date to YYYY-MM-DD for the input[type=date] value
const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to format date from YYYY-MM-DD to DD/MM/YYYY for display
const formatDateForDisplay = (dateString: string): string => {
  if (!dateString || !dateString.includes('-')) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

const App: React.FC = () => {
  // Staff list state initialized from localStorage
  const [staffList, setStaffList] = useState<StaffMember[]>(() => {
    try {
      const saved = localStorage.getItem(STAFF_STORAGE_KEY);
      if (saved) {
        const parsed: StaffMember[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved staff list:', e);
    }
    return DEFAULT_STAFF_LIST;
  });

  // Daily report records state initialized from localStorage
  const [records, setRecords] = useState<DailyReportRecord[]>(() => {
    try {
      const saved = localStorage.getItem(RECORDS_STORAGE_KEY);
      if (saved) {
        const parsed: DailyReportRecord[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved daily records:', e);
    }
    return INITIAL_SAMPLE_RECORDS;
  });

  // Admin authentication state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true';
  });
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'report' | 'admin'>('report');

  // Daily Report form states
  const [reportDate, setReportDate] = useState<string>('');
  const [activeVehicleType, setActiveVehicleType] = useState<VehicleOperationType>('Load');
  const [vehicleEntries, setVehicleEntries] = useState<VehicleEntry[]>(() => {
    try {
      const saved = localStorage.getItem('rfl_khulna_vehicles_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: any) => ({
            id: item.id || `v_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            number: String(item.number || item || '').replace(/\s+(load|unload)$/i, '').trim(),
            type: (item.type === 'Unload' || String(item).toLowerCase().includes('unload')) ? 'Unload' : 'Load',
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved vehicles:', e);
    }
    return [
      { id: '1', number: '2040', type: 'Load' },
      { id: '2', number: '2029', type: 'Load' },
      { id: '3', number: '1798', type: 'Load' },
      { id: '4', number: '1452', type: 'Unload' },
    ];
  });
  const [vehicleInput, setVehicleInput] = useState<string>('');
  const [selectedStaffId, setSelectedStaffId] = useState<string>(() => {
    const firstStaff = staffList[0] || DEFAULT_STAFF_LIST[0];
    return firstStaff.id;
  });

  // Derived staff information: strictly locked and read-only from the registered depot staff list
  const staffInfo: StaffInfo = useMemo(() => {
    const found =
      staffList.find((s) => s.id === selectedStaffId) ||
      staffList[0] ||
      DEFAULT_STAFF_LIST[0];
    return {
      id: found.id,
      name: `${found.name} | ${found.title}`,
      phone: found.phone,
    };
  }, [staffList, selectedStaffId]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportText, setReportText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync staff list to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(staffList));
    } catch (err) {
      console.error('Error saving staff list:', err);
    }
  }, [staffList]);

  // Sync records to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
    } catch (err) {
      console.error('Error saving records:', err);
    }
  }, [records]);

  // Sync vehicle entries to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('rfl_khulna_vehicles_v3', JSON.stringify(vehicleEntries));
    } catch (err) {
      console.error('Error saving vehicle entries:', err);
    }
  }, [vehicleEntries]);

  // Real-time Firestore sync for staff list
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'staff'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: StaffMember[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            list.push({
              id: data.id || docSnap.id,
              name: data.name || '',
              title: data.title || '',
              phone: data.phone || '',
            });
          });
          setStaffList(list);
        } else {
          // Initial seed to Firestore if collection is empty
          DEFAULT_STAFF_LIST.forEach((member) => {
            setDoc(doc(db, 'staff', member.id), member).catch((err) => {
              console.warn('Initial staff seed error:', err);
            });
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'staff');
      }
    );
    return () => unsubscribe();
  }, []);

  // Real-time Firestore sync for daily records
  useEffect(() => {
    const q = query(collection(db, 'records'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const fetchedRecords: DailyReportRecord[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as DailyReportRecord;
            fetchedRecords.push({
              ...data,
              id: data.id || docSnap.id,
            });
          });
          setRecords(fetchedRecords);
        } else {
          // If Firestore records is empty, seed with initial sample records
          INITIAL_SAMPLE_RECORDS.forEach((rec) => {
            setDoc(doc(db, 'records', rec.id), rec).catch((err) => {
              console.warn('Initial sample records seed error:', err);
            });
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'records');
      }
    );
    return () => unsubscribe();
  }, []);

  // Initial date setup: yesterday
  useEffect(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setReportDate(formatDateForInput(yesterday));
  }, []);

  // Keep selectedStaffId in sync if staff list changes or selected staff is removed
  useEffect(() => {
    if (staffList.length > 0 && !staffList.some((s) => s.id === selectedStaffId)) {
      setSelectedStaffId(staffList[0].id);
    }
  }, [staffList, selectedStaffId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleStaffSelectionChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedStaffId(e.target.value);
    },
    []
  );

  // Add vehicle with support for single or comma/space separated batch entry
  // and smart detection of "Load" / "Unload" in input
  const handleAddVehicle = (e: FormEvent) => {
    e.preventDefault();
    if (!vehicleInput.trim()) return;

    const rawTokens = vehicleInput.split(/[,\n]+/).map((t) => t.trim()).filter(Boolean);

    const newItems: VehicleEntry[] = [];
    rawTokens.forEach((token) => {
      const lower = token.toLowerCase();
      let num = token;
      let type: VehicleOperationType = activeVehicleType;

      if (lower.endsWith(' unload') || lower.endsWith('-unload') || lower.endsWith('/unload')) {
        num = token.replace(/[-/ ]*unload$/i, '').trim();
        type = 'Unload';
      } else if (lower.endsWith(' load') || lower.endsWith('-load') || lower.endsWith('/load')) {
        num = token.replace(/[-/ ]*load$/i, '').trim();
        type = 'Load';
      } else if (token.includes(' ')) {
        const spaceParts = token.split(/\s+/);
        spaceParts.forEach((sp) => {
          if (sp.trim()) {
            newItems.push({
              id: `v_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              number: sp.trim(),
              type: activeVehicleType,
            });
          }
        });
        return;
      }

      if (num) {
        newItems.push({
          id: `v_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          number: num,
          type: type,
        });
      }
    });

    if (newItems.length > 0) {
      setVehicleEntries((prev) => [...prev, ...newItems]);
      setVehicleInput('');
    }
  };

  const handleToggleVehicleType = (index: number) => {
    setVehicleEntries((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, type: item.type === 'Load' ? 'Unload' : 'Load' }
          : item
      )
    );
  };

  const handleRemoveVehicle = (indexToRemove: number) => {
    setVehicleEntries((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleClearAllVehicles = () => {
    if (vehicleEntries.length === 0) return;
    setVehicleEntries([]);
    showToast('All vehicle numbers cleared.');
  };

  const generateReportText = useCallback((): string => {
    const displayDate = formatDateForDisplay(reportDate);
    const totalCount = vehicleEntries.length;
    const loadCount = vehicleEntries.filter((v) => v.type === 'Load').length;
    const unloadCount = vehicleEntries.filter((v) => v.type === 'Unload').length;

    // Determine report title
    let reportTitle = '*Vehicle Load/Unload Report*';
    if (totalCount > 0) {
      if (loadCount > 0 && unloadCount === 0) {
        reportTitle = '*Vehicle Load Report*';
      } else if (unloadCount > 0 && loadCount === 0) {
        reportTitle = '*Vehicle Unload Report*';
      } else {
        reportTitle = '*Vehicle Load/Unload Report*';
      }
    }

    // Vehicle lines: 1) 2040 Load
    const vehicleList = vehicleEntries
      .map((v, i) => `${i + 1}) ${v.number} ${v.type}`)
      .join('\n');

    // Total summary line exactly as requested:
    // *Total:* 4 No's  (3 no's Load & 1 no's Unload)
    let totalSummaryLine = `*Total:* ${totalCount} No's`;
    if (totalCount > 0) {
      if (loadCount > 0 && unloadCount > 0) {
        totalSummaryLine = `*Total:* ${totalCount} No's  (${loadCount} no's Load & ${unloadCount} no's Unload)`;
      } else if (loadCount > 0) {
        totalSummaryLine = `*Total:* ${totalCount} No's  (${loadCount} no's Load)`;
      } else {
        totalSummaryLine = `*Total:* ${totalCount} No's  (${unloadCount} no's Unload)`;
      }
    }

    return `*RFL DISTRIBUTION*
KHULNA DEPOT - 16531
Damudor, Phultala, Khulna
-------------------------
${reportTitle}
*Date:* ${displayDate}

*Vehicles (${totalCount} total):*
${vehicleList.length > 0 ? vehicleList : 'No vehicles listed.'}

${totalSummaryLine}
---------------------------------------------
*Staff Details:*
*Staff ID:* ${staffInfo.id}
*Name:* ${staffInfo.name}
*Phone:* ${staffInfo.phone}
`;
  }, [vehicleEntries, staffInfo, reportDate]);

  // Unified save function: whether View, Save, or Share is clicked, it records into Firestore and state!
  const recordCurrentReport = useCallback((): { record: DailyReportRecord; text: string } => {
    const textToCopy = generateReportText();
    const displayDate = formatDateForDisplay(reportDate);
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    const totalCount = vehicleEntries.length;
    const loadCount = vehicleEntries.filter((v) => v.type === 'Load').length;
    const unloadCount = vehicleEntries.filter((v) => v.type === 'Unload').length;

    let derivedReportType = ReportType.Mixed;
    if (loadCount > 0 && unloadCount === 0) {
      derivedReportType = ReportType.Load;
    } else if (unloadCount > 0 && loadCount === 0) {
      derivedReportType = ReportType.Unload;
    }

    const vehicleStringList = vehicleEntries.map((v) => `${v.number} ${v.type}`);

    const newRecord: DailyReportRecord = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: reportDate,
      displayDate: displayDate,
      time: timeStr,
      reportType: derivedReportType,
      vehicles: vehicleStringList,
      vehicleCount: totalCount,
      staffId: staffInfo.id,
      staffName: staffInfo.name,
      staffPhone: staffInfo.phone,
      reportText: textToCopy,
      createdAt: Date.now(),
    };

    setRecords((prev) => [newRecord, ...prev]);

    // Persist to Firebase Firestore
    setDoc(doc(db, 'records', newRecord.id), newRecord).catch((err) => {
      handleFirestoreError(err, OperationType.CREATE, `records/${newRecord.id}`);
    });

    return { record: newRecord, text: textToCopy };
  }, [generateReportText, reportDate, vehicleEntries, staffInfo]);

  // Click View: Saves to database, sets text, and opens modal
  const handleViewReport = () => {
    const { text } = recordCurrentReport();
    setReportText(text);
    setIsModalOpen(true);
    showToast('Report recorded to database and opened for preview.');
  };

  // Click Save: Saves to database and copies to clipboard
  const handleSaveReport = async () => {
    const { text } = recordCurrentReport();
    try {
      await navigator.clipboard.writeText(text);
      showToast('Report saved & copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy text:', err);
      showToast('Report recorded to database successfully!');
    }
  };

  // Click Share: Saves to database, copies text, and opens specified WhatsApp group link
  const handleShare = async () => {
    const { text } = recordCurrentReport();
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.warn('Clipboard write failed during share:', e);
    }
    showToast('Report saved! Opening WhatsApp group...');
    window.open(WHATSAPP_GROUP_URL, '_blank', 'noopener,noreferrer');
  };

  // Admin login handling
  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
    setIsAdminModalOpen(false);
    setCurrentView('admin');
    showToast('Admin verified and logged in.');
  };

  const handleAdminLogout = async () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    setCurrentView('report');
    showToast('Logged out of Admin Portal.');
  };

  const handleAdminLogoClick = () => {
    if (isAdminLoggedIn) {
      setCurrentView(currentView === 'admin' ? 'report' : 'admin');
    } else {
      setIsAdminModalOpen(true);
    }
  };

  // Admin Staff handlers with Firestore sync
  const handleAddStaff = async (newStaff: StaffMember) => {
    setStaffList((prev) => [...prev, newStaff]);
    try {
      await setDoc(doc(db, 'staff', newStaff.id), newStaff);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `staff/${newStaff.id}`);
    }
  };

  const handleUpdateStaff = async (updatedStaff: StaffMember) => {
    setStaffList((prev) =>
      prev.map((s) => (s.id === updatedStaff.id ? updatedStaff : s))
    );
    try {
      await setDoc(doc(db, 'staff', updatedStaff.id), updatedStaff);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `staff/${updatedStaff.id}`);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    setStaffList((prev) => prev.filter((s) => s.id !== staffId));
    try {
      await deleteDoc(doc(db, 'staff', staffId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `staff/${staffId}`);
    }
  };

  const handleResetStaff = async () => {
    setStaffList(DEFAULT_STAFF_LIST);
    try {
      for (const member of DEFAULT_STAFF_LIST) {
        await setDoc(doc(db, 'staff', member.id), member);
      }
    } catch (err) {
      console.warn('Error resetting staff in Firestore:', err);
    }
  };

  // Admin Record handlers with Firestore sync
  const handleAddRecord = async (record: DailyReportRecord) => {
    setRecords((prev) => [record, ...prev]);
    try {
      await setDoc(doc(db, 'records', record.id), record);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `records/${record.id}`);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    try {
      await deleteDoc(doc(db, 'records', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `records/${id}`);
    }
  };

  const handleClearAllRecords = async () => {
    const oldRecords = [...records];
    setRecords([]);
    try {
      const batch = writeBatch(db);
      oldRecords.forEach((r) => {
        batch.delete(doc(db, 'records', r.id));
      });
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'records');
    }
  };

  // If viewing admin panel
  if (currentView === 'admin' && isAdminLoggedIn) {
    return (
      <AdminPanel
        onBackToApp={() => setCurrentView('report')}
        onLogout={handleAdminLogout}
        records={records}
        onAddRecord={handleAddRecord}
        onDeleteRecord={handleDeleteRecord}
        onClearAllRecords={handleClearAllRecords}
        staffList={staffList}
        onAddStaff={handleAddStaff}
        onUpdateStaff={handleUpdateStaff}
        onDeleteStaff={handleDeleteStaff}
        onResetStaff={handleResetStaff}
      />
    );
  }

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-sm w-11/12 bg-gray-900 border border-indigo-500/80 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs sm:text-sm animate-fadeIn">
          <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center flex-shrink-0 text-indigo-400">
            <i className="fa-solid fa-circle-check"></i>
          </div>
          <span className="flex-1 leading-snug">{toastMessage}</span>
        </div>
      )}

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />

      <div className="min-h-screen p-2 sm:p-4 flex flex-col justify-center items-center">
        <div className="w-full max-w-md mx-auto bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 relative">
          
          {/* Header with Admin Logo & PWA Install Button */}
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase">
                Khulna Depot - 16531
              </span>
            </div>

            <div className="flex items-center gap-2">
              <PWAInstallButton />
              {/* Admin Logo Button */}
              <button
                onClick={handleAdminLogoClick}
                className="w-9 h-9 rounded-xl bg-gray-850 hover:bg-indigo-600/30 border border-indigo-500/40 hover:border-indigo-400 text-indigo-400 hover:text-white flex items-center justify-center shadow-md transition-all active:scale-95"
                title="Admin Portal"
                aria-label="Admin Portal"
              >
                <i className="fa-solid fa-user-shield text-sm"></i>
              </button>
            </div>
          </div>

          <header className="text-center pt-1">
            <div className="flex items-center justify-center gap-2.5 mb-1">
              <img
                src="/pwa-192x192.png"
                alt="RFL Icon"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl shadow-lg border border-red-500/30 object-contain shadow-red-500/10"
              />
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                <span className="text-red-500">RFL</span> DISTRIBUTION
              </h1>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-indigo-400 mt-0.5">KHULNA DEPOT - 16531</p>
            <p className="text-[11px] sm:text-xs text-gray-400">Damudor, Phultala, Khulna</p>
          </header>

          {/* Date Picker Input */}
          <div className="text-sm text-gray-300 bg-gray-800/70 border border-gray-700/60 p-3 rounded-2xl flex items-center justify-between">
            <strong className="mr-2 flex items-center gap-1.5 text-gray-300 text-xs font-semibold">
              <i className="fa-regular fa-calendar-days text-indigo-400"></i>
              <span>Date:</span>
            </strong>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="w-full bg-transparent p-0 border-none text-gray-100 placeholder-gray-400 focus:ring-0 text-xs sm:text-sm font-medium"
              aria-label="Report Date"
            />
          </div>

          <main className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-200">
                Vehicle Load / Unload Report
              </h2>
              <span className="text-[11px] text-gray-400 font-mono">
                {formatDateForDisplay(reportDate)}
              </span>
            </div>

            {/* Choose Load or Unload for next vehicle */}
            <div>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5 px-0.5">
                <span className="font-medium text-gray-300 flex items-center gap-1.5">
                  <i className="fa-solid fa-layer-group text-indigo-400"></i>
                  <span>Add Vehicle As:</span>
                </span>
                <span className="text-[11px] text-gray-500">
                  Tap to switch mode
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 bg-gray-800/60 p-1 rounded-xl border border-gray-700/60">
                <button
                  type="button"
                  onClick={() => setActiveVehicleType('Load')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeVehicleType === 'Load'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/50'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <i className="fa-solid fa-arrow-up-long"></i>
                  <span>Load</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveVehicleType('Unload')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeVehicleType === 'Unload'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-900/50'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <i className="fa-solid fa-arrow-down-long"></i>
                  <span>Unload</span>
                </button>
              </div>
            </div>

            {/* Vehicle Number Input Form */}
            <form onSubmit={handleAddVehicle} className="flex space-x-2">
              <div className="relative flex-grow">
                <i className="fa-solid fa-truck absolute left-3 top-3 text-xs text-gray-500"></i>
                <input
                  type="text"
                  value={vehicleInput}
                  onChange={(e) => setVehicleInput(e.target.value)}
                  placeholder={`Enter Vehicle No. (as ${activeVehicleType})`}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-8 pr-8 py-2 text-xs sm:text-sm text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                />
                {vehicleInput && (
                  <button
                    type="button"
                    onClick={() => setVehicleInput('')}
                    className="absolute right-2.5 top-2.5 text-xs text-gray-400 hover:text-white p-1"
                    title="Clear input"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>
              <button
                type="submit"
                className={`text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center transition-colors shadow-lg active:scale-95 ${
                  activeVehicleType === 'Load'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                    : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                }`}
                title={`Add as ${activeVehicleType}`}
              >
                <i className="fas fa-plus"></i>
              </button>
            </form>

            {/* Vehicles List Box */}
            <div className="border border-gray-800 bg-gray-950/60 rounded-2xl p-3 space-y-2 max-h-56 overflow-y-auto">
              <div className="flex items-center justify-between text-[11px] text-gray-400 pb-1 border-b border-gray-850">
                <span>Listed Vehicles ({vehicleEntries.length})</span>
                {vehicleEntries.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllVehicles}
                    className="text-red-400 hover:text-red-300 hover:bg-red-950/60 px-2 py-0.5 rounded transition-colors flex items-center gap-1 active:scale-95"
                    title="Clear all vehicles"
                  >
                    <i className="fa-solid fa-trash-can text-[10px]"></i>
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {vehicleEntries.length > 0 ? (
                <ol className="text-gray-200 space-y-1.5">
                  {vehicleEntries.map((vehicle, index) => (
                    <li
                      key={vehicle.id || index}
                      className="flex items-center justify-between bg-gray-800/80 px-2.5 py-1.5 rounded-xl border border-gray-700/50 gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-xs text-gray-400 w-5">{index + 1})</span>
                        <span className="font-mono text-sm text-white font-semibold">
                          {vehicle.number}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Interactive toggle badge for Load / Unload */}
                        <button
                          type="button"
                          onClick={() => handleToggleVehicleType(index)}
                          className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 active:scale-95 border ${
                            vehicle.type === 'Load'
                              ? 'bg-emerald-950/80 hover:bg-emerald-900 border-emerald-600 text-emerald-300'
                              : 'bg-amber-950/80 hover:bg-amber-900 border-amber-600 text-amber-300'
                          }`}
                          title={`Click to switch to ${vehicle.type === 'Load' ? 'Unload' : 'Load'}`}
                        >
                          <i className={`fa-solid ${vehicle.type === 'Load' ? 'fa-arrow-up-long' : 'fa-arrow-down-long'} text-[9px]`}></i>
                          <span>{vehicle.type}</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => handleRemoveVehicle(index)}
                          className="text-red-400 hover:text-red-300 text-xs p-1 rounded transition-colors hover:bg-red-950/40"
                          aria-label={`Remove vehicle ${vehicle.number}`}
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-center text-gray-500 text-xs py-3">
                  No vehicle numbers added yet.
                </p>
              )}
            </div>

            {/* Vehicle Count Summary Banner matching user format */}
            <div className="bg-gray-900 border border-gray-800 p-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm">
              <div className="font-bold text-white flex items-center gap-2">
                <span className="text-indigo-400 font-mono text-sm sm:text-base">
                  *Total:* {vehicleEntries.length} No's
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span className="px-2 py-0.5 rounded-lg bg-emerald-950/70 border border-emerald-800/70 text-emerald-300 font-medium">
                  {vehicleEntries.filter(v => v.type === 'Load').length} no's Load
                </span>
                <span className="text-gray-500">&</span>
                <span className="px-2 py-0.5 rounded-lg bg-amber-950/70 border border-amber-800/70 text-amber-300 font-medium">
                  {vehicleEntries.filter(v => v.type === 'Unload').length} no's Unload
                </span>
              </div>
            </div>
          </main>
          
          <hr className="border-gray-800" />
          
          {/* Staff Details Section */}
          <footer className="space-y-3">
            <div className="relative">
              <label
                htmlFor="staffId"
                className="absolute -top-2.5 left-2 inline-block bg-gray-900 px-1 text-[11px] font-semibold text-gray-400 z-10"
              >
                Staff ID (Select)
              </label>
              <div className="flex items-center border border-gray-700 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all bg-gray-850">
                <i className="fa-solid fa-id-card text-gray-400 mr-2.5 w-4 text-center"></i>
                <select
                  id="staffId"
                  name="id"
                  value={staffInfo.id}
                  onChange={handleStaffSelectionChange}
                  className="w-full bg-transparent p-0 border-none text-gray-100 placeholder-gray-400 focus:ring-0 text-xs sm:text-sm"
                >
                  {staffList.map((staff) => (
                    <option key={staff.id} value={staff.id} className="bg-gray-900 text-white">
                      {staff.id} - {staff.name} ({staff.title})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Non-editable Name & Title */}
            <EditableField
              id="name"
              label="Name | Title"
              value={staffInfo.name}
              iconClass="fa-solid fa-user-shield"
              readOnly={true}
            />

            {/* Non-editable Phone */}
            <EditableField
              id="phone"
              label="Phone No"
              value={staffInfo.phone}
              iconClass="fa-solid fa-phone"
              inputType="tel"
              readOnly={true}
            />

            <div className="px-1 pt-0.5 flex items-center justify-between text-[10px] text-gray-500">
              <span className="flex items-center gap-1">
                <i className="fa-solid fa-lock text-amber-500/80 text-[9px]"></i>
                <span>Staff details are locked & verified</span>
              </span>
              <span className="text-gray-500">Manage in Admin Portal</span>
            </div>
          </footer>

          {/* Action Buttons: View, Save, Share - any click automatically records to database! */}
          <div className="pt-2 grid grid-cols-3 gap-2">
            <button
              onClick={handleViewReport}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-2 rounded-xl flex items-center justify-center space-x-1.5 transition-all text-xs shadow-md shadow-blue-600/20 active:scale-95"
              title="Save report to database & view report format"
            >
              <i className="fas fa-eye text-xs"></i>
              <span>View</span>
            </button>
            <button
              onClick={handleSaveReport}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-2 rounded-xl flex items-center justify-center space-x-1.5 transition-all text-xs shadow-md shadow-indigo-600/20 active:scale-95"
              title="Save report to database & copy text to clipboard"
            >
              <i className="fas fa-save text-xs"></i>
              <span>Save</span>
            </button>
            <button
              onClick={handleShare}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-2 rounded-xl flex items-center justify-center space-x-1.5 transition-all text-xs shadow-md shadow-emerald-600/20 active:scale-95"
              title="Save report & open WhatsApp group"
            >
              <i className="fab fa-whatsapp text-xs"></i>
              <span>Share</span>
            </button>
          </div>

          {/* Bottom footer */}
          <div className="pt-2 border-t border-gray-850/80 text-center text-[11px] text-gray-500">
            <span>RFL Distribution • Khulna Depot - 16531</span>
          </div>

        </div>
      </div>
      
      {/* Generated Report Preview Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-gray-900 border border-gray-700 rounded-3xl shadow-2xl p-5 w-full max-w-md max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-file-lines text-indigo-400"></i>
                <h3 className="text-base font-bold text-white">Generated Report</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            <div className="flex-grow overflow-y-auto bg-gray-950 p-4 rounded-2xl border border-gray-800 mb-3 shadow-inner">
              <pre className="text-gray-200 text-xs sm:text-sm whitespace-pre-wrap font-mono leading-relaxed">
                {reportText}
              </pre>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(reportText);
                    showToast('Report text copied to clipboard!');
                  } catch {
                    showToast('Failed to copy text.');
                  }
                }}
                className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30"
              >
                <i className="fa-solid fa-copy"></i>
                <span>Copy Report</span>
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="py-2.5 px-4 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold rounded-xl text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default App;