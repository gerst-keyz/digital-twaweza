/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User,
  signOut
} from 'firebase/auth';
import { 
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { SaccosData, Member, Contribution, Loan, Expense, InternalUser, AuditLog } from '../types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request Google Sheets scope
provider.addScope('https://www.googleapis.com/auth/spreadsheets');

// Memory cache for OAuth access token (as required by the skill instructions)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// 1. COMPLIANT FIRESTORE ERROR HANDLER (Mandatory - Eight Pillars of Hardened Rules)
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous
    },
    operationType,
    path
  };
  console.error('Firestore Secure Logging Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 2. AUTH SYSTEM PATTERNS
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        // We have a user but no session-cached token. Force them to re-click login if necessary
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Google Auth Provider');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const googleSignOut = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// 3. FIRESTORE DATA BACKEND OPERATIONS (Sync SaccosData)
export const saveSaccosDataToCloud = async (groupId: string, data: SaccosData): Promise<void> => {
  const groupDocPath = `saccos_groups/${groupId}`;
  
  try {
    // 1. Save Group Config/Constitution
    await setDoc(doc(db, groupDocPath), {
      constitution: data.constitution || ''
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, groupDocPath);
  }

  // To prevent too many network roundtrips or exceeding limits, we store subcollections:
  // We can write updates in bulk or a nested document if size is within 1MB. Fits perfectly in subcollections.
  const batch = writeBatch(db);
  
  // To avoid quota errors and write safely, we upload individual items if changed
  // But a robust way to sync current state is writing documents.
  // We'll write to Firestore.
  try {
    // Members
    for (const m of data.members) {
      const ref = doc(db, `${groupDocPath}/members`, m.id);
      batch.set(ref, m);
    }
    // Contributions
    for (const c of data.contributions) {
      const ref = doc(db, `${groupDocPath}/contributions`, c.id);
      batch.set(ref, c);
    }
    // Loans
    for (const l of data.loans) {
      const ref = doc(db, `${groupDocPath}/loans`, l.id);
      batch.set(ref, l);
    }
    // Expenses
    for (const e of data.expenses) {
      const ref = doc(db, `${groupDocPath}/expenses`, e.id);
      batch.set(ref, e);
    }
    // AuditLogs - optimize: only sync last 50 audit logs to avoid massive quota usage
    const recentLogs = data.auditLogs.slice(0, 50);
    for (const log of recentLogs) {
      const ref = doc(db, `${groupDocPath}/auditLogs`, log.id);
      batch.set(ref, log);
    }
    // Internal Users
    for (const u of data.internalUsers) {
      const ref = doc(db, `${groupDocPath}/internalUsers`, u.id);
      batch.set(ref, u);
    }

    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, groupDocPath);
  }
};

export const loadSaccosDataFromCloud = async (groupId: string): Promise<Partial<SaccosData> | null> => {
  const groupDocPath = `saccos_groups/${groupId}`;
  
  try {
    const configSnap = await getDoc(doc(db, groupDocPath));
    if (!configSnap.exists()) {
      return null;
    }
    
    const constitution = configSnap.data()?.constitution || '';

    // Load subcollections
    const membersSnap = await getDocs(collection(db, `${groupDocPath}/members`));
    const contributionsSnap = await getDocs(collection(db, `${groupDocPath}/contributions`));
    const loansSnap = await getDocs(collection(db, `${groupDocPath}/loans`));
    const expensesSnap = await getDocs(collection(db, `${groupDocPath}/expenses`));
    const auditLogsSnap = await getDocs(collection(db, `${groupDocPath}/auditLogs`));
    const internalUsersSnap = await getDocs(collection(db, `${groupDocPath}/internalUsers`));

    const members: Member[] = [];
    membersSnap.forEach(d => members.push(d.data() as Member));

    const contributions: Contribution[] = [];
    contributionsSnap.forEach(d => contributions.push(d.data() as Contribution));

    const loans: Loan[] = [];
    loansSnap.forEach(d => loans.push(d.data() as Loan));

    const expenses: Expense[] = [];
    expensesSnap.forEach(d => expenses.push(d.data() as Expense));

    const auditLogs: AuditLog[] = [];
    auditLogsSnap.forEach(d => auditLogs.push(d.data() as AuditLog));

    const internalUsers: InternalUser[] = [];
    internalUsersSnap.forEach(d => internalUsers.push(d.data() as InternalUser));

    return {
      constitution,
      members,
      contributions,
      loans,
      expenses,
      auditLogs,
      internalUsers
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, groupDocPath);
    return null;
  }
};
