/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  Users, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  Calculator, 
  ShieldAlert, 
  CheckCircle2, 
  RefreshCw
} from 'lucide-react';
import { SaccosData, InternalUser } from '../types';

interface DashboardViewProps {
  data: SaccosData;
  currentUser: InternalUser | null;
  onOpenModal: (modalId: string) => void;
  formatMoney: (n: number) => string;
}

export default function DashboardView({
  data,
  currentUser,
  onOpenModal,
  formatMoney
}: DashboardViewProps) {
  // Kikokotoo cha Mikopo (Loan Calculator State)
  const [calcAmount, setCalcAmount] = useState<number>(1000000);
  const [calcInterest, setCalcInterest] = useState<number>(10);
  const [calcDuration, setCalcDuration] = useState<number>(12);

  const calcTotalInterest = (calcAmount * calcInterest) / 100;
  const calcTotalPay = calcAmount + calcTotalInterest;
  const calcMonthlyPay = calcTotalPay / calcDuration;

  // Uchambuzi wa data za mfumo
  const totalMembers = data.members.filter(m => m.active).length;
  const inactiveMembers = data.members.filter(m => !m.active).length;

  // Michango ya wanachama (bila kujumuisha marejesho ya mkopo kwenye jedwali la michango ili kuzuia double counting)
  const totalPureContributions = data.contributions
    .filter(c => c.type !== ('Marejesho ya Mkopo' as any))
    .reduce((s, c) => s + c.amount, 0);

  // Kiwango cha mkopo kilichotolewa kwenda kwa mwanachama (bila kujali kiasi kilichorejeshwa)
  const totalLoansGiven = data.loans.reduce((s, l) => s + l.amount, 0);

  // Matumizi ya kikundi
  const totalExpenses = data.expenses.reduce((s, e) => s + e.amount, 0);

  // Kiwango cha riba kilichopatikana kwenye marejesho ya mkopo
  const totalInterestRepaid = data.loans.reduce((s, l) => {
    if (l.totalPay > 0) {
      const interestRatio = (l.totalPay - l.amount) / l.totalPay;
      return s + (l.paidAmount * interestRatio);
    }
    return s;
  }, 0);

  // Marejesho ya mkopo ya wanachama
  const totalLoansRepaid = data.loans.reduce((s, l) => s + l.paidAmount, 0);

  // Fomula mpya ya Mtumiaji (Gaston Mapunda):
  // Mapato Makuu = Michango Safi ya Wanachama (ambayo haihusishi riba wala marejesho kwenye mabadiliko ya michango) - Jumla ya Mikopo Iliyotolewa - Matumizi + Jumla ya Marejesho yote (pamoja na riba iliyolipwa)
  const mapatoMakuuYaMfumo = totalPureContributions - totalLoansGiven - totalExpenses + totalLoansRepaid;

  // Salio la mikopo inayodaiwa (kiwango cha mkopo bila riba yake yaani baki ya deni la msingi pekee)
  const totalLoanBalance = data.loans
    .filter(l => l.status === 'ongoing')
    .reduce((s, l) => {
      if (l.totalPay > 0) {
        const remaining = l.totalPay - l.paidAmount;
        const principalRatio = l.amount / l.totalPay;
        return s + (remaining * principalRatio);
      }
      return s + (l.amount - l.paidAmount);
    }, 0);

  const totalClearedLoans = data.loans
    .filter(l => l.status === 'cleared')
    .reduce((s, l) => s + l.totalPay, 0);

  const activeLoansCount = data.loans.filter(l => l.status === 'ongoing').length;
  const uniqueMembersWithLoans = new Set(
    data.loans.filter(l => l.status === 'ongoing').map(l => l.memberId)
  ).size;

  // Uchambuzi wa matumizi kwa kategoria
  const categories: Record<string, number> = {};
  data.expenses.forEach(e => {
    categories[e.category] = (categories[e.category] || 0) + e.amount;
  });
  const maxExpense = Math.max(...Object.values(categories), 1);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Sehemu ya Juu ya Takwimu na Haraka za Kidhibiti inayobaki juu wakati wa kusogeza ukurasa (Sticky Container) */}
      <div className="sticky top-[64px] z-30 bg-slate-950/95 py-2.5 sm:py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b border-slate-800/80 backdrop-blur-md space-y-2.5 sm:space-y-4 shadow-lg">
        
        {/* Gridu ya Takwimu Kuu */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          
          {/* Wanachama */}
          <div className="bg-slate-800/60 p-3 sm:p-4 rounded-xl border border-slate-700/50 flex items-center justify-between shadow-sm min-w-0">
            <div className="space-y-0.5 sm:space-y-1 min-w-0">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider block truncate">Wanachama Hai</span>
              <div className="text-sm sm:text-lg md:text-xl font-black text-white truncate">{totalMembers}</div>
            </div>
            <div className="p-2 sm:p-3 bg-blue-500/10 text-blue-400 rounded-lg sm:rounded-xl shrink-0">
              <Users className="w-5 h-5 sm:w-6 h-6 md:w-8 h-8" />
            </div>
          </div>

          {/* Mapato ya Mfumo (Fomula Mpya ya Gaston Mapunda) */}
          <div className="bg-slate-800/60 p-3 sm:p-4 rounded-xl border border-slate-700/50 flex items-center justify-between shadow-sm min-w-0">
            <div className="space-y-0.5 sm:space-y-1 min-w-0">
              <span className="text-[10px] sm:text-xs font-semibold text-emerald-400 uppercase tracking-wider block truncate">Mapato</span>
              <div className="text-sm sm:text-lg md:text-xl font-black text-white truncate">{formatMoney(mapatoMakuuYaMfumo)}</div>
            </div>
            <div className="p-2 sm:p-3 bg-emerald-500/10 text-emerald-400 rounded-lg sm:rounded-xl shrink-0">
              <DollarSign className="w-5 h-5 sm:w-6 h-6 md:w-8 h-8" />
            </div>
          </div>

          {/* Mikopo Inayodaiwa */}
          <div className="bg-slate-800/60 p-3 sm:p-4 rounded-xl border border-slate-700/50 flex items-center justify-between shadow-sm min-w-0">
            <div className="space-y-0.5 sm:space-y-1 min-w-0">
              <span className="text-[10px] sm:text-xs font-semibold text-amber-400 uppercase tracking-wider block truncate">Mikopo ya Nje</span>
              <div className="text-sm sm:text-lg md:text-xl font-black text-white truncate">{formatMoney(totalLoanBalance)}</div>
            </div>
            <div className="p-2 sm:p-3 bg-amber-500/10 text-amber-400 rounded-lg sm:rounded-xl shrink-0">
              <Calculator className="w-5 h-5 sm:w-6 h-6 md:w-8 h-8" />
            </div>
          </div>

          {/* Matumizi */}
          <div className="bg-slate-800/60 p-3 sm:p-4 rounded-xl border border-slate-700/50 flex items-center justify-between shadow-sm min-w-0">
            <div className="space-y-0.5 sm:space-y-1 min-w-0">
              <span className="text-[10px] sm:text-xs font-semibold text-rose-400 uppercase tracking-wider block truncate">Matumizi</span>
              <div className="text-sm sm:text-lg md:text-xl font-black text-white truncate">{formatMoney(totalExpenses)}</div>
            </div>
            <div className="p-2 sm:p-3 bg-rose-500/10 text-rose-400 rounded-lg sm:rounded-xl shrink-0">
              <ArrowDownRight className="w-5 h-5 sm:w-6 h-6 md:w-8 h-8" />
            </div>
          </div>

        </div>

        {/* Vitendo vya Haraka (Quick Actions) */}
        {currentUser && (
          <div className="bg-slate-800/40 p-2 sm:p-3 rounded-xl border border-slate-700/50 backdrop-blur-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => onOpenModal('memberModal')}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-all duration-250 cursor-pointer shadow-md shadow-blue-900/10 shrink-0"
              >
                <span className="truncate">👤 Sajili Mwanachama</span>
              </button>
              <button
                onClick={() => onOpenModal('contributionModal')}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-all duration-250 cursor-pointer shadow-md shadow-emerald-900/10 shrink-0"
              >
                <span className="truncate">💰 Rekodi Mchango</span>
              </button>
              <button
                onClick={() => onOpenModal('loanModal')}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-amber-600 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs transition-all duration-250 cursor-pointer shadow-md shadow-amber-900/10 shrink-0"
              >
                <span className="truncate">🏦 Toa Mkopo Mpya</span>
              </button>
              <button
                onClick={() => onOpenModal('expenseModal')}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs transition-all duration-250 cursor-pointer shadow-md shadow-rose-900/10 shrink-0"
              >
                <span className="truncate">💸 Rekodi Matumizi</span>
              </button>
            </div>
          </div>
        )}

      </div>



      {/* Kikokotoo cha Mikopo */}
      <div className="bg-slate-800/30 border border-slate-700/50 p-5 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Visingizia ya Input */}
        <div className="space-y-4 md:col-span-2">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
            <Calculator className="w-4.5 h-4.5 text-blue-400" />
            <span>Kikokotoo cha Mikopo ya Wanachama (Vikundini Riba)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Kiasi cha Mkopo (TSh)</label>
              <input
                type="number"
                value={calcAmount}
                onChange={(e) => setCalcAmount(Number(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 text-white text-sm outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Riba (Kila mwezi %)</label>
              <input
                type="number"
                value={calcInterest}
                onChange={(e) => setCalcInterest(Number(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 text-white text-sm outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Muda wa Kurejesha (Miezi)</label>
              <input
                type="number"
                value={calcDuration}
                onChange={(e) => setCalcDuration(Number(e.target.value) || 1)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 text-white text-sm outline-none"
              />
            </div>
          </div>
        </div>

        {/* Jibu la kikokotoo */}
        <div className="bg-slate-900/60 p-4 border border-blue-900/20 rounded-xl flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Muhtasari wa Kikokotoo</span>
            <div className="mt-2 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Riba Pekee:</span>
                <span className="text-slate-200 font-semibold">{formatMoney(calcTotalInterest)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Jumla Rejesho:</span>
                <span className="text-slate-200 font-semibold">{formatMoney(calcTotalPay)}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-400">Rejesho la Mwezi:</div>
            <div className="text-lg font-black text-rose-500">{formatMoney(Math.round(calcMonthlyPay))}</div>
          </div>
        </div>

      </div>

    </div>
  );
}
