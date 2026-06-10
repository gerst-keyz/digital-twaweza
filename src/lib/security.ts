/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SaccosData, AuditLog } from '../types';

// Usimbaji rahisi (XOR Cipher na Base64) kuzuia password kusomwa kama maandishi ya kawaida (plain text) kwenye LocalStorage.
const ENCRYPTION_KEY = 'SACCOS_SECURE_KEY_2026';

export function encryptPassword(password: string): string {
  if (!password) return '';
  let result = '';
  for (let i = 0; i < password.length; i++) {
    const charCode = password.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
    result += String.fromCharCode(charCode);
  }
  return btoa(result);
}

export function decryptPassword(cipherText: string): string {
  if (!cipherText) return '';
  try {
    const raw = atob(cipherText);
    let result = '';
    for (let i = 0; i < raw.length; i++) {
      const charCode = raw.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch (e) {
    // Ikiwa ilikuwa haijasimbwa bado (Plain text)
    return cipherText;
  }
}

// Kupakua Backup ya data kama faili la JSON kuzuia upotevu wa data
export function exportDataBackup(data: SaccosData): void {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `saccos_plus_backup_${timestamp}.json`;
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Alasiri! Imeshindikana kupakua backup:', err);
    throw new Error('Imeshindikana kutengeneza faili la Backup.');
  }
}

// Kupakia nakala ya data (Restore kutoka faili la JSON)
export function importDataBackup(jsonStr: string): SaccosData {
  try {
    const parsed = JSON.parse(jsonStr);
    
    // Uhakiki wa msingi wa muundo wa data (Data Integrity Check)
    if (
      parsed &&
      Array.isArray(parsed.members) &&
      Array.isArray(parsed.contributions) &&
      Array.isArray(parsed.loans) &&
      Array.isArray(parsed.expenses) &&
      typeof parsed.constitution === 'string' &&
      Array.isArray(parsed.internalUsers)
    ) {
      if (!Array.isArray(parsed.auditLogs)) {
        parsed.auditLogs = [];
      }
      return parsed as SaccosData;
    }
    throw new Error('Muundo wa faili la backup si sahihi.');
  } catch (err) {
    console.error('Imeshindikana kupakia backup:', err);
    throw new Error('Faili halina muundo sahihi wa data ya SACCOS Plus au limeharibika.');
  }
}

// Kujenga log mpya ya mabadiliko
export function createAuditLog(
  user: string,
  action: string,
  details: string
): AuditLog {
  return {
    id: 'log_' + Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    user,
    action,
    details
  };
}
