// Mock Plaid transaction generator for POC.
import { randomUUID } from "crypto";

export interface MockTransaction {
  plaid_transaction_id: string;
  amount: number;
  name: string;
  merchant_name: string | null;
  category: string[];
  payment_channel: string;
  pending: boolean;
  iso_currency_code: string;
  date: string; // YYYY-MM-DD
  location: Record<string, unknown> | null;
}

export interface MockAccount {
  plaid_account_id: string;
  name: string;
  official_name: string;
  subtype: string;
  mask: string;
  current_balance: number;
  available_balance: number;
  currency: string;
}

const INSTITUTIONS = [
  { name: "Chase", id: "ins_1" },
  { name: "Bank of America", id: "ins_2" },
  { name: "Wells Fargo", id: "ins_3" },
  { name: "Citibank", id: "ins_4" },
  { name: "PNC", id: "ins_5" },
  { name: "U.S. Bank", id: "ins_6" },
];

const NORMAL_MERCHANTS: { name: string; merchant_name: string; category: string[]; channel: string; min: number; max: number }[] = [
  { name: "KROGER #442", merchant_name: "Kroger", category: ["Food and Drink", "Grocery"], channel: "in store", min: 45, max: 180 },
  { name: "SAFEWAY STORE 8812", merchant_name: "Safeway", category: ["Food and Drink", "Grocery"], channel: "in store", min: 30, max: 140 },
  { name: "TRADER JOE'S #512", merchant_name: "Trader Joe's", category: ["Food and Drink", "Grocery"], channel: "in store", min: 25, max: 95 },
  { name: "WHOLEFDS MKT 10123", merchant_name: "Whole Foods", category: ["Food and Drink", "Grocery"], channel: "in store", min: 35, max: 120 },
  { name: "PUBLIX #1241", merchant_name: "Publix", category: ["Food and Drink", "Grocery"], channel: "in store", min: 40, max: 150 },
  { name: "ALDI 4402", merchant_name: "Aldi", category: ["Food and Drink", "Grocery"], channel: "in store", min: 20, max: 80 },
  { name: "CVS/PHARMACY #8841", merchant_name: "CVS", category: ["Shops", "Pharmacy"], channel: "in store", min: 12, max: 85 },
  { name: "WALGREENS #10912", merchant_name: "Walgreens", category: ["Shops", "Pharmacy"], channel: "in store", min: 15, max: 75 },
  { name: "SHELL OIL 574421234", merchant_name: "Shell", category: ["Travel", "Gas Station"], channel: "in store", min: 35, max: 65 },
  { name: "CHEVRON 0393841", merchant_name: "Chevron", category: ["Travel", "Gas Station"], channel: "in store", min: 32, max: 58 },
  { name: "CONEDISON ELEC BILL", merchant_name: "Con Edison", category: ["Bills and Utilities", "Electric"], channel: "online", min: 85, max: 220 },
  { name: "PG&E AUTOPAY", merchant_name: "PG&E", category: ["Bills and Utilities", "Electric"], channel: "online", min: 70, max: 180 },
  { name: "COMCAST CABLE", merchant_name: "Comcast", category: ["Bills and Utilities", "Internet"], channel: "online", min: 55, max: 95 },
  { name: "AT&T INTERNET", merchant_name: "AT&T", category: ["Bills and Utilities", "Internet"], channel: "online", min: 50, max: 80 },
  { name: "MCDONALD'S #4412", merchant_name: "McDonald's", category: ["Food and Drink", "Restaurants"], channel: "in store", min: 8, max: 22 },
  { name: "STARBUCKS STORE 8821", merchant_name: "Starbucks", category: ["Food and Drink", "Restaurants"], channel: "in store", min: 5, max: 18 },
  { name: "OLIVE GARDEN 0044", merchant_name: "Olive Garden", category: ["Food and Drink", "Restaurants"], channel: "in store", min: 28, max: 65 },
  { name: "CHIPOTLE 00912", merchant_name: "Chipotle", category: ["Food and Drink", "Restaurants"], channel: "in store", min: 12, max: 28 },
  { name: "TARGET STORE #T2881", merchant_name: "Target", category: ["Shops", "Department Stores"], channel: "in store", min: 25, max: 120 },
  { name: "WAL-MART SUPERCENTER", merchant_name: "Walmart", category: ["Shops", "Department Stores"], channel: "in store", min: 30, max: 150 },
  { name: "COSTCO WHSE #441", merchant_name: "Costco", category: ["Shops", "Warehouse Clubs"], channel: "in store", min: 80, max: 280 },
  { name: "HOME DEPOT #4412", merchant_name: "Home Depot", category: ["Shops", "Home Improvement"], channel: "in store", min: 25, max: 95 },
  { name: "DR. SMITH FAMILY MED", merchant_name: "Dr. Smith Family Medicine", category: ["Health Care", "Doctor"], channel: "in store", min: 35, max: 150 },
  { name: "LABCORP BILLING", merchant_name: "LabCorp", category: ["Health Care", "Medical Services"], channel: "online", min: 45, max: 250 },
  { name: "QUEST DIAGNOSTICS", merchant_name: "Quest Diagnostics", category: ["Health Care", "Medical Services"], channel: "online", min: 40, max: 220 },
  { name: "NETFLIX.COM", merchant_name: "Netflix", category: ["Entertainment", "Subscription"], channel: "online", min: 15, max: 25 },
  { name: "AMAZON PRIME MEMBER", merchant_name: "Amazon Prime", category: ["Shops", "Subscription"], channel: "online", min: 14, max: 18 },
  { name: "STATE FARM INS PREM", merchant_name: "State Farm", category: ["Insurance", "Home"], channel: "online", min: 120, max: 350 },
  { name: "MEDICARE PART B", merchant_name: "Medicare", category: ["Insurance", "Health"], channel: "online", min: 140, max: 180 },
  { name: "SPOTIFY USA", merchant_name: "Spotify", category: ["Entertainment", "Subscription"], channel: "online", min: 10, max: 16 },
  { name: "BROOKSHIRE GROCERY #4", merchant_name: "Brookshire Grocery", category: ["Food and Drink", "Grocery"], channel: "in store", min: 30, max: 110 },
  { name: "LOWE'S #00441", merchant_name: "Lowe's", category: ["Shops", "Home Improvement"], channel: "in store", min: 20, max: 85 },
  { name: "DUNKIN' #88121", merchant_name: "Dunkin'", category: ["Food and Drink", "Restaurants"], channel: "in store", min: 6, max: 14 },
  { name: "SUBWAY 000441234", merchant_name: "Subway", category: ["Food and Drink", "Restaurants"], channel: "in store", min: 8, max: 18 },
  { name: "BATH & BODY WORKS", merchant_name: "Bath & Body Works", category: ["Shops", "Beauty"], channel: "in store", min: 25, max: 65 },
  { name: "GREAT CLIPS #4412", merchant_name: "Great Clips", category: ["Service", "Personal Care"], channel: "in store", min: 18, max: 35 },
  { name: "AMC THEATERS 00441", merchant_name: "AMC Theaters", category: ["Entertainment", "Movie Theatres"], channel: "in store", min: 12, max: 28 },
  { name: "BARNES & NOBLE #441", merchant_name: "Barnes & Noble", category: ["Shops", "Bookstore"], channel: "in store", min: 15, max: 45 },
];

