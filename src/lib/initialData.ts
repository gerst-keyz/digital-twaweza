/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SaccosData } from '../types';
import { encryptPassword } from './security';

export function getDefaultSaccosData(): SaccosData {
  const now = new Date();

  const members = [
    {
      id: 'm_credo',
      name: 'Credo mapunda',
      memberNo: 'Mwanachama',
      phone: '0757749594',
      email: 'credo.mapunda@example.com',
      active: true,
      created: '2025-10-31'
    },
    {
      id: 'm_frolian',
      name: 'Frolian mapunda',
      memberNo: 'Mwanachama',
      phone: '0768561197',
      email: 'frolian.mapunda@example.com',
      active: true,
      created: '2025-10-31'
    },
    {
      id: 'm_fulko',
      name: 'Fulko nkolela',
      memberNo: 'Mwanachama',
      phone: '0744093850',
      email: 'fulko.nkolela@example.com',
      active: true,
      created: '2025-10-31'
    },
    {
      id: 'm_gaston',
      name: 'Gaston mapunda',
      memberNo: 'Katibu',
      phone: '0762012479',
      email: 'gastonmapunda24@gmail.com',
      active: true,
      created: '2025-10-31'
    },
    {
      id: 'm_glory',
      name: 'Glory nkolela',
      memberNo: 'Mhasibu',
      phone: '0746313941',
      email: 'glory.nkolela@example.com',
      active: true,
      created: '2025-10-31'
    },
    {
      id: 'm_innocent',
      name: 'Innocent mapunda',
      memberNo: 'Mwanachama',
      phone: '0763883581',
      email: 'innocent.mapunda@example.com',
      active: true,
      created: '2025-11-30'
    },
    {
      id: 'm_isack',
      name: 'Isack mapunda',
      memberNo: 'Mwanachama',
      phone: '0767409635',
      email: 'isack.mapunda@example.com',
      active: true,
      created: '2025-11-30'
    },
    {
      id: 'm_joyce',
      name: 'Joyce mapunda',
      memberNo: 'Mwanachama',
      phone: '0746137804',
      email: 'joyce.mapunda@example.com',
      active: true,
      created: '2025-11-30'
    },
    {
      id: 'm_maria',
      name: 'Maria nkolela',
      memberNo: 'Mwanachama',
      phone: '0741962702',
      email: 'maria.nkolela@example.com',
      active: true,
      created: '2025-11-30'
    },
    {
      id: 'm_nestory',
      name: 'Nestory mapunda',
      memberNo: 'Mwanachama',
      phone: '0750256765',
      email: 'nestory.mapunda@example.com',
      active: true,
      created: '2025-10-31'
    },
    {
      id: 'm_rozina',
      name: 'Rozina mapunda',
      memberNo: 'Mwenyekiti',
      phone: '0757279482',
      email: 'rozina.mapunda@example.com',
      active: true,
      created: '2025-10-31'
    },
    {
      id: 'm_taslo',
      name: 'Taslo nkolela',
      memberNo: 'Mwanachama',
      phone: '0756502085',
      email: 'taslo.nkolela@example.com',
      active: true,
      created: '2025-10-31'
    },
    {
      id: 'm_agatha',
      name: 'Agatha mponera',
      memberNo: 'Mwanachama',
      phone: '0625806227',
      email: 'agatha.mponera@example.com',
      active: false,
      created: '2026-06-09'
    }
  ];

  const result: SaccosData = {
    members,
    contributions: [
      // row 1-2: Credo mapunda
      { id: 'c_1', memberId: 'm_credo', amount: 5000, date: '2025-10-31', type: 'Hisa', note: '' },
      { id: 'c_2', memberId: 'm_credo', amount: 5000, date: '2025-11-30', type: 'Ada ya Uanachama', note: '-' },
      
      // row 3-5: Frolian mapunda
      { id: 'c_3', memberId: 'm_frolian', amount: 5000, date: '2025-10-31', type: 'Hisa', note: '' },
      { id: 'c_4', memberId: 'm_frolian', amount: 5000, date: '2025-11-30', type: 'Ada ya Uanachama', note: '-' },
      { id: 'c_5', memberId: 'm_frolian', amount: 6000, date: '2025-12-31', type: 'Ada ya Uanachama', note: 'amezidisha kiasi cha TZS 1000' },
      
      // row 6-9: Fulko nkolela
      { id: 'c_6', memberId: 'm_fulko', amount: 5000, date: '2025-10-31', type: 'Hisa', note: '' },
      { id: 'c_7', memberId: 'm_fulko', amount: 5000, date: '2025-11-30', type: 'Ada ya Uanachama', note: '' },
      { id: 'c_8', memberId: 'm_fulko', amount: 5000, date: '2025-12-31', type: 'Ada ya Uanachama', note: '' },
      { id: 'c_9', memberId: 'm_fulko', amount: 5000, date: '2026-01-30', type: 'Ada ya Uanachama', note: '' },
      
      // row 10-12: Gaston mapunda
      { id: 'c_10', memberId: 'm_gaston', amount: 5000, date: '2025-10-31', type: 'Hisa', note: '' },
      { id: 'c_11', memberId: 'm_gaston', amount: 5000, date: '2025-11-30', type: 'Akiba', note: '' },
      { id: 'c_12', memberId: 'm_gaston', amount: 5000, date: '2025-12-31', type: 'Ada ya Uanachama', note: '' },
      
      // row 13-19: Glory nkolela
      { id: 'c_13', memberId: 'm_glory', amount: 5000, date: '2025-10-31', type: 'Hisa', note: '' },
      { id: 'c_14', memberId: 'm_glory', amount: 5000, date: '2025-11-30', type: 'Ada ya Uanachama', note: '' },
      { id: 'c_15', memberId: 'm_glory', amount: 5000, date: '2025-12-31', type: 'Ada ya Uanachama', note: '' },
      { id: 'c_16', memberId: 'm_glory', amount: 5000, date: '2026-01-31', type: 'Ada ya Uanachama', note: '' },
      { id: 'c_17', memberId: 'm_glory', amount: 5000, date: '2026-02-28', type: 'Ada ya Uanachama', note: '' },
      { id: 'c_18', memberId: 'm_glory', amount: 5000, date: '2026-03-31', type: 'Ada ya Uanachama', note: '' },
      { id: 'c_19', memberId: 'm_glory', amount: 5000, date: '2026-04-30', type: 'Ada ya Uanachama', note: '' },
      
      // row 20-27: Innocent mapunda
      { id: 'c_20', memberId: 'm_innocent', amount: 5000, date: '2026-06-08', type: 'Hisa', note: '' },
      { id: 'c_21', memberId: 'm_innocent', amount: 5000, date: '2025-11-30', type: 'Ada ya Uanachama', note: '' },
      { id: 'c_22', memberId: 'm_innocent', amount: 5000, date: '2025-12-31', type: 'Ada ya Uanachama', note: '' },
      { id: 'c_23', memberId: 'm_innocent', amount: 5000, date: '2026-01-31', type: 'Ada ya Uanachama', note: '' },
      { id: 'c_24', memberId: 'm_innocent', amount: 5000, date: '2026-02-28', type: 'Ada ya Uanachama', note: '' },
      { id: 'c_25', memberId: 'm_innocent', amount: 5000, date: '2026-04-30', type: 'Ada ya Uanachama', note: '' },
      { id: 'c_26', memberId: 'm_innocent', amount: 5000, date: '2026-05-31', type: 'Ada ya Uanachama', note: '' },
      { id: 'c_27', memberId: 'm_innocent', amount: 5000, date: '2026-03-31', type: 'Ada ya Uanachama', note: '' },
      
      // row 28-30: Isack mapunda
      { id: 'c_28', memberId: 'm_isack', amount: 5000, date: '2026-06-08', type: 'Hisa', note: '' },
      { id: 'c_29', memberId: 'm_isack', amount: 5000, date: '2025-11-30', type: 'Ada ya Uanachama', note: '' },
      { id: 'c_30', memberId: 'm_isack', amount: 5000, date: '2025-12-31', type: 'Ada ya Uanachama', note: '' },
      
      // row 31-33: Joyce mapunda
      { id: 'c_31', memberId: 'm_joyce', amount: 5000, date: '2026-06-08', type: 'Hisa', note: '' },
      { id: 'c_32', memberId: 'm_joyce', amount: 5000, date: '2025-11-30', type: 'Ada ya Uanachama', note: '' },
      { id: 'c_33', memberId: 'm_joyce', amount: 5000, date: '2025-12-31', type: 'Ada ya Uanachama', note: '' },
      
      // row 34-39: Maria nkolela
      { id: 'c_34', memberId: 'm_maria', amount: 5000, date: '2026-06-08', type: 'Hisa', note: '' },
      { id: 'c_35', memberId: 'm_maria', amount: 5000, date: '2025-11-30', type: 'Ada ya Uanachama', note: '' },
      { id: 'c_36', memberId: 'm_maria', amount: 5000, date: '2025-12-31', type: 'Ada ya Uanachama', note: '' },
      { id: 'c_37', memberId: 'm_maria', amount: 5000, date: '2026-01-31', type: 'Ada ya Uanachama', note: '' },
      { id: 'c_38', memberId: 'm_maria', amount: 5000, date: '2026-03-31', type: 'Ada ya Uanachama', note: '' },
      { id: 'c_39', memberId: 'm_maria', amount: 5000, date: '2026-02-28', type: 'Ada ya Uanachama', note: '' },
      
      // row 40-42: Nestory mapunda
      { id: 'c_40', memberId: 'm_nestory', amount: 5000, date: '2025-10-31', type: 'Hisa', note: '' },
      { id: 'c_41', memberId: 'm_nestory', amount: 5000, date: '2025-11-30', type: 'Ada ya Uanachama', note: '' },
      { id: 'c_42', memberId: 'm_nestory', amount: 5000, date: '2025-12-31', type: 'Ada ya Uanachama', note: '' },
      
      // row 43-47: Rozina mapunda
      { id: 'c_43', memberId: 'm_rozina', amount: 5000, date: '2025-10-31', type: 'Hisa', note: '' },
      { id: 'c_44', memberId: 'm_rozina', amount: 5000, date: '2025-11-30', type: 'Ada ya Uanachama', note: '' },
      { id: 'c_45', memberId: 'm_rozina', amount: 5000, date: '2025-12-31', type: 'Ada ya Uanachama', note: '' },
      { id: 'c_46', memberId: 'm_rozina', amount: 5000, date: '2026-01-31', type: 'Ada ya Uanachama', note: '' },
      { id: 'c_47', memberId: 'm_rozina', amount: 5000, date: '2026-02-28', type: 'Ada ya Uanachama', note: '' },
      
      // row 48-50: Taslo nkolela
      { id: 'c_48', memberId: 'm_taslo', amount: 5000, date: '2025-10-31', type: 'Hisa', note: '' },
      { id: 'c_49', memberId: 'm_taslo', amount: 5000, date: '2025-11-30', type: 'Ada ya Uanachama', note: '' },
      { id: 'c_50', memberId: 'm_taslo', amount: 5000, date: '2025-12-31', type: 'Ada ya Uanachama', note: '' },
      // Marejesho ya Mkopo ya Rozina Mapunda
      { id: 'c_rozina_pay1', memberId: 'm_rozina', amount: 160000, date: '2026-05-04', type: 'Marejesho ya Mkopo', note: 'Marejesho ya kwanza ya mkopo' },
      { id: 'c_rozina_pay2', memberId: 'm_rozina', amount: 12500, date: '2026-05-11', type: 'Marejesho ya Mkopo', note: 'Marejesho ya pili na kumaliza mkopo' }
    ],
    loans: [
      {
        id: 'l_rozina',
        memberId: 'm_rozina',
        amount: 150000,
        interest: 15,
        totalPay: 172500,
        paidAmount: 172500,
        duration: 1,
        date: '2026-02-18',
        status: 'cleared',
        note: 'mkopo wa dharura'
      },
      {
        id: 'l_innocent',
        memberId: 'm_innocent',
        amount: 50000,
        interest: 10,
        totalPay: 55000,
        paidAmount: 0,
        duration: 1,
        date: '2026-05-24',
        status: 'ongoing',
        note: '-'
      }
    ],
    expenses: [
      {
        id: 'exp_vocha',
        description: 'kununua vocha kwaajili ya kikao',
        amount: 5000,
        date: '2026-05-23',
        category: 'Uendeshaji',
        note: 'vocha'
      }
    ],
    constitution: ` KATIBA YA KIKUNDI CHA TWAWEZA FAMILY

1.0 UTANGULIZI
Kikundi hiki kinaitwa "TWAWEZA FAMILY" na kinaundwa kwa lengo kusaidiana katika shida na raha pia kuleta maendeleo ya kiuchumi na kijamii kwa kukuza utamaduni wa kuweka akiba na kukopesha kwa kila mwanachama wake.

2.0 MALENGO
-kusaidiana katika shida na raha
-kutoa mikopo yenye riba nafuu kwa wanachama wake

3.0 UANACHAMA
- Kila mwanachama anapaswa kupitia mchakato rasmi wa kujiunga na kuidhinishwa na Kamati Kuu.
- Kila mwanachama atalipa ada ya kujiunga inayopangwa kisheria.
- Wanachama wote wana haki sawa ya kupiga kura, kupata mikopo, na kufaidika na faida (gawio).
- Uanachama utakoma ikiwa mwanachama atavunja katiba hii, kujiondoa kwa hiari, au kushindwa kutoa michango kwa miezi mitatu mtawalia bila taarifa thabiti.

4.0 MICHANGO NA AKIBA
- Kila mwanachama atchanga kiwango cha chini cha TSh 5,000 kila mwezi kama Akiba.
- Hisa inaweza kununuliwa kwa mafungu ya TSh 100,000 kwa hisa moja hadi ukomo av 20% ya hisa zote za kikundi.
- Michango maalum inaweza kuwekwa kulingana na maamuzi ya Mkutano Mkuu.

5.0 USIMAMIZI NA USALAMA WA MIKOPO
- Ukomo wa mkopo ni mara tatu (3x) ya akiba ya mwanachama.
- Riba ya mkopo ni 10% kwa miezi hadi 6 na 12% kwa miezi 12 (au kulingana na kiwango kikitofautishwa).
- Mikopo yote lazima idhaminiwe na wanachama wasiopungua wawili wenye akiba za kutosha.
- Malipo ya marejesho ya kila mwezi lazima yafanyike kwa nidhamu, vinginevyo hatua za kisheria au faini zitachukuliwa.

6.0 USIMAMIZI WA PESA
- Fedha zote za kikundi zeitahifadhiwa katika Akunti ya Benki ya Kikundi.
- Matumizi yote ya uendeshaji lazima yaidhinishwe na viongozi watatu rasmi (Mwenyekiti, Katibu na Mhasibu).
- Taarifa kamili za fedha zitasomwa na kujadiliwa wakati wote wa Mkutano Mkuu wa Mwezi.`,
    internalUsers: [
      {
        id: 'u1',
        username: 'admin',
        passwordHash: encryptPassword('saccos123'),
        fullName: 'Mkurugenzi Mkuu',
        created: now.toISOString(),
        role: 'admin'
      },
      {
        id: 'u2',
        username: 'mhasibu',
        passwordHash: encryptPassword('mhasibu123'),
        fullName: 'Mhasibu Mkuu',
        created: now.toISOString(),
        role: 'staff'
      }
    ],
    auditLogs: [
      {
        id: 'log_start',
        timestamp: now.toISOString(),
        user: 'Mfumo',
        action: 'Kuanzishwa kwa Mfumo',
        details: 'Mfumo wa TWAWEZA FAMILY umeanza kufanya kazi rasmi na data safi za mwanachama na michango kupakiwa.'
      }
    ]
  };

  // Badilisha aina ya michango yote (isipokuwa Marejesho ya Mkopo) kuwa "Ada ya Uanachama"
  result.contributions = result.contributions.map(c => ({
    ...c,
    type: c.type === 'Marejesho ya Mkopo' ? 'Marejesho ya Mkopo' : ('Ada ya Uanachama' as any)
  }));

  return result;
}
