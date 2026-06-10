/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Member {
  id: string;
  name: string;
  memberNo: string;
  phone: string;
  email: string;
  active: boolean;
  created: string;
  driveFileId?: string;
  driveFileName?: string;
}

export type ContributionType = 
  | 'Hisa' 
  | 'Akiba' 
  | 'Mfuko Maalum' 
  | 'Rada' 
  | 'Marejesho ya Mkopo'
  | 'Ada ya Uanachama'
  | 'Nyingine';

export interface Contribution {
  id: string;
  memberId: string;
  amount: number;
  date: string;
  type: ContributionType;
  note: string;
}

export interface Loan {
  id: string;
  memberId: string;
  amount: number;
  interest: number; // as percentage, e.g., 10 for 10%
  totalPay: number;
  paidAmount: number;
  duration: number; // in months
  date: string;
  status: 'ongoing' | 'cleared';
  note: string;
}

export interface LoanPayment {
  id: string;
  loanId: string;
  memberId: string;
  amount: number;
  date: string;
  note: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: 'Uendeshaji' | 'Vifaa' | 'Mafunzo' | 'Safari' | 'Matengenezo' | 'Drawings' | 'Nyingine';
  note: string;
}

export interface InternalUser {
  id: string;
  username: string;
  passwordHash: string; // Tuta-encrypt au ku-hash kidogo kwa usalama
  fullName: string;
  created: string;
  role: 'admin' | 'staff';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export interface SaccosData {
  members: Member[];
  contributions: Contribution[];
  loans: Loan[];
  expenses: Expense[];
  constitution: string;
  internalUsers: InternalUser[];
  auditLogs: AuditLog[];
}
