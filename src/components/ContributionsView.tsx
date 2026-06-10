/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Search, Plus, Trash2, Download, TrendingUp, Filter } from 'lucide-react';
import { Contribution, Member, InternalUser, ContributionType } from '../types';

interface ContributionsViewProps {
  contributions: Contribution[];
  members: Member[];
  currentUser: InternalUser | null;
  onOpenAddModal: () => void;
  onDeleteContribution: (id: string) => void;
  formatMoney: (n: number) => string;
}

export default function ContributionsView({
  contributions,
  members,
  currentUser,
  onOpenAddModal,
  onDeleteContribution,
  formatMoney
}: ContributionsViewProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

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
  const filteredContributions = contributions.filter(c => {
    const memberName = getMemberName(c.memberId).toLowerCase();
    const memberNo = getMemberNo(c.memberId).toLowerCase();
    const matchesSearch = memberName.includes(search.toLowerCase()) || memberNo.includes(search.toLowerCase()) || c.note.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || c.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  // Jumla ya kiasi kilichochujwa
  const filteredTotal = filteredContributions.reduce((s, c) => s + c.amount, 0);

  // Aina zote za michango zilizopo kwa kuchaguliwa
  const contributionTypes: ContributionType[] = [
    'Hisa',
    'Akiba',
    'Mfuko Maalum',
    'Rada',
    'Marejesho ya Mkopo',
    'Ada ya Uanachama',
    'Nyingine'
  ];

  // Export CSV ripoti ya michango
  const exportCSV = () => {
    try {
      const csvRows = [
        ['Namba', 'Mwanachama', 'Cheo', 'Kiasi cha Mchango (TSh)', 'Tarehe ya Rekodi', 'Aina ya Mchango', 'Maelezo ya Ziada']
      ];

      filteredContributions.forEach((c, idx) => {
        csvRows.push([
          (idx + 1).toString(),
          getMemberName(c.memberId).replace(/,/g, ' '),
          getMemberNo(c.memberId),
          c.amount.toString(),
          c.date,
          c.type,
          c.note ? c.note.replace(/,/g, ' ') : '-'
        ]);
      });

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
        + csvRows.map(e => e.join(',')).join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `ripoti_michango_saccos_plus_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert('Imeshindikana kutengeneza ripoti ya CSV ya michango.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Sehemu ya Juu ya Takwimu na Vichujio inayobaki juu wakati wa kusogeza ukurasa (Sticky Container) */}
      <div className="sticky top-[64px] z-30 bg-slate-950/95 py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b border-slate-800/80 backdrop-blur-md space-y-4">
        
        {/* Sehemu ya Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Tafuta mchango kwa jina au namba..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700/85 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg pl-9 pr-4 py-2 text-white text-sm outline-none transition-all"
              />
            </div>

            {/* Type dropdown */}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full sm:w-48 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs font-semibold outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">Aina Zote za Mchango</option>
                {contributionTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={exportCSV}
              title="Pakua ripoti kamili kama CSV"
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-slate-650 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ripoti Excel</span>
            </button>
            
            {currentUser && (
              <button
                onClick={onOpenAddModal}
                className="flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-lg shadow-emerald-900/10"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Rekodi Mchango</span>
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Jedwali la Michango */}
      <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 w-12 text-center">#</th>
                <th className="p-4">Mwanachama</th>
                <th className="p-4">Cheo</th>
                <th className="p-4">Aina ya Mchango</th>
                <th className="p-4">Tarehe</th>
                <th className="p-4">Maelezo (Notes)</th>
                <th className="p-4 text-right">Kiasi (TSh)</th>
                {currentUser && <th className="p-4 text-center">Futa</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredContributions.length === 0 ? (
                <tr>
                  <td colSpan={currentUser ? 8 : 7} className="p-10 text-center text-slate-500">
                    Hakuna mchango ulioandikishwa kwa sasa unaokidhi vigezo hivi.
                  </td>
                </tr>
              ) : (
                filteredContributions.map((c, idx) => {
                  const mName = getMemberName(c.memberId);
                  const mNo = getMemberNo(c.memberId);
                  return (
                    <tr key={c.id} className="hover:bg-slate-800/30 transition-colors text-slate-300">
                      <td className="p-4 text-center text-xs text-slate-500">{idx + 1}</td>
                      <td className="p-4 font-bold text-white">{mName}</td>
                      <td className="p-4 font-mono text-xs text-sky-400">{mNo}</td>
                      <td className="p-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700">
                          {c.type}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-medium text-slate-400">{c.date}</td>
                      <td className="p-4 text-xs max-w-[200px] truncate" title={c.note}>{c.note || '-'}</td>
                      <td className="p-4 text-right font-black text-emerald-400">{formatMoney(c.amount)}</td>
                      
                      {currentUser && (
                        <td className="p-4 text-center">
                          <button
                            onClick={() => onDeleteContribution(c.id)}
                            title="Futa Mchango huu"
                            className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-950/20 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
