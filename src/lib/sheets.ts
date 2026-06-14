/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SaccosData } from '../types';

interface SheetSyncResponse {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

export const syncSaccosToGoogleSheets = async (
  accessToken: string,
  data: SaccosData,
  existingSpreadsheetId?: string | null
): Promise<SheetSyncResponse> => {
  let spreadsheetId = existingSpreadsheetId;

  // 1. If there's no existing spreadsheet, construct a new one on user's drive
  if (!spreadsheetId) {
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          title: `TWAWEZA FAMILY — SACCOS Records (${new Date().toLocaleDateString('sw-TZ')})`
        },
        sheets: [
          { properties: { title: 'Maelezo Kuu' } },
          { properties: { title: 'Wanachama' } },
          { properties: { title: 'Michango' } },
          { properties: { title: 'Mikopo' } },
          { properties: { title: 'Matumizi' } }
        ]
      })
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error('Bila kuunda failsafe ya Sheets API: ', errText);
      throw new Error(`Imeshindikana kuandaa Sheet mpya: ${errText}`);
    }

    const createdSheet = await createRes.json();
    spreadsheetId = createdSheet.spreadsheetId;
  }

  if (!spreadsheetId) {
    throw new Error('Hukutambuliwa ID ya Spreadsheet');
  }

  // 2. Prepare spreadsheet data formats
  
  // Tab 1: Maelezo Kuu (Summary Dashboard Dashboard stats)
  const totalMembers = data.members.length;
  const activeMembers = data.members.filter(m => m.active).length;
  const totalContribs = data.contributions.filter(c => c.type !== ('Marejesho ya Mkopo' as any)).reduce((sum, c) => sum + c.amount, 0);
  const totalLoansGiven = data.loans.reduce((sum, l) => sum + l.amount, 0);
  const totalLoansRepaid = data.loans.reduce((sum, l) => sum + l.paidAmount, 0);
  const totalExpenses = data.expenses.reduce((sum, e) => sum + e.amount, 0);
  
  const summaryValues = [
    ['TAARIFA KUU YA KIKUNDI — TWAWEZA FAMILY'],
    ['Kigezo', 'Thamani', 'Maelezo'],
    ['Jumla ya Wanachama', totalMembers, 'Wanachama waliosajiliwa kwenye mfumo'],
    ['Wanachama Hai', activeMembers, 'Wanachama wenye sifa ya kushiriki sasa hivi'],
    ['Jumla ya Michango (TSh)', totalContribs, 'Fedha zote zilizochangwa na wanachama'],
    ['Mikopo Iliyotolewa (TSh)', totalLoansGiven, 'Kiasi kamili cha mikopo yote kuanzia mwanzo'],
    ['Mikopo Iliyorejeshwa (TSh)', totalLoansRepaid, 'Marejesho ya mikopo yaliyofanyika kamili'],
    ['Jumla ya Matumizi (TSh)', totalExpenses, 'Gharama za kikundi na maendekezo ya uendeshaji'],
    [],
    ['Muda wa kusawazisha (Last Synced):', new Date().toLocaleString('sw-TZ'), 'Muda halisi wa mabadiliko haya']
  ];

  // Tab 2: Wanachama (Members)
  const memberRows = data.members.map(m => [
    m.id,
    m.name,
    m.memberNo,
    m.phone,
    m.email,
    m.active ? 'Hai (Active)' : 'Sio Hai (Inactive)',
    m.created ? new Date(m.created).toLocaleDateString('sw-TZ') : ''
  ]);
  const memberValues = [
    ['ID ya Mwanachama', 'Jina Kamili', 'Cheo', 'Simu ya Mkononi', 'Barua Pepe (Email)', 'Hali ya Uanachama', 'Tarehe ya Kujiunga'],
    ...memberRows
  ];

  // Tab 3: Michango (Contributions)
  const contributionRows = data.contributions.map(c => {
    const m = data.members.find(x => x.id === c.memberId);
    return [
      c.id,
      m ? m.name : 'Unknown Member',
      m ? m.memberNo : '',
      c.amount,
      c.date,
      c.type,
      c.note
    ];
  });
  const contributionValues = [
    ['ID ya Mlinzi', 'Mwanachama', 'Cheo', 'Kiasi cha Mchango (TSh)', 'Tarehe', 'Aina ya Mchango', 'Maelezo ya Ziada (Notes)'],
    ...contributionRows
  ];

  // Tab 4: Mikopo (Loans)
  const loanRows = data.loans.map(l => {
    const m = data.members.find(x => x.id === l.memberId);
    return [
      l.id,
      m ? m.name : 'Unknown Member',
      m ? m.memberNo : '',
      l.amount,
      `${l.interest}%`,
      l.totalPay,
      l.paidAmount,
      l.totalPay - l.paidAmount,
      l.duration,
      l.date,
      l.status === 'ongoing' ? 'Inaendelea (Ongoing)' : 'Ilikamilika (Cleared)',
      l.note
    ];
  });
  const loanValues = [
    ['ID ya Mkopo', 'Mwanachama', 'Cheo', 'Kiasi cha Mkopo (TSh)', 'Riba (%)', 'Jumla ya Kurejesha (TSh)', 'Kiasi Kilichorejeshwa', 'Bari / Deni Lililobaki', 'Muda (Miezi)', 'Tarehe ya Mkopo', 'Hali ya Mkopo', 'Maelezo mengine'],
    ...loanRows
  ];

  // Tab 5: Matumizi (Expenses)
  const expenseRows = data.expenses.map(e => [
    e.id,
    e.description,
    e.amount,
    e.date,
    e.category,
    e.note
  ]);
  const expenseValues = [
    ['ID ya Matumizi', 'Maelezo ya Matumizi', 'Kiasi Kilichotumika (TSh)', 'Tarehe ya Matumizi', 'Kundi la Matumizi', 'Maelezo Maalum'],
    ...expenseRows
  ];

  // 3. Batch Update values in single API call
  const batchRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: 'Maelezo Kuu!A1:C20', values: summaryValues },
        { range: 'Wanachama!A1:G5000', values: memberValues },
        { range: 'Michango!A1:G10000', values: contributionValues },
        { range: 'Mikopo!A1:L5000', values: loanValues },
        { range: 'Matumizi!A1:F5000', values: expenseValues }
      ]
    })
  });

  if (!batchRes.ok) {
    const errText = await batchRes.text();
    console.error('Batch update failed to update cells: ', errText);
    throw new Error(`Imeshindikana kusasisha thamani kwenye Google Sheets: ${errText}`);
  }

  return {
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
  };
};
