/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Search, Plus, Edit, ToggleLeft, ToggleRight, Trash2, Download, CheckCircle, XCircle } from 'lucide-react';
import { Member, Contribution, Loan, InternalUser } from '../types';

interface MembersViewProps {
  members: Member[];
  contributions: Contribution[];
  loans: Loan[];
  currentUser: InternalUser | null;
  onOpenAddModal: () => void;
  onEditMember: (member: Member) => void;
  onDeleteMember: (id: string) => void;
  onToggleStatus: (id: string) => void;
  formatMoney: (n: number) => string;
}

export default function MembersView({
  members,
  contributions,
  loans,
  currentUser,
  onOpenAddModal,
  onEditMember,
  onDeleteMember,
  onToggleStatus,
  formatMoney
}: MembersViewProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Uchambuzi na michango (bila kujumuisha marejesho ya mkopo ili kufuata maombi ya mtumiaji)
  const getMemberContributions = (memberId: string) => {
    return contributions
      .filter(c => c.memberId === memberId && c.type !== 'Marejesho ya Mkopo')
      .reduce((s, c) => s + c.amount, 0);
  };

  const getMemberLoans = (memberId: string) => {
    return loans
      .filter(l => l.memberId === memberId && l.status === 'ongoing')
      .reduce((s, l) => s + (l.totalPay - l.paidAmount), 0);
  };

  // Kufanya uchujaji na utaftaji
  const filteredMembers = members.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(search.toLowerCase()) || 
      m.memberNo.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.includes(search);
    
    if (filter === 'active') return matchesSearch && m.active;
    if (filter === 'inactive') return matchesSearch && !m.active;
    return matchesSearch;
  });

  // Export ripoti kama CSV kuzuia kupoteza data
  const exportCSV = () => {
    try {
      const csvRows = [
        ['Namba', 'Jina Kamili', 'Cheo', 'Simu', 'Barua Pepe', 'Hali', 'Jumla ya Michango (TSh)', 'Mkopo Unaendelea (TSh)', 'Tarehe ya Kujiunga']
      ];

      members.forEach((m, idx) => {
        csvRows.push([
          (idx + 1).toString(),
          m.name.replace(/,/g, ' '),
          m.memberNo,
          m.phone,
          m.email,
          m.active ? 'Hai (Active)' : 'Isiyo Hai (Inactive)',
          getMemberContributions(m.id).toString(),
          getMemberLoans(m.id).toString(),
          new Date(m.created).toLocaleDateString('sw-TZ')
        ]);
      });

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
        + csvRows.map(e => e.join(',')).join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `ripoti_wanachama_saccos_plus_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert('Imeshindikana kutengeneza ripoti ya CSV.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="sticky top-[64px] z-30 bg-slate-950/95 py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b border-slate-800/80 backdrop-blur-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        {/* Utaratibu wa Kutafuta & Vichungi */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Tafuta mwanachama kwa jina au nafasi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/85 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg pl-9 pr-4 py-2 text-white text-sm outline-none transition-all"
            />
          </div>

          <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-705">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                filter === 'all' ? 'bg-slate-750 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Wote ({members.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                filter === 'active' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              Hai ({members.filter(m => m.active).length})
            </button>
            <button
              onClick={() => setFilter('inactive')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                filter === 'inactive' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              Asio Hai ({members.filter(m => !m.active).length})
            </button>
          </div>
        </div>

        {/* Vitendo Vikuu wa Juu */}
        <div className="flex items-center gap-2 self-end sm:self-auto scroll-mx-1">
          <button
            onClick={exportCSV}
            title="Pakua ripoti kamili kama faili la Excel/CSV"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-slate-650 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ripoti Excel</span>
          </button>
          
          {currentUser && (
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shrink-0 shadow-lg shadow-emerald-900/10"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Sajili Mpya</span>
            </button>
          )}
        </div>

      </div>

      {/* Jedwali la Wanachama */}
      <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 w-12 text-center">#</th>
                <th className="p-4">Mwanachama</th>
                <th className="p-4">Cheo</th>
                <th className="p-4">Simu & Email</th>
                <th className="p-4">Hali</th>
                <th className="p-4 text-right">Jumla Michango</th>
                <th className="p-4 text-right">Mkopo Active</th>
                {currentUser && <th className="p-4 text-center">Vitendo</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={currentUser ? 8 : 7} className="p-10 text-center text-slate-500">
                    Hakuna mwanachama aliyepatikana kwa vigezo hivi vya utafutaji.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m, idx) => {
                  const contrib = getMemberContributions(m.id);
                  const loanBal = getMemberLoans(m.id);
                  return (
                    <tr key={m.id} className="hover:bg-slate-800/30 transition-colors text-slate-300">
                      <td className="p-4 text-center text-xs text-slate-500">{idx + 1}</td>
                      <td className="p-4">
                        <div className="font-bold text-white leading-snug">{m.name}</div>
                        <div className="text-[10px] text-slate-500 pt-0.5">Sajili: {new Date(m.created).toLocaleDateString('sw-TZ')}</div>
                      </td>
                      <td className="p-4 font-semibold text-emerald-450 text-xs">{m.memberNo}</td>
                      <td className="p-4 space-y-0.5">
                        <div className="text-xs">{m.phone || '-'}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[150px]" title={m.email}>{m.email || '-'}</div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.active 
                            ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/40' 
                            : 'bg-rose-900/30 text-rose-400 border border-rose-800/40'
                        }`}>
                          {m.active ? (
                            <>
                              <CheckCircle className="w-2.5 h-2.5" />
                              <span>Amewashwa</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-2.5 h-2.5" />
                              <span>Amezimwa</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="p-4 text-right font-semibold text-slate-200">{formatMoney(contrib)}</td>
                      <td className="p-4 text-right font-semibold text-amber-500">{loanBal > 0 ? formatMoney(loanBal) : '-'}</td>
                      
                      {currentUser && (
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onEditMember(m)}
                              title="Hariri Taarifa"
                              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-750 rounded-md transition-colors cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onToggleStatus(m.id)}
                              title={m.active ? "Weka kuwa Inactive" : "Weka kuwa Active"}
                              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                                m.active 
                                  ? 'text-amber-400 hover:bg-amber-950/20' 
                                  : 'text-emerald-400 hover:bg-emerald-950/20'
                              }`}
                            >
                              {m.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => onDeleteMember(m.id)}
                              title="Futia Mwanachama kabisa"
                              className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-950/20 rounded-md transition-colors cursor-pointer"
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
