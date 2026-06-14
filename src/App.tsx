/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import MembersView from './components/MembersView';
import ContributionsView from './components/ContributionsView';
import LoansView from './components/LoansView';
import ExpensesView from './components/ExpensesView';
import ConstitutionView from './components/ConstitutionView';
import UsersView from './components/UsersView';
import Modals from './components/Modals';

import { SaccosData, Member, Loan, InternalUser, ContributionType } from './types';
import { getDefaultSaccosData } from './lib/initialData';
import { 
  exportDataBackup, 
  importDataBackup, 
  createAuditLog, 
  encryptPassword 
} from './lib/security';
import { 
  googleSignIn, 
  googleSignOut, 
  initAuth, 
  saveSaccosDataToCloud, 
  loadSaccosDataFromCloud, 
  getAccessToken,
  db
} from './lib/firebase';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { syncSaccosToGoogleSheets } from './lib/sheets';

const LOCAL_STORAGE_KEY = 'twaweza_digital_main_data_v1';
const LOCAL_STORAGE_KEY_LEGACY = 'saccos_plus_main_data_v1';
const SESSION_USER_KEY = 'twaweza_digital_current_user_v1';

export default function App() {
  // 1. STATE MANAGEMENT
  const [data, setData] = useState<SaccosData>(() => {
    try {
      let stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!stored) {
        stored = localStorage.getItem(LOCAL_STORAGE_KEY_LEGACY);
      }
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Migration kwa ajili ya usalama wa auditLogs
        if (!parsed.auditLogs) parsed.auditLogs = [];
        if (!parsed.internalUsers) {
          const defaults = getDefaultSaccosData();
          parsed.internalUsers = defaults.internalUsers;
        }

        // Kama mfumo una data za mfano za zamani kama "Hamisi" au "Juma Hamisi Kilindo" au "Amina",
        // au mwanachama yeyote wa zamani, tunaweka data mpya sahihi zilizowekwa na mtumiaji.
        const containsOldTestData = parsed.members?.some((m: any) => 
          m.name.includes('Hamisi') || m.name.includes('Kilindo') || m.name.includes('Amina Salim') || m.name.includes('Mwaipopo')
        );

        if (containsOldTestData) {
          const defaults = getDefaultSaccosData();
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaults));
          return defaults;
        }

        // Hakikisha Agatha mponera ameongezwa kama hayupo kwenye orodha ya sasa ili kumuonyesha moja kwa moja
        const hasAgatha = parsed.members?.some((m: any) => m.name.toLowerCase().includes('agatha mponera') || m.phone === '0625806227');
        if (!hasAgatha && parsed.members) {
          parsed.members.push({
            id: 'm_agatha',
            name: 'Agatha mponera',
            memberNo: 'Mwanachama',
            phone: '0625806227',
            email: 'agatha.mponera@example.com',
            active: false,
            created: '2026-06-09'
          });
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
        }

        // Kusasisha namba mpya za simu za wanachama kulingana na data sahihi zilizotolewa
        const phoneUpdates: { [key: string]: string } = {
          'credo mapunda': '0757749594',
          'frolian mapunda': '0768561197',
          'fulko nkolela': '0744093850',
          'gaston mapunda': '0762012479',
          'glory nkolela': '0746313941',
          'innocent mapunda': '0763883581',
          'isack mapunda': '0767409635',
          'joyce mapunda': '0746137804',
          'maria nkolela': '0741962702',
          'nestory mapunda': '0750256765',
          'rozina mapunda': '0757279482',
          'rozina mapund': '0757279482',
          'taslo nkolela': '0756502085',
          'agatha mponera': '0625806227'
        };

        let didUpdatePhones = false;
        if (parsed.members) {
          parsed.members = parsed.members.map((m: any) => {
            const nameLower = m.name.toLowerCase().trim();
            const targetPhone = phoneUpdates[nameLower];
            if (targetPhone && m.phone !== targetPhone) {
              didUpdatePhones = true;
              return { ...m, phone: targetPhone };
            }
            return m;
          });
          if (didUpdatePhones) {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
          }
        }

        // Hakikisha michango yote (isipokuwa Marejesho ya Mkopo) inawekwa aina ya "Ada ya Uanachama"
        const needsContribUpdate = parsed.contributions && parsed.contributions.some((c: any) => c.type !== 'Ada ya Uanachama' && c.type !== 'Marejesho ya Mkopo');
        if (needsContribUpdate) {
          parsed.contributions = parsed.contributions.map((c: any) => ({
            ...c,
            type: c.type === 'Marejesho ya Mkopo' ? 'Marejesho ya Mkopo' : 'Ada ya Uanachama'
          }));
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
        }

        // Hakikisha marejesho ya Rozina yameongezwa kwenye michango
        if (parsed.contributions) {
          const hasRozinaPay1 = parsed.contributions.some((c: any) => c.id === 'c_rozina_pay1' || (c.memberId === 'm_rozina' && c.amount === 160000 && c.date === '2026-05-04'));
          const hasRozinaPay2 = parsed.contributions.some((c: any) => c.id === 'c_rozina_pay2' || (c.memberId === 'm_rozina' && c.amount === 12500 && c.date === '2026-05-11'));
          let updatedContribs = false;
          
          if (!hasRozinaPay1) {
            parsed.contributions.push({
              id: 'c_rozina_pay1',
              memberId: 'm_rozina',
              amount: 160000,
              date: '2026-05-04',
              type: 'Marejesho ya Mkopo',
              note: 'Marejesho ya kwanza ya mkopo'
            });
            updatedContribs = true;
          }
          if (!hasRozinaPay2) {
            parsed.contributions.push({
              id: 'c_rozina_pay2',
              memberId: 'm_rozina',
              amount: 12500,
              date: '2026-05-11',
              type: 'Marejesho ya Mkopo',
              note: 'Marejesho ya pili na kumaliza mkopo'
            });
            updatedContribs = true;
          }
          if (updatedContribs) {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
          }
        }

        // Hakikisha mikopo ya Rozina na Innocent imeongezwa kwenye hifadhi ya ndani kama haipo bado
        let updatedLoans = false;
        if (!parsed.loans) {
          parsed.loans = [];
          updatedLoans = true;
        }

        const rozinaLoanIndex = parsed.loans.findIndex((l: any) => l.id === 'l_rozina' || (l.memberId === 'm_rozina' && l.amount === 150000));
        
        if (rozinaLoanIndex === -1) {
          parsed.loans.push({
            id: 'l_rozina',
            memberId: 'm_rozina',
            amount: 150000,
            interest: 15,
            totalPay: 172500,
            paidAmount: 172500,
            duration: 1,
            date: '2026-02-18',
            status: 'cleared',
            note: 'mkopo wa dharura'
          });
          updatedLoans = true;
        } else {
          const currentLoan = parsed.loans[rozinaLoanIndex];
          if (currentLoan.paidAmount !== 172500 || currentLoan.status !== 'cleared') {
            parsed.loans[rozinaLoanIndex] = {
              ...currentLoan,
              paidAmount: 172500,
              status: 'cleared'
            };
            updatedLoans = true;
          }
        }

        const hasInnocentLoan = parsed.loans?.some((l: any) => l.id === 'l_innocent' || (l.memberId === 'm_innocent' && l.amount === 50000));
        if (!hasInnocentLoan) {
          parsed.loans.push({
            id: 'l_innocent',
            memberId: 'm_innocent',
            amount: 50000,
            interest: 10,
            totalPay: 55000,
            paidAmount: 0,
            duration: 1,
            date: '2026-05-24',
            status: 'ongoing',
            note: '-'
          });
          updatedLoans = true;
        }

        // Hakikisha matumizi ya vocha yameongezwa kwenye hifadhi ya ndani kama hayapo bado
        let updatedExpenses = false;
        if (!parsed.expenses) {
          parsed.expenses = [];
          updatedExpenses = true;
        }
        const hasVochaExpense = parsed.expenses?.some((e: any) => e.id === 'exp_vocha' || (e.description.includes('vocha') && e.amount === 5000));
        if (!hasVochaExpense) {
          parsed.expenses.push({
            id: 'exp_vocha',
            description: 'kununua vocha kwaajili ya kikao',
            amount: 5000,
            date: '2026-05-23',
            category: 'Uendeshaji',
            note: 'vocha'
          });
          updatedExpenses = true;
        }

        if (updatedLoans || updatedExpenses) {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
        }
        
        return parsed;
      }
    } catch (e) {
      console.error('Imeshindikana kusoma LocalStorage data, nitapakia chaguomsingi', e);
    }
    const defaults = getDefaultSaccosData();
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  });

  const [currentUser, setCurrentUser] = useState<InternalUser | null>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_USER_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}
    return null;
  });

  const [activePage, setActivePage] = useState<string>('dashboard');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editingUser, setEditingUser] = useState<InternalUser | null>(null);
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState<Loan | null>(null);
  
  // Internet connectivity state
  const [isOnline, setIsOnline] = useState<boolean>(() => navigator.onLine);
  
  // Login flow state
  const [loginError, setLoginError] = useState<string>('');
  
  // System alerts / Custom Toasts State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  
  // Hidden file input ref for backup restores
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Google Auth & Cloud Sync state
  const isApplyingSnapshotRef = useRef(false);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);
  const [isSyncingSheets, setIsSyncingSheets] = useState<boolean>(false);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(() => {
    return localStorage.getItem('twaweza_digital_spreadsheet_url');
  });
  const [lastCloudSynced, setLastCloudSynced] = useState<string | null>(() => {
    return localStorage.getItem('twaweza_digital_last_cloud_synced');
  });
  const [lastSheetsSynced, setLastSheetsSynced] = useState<string | null>(() => {
    return localStorage.getItem('twaweza_digital_last_sheets_synced');
  });

  // Google OAuth na Hifadhi ya Firebase - msikilizaji wa kuanza
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
      },
      () => {
        setGoogleUser(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // 1.5. REAL-TIME DATA LISTENERS (FIRESTORE TO LOCAL STATE)
  useEffect(() => {
    if (!googleUser) return;

    const groupId = googleUser.uid;
    const unsubscribers: (() => void)[] = [];

    // Simple helper to register a listener on each collection
    const setupListener = (colName: string, stateKey: keyof SaccosData) => {
      const colRef = collection(db, 'saccos_groups', groupId, colName);
      const unsub = onSnapshot(colRef, (snapshot) => {
        let items: any[] = [];
        snapshot.forEach((snapDoc) => {
          items.push(snapDoc.data());
        });
        
        // Only trigger update if snapshots are not empty from server
        if (items.length > 0) {
          // Sahihiisha namba za simu za wanachama pia toka kwenye kijito cha Firestore
          if (stateKey === 'members') {
            const upMap: { [key: string]: string } = {
              'credo mapunda': '0757749594',
              'frolian mapunda': '0768561197',
              'fulko nkolela': '0744093850',
              'gaston mapunda': '0762012479',
              'glory nkolela': '0746313941',
              'innocent mapunda': '0763883581',
              'isack mapunda': '0767409635',
              'joyce mapunda': '0746137804',
              'maria nkolela': '0741962702',
              'nestory mapunda': '0750256765',
              'rozina mapunda': '0757279482',
              'rozina mapund': '0757279482',
              'taslo nkolela': '0756502085',
              'agatha mponera': '0625806227'
            };
            items = items.map((m) => {
              const nameKey = (m.name || '').toLowerCase().trim();
              const reqPhone = upMap[nameKey];
              if (reqPhone && m.phone !== reqPhone) {
                return { ...m, phone: reqPhone };
              }
              return m;
            });
          }

          isApplyingSnapshotRef.current = true;
          setData(prev => {
            // Check changes to avoid infinite loop
            const prevStr = JSON.stringify(prev[stateKey]);
            const newStr = JSON.stringify(items);
            if (prevStr === newStr) return prev;
            
            if (stateKey === 'auditLogs') {
              items.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
            }

            return {
              ...prev,
              [stateKey]: items
            };
          });
          setTimeout(() => {
            isApplyingSnapshotRef.current = false;
          }, 150);
        }
      }, (err) => {
        console.error(`Error on real-time collection ${colName}:`, err);
      });
      unsubscribers.push(unsub);
    };

    // Initialize snapshot listeners
    setupListener('members', 'members');
    setupListener('contributions', 'contributions');
    setupListener('loans', 'loans');
    setupListener('expenses', 'expenses');
    setupListener('auditLogs', 'auditLogs');
    setupListener('internalUsers', 'internalUsers');

    // Monitor constitution document in real-time
    const docRef = doc(db, 'saccos_groups', groupId);
    const unsubDoc = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const constitution = docSnap.data().constitution || '';
        isApplyingSnapshotRef.current = true;
        setData(prev => {
          if (prev.constitution === constitution) return prev;
          return {
            ...prev,
            constitution
          };
        });
        setTimeout(() => {
          isApplyingSnapshotRef.current = false;
        }, 150);
      }
    }, (err) => {
      console.error("Error on constitution real-time snapshot:", err);
    });
    unsubscribers.push(unsubDoc);

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [googleUser]);

  // 1.6. AUTOMATIC SAVE TO CLOUD IN REAL-TIME (LOCAL CHANGES TO FIRESTORE)
  useEffect(() => {
    if (!googleUser) return;
    
    // Skip if modification came from snapshot callback
    if (isApplyingSnapshotRef.current) return;

    // Use debounced auto-sync to Firestore (1.2 seconds)
    const delayDebounce = setTimeout(async () => {
      try {
        await saveSaccosDataToCloud(googleUser.uid, data);
        const nowStr = new Date().toLocaleString('sw-TZ');
        setLastCloudSynced(nowStr);
        localStorage.setItem('twaweza_digital_last_cloud_synced', nowStr);
      } catch (err) {
        console.error("Kosa la autocloud saving:", err);
      }
    }, 1200);

    return () => clearTimeout(delayDebounce);
  }, [data, googleUser]);

  const handleGoogleSignIn = async () => {
    try {
      const res = await googleSignIn();
      if (!res) return;
      const { user, accessToken } = res;
      setGoogleUser(user);
      showToast(`Umeunganishwa na Google kama ${user.displayName}!`, 'success');

      // Jaribu kupakia data zilizopo kwenye Cloud (Firebase Firestore)
      showToast('Kutafuta nakala zako za wingu...', 'info');
      const cloudData = await loadSaccosDataFromCloud(user.uid);
      if (cloudData && (cloudData.members?.length || cloudData.contributions?.length)) {
        const confirmCloudLoad = window.confirm(
          `Tumepata data za wingu zilizohifadhiwa hapo awali. Je, unataka kupakia na kuchukua nafasi ya data za kifaa hiki sasa?\n(Muda: ${localStorage.getItem('twaweza_digital_last_cloud_synced') || 'Sio wa sasa'})`
        );
        if (confirmCloudLoad) {
          setData(cloudData as SaccosData);
          showToast('Data kutoka kwenye wingu imepakiwa kikamilifu!', 'success');
          addSystemLog('Kiunganishi cha Wingu', 'Mtumiaji amepakia data kutoka Firebase Firestore.');
        }
      } else {
        // Ikiwa hakuna data ya wingu, hifadhi kiotomatiki data ya sasa ya kifaa kwenda cloud ili isipotee!
        showToast('Kuanzisha nakala mpya kwenye wingu kwa ajili yako...', 'info');
        await saveSaccosDataToCloud(user.uid, data);
        const nowStr = new Date().toLocaleString('sw-TZ');
        setLastCloudSynced(nowStr);
        localStorage.setItem('twaweza_digital_last_cloud_synced', nowStr);
        showToast('Backup ya kwanza kwenye Cloud imekamilika!', 'success');
        addSystemLog('Kiunganishi cha Wingu', 'Kuanzisha nakala mpya ya data kwenye Firebase Firestore.');
      }
    } catch (err) {
      console.error(err);
      showToast('Imeshindikana kuunganisha na Google: ' + err, 'error');
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await googleSignOut();
      setGoogleUser(null);
      showToast('Akaunti ya Google imetenganishwa ya mchezo.', 'info');
    } catch (err) {
      showToast('Imeshindikana kutenganisha akaunti.', 'error');
    }
  };

  const handleSyncCloud = async () => {
    if (!googleUser) return;
    setIsSyncingCloud(true);
    try {
      await saveSaccosDataToCloud(googleUser.uid, data);
      const nowStr = new Date().toLocaleString('sw-TZ');
      setLastCloudSynced(nowStr);
      localStorage.setItem('twaweza_digital_last_cloud_synced', nowStr);
      showToast('Data zote zimehifadhiwa salama kwenye Firebase Firestore (Cloud)!', 'success');
      addSystemLog('Hifadhi Cloud', 'Data zote zikiwemo wanachama, mikopo na matumizi zimehifadhiwa Firebase.');
    } catch (err) {
      showToast('Imeshindikana kuhifadhi mtandaoni: ' + err, 'error');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handleSyncSheets = async () => {
    if (!googleUser) return;
    setIsSyncingSheets(true);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Hupati token ya Google. Tafadhali unganisha akaunti yako upya.');
      }
      
      const existingId = localStorage.getItem('twaweza_digital_spreadsheet_id');
      const response = await syncSaccosToGoogleSheets(accessToken, data, existingId);
      
      localStorage.setItem('twaweza_digital_spreadsheet_id', response.spreadsheetId);
      localStorage.setItem('twaweza_digital_spreadsheet_url', response.spreadsheetUrl);
      setSpreadsheetUrl(response.spreadsheetUrl);
      
      const nowStr = new Date().toLocaleString('sw-TZ');
      setLastSheetsSynced(nowStr);
      localStorage.setItem('twaweza_digital_last_sheets_synced', nowStr);
      
      showToast('Google Sheets imesawazishwa vizuri! Sasa unaweza kuangalia kote mtandaoni.', 'success');
      addSystemLog('Google Sheets Sync', 'Kusasisha taarifa zote za Saccos kwenye Google Spreadsheet.');
    } catch (err: any) {
      showToast('Kosa la Google Sheets: ' + err.message, 'error');
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // 2. LIFECYCLE / COMPONENT DID MOUNT
  useEffect(() => {
    // Kuhifadhi data kwenye LocalStorage kila inapobadilika (Auto-Save, offline reliability)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    // Update active user session
    if (currentUser) {
      sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem(SESSION_USER_KEY);
    }
  }, [currentUser]);

  useEffect(() => {
    // Kusikiliza mabenki ya internet connection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 3. CORE UTILITY HELPERS
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const formatMoney = (n: number) => {
    return 'TSh ' + Number(n).toLocaleString('sw-TZ');
  };

  const addSystemLog = (action: string, details: string) => {
    const userLabel = currentUser ? `${currentUser.fullName} (${currentUser.username})` : 'Mtumiaji wa Nje';
    const newLog = createAuditLog(userLabel, action, details);
    
    setData(prev => ({
      ...prev,
      auditLogs: [newLog, ...(prev.auditLogs || [])]
    }));
  };

  // 4. BUSINESS LOGICS & CALLBACK ACTIONS

  // 4.1 Login / Logout Action
  const handleExecuteLogin = (username: string, passwordRaw: string): boolean => {
    const hashed = encryptPassword(passwordRaw);
    const found = data.internalUsers.find(
      u => u.username === username && u.passwordHash === hashed
    );

    if (found) {
      setCurrentUser(found);
      setLoginError('');
      setActiveModal(null);
      showToast(`Karibu tena, ${found.fullName}! Mfumo sasa una uwezo kamili.`, 'success');
      
      // Rekodi kwenye log ya mfumo kwa usalama
      const logUser = `${found.fullName} (${found.username})`;
      const newLog = createAuditLog(logUser, 'Ingia Mfumo', 'Mtumiaji ameingia na kuanzisha awamu mpya.');
      setData(prev => ({
        ...prev,
        auditLogs: [newLog, ...(prev.auditLogs || [])]
      }));
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    if (currentUser) {
      addSystemLog('Toka Mfumo', 'Mtumiaji amejiondoa salama kwenye mfumo wetu.');
    }
    setCurrentUser(null);
    setActivePage('dashboard');
    showToast('Umetolewa salama! Mfumo umerudi kwenye mtazamo wa nje tu (Soma pekee).', 'info');
  };

  // 4.2 Member Management Actions
  const handleSaveMember = (memberInput: { id?: string; name: string; memberNo: string; phone: string; email: string; initial: number; date?: string }) => {
    let successMsg = '';
    
    if (memberInput.id) {
      // Edit mode
      setData(prev => {
        const updatedMembers = prev.members.map(m => {
          if (m.id === memberInput.id) {
            return {
              ...m,
              name: memberInput.name,
              memberNo: memberInput.memberNo,
              phone: memberInput.phone,
              email: memberInput.email,
              created: memberInput.date ? new Date(memberInput.date).toISOString() : m.created
            };
          }
          return m;
        });
        return { ...prev, members: updatedMembers };
      });
      successMsg = `Taarifa za mwanachama ${memberInput.name} zimehaririwa kikamilifu!`;
      addSystemLog('Hariri Mwanachama', `Ilihariri taarifa za mwanachama ${memberInput.name} (${memberInput.memberNo})`);
    } else {
      // Create new member
      const newId = 'm_' + Math.random().toString(36).substring(2, 9);
      const newMember: Member = {
        id: newId,
        name: memberInput.name,
        memberNo: memberInput.memberNo,
        phone: memberInput.phone,
        email: memberInput.email,
        active: true,
        created: memberInput.date ? new Date(memberInput.date).toISOString() : new Date().toISOString()
      };

      setData(prev => {
        const updatedMembers = [...prev.members, newMember];
        const updatedContributions = [...prev.contributions];
        
        // Ikiwa aliweka michango ya mwanzo
        if (memberInput.initial > 0) {
          updatedContributions.push({
            id: 'c_' + Math.random().toString(36).substring(2, 9),
            memberId: newId,
            amount: memberInput.initial,
            date: memberInput.date || new Date().toISOString().slice(0, 10),
            type: 'Hisa',
            note: 'Michango ya vishada ya mwanzo ya kujiunga.'
          });
        }

        return {
          ...prev,
          members: updatedMembers,
          contributions: updatedContributions
        };
      });

      successMsg = `Mwanachama ${memberInput.name} amesajiliwa kikamilifu ${memberInput.initial > 0 ? 'pamoja na hisa za mwanzo' : ''}!`;
      addSystemLog('Sajili Mwanachama', `Amesajili mwanachama mpya: ${memberInput.name} na namba ${memberInput.memberNo}`);
    }

    showToast(successMsg, 'success');
    setActiveModal(null);
    setEditingMember(null);
  };

  const handleToggleMemberStatus = (id: string) => {
    const m = data.members.find(x => x.id === id);
    if (!m) return;
    
    const newStatus = !m.active;
    
    setData(prev => ({
      ...prev,
      members: prev.members.map(x => x.id === id ? { ...x, active: newStatus } : x)
    }));

    showToast(`Mwanachama ${m.name} sasa ${newStatus ? 'amewashwa rasmi' : 'amezimwa na hawezi kufanya miamala'}!`, 'info');
    addSystemLog('Badili Hali ya Uanachama', `${newStatus ? 'Amemuwasha' : 'Amemuzima'} mwanachama ${m.name} (${m.memberNo})`);
  };

  const handleDeleteMember = (id: string) => {
    const m = data.members.find(x => x.id === id);
    if (!m) return;
    
    if (!window.confirm(`Una uhakika unataka kumfuta kabisa mwanachama '${m.name}'? Hii itafuta pia kumbukumbu zote za michango na mikopo wake tangu mwanzo ili kuzuia makosa ya hesabu!`)) {
      return;
    }

    setData(prev => ({
      ...prev,
      members: prev.members.filter(x => x.id !== id),
      contributions: prev.contributions.filter(x => x.memberId !== id),
      loans: prev.loans.filter(x => x.memberId !== id)
    }));

    showToast(`Mwanachama ${m.name} na rekodi zake zote amefutwa kikamilifu!`, 'info');
    addSystemLog('Futa Mwanachama', `Amemfuta mwanachama na kumbukumbu zake zote: ${m.name} (${m.memberNo})`);
  };

  // 4.3 Contribution Actions
  const handleSaveContribution = (contrib: { memberId: string; amount: number; type: ContributionType; note: string; date?: string }) => {
    const m = data.members.find(x => x.id === contrib.memberId);
    if (!m) return;

    const newContrib = {
      id: 'c_' + Math.random().toString(36).substring(2, 9),
      memberId: contrib.memberId,
      amount: contrib.amount,
      date: contrib.date || new Date().toISOString().slice(0, 10),
      type: contrib.type,
      note: contrib.note
    };

    setData(prev => ({
      ...prev,
      contributions: [...prev.contributions, newContrib]
    }));

    showToast(`Mchango wa ${formatMoney(contrib.amount)} (${contrib.type}) wa mwanachama ${m.name} umerekodiwa!`, 'success');
    addSystemLog('Rekodi Mchango', `Amerekodi mchango wa ${formatMoney(contrib.amount)} aina ya ${contrib.type} kwa mwanachama ${m.name}`);
    setActiveModal(null);
  };

  const handleDeleteContribution = (id: string) => {
    const c = data.contributions.find(x => x.id === id);
    if (!c) return;
    
    const mName = data.members.find(x => x.id === c.memberId)?.name || 'Hajulikani';

    if (!window.confirm(`Futa mchango huu wa ${mName} kiasi cha ${formatMoney(c.amount)}?`)) {
      return;
    }

    setData(prev => ({
      ...prev,
      contributions: prev.contributions.filter(x => x.id !== id)
    }));

    showToast(`Mchango umefutwa kikamilifu!`, 'info');
    addSystemLog('Futa Mchango', `Amefuta mchango wa ${formatMoney(c.amount)} uliorekodiwa kwa mwanachama ${mName}`);
  };

  // 4.4 Loan Management Actions
  const handleSaveLoan = (loanInput: { memberId: string; amount: number; interest: number; totalPay: number; duration: number; note: string; date?: string }) => {
    const m = data.members.find(x => x.id === loanInput.memberId);
    if (!m) return;

    const newLoan: Loan = {
      id: 'l_' + Math.random().toString(36).substring(2, 9),
      memberId: loanInput.memberId,
      amount: loanInput.amount,
      interest: loanInput.interest,
      totalPay: loanInput.totalPay,
      paidAmount: 0,
      duration: loanInput.duration,
      date: loanInput.date || new Date().toISOString().slice(0, 10),
      status: 'ongoing',
      note: loanInput.note
    };

    setData(prev => ({
      ...prev,
      loans: [...prev.loans, newLoan]
    }));

    showToast(`Mkopo wa ${formatMoney(loanInput.amount)} umeidhinishwa na kutolewa salama kwa ${m.name}!`, 'success');
    addSystemLog('Toa Mkopo', `Ameidhinisha kumpa mkopo wa ${formatMoney(loanInput.amount)} riba ya ${loanInput.interest}% kwa ${m.name}`);
    setActiveModal(null);
  };

  const handleProcessLoanPayment = (payInput: { loanId: string; amount: number; date?: string }) => {
    const l = data.loans.find(x => x.id === payInput.loanId);
    if (!l) return;
    
    const m = data.members.find(x => x.id === l.memberId);
    const mName = m ? m.name : 'Unknown';

    setData(prev => {
      // 1. Sasisha mkopo wenyewe
      const updatedLoans = prev.loans.map(item => {
        if (item.id === payInput.loanId) {
          const newPaid = item.paidAmount + payInput.amount;
          const newStatus = newPaid >= item.totalPay ? 'cleared' : 'ongoing';
          return {
            ...item,
            paidAmount: newPaid,
            status: newStatus as any
          };
        }
        return item;
      });

      // 2. Ingiza marejesho kama ununuzi wa contribution ili hesabu za ripoti zijazwe kiotomatiki
      const newContrib = {
        id: 'c_' + Math.random().toString(36).substring(2, 9),
        memberId: l.memberId,
        amount: payInput.amount,
        date: payInput.date || new Date().toISOString().slice(0, 10),
        type: 'Marejesho ya Mkopo' as any,
        note: `Marejesho kiasi cha mkopo: ${l.id}`
      };

      return {
        ...prev,
        loans: updatedLoans,
        contributions: [...prev.contributions, newContrib]
      };
    });

    showToast(`Marejesho ya ${formatMoney(payInput.amount)} ya mwanachama ${mName} yamepokelewa kikamilifu!`, 'success');
    addSystemLog('Katisha Marejesho Mkopo', `Amesajili malipo ya marejesho ${formatMoney(payInput.amount)} ya ${mName} kufuatia mkopo wake.`);
    setActiveModal(null);
    setSelectedLoanForPayment(null);
  };

  const handleDeleteLoan = (id: string) => {
    const l = data.loans.find(x => x.id === id);
    if (!l) return;

    const mName = data.members.find(x => x.id === l.memberId)?.name || 'Hajulikani';

    if (!window.confirm(`Futa kabisa rekodi hii ya mkopo ya ${mName} ya ${formatMoney(l.amount)}? Hii haitarudisha marejesho yaliyokwisha kufanyika ila inasafisha mkopo wenyewe.`)) {
      return;
    }

    setData(prev => ({
      ...prev,
      loans: prev.loans.filter(x => x.id !== id)
    }));

    showToast(`Mkopo umefutwa kikamilifu kwenye bodi ya orodha!`, 'info');
    addSystemLog('Futa Mkopo', `Amefuta rekodi ya mkopo wa ${formatMoney(l.amount)} uliokuwa kwa ${mName}`);
  };

  // 4.5 Expense Actions
  const handleSaveExpense = (exp: { description: string; amount: number; category: any; note: string; date?: string }) => {
    const newExp = {
      id: 'e_' + Math.random().toString(36).substring(2, 9),
      description: exp.description,
      amount: exp.amount,
      date: exp.date || new Date().toISOString().slice(0, 10),
      category: exp.category,
      note: exp.note
    };

    setData(prev => ({
      ...prev,
      expenses: [...prev.expenses, newExp]
    }));

    showToast(`Matumizi ya ${formatMoney(exp.amount)} ya ${exp.description} yamesajiliwa kikamilifu!`, 'success');
    addSystemLog('Rekodi Matumizi', `Amerekodi matumizi ${formatMoney(exp.amount)} kwa kategoria ya ${exp.category}: ${exp.description}`);
    setActiveModal(null);
  };

  const handleDeleteExpense = (id: string) => {
    const e = data.expenses.find(x => x.id === id);
    if (!e) return;

    if (!window.confirm(`Una uhakika unataka kufuta matumizi haya ya '${e.description}' ya ${formatMoney(e.amount)}?`)) {
      return;
    }

    setData(prev => ({
      ...prev,
      expenses: prev.expenses.filter(x => x.id !== id)
    }));

    showToast(`Matumizi yamefutwa kabisa!`, 'info');
    addSystemLog('Futa Matumizi', `Amefuta matumizi ya ${formatMoney(e.amount)} kufuatia: ${e.description}`);
  };

  // 4.6 Constitution Actions
  const handleSaveConstitution = (text: string) => {
    setData(prev => ({
      ...prev,
      constitution: text
    }));

    showToast('Katiba imesasishwa salama na kamati ya kundi!', 'success');
    addSystemLog('Hariri Katiba', 'Katiba ya kikundi imesasishwa rasmi na andiko jipya kuhifadhiwa.');
    setActiveModal(null);
  };

  // 4.7 Internal User Administration Actions
  const handleSaveUser = (userInput: { id?: string; username: string; passwordRaw: string; fullName: string; role: 'admin' | 'staff' }) => {
    const hashed = encryptPassword(userInput.passwordRaw);
    
    if (userInput.id) {
      // Edit mode
      const duplicate = data.internalUsers.find(u => u.username === userInput.username && u.id !== userInput.id);
      if (duplicate) {
        alert(`Jina la mtumiaji '${userInput.username}' tayari limeshasajiliwa na mtu mwingine!`);
        return;
      }

      setData(prev => {
        const updatedUsers = prev.internalUsers.map(u => {
          if (u.id === userInput.id) {
            return {
              ...u,
              username: userInput.username,
              passwordHash: hashed,
              fullName: userInput.fullName,
              role: userInput.role
            };
          }
          return u;
        });
        return {
          ...prev,
          internalUsers: updatedUsers
        };
      });

      // Sasisha currentUser ikiwa mabadiliko yanamhusu mtumiaji aliyopo kwenye kikao sasa (login session)
      if (currentUser && currentUser.id === userInput.id) {
        const updatedCurrentUser = {
          ...currentUser,
          username: userInput.username,
          passwordHash: hashed,
          fullName: userInput.fullName,
          role: userInput.role
        };
        setCurrentUser(updatedCurrentUser);
        sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(updatedCurrentUser));
      }

      showToast(`Taarifa za mtumiaji ${userInput.fullName} zimesasishwa salama!`, 'success');
      addSystemLog('Hariri Profaili', `Amehariri taarifa za mtumiaji wa ndani: ${userInput.fullName} (${userInput.username})`);
      setActiveModal(null);
      setEditingUser(null);
    } else {
      // Create mode
      const duplicate = data.internalUsers.find(u => u.username === userInput.username);
      if (duplicate) {
        alert(`Jina la mtumiaji '${userInput.username}' tayari limeshasajiliwa!`);
        return;
      }

      const newUser = {
        id: 'u_' + Math.random().toString(36).substring(2, 9),
        username: userInput.username,
        passwordHash: hashed,
        fullName: userInput.fullName,
        created: new Date().toISOString(),
        role: userInput.role
      };

      setData(prev => ({
        ...prev,
        internalUsers: [...prev.internalUsers, newUser]
      }));

      showToast(`Mtumiaji mpya ${userInput.fullName} (${userInput.username}) amesajiliwa kama ${userInput.role === 'admin' ? 'Mkuu' : 'Mtendaji'}!`, 'success');
      addSystemLog('Unda Mtumiaji wa Ndani', `Ameunda mtumiaji mpya wa ndani: ${userInput.fullName} mwenye mamlaka ya ${userInput.role}`);
      setActiveModal(null);
    }
  };

  const handleResetSystem = () => {
    if (!currentUser || currentUser.role !== 'admin') {
      alert('Ni msimamizi mkuu pekee (Admin) mwenye haki ya kusafisha mfumo mzima!');
      return;
    }

    if (!window.confirm('Je, una uhakika unataka KUFUTA kabisa taarifa zote mtawalia (Wanachama, Michango yote, Mikopo yote, Matumizi yote)? Kitendo hiki hakiwezi kurudishwa nyuma!')) {
      return;
    }

    const confirmText = prompt('Tafadhali andika neno "FUTA" kudhibitisha kitendo hiki kizito laha ya data:');
    if (!confirmText || confirmText.trim().toUpperCase() !== 'FUTA') {
      alert('Ufutaji umesitishwa. Neno la udhibitisho halikulingana.');
      return;
    }

    try {
      const emptyData: SaccosData = {
        members: [],
        contributions: [],
        loans: [],
        expenses: [],
        constitution: data.constitution,
        internalUsers: data.internalUsers, // Tunashikilia watumiaji washuhuda ili wasijifunge nje (lockout)
        auditLogs: [
          {
            id: `log_reset_${Date.now()}`,
            timestamp: new Date().toISOString(),
            user: `${currentUser.fullName} (${currentUser.username})`,
            action: 'Kusafisha Mfumo',
            details: 'Msimamizi amesafisha kabisa taarifa zote za mfano na data mtawalia za mfumo ili kuanza matumizi halisi.'
          }
        ]
      };

      setData(emptyData);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(emptyData));
      localStorage.removeItem(LOCAL_STORAGE_KEY_LEGACY);

      showToast('Mfumo umesafishwa na data zote za mfano kufutwa! Sasa kundi liko safi kuanza uandikishaji halisi.', 'success');
    } catch (e) {
      console.error('Alas! Imeshindikana kusafisha data kikamilifu:', e);
      showToast('Hitilafu ilitokea wakati wa kusafisha data.', 'error');
    }
  };

  const handleLoadSampleData = () => {
    if (!currentUser || currentUser.role !== 'admin') {
      alert('Ni msimamizi mkuu pekee (Admin) mwenye haki ya kupakia data ya mfano!');
      return;
    }

    if (!window.confirm('Je, una uhakika unataka kupakia tena data ya mfano? Kitendo hiki kitaweka wanachama wa kielelezo, michango na mikopo ya mfano.')) {
      return;
    }

    try {
      const defaults = getDefaultSaccosData();
      const updatedData: SaccosData = {
        ...data,
        members: defaults.members,
        contributions: defaults.contributions,
        loans: defaults.loans,
        expenses: defaults.expenses,
        auditLogs: [
          ...data.auditLogs,
          {
            id: `log_restore_sample_${Date.now()}`,
            timestamp: new Date().toISOString(),
            user: `${currentUser.fullName} (${currentUser.username})`,
            action: 'Kurejesha Data ya Mfano',
            details: 'Msimamizi amerejesha taarifa za mfano za kikundi kwenye mfumo.'
          }
        ]
      };

      setData(updatedData);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedData));
      localStorage.removeItem(LOCAL_STORAGE_KEY_LEGACY);

      showToast('Data ya mfano imerejeshwa kikamilifu kwenye mfumo wako!', 'success');
    } catch (e) {
      console.error('Alas! Imeshindikana kupakia data ya mfano:', e);
      showToast('Hitilafu ilitokea wakati wa kupakia data za mfano.', 'error');
    }
  };

  const handleDeleteUser = (id: string) => {
    // Kuzuia kufuta admin wa mwisho
    if (data.internalUsers.length <= 1) {
      alert('Huwezi kufuta mtumiaji wa mwisho! Angalau mtumiaji mmoja anahitajika kuingia mfumo kuzuia lockout.');
      return;
    }

    const target = data.internalUsers.find(u => u.id === id);
    if (!target) return;

    if (!window.confirm(`Futa kabisa mamlaka na mtumiaji wa ndani '${target.fullName}' (${target.username})?`)) {
      return;
    }

    setData(prev => ({
      ...prev,
      internalUsers: prev.internalUsers.filter(u => u.id !== id)
    }));

    showToast(`Mtumiaji ${target.fullName} amefutwa na kuondolewa mamlaka yake!`, 'info');
    addSystemLog('Futa Mtumiaji wa Ndani', `Amemfuta mtumiaji wa ndani na kuondoa login yake: ${target.fullName} (${target.username})`);
  };

  // 4.8 Backups - Export and Import (Data Security & Loss prevention)
  const handleExportBackup = () => {
    try {
      exportDataBackup(data);
      showToast('Nyaraka imehifadhiwa! Backup ya data yako yote ya SACCOS imepakuliwa salama.', 'success');
      addSystemLog('Tengeneza Backup', 'Amepakua nakala kamili ya data (JSON Backup) ili kulinda usalama wa fedha.');
    } catch (e) {
      showToast('Maji yamezidi unga! Imeshindikana kupakua backup.', 'error');
    }
  };

  const handleTriggerImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const resultText = event.target?.result as string;
        const restoredData = importDataBackup(resultText);
        
        // Uliza thibitisho kabla ya kuoverwrite kila kitu
        if (window.confirm(`Tahadhari! Kupakia faili la Backup kuta-overwrite (kutaondoa) data zote zilizopo sasa kwenye kivinjari chako. Je run weka data hizi mpya zilizopo kwenye faili la nakala la '${file.name}'?`)) {
          // kuandikisha log ya mwisho kuami upakiaji wetu
          const now = new Date().toISOString();
          restoredData.auditLogs = [
            createAuditLog(
              currentUser ? `${currentUser.fullName} (${currentUser.username})` : 'System Restore',
              'Pakia Data Backup (Restore)',
              `Data zote zimepakiwa na kurestoriwa upya kutoka faili la backup: ${file.name}`
            ),
            ...(restoredData.auditLogs || [])
          ];

          setData(restoredData);
          setActivePage('dashboard');
          showToast('Hongera sana! Data yote ya backup imepakiwa na kurestoriwa kikamilifu bila kupoteza chochote.', 'success');
        }
      } catch (err: any) {
        showToast(err.message || 'Mchakato wa backup umefeli! Faili si sahihi.', 'error');
      }
    };

    reader.readAsText(file);
    // Safisha value ili trigger afanye kazi akipata faili lingine la aina moja mbeleni
    e.target.value = '';
  };

  // Navigational callback wrapper
  const handleNavigatePage = (pageId: string) => {
    if (pageId === 'login') {
      setActiveModal('login');
    } else {
      setActivePage(pageId);
    }
  };

  const handleOpenGeneralModal = (modalId: string) => {
    setEditingMember(null);
    setEditingUser(null);
    setSelectedLoanForPayment(null);
    setActiveModal(modalId);
  };

  const handleTriggerEditMember = (member: Member) => {
    setEditingMember(member);
    setActiveModal('memberModal');
  };

  const handleTriggerEditUser = (user: InternalUser) => {
    setEditingUser(user);
    setActiveModal('userModal');
  };

  const handleTriggerPaymentModal = (loan: Loan) => {
    setSelectedLoanForPayment(loan);
    setActiveModal('loanPaymentModal');
  };

  // Render Page Content Switch-board
  const renderActiveView = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <DashboardView 
            data={data}
            currentUser={currentUser}
            onOpenModal={handleOpenGeneralModal}
            formatMoney={formatMoney}
          />
        );
      case 'members':
        return (
          <MembersView 
            members={data.members}
            contributions={data.contributions}
            loans={data.loans}
            currentUser={currentUser}
            onOpenAddModal={() => handleOpenGeneralModal('memberModal')}
            onEditMember={handleTriggerEditMember}
            onDeleteMember={handleDeleteMember}
            onToggleStatus={handleToggleMemberStatus}
            formatMoney={formatMoney}
          />
        );
      case 'contributions':
        return (
          <ContributionsView 
            contributions={data.contributions}
            members={data.members}
            currentUser={currentUser}
            onOpenAddModal={() => handleOpenGeneralModal('contributionModal')}
            onDeleteContribution={handleDeleteContribution}
            formatMoney={formatMoney}
          />
        );
      case 'loans':
        return (
          <LoansView 
            loans={data.loans}
            members={data.members}
            currentUser={currentUser}
            onOpenAddModal={() => handleOpenGeneralModal('loanModal')}
            onOpenPaymentModal={handleTriggerPaymentModal}
            onDeleteLoan={handleDeleteLoan}
            formatMoney={formatMoney}
          />
        );
      case 'expenses':
        return (
          <ExpensesView 
            expenses={data.expenses}
            currentUser={currentUser}
            onOpenAddModal={() => handleOpenGeneralModal('expenseModal')}
            onDeleteExpense={handleDeleteExpense}
            formatMoney={formatMoney}
          />
        );
      case 'constitution':
        return (
          <ConstitutionView 
            constitution={data.constitution}
            currentUser={currentUser}
            onOpenEditModal={() => handleOpenGeneralModal('constitutionModal')}
          />
        );
      case 'users':
        return (
          <UsersView 
            users={data.internalUsers}
            auditLogs={data.auditLogs}
            currentUser={currentUser}
            onOpenAddUserModal={() => handleOpenGeneralModal('userModal')}
            onOpenEditUserModal={handleTriggerEditUser}
            onDeleteUser={handleDeleteUser}
            onResetSystem={handleResetSystem}
            onLoadSampleData={handleLoadSampleData}
            
            // Google Auth & Cloud Sync props
            googleUser={googleUser}
            onGoogleSignIn={handleGoogleSignIn}
            onGoogleSignOut={handleGoogleSignOut}
            isSyncingCloud={isSyncingCloud}
            onSyncCloud={handleSyncCloud}
            isSyncingSheets={isSyncingSheets}
            onSyncSheets={handleSyncSheets}
            spreadsheetUrl={spreadsheetUrl}
            lastCloudSynced={lastCloudSynced}
            lastSheetsSynced={lastSheetsSynced}
          />
        );
      default:
        return (
          <div className="text-center py-20 text-slate-500">
            Ukurasa huu haupatikani bado. Rudi nyumbani.
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      
      {/* Hidden File Input for Data Backups Restores */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Modern custom toast notification bar kilele */}
      {toast && (
        <div className="fixed top-20 right-4 sm:right-8 z-[200] max-w-sm w-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-4 flex items-start gap-3 animate-slide-in">
          <div className="text-lg">
            {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
          </div>
          <div className="flex-1 space-y-0.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {toast.type === 'success' ? 'Mafanikio ✓' : toast.type === 'error' ? 'Kosa' : 'Taarifa'}
            </h4>
            <p className="text-xs text-slate-300 font-medium leading-snug">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Head Navigation */}
      <Header 
        isOnline={isOnline}
        currentUser={currentUser}
        onLogout={handleLogout}
        onNavigate={handleNavigatePage}
        activePage={activePage}
        onExportBackup={handleExportBackup}
        onTriggerImportClick={handleTriggerImportClick}
      />

      {/* Main Body Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-32">
        
        {/* Printable Section Header - with real-time date indicators  */}
        <div className="hidden print:flex flex-col items-center justify-center text-center pb-8 border-b border-slate-200 text-slate-900">
          <h1 className="text-2xl font-black uppercase tracking-wide">Ripoti Rasmi za Saccos Plus</h1>
          <p className="text-sm">Kikundi cha Maendeleo ya Pamoja</p>
          <div className="text-xs text-slate-650 mt-2">
            Mchapisho wa SAA: {new Date().toLocaleDateString('sw-TZ')} {new Date().toLocaleTimeString('sw-TZ')}
          </div>
        </div>

        {/* Section Content */}
        {renderActiveView()}

      </main>

      {/* Page Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-900/80 backdrop-blur-md py-4 text-center text-xs text-slate-600 space-y-1 no-print">
        <div>
          <strong className="text-slate-500">TWAWEZA DIGITAL &copy; 2026</strong> — Mfumo wa kisasa wa Kusimamia Kikundi Offline na Online.
        </div>
        <div className="text-xs text-slate-400 font-semibold">
          Mtengenezaji wa mfumo huu ni <span className="text-emerald-400 font-bold">Gaston Mapunda</span>
        </div>
        <div className="text-[10px] text-slate-550">
          Uwezo wa kuhifadhi unalindwa na kivinjari chako. Pakua backup mara kwa mara kuzuia upotevu wa vifaa.
        </div>
      </footer>

      {/* Modal Controllers */}
      <Modals 
        activeModal={activeModal}
        onClose={() => {
          setActiveModal(null);
          setEditingMember(null);
          setEditingUser(null);
          setSelectedLoanForPayment(null);
          setLoginError('');
        }}
        members={data.members}
        loans={data.loans}
        
        // Members
        onSaveMember={handleSaveMember}
        editingMember={editingMember}
        
        // Contributions
        onSaveContribution={handleSaveContribution}
        
        // Loans
        onSaveLoan={handleSaveLoan}
        selectedLoanForPayment={selectedLoanForPayment}
        onProcessLoanPayment={handleProcessLoanPayment}
        
        // Expenses
        onSaveExpense={handleSaveExpense}
        
        // Internal Users
        onSaveUser={handleSaveUser}
        editingUser={editingUser}
        currentUser={currentUser}
        
        // Constitution
        onSaveConstitution={handleSaveConstitution}
        constitutionText={data.constitution}
        
        // Auth Logic
        onExecuteLogin={handleExecuteLogin}
        loginError={loginError}
        setLoginError={setLoginError}
        
        // Google Auth Logic
        googleUser={googleUser}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleSignOut={handleGoogleSignOut}
        
        formatMoney={formatMoney}
      />

    </div>
  );
}