const ATM_MERCHANTS = [
  { name: "ATM WITHDRAWAL", merchant_name: "ATM", category: ["Transfer", "Withdrawal"], channel: "other", min: 40, max: 200 },
  { name: "ATM WITHDRAWAL - CHASE", merchant_name: "ATM", category: ["Transfer", "Withdrawal"], channel: "other", min: 60, max: 300 },
];

const SUSPICIOUS_SCENARIOS: { name: string; merchant_name: string | null; category: string[]; channel: string; amount: number; description: string }[] = [
  { name: "APPLE GIFT CARD", merchant_name: "Apple", category: ["Shops", "Gift Card"], channel: "in store", amount: 500.0, description: "Five $100 Apple gift cards purchased at CVS." },
  { name: "GOOGLE PLAY GIFT CARD", merchant_name: "Google", category: ["Shops", "Gift Card"], channel: "in store", amount: 300.0, description: "Three $100 Google Play gift cards." },
  { name: "WIRE TRANSFER OUT", merchant_name: null, category: ["Transfer", "Wire"], channel: "online", amount: 1500.0, description: "Outbound wire to 'EMERGENCY ASSISTANCE LLC'." },
  { name: "WESTERN UNION QUICK COLLECT", merchant_name: "Western Union", category: ["Transfer", "Wire"], channel: "online", amount: 1200.0, description: "Western Union money transfer." },
  { name: "ZELLE PAYMENT SENT", merchant_name: "Zelle", category: ["Transfer", "Debit"], channel: "online", amount: 800.0, description: "Zelle payment sent to a first-time recipient." },
  { name: "COINBASE", merchant_name: "Coinbase", category: ["Transfer", "Crypto"], channel: "online", amount: 2000.0, description: "Cryptocurrency purchase on Coinbase." },
  { name: "NORTON-LIFELOCK-RENEW", merchant_name: "Norton", category: ["Service", "Software"], channel: "online", amount: 420.0, description: "Norton LifeLock renewal for $420." },
  { name: "PC HELP DESK REMOTE ACCESS", merchant_name: "PC Help Desk", category: ["Service", "Computer"], channel: "online", amount: 299.0, description: "Payment to a remote tech-support service." },
  { name: "MONEYGRAM SEND", merchant_name: "MoneyGram", category: ["Transfer", "Wire"], channel: "in store", amount: 950.0, description: "MoneyGram transfer at a retail location." },
  { name: "CASH APP TRANSFER", merchant_name: "Cash App", category: ["Transfer", "Debit"], channel: "online", amount: 600.0, description: "Cash App transfer to an unknown recipient." },
  { name: "BINANCE.US", merchant_name: "Binance.US", category: ["Transfer", "Crypto"], channel: "online", amount: 1500.0, description: "Cryptocurrency purchase on Binance.US." },
];

