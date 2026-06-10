/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Search, Plus, Trash2, Download, TrendingDown, ClipboardList } from 'lucide-react';
import { Expense, InternalUser } from '../types';

interface ExpensesViewProps {
  expenses: Expense[];
  currentUser: InternalUser | null;
  onOpenAddModal: () => void;
  onDeleteExpense: (id: string) => void;
  formatMoney: (n: number) => string;
}

export default function ExpensesView({
  expenses,
  currentUser,
  onOpenAddModal,
  onDeleteExpense,
  formatMoney
}: ExpensesViewProps) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('all');

  // Kufanya uchujaji na utafutaji
  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.description.toLowerCase().includes(search.toLowerCase()) || (e.note || '').toLowerCase().includes(search.toLowerCase());
    const matchesCat = catFilter === 'all' || e.category === catFilter;
    
    return matchesSearch && matchesCat;
  });

  const filteredTotal = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  const categories = ['Uendeshaji', 'Vifaa', 'Mafunzo', 'Safari', 'Matengenezo', 'Drawings', 'Nyingine'];

  // Export CSV ripoti ya matumizi
  const exportCSV = () => {
    try {
      const csvRows = [
        ['Namba', 'Maelezo ya Matumizi', 'Kiasi (TSh)', 'Aina ya Matumizi', 'Tarehe ya Malipo', 'Maelezo ya Ziada']
      ];

      filteredExpenses.forEach((e, idx) => {
        csvRows.push([
          (idx + 1).toString(),
          e.description.replace(/,/g, ' '),
          e.amount.toString(),
          e.category,
          e.date,
          e.note ? e.note.replace(/,/g, ' ') : '-'
        ]);
      });

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
        + csvRows.map(e => e.join(',')).join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `ripoti_matumizi_saccos_plus_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert('Imeshindikana kutengeneza ripoti ya CSV ya matumizi.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Sehemu ya Juu ya Takwimu na Vichujio inayobaki juu wakati wa kusogeza ukurasa (Sticky Container) */}
      <div className="sticky top-[64px] z-30 bg-slate-950/95 py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b border-slate-800/80 backdrop-blur-md space-y-4">
        
        {/* Vichunaji & Tafuta */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-1">
            {/* Search bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Tafuta matumizi kwa maelezo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700/85 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-lg pl-9 pr-4 py-2 text-white text-sm outline-none transition-all"
              />
            </div>

            {/* Category SELECT filter */}
            <div className="relative">
              <select
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
                className="w-full sm:w-48 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs font-semibold outline-none focus:border-rose-500 cursor-pointer"
              >
                <option value="all">Kategoria Zote</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={exportCSV}
              title="Pakua ripoti kamili ya matumizi kama CSV"
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-205 border border-slate-700 hover:border-slate-650 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ripoti Excel</span>
            </button>
            
            {currentUser && (
              <button
                onClick={onOpenAddModal}
                className="flex items-center gap-1 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-lg shadow-rose-900/10"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Rekodi Matumizi</span>
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Jedwali la Matumizi */}
      <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 w-12 text-center">#</th>
                <th className="p-4">Matumizi</th>
                <th className="p-4">Kategoria</th>
                <th className="p-4">Tarehe</th>
                <th className="p-4">Maelezo (Notes)</th>
                <th className="p-4 text-right">Kiasi (TSh)</th>
                {currentUser && <th className="p-4 text-center">Futa</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={currentUser ? 7 : 6} className="p-10 text-center text-slate-500">
                    Hakuna matumizi yaliyopo chini ya vigezo hivyo.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((e, idx) => (
                  <tr key={e.id} className="hover:bg-slate-800/30 transition-colors text-slate-300">
                    <td className="p-4 text-center text-xs text-slate-500">{idx + 1}</td>
                    <td className="p-4 font-bold text-white leading-snug">{e.description}</td>
                    <td className="p-4">
                      <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-700/65 text-rose-300">
                        {e.category}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-semibold text-slate-400">{e.date}</td>
                    <td className="p-4 text-xs text-slate-400 truncate max-w-[200px]" title={e.note}>{e.note || '-'}</td>
                    <td className="p-4 text-right font-black text-rose-400">{formatMoney(e.amount)}</td>
                    
                    {currentUser && (
                      <td className="p-4 text-center">
                        <button
                          onClick={() => onDeleteExpense(e.id)}
                          title="Futa matumizi haya"
                          className="p-1.5 text-slate-505 hover:text-rose-500 hover:bg-rose-950/20 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
