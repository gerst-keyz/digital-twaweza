/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Coins, Landmark, DollarSign, BookOpen, Key, AlertCircle, User, Lock } from 'lucide-react';
import { Member, ContributionType, Loan, InternalUser } from '../types';
import { decryptPassword } from '../lib/security';

interface ModalsProps {
  activeModal: string | null;
  onClose: () => void;
  members: Member[];
  loans: Loan[];
  onSaveMember: (data: { id?: string; name: string; memberNo: string; phone: string; email: string; initial: number; date?: string }) => void;
  editingMember: Member | null;
  onSaveContribution: (data: { memberId: string; amount: number; type: ContributionType; note: string; date?: string }) => void;
  onSaveLoan: (data: { memberId: string; amount: number; interest: number; totalPay: number; duration: number; note: string; date?: string }) => void;
  selectedLoanForPayment: Loan | null;
  onProcessLoanPayment: (data: { loanId: string; amount: number; date?: string }) => void;
  onSaveExpense: (data: { description: string; amount: number; category: any; note: string; date?: string }) => void;
  onSaveUser: (data: { id?: string; username: string; passwordRaw: string; fullName: string; role: 'admin' | 'staff' }) => void;
  editingUser: InternalUser | null;
  currentUser: InternalUser | null;
  onSaveConstitution: (text: string) => void;
  constitutionText: string;
  onExecuteLogin: (username: string, passwordRaw: string) => boolean;
  loginError: string;
  setLoginError: (err: string) => void;
  formatMoney: (n: number) => string;
  googleUser?: any | null;
  onGoogleSignIn?: () => Promise<void>;
  onGoogleSignOut?: () => Promise<void>;
}

