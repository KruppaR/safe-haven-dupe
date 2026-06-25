import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type AlertSeverity = "info" | "watch" | "urgent";
export type AlertCategory = "suspicious_transaction";

export interface TransactionAlert {
  severity: AlertSeverity;
  title: string;
  detail: string;
  sourceExcerpt: string;
  suggestedAction: string;
  signals: string[];
}

interface TransactionRow {
  id: string;
  elder_id: string;
  amount: number;
  name: string;
  merchant_name: string | null;
  category: unknown;
  date: string;
}

function normalizePayee(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isGiftCard(name: string): boolean {
  const n = name.toLowerCase();
  return /\bgift\s?card\b/.test(n) || /\b(apple|google|amazon|visa|steam)\s?gift\b/.test(n);
}

function isWire(name: string): boolean {
  const n = name.toLowerCase();
  return /\b(wire\s?transfer|western\s?union|moneygram)\b/.test(n);
}

function isZelle(name: string): boolean {
  return /\bzelle\b/i.test(name);
}

function isCrypto(name: string, merchant: string | null): boolean {
  const n = `${name} ${merchant ?? ""}`.toLowerCase();
  return /\b(coinbase|crypto|bitcoin|btc|binance|ethereum|usdt|kraken|gemini)\b/.test(n);
}

function isAtmWithdrawal(name: string, category: unknown): boolean {
  const n = name.toLowerCase();
  const cat = JSON.stringify(category).toLowerCase();
  return /\batm\b/.test(n) && /\b(withdrawal|transfer)\b/.test(cat);
}

function isTechSupportScam(name: string): boolean {
  const n = name.toLowerCase();
  return /\b(pc\s?help|tech\s?support|remote\s?access|norton.*renew|mcafee.*renew)\b/.test(n);
}

export async function analyzeTransaction(
  supabase: SupabaseClient<Database>,
  txn: TransactionRow,
  elderName: string,
): Promise<TransactionAlert | null> {
  const { data: known } = await supabase
    .from("known_payees")
    .select("id")
    .eq("elder_id", txn.elder_id)
    .eq("normalized_name", normalizePayee(txn.name))
    .maybeSingle();

  const isNewPayee = !known;
  const amt = txn.amount;

  if (isGiftCard(txn.name)) {
    return {
      severity: amt >= 300 ? "urgent" : "watch",
      title: `${amt >= 300 ? "Urgent:" : "Watch:"} ${amt.toLocaleString("en-US", { style: "currency", currency: "USD" })} gift card purchase`,
      detail: `${elderName} purchased gift cards at ${txn.merchant_name ?? txn.name} for ${amt.toLocaleString("en-US", { style: "currency", currency: "USD" })}. No legitimate company, agency, or family member asks to be paid in gift cards.`,
      sourceExcerpt: `${txn.name} · ${amt.toLocaleString("en-US", { style: "currency", currency: "USD" })}`,
      suggestedAction: `Call her now. Ask what the gift cards are for and who asked for them. If it's a "prize" or "tech support refund," it's a scam.`,
      signals: ["gift_card"],
    };
  }

  if (isWire(txn.name)) {
    return {
      severity: "urgent",
      title: `Wire transfer of ${amt.toLocaleString("en-US", { style: "currency", currency: "USD" })}`,
      detail: `An outbound wire to ${txn.name} was initiated. Wire transfers are irreversible and scammers' favorite payment rail.`,
      sourceExcerpt: `${txn.name} · ${amt.toLocaleString("en-US", { style: "currency", currency: "USD" })}`,
      suggestedAction: "Call her immediately. Ask if someone — a grandchild, lawyer, or officer — told her to send money urgently. If yes, contact the bank's fraud line to attempt a recall.",
      signals: ["wire_transfer"],
    };
  }

  if (isCrypto(txn.name, txn.merchant_name)) {
    return {
      severity: "urgent",
      title: `Cryptocurrency purchase: ${amt.toLocaleString("en-US", { style: "currency", currency: "USD" })}`,
      detail: `Purchase on ${txn.merchant_name ?? txn.name} for ${amt.toLocaleString("en-US", { style: "currency", currency: "USD" })}. Most elderly people do not buy cryptocurrency. This is a major red flag for investment or romance scams.`,
      sourceExcerpt: `${txn.merchant_name ?? txn.name} · ${amt.toLocaleString("en-US", { style: "currency", currency: "USD" })}`,
      suggestedAction: "Ask who told her to buy crypto. Scammers often pose as investment advisors or romantic partners. Crypto purchases are irreversible.",
      signals: ["crypto_purchase"],
    };
  }

  if (isTechSupportScam(txn.name)) {
    return {
      severity: "watch",
      title: `Suspicious software charge: ${txn.name}`,
      detail: `Charge from ${txn.name} for ${amt.toLocaleString("en-US", { style: "currency", currency: "USD" })}. This matches a known tech-support or fake-renewal scam pattern.`,
      sourceExcerpt: `${txn.name} · ${amt.toLocaleString("en-US", { style: "currency", currency: "USD" })}`,
      suggestedAction: "Ask if she clicked a pop-up that said her computer was infected. Real antivirus companies don't demand payment via pop-up. Call the real company's number from their official website to verify.",
      signals: ["tech_support_scam"],
    };
  }

  if (isZelle(txn.name)) {
    return {
      severity: amt >= 500 ? "urgent" : "watch",
      title: `Zelle payment of ${amt.toLocaleString("en-US", { style: "currency", currency: "USD" })}`,
      detail: `Zelle payment sent for ${amt.toLocaleString("en-US", { style: "currency", currency: "USD" })}. Zelle is instant and irreversible. Scammers frequently impersonate banks or family members to request Zelle payments.`,
      sourceExcerpt: `${txn.name} · ${amt.toLocaleString("en-US", { style: "currency", currency: "USD" })}`,
      suggestedAction: `Ask who requested the Zelle payment. If it was a "bank fraud department" or a "grandchild in trouble," it's a scam. Call the real bank or family member on a known number.`,
      signals: ["zelle_payment"],
    };
  }

  if (isNewPayee) {
    if (amt >= 1500) {
      return {
        severity: "urgent",
        title: `Large payment to new recipient: ${amt.toLocaleString("en-US", { style: "currency", currency: "USD" })}`,
        detail: `First-time payment to ${txn.name} for ${amt.toLocaleString("en-US", { style: "currency", currency: "USD" })}. This is a new payee she's never paid before, and the amount is unusually high.`,
        sourceExcerpt: `${txn.name} · ${amt.toLocaleString("en-US", { style: "currency", currency: "USD" })}`,
        suggestedAction: "Call her now. Ask what this payment is for and who asked for it. If it involves a prize, family emergency, or urgent bill — it's likely a scam.",
        signals: ["new_payee", "large_amount"],
      };
    }
    if (amt >= 500) {
      return {
        severity: "watch",
        title: `Payment to new recipient: ${amt.toLocaleString("en-US", { style: "currency", currency: "USD" })}`,
        detail: `First-time payment to ${txn.name} for ${amt.toLocaleString("en-US", { style: "currency", currency: "USD" })}. She's never paid this merchant before.`,
        sourceExcerpt: `${txn.name} · ${amt.toLocaleString("en-US", { style: "currency", currency: "USD" })}`,
        suggestedAction: "Ask what this payment was for. If she was directed there by phone or text, verify independently before she pays again.",
        signals: ["new_payee"],
      };
    }
    return null;
  }

  if (isAtmWithdrawal(txn.name, txn.category)) {
    if (amt >= 1000) {
      return {
        severity: "urgent",
        title: `Large cash withdrawal: ${amt.toLocaleString("en-US", { style: "currency", currency: "USD" })}`,
        detail: `ATM withdrawal of ${amt.toLocaleString("en-US", { style: "currency", currency: "USD" })}. Scammers often instruct victims to withdraw cash to buy gift cards or send via wire.`,
        sourceExcerpt: `${txn.name} · ${amt.toLocaleString("en-US", { style: "currency", currency: "USD" })}`,
        suggestedAction: `Ask why she withdrew this much cash. If someone told her to "pay a fine" or "fix a computer problem" with cash — it's a scam.`,
        signals: ["large_cash_withdrawal"],
      };
    }
    if (amt >= 500) {
      return {
        severity: "watch",
        title: `Cash withdrawal: ${amt.toLocaleString("en-US", { style: "currency", currency: "USD" })}`,
        detail: `ATM withdrawal of ${amt.toLocaleString("en-US", { style: "currency", currency: "USD" })}. Verify she wasn't instructed to withdraw cash for a "payment" or "refund."`,
        sourceExcerpt: `${txn.name} · ${amt.toLocaleString("en-US", { style: "currency", currency: "USD" })}`,
        suggestedAction: "Ask what the cash was for. If someone on the phone told her to withdraw it — hang up and call the real company or family member.",
        signals: ["cash_withdrawal"],
      };
    }
  }

  return null;
}

export async function upsertKnownPayee(
  supabase: SupabaseClient<Database>,
  elderId: string,
  txnName: string,
  txnDate: string,
): Promise<void> {
  const normalized = normalizePayee(txnName);
  const { data: existing } = await supabase
    .from("known_payees")
    .select("id, transaction_count")
    .eq("elder_id", elderId)
    .eq("normalized_name", normalized)
    .single();

  if (existing) {
    await supabase
      .from("known_payees")
      .update({
        last_seen: txnDate,
        transaction_count: existing.transaction_count + 1,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("known_payees").insert({
      elder_id: elderId,
      name: txnName,
      normalized_name: normalized,
      first_seen: txnDate,
      last_seen: txnDate,
      transaction_count: 1,
    });
  }
}
