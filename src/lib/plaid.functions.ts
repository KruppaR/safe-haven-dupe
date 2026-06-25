import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  getMockInstitutions,
  createMockAccounts,
  generateInitialTransactions,
  generateSyncTransactions,
  generateSingleSuspiciousTransaction,
} from "./plaid/mock";
import { analyzeTransaction, upsertKnownPayee } from "./transactions/rules";

const ConnectBankInput = z.object({
  elder_id: z.string().uuid(),
  institution_name: z.string().min(1).max(60),
});

const ElderIdInput = z.object({ elder_id: z.string().uuid() });

export const getInstitutions = createServerFn({ method: "GET" }).handler(() => {
  return { institutions: getMockInstitutions() };
});

export const connectMockBank = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ConnectBankInput.parse(d))
  .handler(async ({ data, context }) => {
    const institution = getMockInstitutions().find((i) => i.name === data.institution_name);
    if (!institution) throw new Error("Invalid institution");

    const { data: elder, error: elderErr } = await context.supabase
      .from("elders")
      .select("id, display_name")
      .eq("id", data.elder_id)
      .eq("caregiver_id", context.userId)
      .single();
    if (elderErr || !elder) throw new Error(elderErr?.message ?? "Elder not found");

    const { data: item, error: itemErr } = await context.supabase
      .from("plaid_items")
      .insert({
        elder_id: data.elder_id,
        caregiver_id: context.userId,
        plaid_item_id: `mock-item-${crypto.randomUUID()}`,
        institution_name: institution.name,
        institution_id: institution.id,
        plaid_access_token: "mock-token",
        status: "active",
      })
      .select()
      .single();
    if (itemErr || !item) throw new Error(itemErr?.message ?? "Failed to create plaid item");

    const mockAccounts = createMockAccounts(institution.name);
    const accountRows = mockAccounts.map((a) => ({
      plaid_item_id: item.id,
      elder_id: data.elder_id,
      plaid_account_id: a.plaid_account_id,
      name: a.name,
      official_name: a.official_name,
      subtype: a.subtype,
      mask: a.mask,
      current_balance: a.current_balance,
      available_balance: a.available_balance,
      currency: a.currency,
    }));

    const { data: accounts, error: acctErr } = await context.supabase
      .from("accounts")
      .insert(accountRows)
      .select();
    if (acctErr) throw new Error(acctErr.message);

    const checking = accounts?.find((a) => a.subtype === "checking");
    if (checking) {
      const txns = generateInitialTransactions(checking.id, data.elder_id);
      const txnRows = txns.map((t) => ({
        account_id: checking.id,
        elder_id: data.elder_id,
        plaid_transaction_id: t.plaid_transaction_id,
        amount: t.amount,
        name: t.name,
        merchant_name: t.merchant_name,
        category: t.category,
        payment_channel: t.payment_channel,
        pending: t.pending,
        iso_currency_code: t.iso_currency_code,
        date: t.date,
      }));

      const { data: insertedTxns, error: txnErr } = await context.supabase
        .from("transactions")
        .insert(txnRows)
        .select();
      if (txnErr) throw new Error(txnErr.message);

      for (const t of insertedTxns ?? []) {
        await upsertKnownPayee(context.supabase, data.elder_id, t.name, t.date);
      }

      const recent = (insertedTxns ?? []).filter((t) => {
        const daysDiff = (Date.now() - new Date(t.date).getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 14;
      });

      for (const t of recent) {
        const alert = await analyzeTransaction(context.supabase, t, elder.display_name);
        if (alert) {
          await context.supabase.from("alerts").insert({
            elder_id: data.elder_id,
            severity: alert.severity,
            category: "suspicious_transaction",
            title: alert.title,
            detail: alert.detail,
            source_excerpt: alert.sourceExcerpt,
            suggested_action: alert.suggestedAction,
          });
        }
      }
    }

    await context.supabase
      .from("monitors")
      .update({ status: "active" })
      .eq("elder_id", data.elder_id)
      .eq("kind", "financial");

    return { item, accounts: accounts ?? [] };
  });

export const getElderFinancialData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ElderIdInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: items, error: itemErr } = await context.supabase
      .from("plaid_items")
      .select("id, institution_name, status, created_at")
      .eq("elder_id", data.elder_id)
      .eq("caregiver_id", context.userId);
    if (itemErr) throw new Error(itemErr.message);

    if (!items || items.length === 0) {
      return { connected: false, accounts: [], transactions: [] };
    }

    const itemIds = items.map((i) => i.id);

    const [{ data: accounts }, { data: transactions }] = await Promise.all([
      context.supabase
        .from("accounts")
        .select("id, name, official_name, subtype, mask, current_balance, available_balance, currency, plaid_item_id")
        .in("plaid_item_id", itemIds)
        .order("created_at", { ascending: true }),
      context.supabase
        .from("transactions")
        .select("id, account_id, amount, name, merchant_name, category, payment_channel, date")
        .eq("elder_id", data.elder_id)
        .order("date", { ascending: false })
        .limit(50),
    ]);

    return {
      connected: true,
      accounts: accounts ?? [],
      transactions: transactions ?? [],
    };
  });