function rand(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getMockInstitutions() {
  return INSTITUTIONS;
}

export function createMockAccounts(institutionName: string): MockAccount[] {
  const suffix = Math.floor(Math.random() * 9000) + 1000;
  return [
    {
      plaid_account_id: `mock-acc-${randomUUID()}`,
      name: "Checking",
      official_name: `${institutionName} Checking`,
      subtype: "checking",
      mask: String(suffix),
      current_balance: rand(1200, 8500),
      available_balance: rand(1100, 8400),
      currency: "USD",
    },
    {
      plaid_account_id: `mock-acc-${randomUUID()}`,
      name: "Savings",
      official_name: `${institutionName} Savings`,
      subtype: "savings",
      mask: String(suffix + 1),
      current_balance: rand(5000, 45000),
      available_balance: rand(4900, 44900),
      currency: "USD",
    },
  ];
}

export function generateInitialTransactions(accountId: string, elderId: string): MockTransaction[] {
  const txns: MockTransaction[] = [];
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 60);

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dailyCount = randInt(0, 4);
    for (let i = 0; i < dailyCount; i++) {
      const m = pick(NORMAL_MERCHANTS);
      txns.push({
        plaid_transaction_id: `mock-txn-${randomUUID()}`,
        amount: rand(m.min, m.max),
        name: m.name,
        merchant_name: m.merchant_name,
        category: m.category,
        payment_channel: m.channel,
        pending: false,
        iso_currency_code: "USD",
        date: d.toISOString().slice(0, 10),
        location: null,
      });
    }
    if (Math.random() < 0.12) {
      const atm = pick(ATM_MERCHANTS);
      txns.push({
        plaid_transaction_id: `mock-txn-${randomUUID()}`,
        amount: rand(atm.min, atm.max),
        name: atm.name,
        merchant_name: atm.merchant_name,
        category: atm.category,
        payment_channel: atm.channel,
        pending: false,
        iso_currency_code: "USD",
        date: d.toISOString().slice(0, 10),
        location: null,
      });
    }
  }

  const suspiciousCount = randInt(2, 3);
  for (let i = 0; i < suspiciousCount; i++) {
    const scenario = pick(SUSPICIOUS_SCENARIOS);
    const daysBack = randInt(1, 28);
    txns.push({
      plaid_transaction_id: `mock-txn-${randomUUID()}`,
      amount: scenario.amount,
      name: scenario.name,
      merchant_name: scenario.merchant_name,
      category: scenario.category,
      payment_channel: scenario.channel,
      pending: false,
      iso_currency_code: "USD",
      date: daysAgo(daysBack),
      location: null,
    });
  }

  txns.sort((a, b) => a.date.localeCompare(b.date));
  return txns;
}

export function generateSyncTransactions(accountId: string, elderId: string, count: number = 2): MockTransaction[] {
  const txns: MockTransaction[] = [];
  const today = new Date().toISOString().slice(0, 10);

  for (let i = 0; i < count; i++) {
    const m = pick(NORMAL_MERCHANTS);
    txns.push({
      plaid_transaction_id: `mock-txn-${randomUUID()}`,
      amount: rand(m.min, m.max),
      name: m.name,
      merchant_name: m.merchant_name,
      category: m.category,
      payment_channel: m.channel,
      pending: false,
      iso_currency_code: "USD",
      date: today,
      location: null,
    });
  }

  if (Math.random() < 0.15) {
    const scenario = pick(SUSPICIOUS_SCENARIOS);
    txns.push({
      plaid_transaction_id: `mock-txn-${randomUUID()}`,
      amount: scenario.amount,
      name: scenario.name,
      merchant_name: scenario.merchant_name,
      category: scenario.category,
      payment_channel: scenario.channel,
      pending: false,
      iso_currency_code: "USD",
      date: today,
      location: null,
    });
  }

  return txns;
}

export function generateSingleSuspiciousTransaction(accountId: string, elderId: string): MockTransaction {
  const scenario = pick(SUSPICIOUS_SCENARIOS);
  const today = new Date().toISOString().slice(0, 10);
  return {
    plaid_transaction_id: `mock-txn-${randomUUID()}`,
    amount: scenario.amount,
    name: scenario.name,
    merchant_name: scenario.merchant_name,
    category: scenario.category,
    payment_channel: scenario.channel,
    pending: false,
    iso_currency_code: "USD",
    date: today,
    location: null,
  };
}
