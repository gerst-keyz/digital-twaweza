/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Search, Plus, Trash2, Download, Landmark, FileCheck, DollarSign, Wallet } from 'lucide-react';
import { Loan, Member, InternalUser } from '../types';

interface LoansViewProps {
  loans: Loan[];
  members: Member[];
  currentUser: InternalUser | null;
  onOpenAddModal: () => void;
  onOpenPaymentModal: (loan: Loan) => void;
  onDeleteLoan: (id: string) => void;
  formatMoney: (n: number) => string;
}

export default function LoansView({
  loans,
  members,
  currentUser,
  onOpenAddModal,
  onOpenPaymentModal,
  onDeleteLoan,
  formatMoney
}: LoansViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ongoing' | 'cleared'>('all');

  // Ramani ya kupata jina la mwanachama haraka
  const getMemberName = (id: string) => {
    const m = members.find(x => x.id === id);
    return m ? m.name : '(Mwanachama Amefutwa)';
  };

  const getMemberNo = (id: string) => {
    const m = members.find(x => x.id === id);
    return m ? m.memberNo : '-';
  };

  // Kufanya uchujaji na utafutaji
  const filteredLoans = loans.filter(l => {
    const memberName = getMemberName(l.memberId).toLowerCase();
    const memberNo = getMemberNo(l.memberId).toLowerCase();
    const matchesSearch = memberName.includes(search.toLowerCase()) || memberNo.includes(search.toLowerCase());
    
    if (statusFilter === 'ongoing') return matchesSearch && l.status === 'ongoing';
    if (statusFilter === 'cleared') return matchesSearch && l.status === 'cleared';
    return matchesSearch;
  });

  // Takwimu za Mikopo
  const totalLoanedOut = loans.reduce((s, l) => s + l.amount, 0);
  const totalInterestEarned = loans.reduce((s, l) => s + (l.totalPay - l.amount), 0);
  const totalLoanBalanceLeft = loans
    .filter(l => l.status === 'ongoing')
    .reduce((s, l) => s + (l.totalPay - l.paidAmount), 0);
  const totalPaidBack = loans.reduce((s, l) => s + l.paidAmount, 0);

  // Export CSV ripoti ya mikopo
  const exportCSV = () => {
    try {
      const csvRows = [
        ['Namba', 'Mwanachama', 'Cheo', 'Kiasi cha Mkopo (TSh)', 'Riba (%)', 'Kiasi cha Kulipa (TSh)', 'Kiasi Kilicholipwa (TSh)', 'Deni Lililobaki (TSh)', 'Muda (Miezi)', 'Tarehe ya Kuchukua', 'Hali', 'Maelezo']
      ];

      filteredLoans.forEach((l, idx) => {
        csvRows.push([
          (idx + 1).toString(),
          getMemberName(l.memberId).replace(/,/g, ' '),
          getMemberNo(l.memberId),
          l.amount.toString(),
          l.interest.toString(),
          l.totalPay.toString(),
          l.paidAmount.toString(),
          (l.totalPay - l.paidAmount).toString(),
          l.duration.toString(),
          l.date,
          l.status === 'ongoing' ? 'Inaendelea (Ongoing)' : 'Imelipwa (Cleared)',
          l.note ? l.note.replace(/,/g, ' ') : '-'
        ]);
      });

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
        + csvRows.map(e => e.join(',')).join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `ripoti_mikopo_saccos_plus_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert('Imeshindikana kutengeneza ripoti ya CSV ya mikopo.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Sehemu ya Juu ya Takwimu na Vichujio inayobaki juu wakati wa kusogeza ukurasa (Sticky Container) */}
      <div className="sticky top-[64px] z-30 bg-slate-950/95 py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b border-slate-800/80 backdrop-blur-md space-y-4">
        
        {/* Vichungi & Utaratibu */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-1">
            {/* Search bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Tafuta mikopo kwa jina la mwanachama..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700/85 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg pl-9 pr-4 py-2 text-white text-sm outline-none transition-all"
              />
            </div>

            {/* Status buttons */}
            <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-750 text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 font-semibold rounded-md transition-all cursor-pointer ${
                  statusFilter === 'all' ? 'bg-slate-750 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Yote ({loans.length})
              </button>
              <button
                onClick={() => setStatusFilter('ongoing')}
                className={`px-3 py-1.5 font-semibold rounded-md transition-all cursor-pointer ${
                  statusFilter === 'ongoing' ? 'bg-amber-600 text-slate-950 shadow-sm font-black' : 'text-slate-400 hover:text-amber-400'
                }`}
              >
                Inaendelea ({loans.filter(l => l.status === 'ongoing').length})
              </button>
              <button
                onClick={() => setStatusFilter('cleared')}
                className={`px-3 py-1.5 font-semibold rounded-md transition-all cursor-pointer ${
                  statusFilter === 'cleared' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-emerald-400'
                }`}
              >
                Yaliyolipwa ({loans.filter(l => l.status === 'cleared').length})
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={exportCSV}
              title="Pakua ripoti kamili ya mikopo"
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-805 hover:bg-slate-750 text-slate-205 border border-slate-700 hover:border-slate-650 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ripoti Excel</span>
            </button>
            
            {currentUser && (
              <button
                onClick={onOpenAddModal}
                className="flex items-center gap-1 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs transition-colors cursor-pointer shadow-lg shadow-amber-900/15"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Toa Mkopo Mpya</span>
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Jedwali la Mikopo */}
      <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 w-12 text-center">#</th>
                <th className="p-4">Mwanachama</th>
                <th className="p-4">Kiasi cha Mkopo</th>
                <th className="p-4 text-center">Riba</th>
                <th className="p-4 text-right">Jumla Kulipa</th>
                <th className="p-4 text-right">Kiasi Kilicholipwa</th>
                <th className="p-4 text-right">Baki ya Deni</th>
                <th className="p-4 text-center">Muda/Tarehe</th>
                <th className="p-4">Hali</th>
                {currentUser && <th className="p-4 text-center">Vitendo</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={currentUser ? 10 : 9} className="p-10 text-center text-slate-500">
                    Hakuna mikopo inayokidhi vigezo hivi vya utafutaji.
                  </td>
                </tr>
              ) : (
                filteredLoans.map((l, idx) => {
                  const mName = getMemberName(l.memberId);
                  const mNo = getMemberNo(l.memberId);
                  const remaining = l.totalPay - l.paidAmount;
                  return (
                    <tr key={l.id} className="hover:bg-slate-800/30 transition-colors text-slate-300">
                      <td className="p-4 text-center text-xs text-slate-500">{idx + 1}</td>
                      <td className="p-4">
                        <div className="font-bold text-white">{mName}</div>
                        <div className="text-[10px] text-slate-500">{mNo}</div>
                      </td>
                      <td className="p-4 font-semibold text-slate-200">{formatMoney(l.amount)}</td>
                      <td className="p-4 text-center text-xs text-emerald-400 font-bold">{l.interest}%</td>
                      <td className="p-4 text-right font-medium text-slate-400">{formatMoney(l.totalPay)}</td>
                      <td className="p-4 text-right font-semibold text-emerald-400">{formatMoney(l.paidAmount)}</td>
                      <td className="p-4 text-right font-black text-rose-400">{remaining > 0 ? formatMoney(remaining) : 'Kamilifu ✓'}</td>
                      <td className="p-4 text-center space-y-0.5">
                        <div className="text-xs font-semibold">{l.duration} miezi</div>
                        <div className="text-[10px] text-slate-500">{l.date}</div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          l.status === 'ongoing' 
                            ? 'bg-amber-900/30 text-amber-500 border border-amber-800/40' 
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-900/40'
                        }`}>
                          {l.status === 'ongoing' ? 'bado' : 'Kamilifu ✓'}
                        </span>
                      </td>
                      
                      {currentUser && (
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {l.status === 'ongoing' && (
                              <button
                                onClick={() => onOpenPaymentModal(l)}
                                className="flex items-center gap-0.5 px-2 py-1 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-800/40 rounded text-[10px] font-bold transition-all cursor-pointer"
                              >
                                <span>Lipa</span>
                              </button>
                            )}
                            <button
                              onClick={() => onDeleteLoan(l.id)}
                              title="Weka pendo la kufuta"
                              className="p-1.5 text-slate-505 hover:text-rose-500 hover:bg-rose-950/20 rounded-md transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