export const syncMockTransactions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ElderIdInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: elder } = await context.supabase
      .from("elders")
      .select("id, display_name")
      .eq("id", data.elder_id)
      .eq("caregiver_id", context.userId)
      .single();
    if (!elder) throw new Error("Elder not found");

    const { data: accounts } = await context.supabase
      .from("accounts")
      .select("id")
      .eq("elder_id", data.elder_id);
    if (!accounts || accounts.length === 0) return { synced: 0, alerts: 0 };

    const checking = accounts.find((a) => a.id);
    if (!checking) return { synced: 0, alerts: 0 };

    const newTxns = generateSyncTransactions(checking.id, data.elder_id);
    const txnRows = newTxns.map((t) => ({
      account_id: checking.id,
      elder_id: data.elder_id,
      plaid_transaction_id: t.plaid_transaction_id,
      amount: t.amount,
      name: t.name,
      merchant_name: t.merchant_name,
      category: t.category,
      payment_channel: t.payment_channel,
      pending: t.pending,
      iso_currency_code: t.iso_currency_code,
      date: t.date,
    }));

    const { data: inserted } = await context.supabase
      .from("transactions")
      .insert(txnRows)
      .select();
    if (!inserted) return { synced: 0, alerts: 0 };

    let alertCount = 0;
    for (const t of inserted) {
      await upsertKnownPayee(context.supabase, data.elder_id, t.name, t.date);
      const alert = await analyzeTransaction(context.supabase, t, elder.display_name);
      if (alert) {
        await context.supabase.from("alerts").insert({
          elder_id: data.elder_id,
          severity: alert.severity,
          category: "suspicious_transaction",
          title: alert.title,
          detail: alert.detail,
          source_excerpt: alert.sourceExcerpt,
          suggested_action: alert.suggestedAction,
        });
        alertCount++;
      }
    }

    return { synced: inserted.length, alerts: alertCount };
  });

export const simulateSuspiciousTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ElderIdInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: elder } = await context.supabase
      .from("elders")
      .select("id, display_name")
      .eq("id", data.elder_id)
      .eq("caregiver_id", context.userId)
      .single();
    if (!elder) throw new Error("Elder not found");

    const { data: accounts } = await context.supabase
      .from("accounts")
      .select("id")
      .eq("elder_id", data.elder_id);
    if (!accounts || accounts.length === 0) throw new Error("No connected accounts. Connect a bank first.");

    const account = accounts[0];
    const txn = generateSingleSuspiciousTransaction(account.id, data.elder_id);

    const { data: inserted } = await context.supabase
      .from("transactions")
      .insert({
        account_id: account.id,
        elder_id: data.elder_id,
        plaid_transaction_id: txn.plaid_transaction_id,
        amount: txn.amount,
        name: txn.name,
        merchant_name: txn.merchant_name,
        category: txn.category,
        payment_channel: txn.payment_channel,
        pending: txn.pending,
        iso_currency_code: txn.iso_currency_code,
        date: txn.date,
      })
      .select()
      .single();
    if (!inserted) throw new Error("Failed to insert transaction");

    await upsertKnownPayee(context.supabase, data.elder_id, inserted.name, inserted.date);

    const alert = await analyzeTransaction(context.supabase, inserted, elder.display_name);
    if (alert) {
      const { data: alertRow } = await context.supabase
        .from("alerts")
        .insert({
          elder_id: data.elder_id,
          severity: alert.severity,
          category: "suspicious_transaction",
          title: alert.title,
          detail: alert.detail,
          source_excerpt: alert.sourceExcerpt,
          suggested_action: alert.suggestedAction,
        })
        .select()
        .single();
      return { transaction: inserted, alert: alertRow ?? null };
    }

    return { transaction: inserted, alert: null };
  });
