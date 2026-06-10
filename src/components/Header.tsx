/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wifi, WifiOff, Shield, ShieldCheck, LogOut, User, Lock, Upload, Menu, X } from 'lucide-react';
import { InternalUser } from '../types';

interface HeaderProps {
  isOnline: boolean;
  currentUser: InternalUser | null;
  onLogout: () => void;
  onNavigate: (page: string) => void;
  activePage: string;
  onExportBackup: () => void;
  onTriggerImportClick: () => void;
}

export default function Header({
  isOnline,
  currentUser,
  onLogout,
  onNavigate,
  activePage,
  onExportBackup,
  onTriggerImportClick
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: '🏠' },
    { id: 'members', label: 'Wanachama', icon: '👥' },
    { id: 'contributions', label: 'Michango', icon: '💰' },
    { id: 'loans', label: 'Mikopo', icon: '🏦' },
    { id: 'expenses', label: 'Matumizi', icon: '💸' },
    { id: 'constitution', label: 'Katiba', icon: '📜' },
    ...(currentUser ? [{ id: 'users', label: 'Watumiaji', icon: '👤' }] : [])
  ];

  const handleMobileNav = (pageId: string) => {
    onNavigate(pageId);
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-900 border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <span 
              className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-1 cursor-pointer" 
              onClick={() => handleMobileNav('dashboard')}
            >
              TWAWEZA <span className="text-emerald-500">DIGITAL</span>
            </span>
          </div>

          {/* Desktop/Tablet Large Navigation */}
          <nav className="hidden lg:flex items-center space-x-1 lg:space-x-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activePage === item.id
                    ? 'bg-slate-800 text-white shadow-sm border-b-2 border-emerald-500 rounded-b-none'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Auth & Storage Controls (Desktop/Tablet Large) */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Backup Restore Control */}
            <div className="flex items-center gap-1">
              {currentUser && (
                <button
                  onClick={onTriggerImportClick}
                  title="Pakia data kutoka kwenye faili (Restore)"
                  className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* User Login state */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1 px-3 py-1.5 bg-rose-600/25 hover:bg-rose-600/40 text-rose-300 hover:text-rose-100 border border-rose-800/50 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Ondoka</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => onNavigate('login')}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-lg text-xs font-bold cursor-pointer transition-all duration-200 shadow-lg shadow-emerald-900/20"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Ingia</span>
              </button>
            )}
          </div>

          {/* Mobile & Tablet Menu Toggle Button */}
          <div className="flex lg:hidden items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none cursor-pointer transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Modern, Animated Mobile Navigation Drawer with a Backdrop */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm lg:hidden"
            />

            {/* Sidebar Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-2/3 max-w-[230px] bg-slate-950 border-l border-slate-800 p-4.5 shadow-2xl flex flex-col justify-between lg:hidden h-full overflow-y-auto"
            >
              <div className="space-y-6">
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-900">
                  <span className="text-sm font-black tracking-wider text-white">
                    TWAWEZA <span className="text-emerald-500">MENU</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Navigation Items */}
                <div className="space-y-1.5">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleMobileNav(item.id);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all duration-150 active:scale-[0.98] ${
                        activePage === item.id
                          ? 'bg-slate-900 text-emerald-400 border-l-4 border-emerald-500 pl-3'
                          : 'text-slate-300 hover:bg-slate-900/60 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-base">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      {activePage === item.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bottom Actions/Credentials inside Drawer */}
              <div className="space-y-3 pt-6 border-t border-slate-900 mt-auto">
                {/* Upload command on mobile */}
                {currentUser && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onTriggerImportClick();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] font-semibold text-slate-400 hover:bg-slate-900 hover:text-white transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Pakia data (Restore)</span>
                  </button>
                )}

                {/* Login/Logout Control */}
                {currentUser ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/40 rounded-xl border border-slate-900">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping shrink-0"></div>
                      <span className="text-[10px] text-slate-400 truncate">
                        Kiongozi: <strong className="text-slate-200">{currentUser.fullName}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        onLogout();
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-600/15 hover:bg-rose-600/30 text-rose-400 hover:text-rose-200 border border-rose-900/40 rounded-xl text-xs font-bold cursor-pointer transition-all duration-150 active:scale-[0.98]"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Ondoka (Logout)</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleMobileNav('login');
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/25 cursor-pointer transition-all duration-150 active:scale-[0.98]"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Ingia (Login)</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </header>
  );
}

