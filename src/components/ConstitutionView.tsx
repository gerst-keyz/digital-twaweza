/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Edit, BookOpen } from 'lucide-react';
import { InternalUser } from '../types';

interface ConstitutionViewProps {
  constitution: string;
  currentUser: InternalUser | null;
  onOpenEditModal: () => void;
}

export default function ConstitutionView({
  constitution,
  currentUser,
  onOpenEditModal
}: ConstitutionViewProps) {
  return (
    <div className="space-y-6 animate-fade-in pt-8">
      <div className="bg-slate-800/60 rounded-xl border border-slate-750 p-6 sm:p-8 space-y-6 shadow-md max-w-4xl mx-auto">
        
        {/* Header kitengo */}
        <div className="flex items-center justify-between border-b border-slate-700 pb-5">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-black text-white">Katiba ya Kikundi / SACCOS PLUS</h2>
          </div>
          
          {currentUser && (
            <button
              onClick={onOpenEditModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Hariri Katiba</span>
            </button>
          )}
        </div>

        {/* Content Box */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 sm:p-6 text-slate-300 leading-relaxed text-sm whitespace-pre-wrap font-sans">
          {constitution ? constitution : (
            <div className="text-center py-20 text-slate-500">
              Hakuna katiba iliyohifadhiwa bado kwenye mfumo wetu.
            </div>
          )}
        </div>

        {/* Bottom indicator */}
        <div className="text-[11px] text-slate-500 flex justify-between items-center bg-slate-900/20 px-4 py-2.5 rounded-lg border border-slate-800/40">
          <span>Kumbukumbu: Katiba inalindwa dhidi ya mabadiliko ya nje.</span>
          <span className="font-semibold text-emerald-500">SACCOS PLUS © 2026</span>
        </div>

      </div>
    </div>
  );
}