export default function Modals({
  activeModal,
  onClose,
  members,
  loans,
  onSaveMember,
  editingMember,
  onSaveContribution,
  onSaveLoan,
  selectedLoanForPayment,
  onProcessLoanPayment,
  onSaveExpense,
  onSaveUser,
  editingUser,
  currentUser,
  onSaveConstitution,
  constitutionText,
  onExecuteLogin,
  loginError,
  setLoginError,
  formatMoney,
  googleUser,
  onGoogleSignIn,
  onGoogleSignOut
}: ModalsProps) {

  // Ikiwa hakuna modali iliyopo wazi, usionyeshe chochote
  if (!activeModal) return null;

  // Render modal base template
  const ModalBase = ({ title, icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl animate-scale-in my-8">
        <button 
          onClick={onClose} 
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
          <span className="p-2 bg-slate-800 rounded-lg text-emerald-400">{icon}</span>
          <h2 className="text-lg font-black text-white">{title}</h2>
        </div>
        
        {children}
      </div>
    </div>
  );

  // 1. MEMBER MODEL STATE & FORM
  const MemberModal = () => {
    const [name, setName] = useState('');
    const [memberNo, setMemberNo] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [initial, setInitial] = useState(0);
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

    useEffect(() => {
      if (editingMember) {
        setName(editingMember.name);
        setMemberNo(editingMember.memberNo);
        setPhone(editingMember.phone);
        setEmail(editingMember.email);
        setInitial(0);
        setDate(editingMember.created ? editingMember.created.slice(0, 10) : new Date().toISOString().slice(0, 10));
      } else {
        setName('');
        setMemberNo('');
        setPhone('');
        setEmail('');
        setInitial(0);
        setDate(new Date().toISOString().slice(0, 10));
      }
    }, [editingMember]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!name || !memberNo) {
        alert('Jina na Cheo cha Mwanachama vinahitajika!');
        return;
      }
      onSaveMember({ id: editingMember?.id, name, memberNo, phone, email, initial, date });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-300">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400">Jina Kamili la Mwanachama</label>
          <input 
            type="text" 
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Mf. Yohana Charles Mrema"
            className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Cheo (Nafasi ya Mwanachama)</label>
            <input 
              type="text" 
              required
              value={memberNo}
              onChange={(e) => setMemberNo(e.target.value)}
              placeholder="Mf. Katibu, Mhasibu, Mwanachama"
              className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Namba ya Simu</label>
            <input 
              type="text" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Mf. 0712XXXXXX"
              className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Barua Pepe (Email - Sio Lazima)</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mwanachama@email.com"
              className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Tarehe ya Usajili / Kujiunga</label>
            <input 
              type="date" 
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onClick={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
              onFocus={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
              className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white transition-colors cursor-pointer"
            />
          </div>
        </div>

        {!editingMember && (
          <div className="space-y-1.5 bg-slate-950/40 border border-slate-850 p-4 rounded-xl">
            <label className="text-xs font-bold text-slate-400">Michango ya Hisa ya Mwanzo (TSh)</label>
            <p className="text-[10px] text-slate-500 pb-2">Ikiwa unataka kusajili na mchango wa kwanza hapa hapa.</p>
            <input 
              type="number" 
              value={initial}
              onChange={(e) => setInitial(Number(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white transition-colors font-bold text-emerald-400"
            />
          </div>
        )}

        <div className="pt-4 border-t border-slate-850 flex gap-3 justify-end">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-lg text-xs cursor-pointer"
          >
            Ghairi
          </button>
          <button 
            type="submit" 
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-lg shadow-emerald-900/10 cursor-pointer"
          >
            💾 {editingMember ? 'Hifadhi Mabadiliko' : 'Sajili Mwanachama'}
          </button>
        </div>
      </form>
    );
  };

  // 2. CONTRIBUTION MODAL
  const ContributionModal = () => {
    const [memberId, setMemberId] = useState('');
    const [amount, setAmount] = useState<number>(50000);
    const [type, setType] = useState<ContributionType>('Akiba');
    const [note, setNote] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!memberId) {
        alert('Tafadhali chagua mwanachama kwanza!');
        return;
      }
      if (amount <= 0) {
        alert('Tafadhali kiasi kinatakiwa kuzidi 0.');
        return;
      }
      onSaveContribution({ memberId, amount, type, note, date });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-300">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400">Chagua Mwanachama</label>
          <select
            required
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white transition-colors cursor-pointer"
          >
            <option value="">-- Chagua Mwanachama active --</option>
            {members.filter(m => m.active).map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.memberNo})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Kiasi cha Mchango (TSh)</label>
            <input 
              type="number" 
              required
              min="100"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white transition-colors font-bold text-emerald-400"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Aina ya Mchango</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ContributionType)}
              className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white transition-colors cursor-pointer text-xs"
            >
              <option value="Akiba">Akiba / Savings</option>
              <option value="Hisa">Hisa / Shares</option>
              <option value="Mfuko Maalum">Mfuko Maalum / Social Fund</option>
              <option value="Ada ya Uanachama">Ada ya Uanachama / Admission Fee</option>
              <option value="Rada">Rada / Donation</option>
              <option value="Nyingine">Nyingine</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Tarehe ya Mchango</label>
            <input 
              type="date" 
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onClick={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
              onFocus={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
              className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white transition-colors cursor-pointer"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Maelezo (Notes m.f Risiti Namba, nk.)</label>
            <input 
              type="text" 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Maelezo mafupi ya mchango..."
              className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white transition-colors"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-850 flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-755 text-slate-300 font-bold rounded-lg text-xs cursor-pointer">Ghairi</button>
          <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow-lg shadow-emerald-900/10">💾 Hifadhi Mchango</button>
        </div>
      </form>
    );
  };

  // 3. LOAN MODAL (Toa Mkopo Mpya)
  const LoanModal = () => {
    const [memberId, setMemberId] = useState('');
    const [amount, setAmount] = useState<number>(500000);
    const [intent, setIntent] = useState<number>(10); // interest
    const [duration, setDuration] = useState<number>(12);
    const [note, setNote] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

    const totalInterest = (amount * intent) / 100;
    const totalPay = amount + totalInterest;

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!memberId) {
        alert('Chagua nani anapewa mkopo!');
        return;
      }
      if (amount <= 0) {
        alert('Kiasi cha mkopo hakiwezi kuwa chini ya 0 TSh!');
        return;
      }
      onSaveLoan({ memberId, amount, interest: intent, totalPay, duration, note, date });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-300">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400">Chagua Mwanachama wa Kukopa</label>
          <select
            required
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white transition-colors cursor-pointer"
          >
            <option value="">-- Chagua nani anapewa mkopo active --</option>
            {members.filter(m => m.active).map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.memberNo})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Kiasi cha Mkopo (TSh)</label>
            <input 
              type="number" 
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white transition-colors font-bold text-amber-555"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Riba Iliyoidhinishwa (%)</label>
            <input 
              type="number" 
              required
              value={intent}
              onChange={(e) => setIntent(Number(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Muda wa Kurejesha (Miezi)</label>
            <input 
              type="number" 
              required
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value) || 1)}
              className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Jumla na Riba (TSh)</label>
            <input 
              type="text" 
              readOnly
              value={formatMoney(totalPay)}
              className="w-full bg-slate-855 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none text-slate-400 font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Tarehe ya Kutoa Mkopo</label>
            <input 
              type="date" 
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onClick={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
              onFocus={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
              className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white transition-colors cursor-pointer"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Maelezo/Malengo (Notes - Si lazima)</label>
            <input 
              type="text" 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="M.f. Mkopo wa ununuzi wa shamba, biashara, etc."
              className="w-full bg-slate-950 border border-slate-850 hover:border-slate-855 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white transition-colors"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-855 flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-755 text-slate-300 font-bold rounded-lg text-xs cursor-pointer">Ghairi</button>
          <button type="submit" className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs cursor-pointer shadow-lg">💾 Toa Mkopo</button>
        </div>
      </form>
    );
  };

  // 4. LOAN PAYMENT MODAL (Lipa Mkopo)
  const LoanPaymentModal = () => {
    const [amount, setAmount] = useState<number>(0);
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    
    if (!selectedLoanForPayment) return null;

    const mName = members.find(m => m.id === selectedLoanForPayment.memberId)?.name || 'Anayerejesha';
    const balance = selectedLoanForPayment.totalPay - selectedLoanForPayment.paidAmount;

    useEffect(() => {
      setAmount(balance); // weka baki kama default
    }, [selectedLoanForPayment]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (amount <= 0) {
        alert('Tafadhali kiasi cha malipo lazima kizidi 0 TSh!');
        return;
      }
      if (amount > balance) {
        alert(`Kiasi kinazidi deni lililobaki! Deni la mwisho ni ${formatMoney(balance)} TSh.`);
        return;
      }
      onProcessLoanPayment({ loanId: selectedLoanForPayment.id, amount, date });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-300">
        <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl space-y-1">
          <div className="text-xs text-slate-450 uppercase font-semibold">Anayerejesha Deni</div>
          <div className="text-sm font-bold text-white">{mName}</div>
          <div className="pt-2 text-xs text-slate-450 uppercase font-semibold">Salio / Baki la Mkopo:</div>
          <div className="text-lg font-black text-rose-455">{formatMoney(balance)}</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Kiasi unacholipa sasa (TSh)</label>
            <input 
              type="number" 
              required
              max={balance}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white transition-colors font-bold text-emerald-400"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Tarehe ya Malipo / Marejesho</label>
            <input 
              type="date" 
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onClick={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
              onFocus={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
              className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white transition-colors cursor-pointer"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-850 flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-755 text-slate-350 font-bold rounded-lg text-xs cursor-pointer">Ghairi</button>
          <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow-lg shadow-emerald-900/10">✅ Thibitisha Marejesho</button>
        </div>
      </form>
    );
  };

  // 5. EXPENSE MODAL (Matumizi)
  const ExpenseModal = () => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState<number>(30000);
    const [category, setCategory] = useState<'Uendeshaji' | 'Vifaa' | 'Mafunzo' | 'Safari' | 'Matengenezo' | 'Drawings' | 'Nyingine'>('Uendeshaji');
    const [note, setNote] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!description) {
        alert('Tafadhali weka maelezo ya matumizi!');
        return;
      }
      if (amount <= 0) {
        alert('Kiasi lazima kizidi 0 TSh!');
        return;
      }
      onSaveExpense({ description, amount, category, note, date });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-300">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400">Maelezo Kamili ya Matumizi</label>
          <input 
            type="text" 
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mf. Kununua vitabu vya risiti vya kikundi"
            className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-rose-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Kiasi cha Matumizi (TSh)</label>
            <input 
              type="number" 
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-rose-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white transition-colors font-bold text-rose-450"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Kundi la Matumizi (Category)</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs outline-none text-white transition-colors cursor-pointer"
            >
              <option value="Uendeshaji">Uendeshaji / Rent, Power</option>
              <option value="Vifaa">Vifaa / Office Supplies</option>
              <option value="Mafunzo">Mafunzo / Seminars</option>
              <option value="Safari">Safari / Transport</option>
              <option value="Matengenezo">Matengenezo / Maintenance</option>
              <option value="Drawings">Drawings / Utoaji mwanachama</option>
              <option value="Nyingine">Nyingine</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Tarehe ya Matumizi</label>
            <input 
              type="date" 
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onClick={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
              onFocus={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
              className="w-full bg-slate-950 border border-slate-850 focus:border-rose-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white cursor-pointer"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Maelezo Maalum (Si Lazima)</label>
            <input 
              type="text" 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Maelezo zaidi..."
              className="w-full bg-slate-950 border border-slate-850 focus:border-rose-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-850 flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-755 text-slate-350 font-bold rounded-lg text-xs cursor-pointer">Ghairi</button>
          <button type="submit" className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow-lg shadow-rose-900/10">💾 Hifadhi Matumizi</button>
        </div>
      </form>
    );
  };

  // 6. INTERNAL USER MODAL
  const UserModal = () => {
    const [username, setUsername] = useState(editingUser ? editingUser.username : '');
    const [passRaw, setPassRaw] = useState(editingUser ? decryptPassword(editingUser.passwordHash) : '');
    const [fullName, setFullName] = useState(editingUser ? editingUser.fullName : '');
    const [role, setRole] = useState<'admin' | 'staff'>(editingUser ? editingUser.role : 'staff');

    useEffect(() => {
      if (editingUser) {
        setUsername(editingUser.username);
        setPassRaw(decryptPassword(editingUser.passwordHash));
        setFullName(editingUser.fullName);
        setRole(editingUser.role);
      }
    }, [editingUser]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!username || !passRaw) {
        alert('Tafadhali username na nywila vinahitajika!');
        return;
      }
      if (passRaw.length < 4) {
        alert('Nywila iwe na urefu sifa wa angalau herufi 4!');
        return;
      }
      onSaveUser({ 
        id: editingUser?.id,
        username: username.toLowerCase().trim(), 
        passwordRaw: passRaw, 
        fullName, 
        role 
      });
    };

    const isCurrentUserAdmin = currentUser?.role === 'admin';
    const isSelfEditing = editingUser?.id === currentUser?.id;

    return (
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-300">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400">Jina la Mtumiaji (Username - Kwa login)</label>
          <input 
            type="text" 
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="M.f. mhasibu"
            disabled={editingUser ? !isCurrentUserAdmin && !isSelfEditing : false}
            className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white lowercase disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400">Nywila ya Sasa / Mpya (Password)</label>
          <input 
            type="text" 
            required
            value={passRaw}
            onChange={(e) => setPassRaw(e.target.value)}
            placeholder="Weka password kamili..."
            disabled={editingUser ? !isCurrentUserAdmin && !isSelfEditing : false}
            className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white font-mono disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400">Jina Kamili la mhusika</label>
          <input 
            type="text" 
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Mf. Grace Elia Kimaro"
            disabled={editingUser ? !isCurrentUserAdmin && !isSelfEditing : false}
            className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Change Role is only allowed for Admin, AND not allowed if staff is editing themselves */}
        {isCurrentUserAdmin && (!editingUser || !isSelfEditing) ? (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Mamlaka (Role)</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white"
            >
              <option value="staff">Staff / Mtendaji (Hawezi kufuta/kuunda watumiaji)</option>
              <option value="admin">Admin / Mkuu (Uwezo kamili wa nchi na system)</option>
            </select>
          </div>
        ) : (
          editingUser && (
            <div className="text-xs text-slate-500 bg-slate-900/40 p-3 rounded-lg border border-slate-800/60">
              <span className="font-semibold text-slate-400">Mamlaka:</span> {role === 'admin' ? 'Msimamizi Mkuu' : 'Mtendaji / Staff'}
              <p className="text-[10px] text-slate-500 mt-1">Huwezi kubadilisha Mamlaka yako mwenyewe au ikiwa wewe si Msimamizi Mkuu.</p>
            </div>
          )
        )}

        <div className="pt-4 border-t border-slate-850 flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-755 text-slate-350 font-bold rounded-lg text-xs cursor-pointer">Ghairi</button>
          <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow-lg">
            {editingUser ? '💾 Tekeleza Mabadiliko' : '💾 Unda Mtumiaji'}
          </button>
        </div>
      </form>
    );
  };

  // 7. CONSTITUTION MODAL
  const ConstitutionModal = () => {
    const [text, setText] = useState('');

    useEffect(() => {
      setText(constitutionText);
    }, [constitutionText]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSaveConstitution(text);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-300">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400">Maandishi Rasmi ya Katiba ya Kikundi</label>
          <textarea 
            rows={14}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Andika au weka kifungu cha katiba hapa..."
            className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs outline-none text-white font-sans leading-relaxed"
          />
        </div>

        <div className="pt-4 border-t border-slate-850 flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-755 text-slate-350 font-bold rounded-lg text-xs cursor-pointer">Ghairi</button>
          <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow-lg shadow-emerald-900/10">💾 Hifadhi Katiba</button>
        </div>
      </form>
    );
  };

  // 8. LOGIN DIALOG (MODAL)
  const LoginModal = () => {
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');

    const handleLoginSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError('');
      
      const success = onExecuteLogin(user.trim().toLowerCase(), pass);
      if (!success) {
        setLoginError('Jina la mtumiaji au nywila (password) si sahihi! Jaribu tena.');
      }
    };

    return (
      <form onSubmit={handleLoginSubmit} className="space-y-5 text-slate-300">
        <div className="text-center space-y-2 pb-2">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 shadow-inner">
            <Lock className="w-6 h-6 animate-pulse" />
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
            Weka taarifa zako za uthibitisho ili kuingia kwenye jopo lako la udhibiti salama.
          </p>
        </div>

        {loginError && (
          <div className="flex items-center gap-2.5 p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-300 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span className="font-medium">{loginError}</span>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 tracking-wide uppercase">Jina la Mtumiaji (Username)</label>
          <div className="relative flex items-center">
            <User className="absolute left-3.5 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              required
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="Ingiza username"
              className="w-full bg-slate-950/80 border border-slate-800/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none font-medium transition-all duration-200"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 tracking-wide uppercase">Nywila (Password)</label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 w-4 h-4 text-slate-500" />
            <input 
              type="password" 
              required
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="Ingiza nywila yako"
              className="w-full bg-slate-955/80 border border-slate-800/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none transition-all duration-200"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-805/55 flex gap-3 justify-end">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4.5 py-2.5 bg-slate-800/70 hover:bg-slate-850 active:scale-95 text-slate-350 font-bold rounded-xl text-xs cursor-pointer transition-all duration-150"
          >
            Rudi
          </button>
          <button 
            type="submit" 
            className="px-6 py-2.5 bg-emerald-650 hover:bg-emerald-600 active:scale-95 text-white font-bold rounded-xl text-xs cursor-pointer shadow-lg shadow-emerald-950/40 transition-all duration-150 flex items-center gap-1.5"
          >
            Ingia
          </button>
        </div>
      </form>
    );
  };

  // Switch rendering kulingana na modal inayofunguliwa
  switch (activeModal) {
    case 'memberModal':
      return (
        <ModalBase title={editingMember ? "✏️ Hariri Taarifa za Mwanachama" : "👤 Sajili Mwanachama Mpya"} icon={<UserPlus className="w-5 h-5" />}>
          <MemberModal />
        </ModalBase>
      );
    case 'contributionModal':
      return (
        <ModalBase title="💰 Sajili Mchango Mpya wa Mwanachama" icon={<Coins className="w-5 h-5" />}>
          <ContributionModal />
        </ModalBase>
      );
    case 'loanModal':
      return (
        <ModalBase title="🏦 Toa Mkopo Mpya kwa Mwanachama" icon={<Landmark className="w-5 h-5" />}>
          <LoanModal />
        </ModalBase>
      );
    case 'loanPaymentModal':
      return (
        <ModalBase title="💰 Lipa au Rejesha Mkopo" icon={<DollarSign className="w-5 h-5" />}>
          <LoanPaymentModal />
        </ModalBase>
      );
    case 'expenseModal':
      return (
        <ModalBase title="💸 Rekodi Matumizi mapya ya Kikundi" icon={<WalletIcon className="w-5 h-5" />}>
          <ExpenseModal />
        </ModalBase>
      );
    case 'userModal':
      return (
        <ModalBase title="👤 Sajili Mtumiaji Mpya wa Ndani" icon={<Key className="w-5 h-5" />}>
          <UserModal />
        </ModalBase>
      );
    case 'constitutionModal':
      return (
        <ModalBase title="📚 Hariri Katiba ya Kikundi" icon={<BookOpen className="w-5 h-5" />}>
          <ConstitutionModal />
        </ModalBase>
      );
    case 'login':
      return (
        <ModalBase title="Ingia" icon={<Key className="w-5 h-5" />}>
          <LoginModal />
        </ModalBase>
      );
    default:
      return null;
  }
}

// Custom simple icon for Wallet
function WalletIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12V7H5a2 2 0 0 1-2-2V5" />
      <path d="M3 10V3a2 2 0 0 1 2-2h14" />
      <rect width="18" height="13" x="3" y="10" rx="2" />
      <path d="M16 16h.01" />
    </svg>
  );
}
