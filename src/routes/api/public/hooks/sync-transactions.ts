import { createFileRoute } from "@tanstack/react-router";
import { generateSyncTransactions } from "@/lib/plaid/mock";
import { analyzeTransaction, upsertKnownPayee } from "@/lib/transactions/rules";

export const Route = createFileRoute("/api/public/hooks/sync-transactions")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = request.headers.get("apikey");
        const expectedKey = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        if (!apiKey || apiKey !== expectedKey) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: items, error: itemsErr } = await supabaseAdmin
          .from("plaid_items")
          .select("id, elder_id, status")
          .eq("status", "active");

        if (itemsErr) {
          console.error("sync-transactions: failed to fetch plaid_items", itemsErr);
          return new Response(JSON.stringify({ error: itemsErr.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        let totalSynced = 0;
        let totalAlerts = 0;

        for (const item of items ?? []) {
          const { data: accounts } = await supabaseAdmin
            .from("accounts")
            .select("id, elder_id")
            .eq("plaid_item_id", item.id);

          if (!accounts || accounts.length === 0) continue;

          const account = accounts[0];

          const { data: elder } = await supabaseAdmin
            .from("elders")
            .select("id, display_name")
            .eq("id", item.elder_id)
            .single();

          const newTxns = generateSyncTransactions(account.id, item.elder_id);
          const txnRows = newTxns.map((t) => ({
            account_id: account.id,
            elder_id: item.elder_id,
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

          const { data: inserted } = await supabaseAdmin
            .from("transactions")
            .insert(txnRows)
            .select();

          if (!inserted) continue;

          totalSynced += inserted.length;

          for (const t of inserted) {
            await upsertKnownPayee(supabaseAdmin as any, item.elder_id, t.name, t.date);
            if (elder) {
              const alert = await analyzeTransaction(supabaseAdmin as any, t, elder.display_name);
              if (alert) {
                await supabaseAdmin.from("alerts").insert({
                  elder_id: item.elder_id,
                  severity: alert.severity,
                  category: "suspicious_transaction",
                  title: alert.title,
                  detail: alert.detail,
                  source_excerpt: alert.sourceExcerpt,
                  suggested_action: alert.suggestedAction,
                });
                totalAlerts++;
              }
            }
          }
        }

        return Response.json({
          success: true,
          synced: totalSynced,
          alerts: totalAlerts,
          timestamp: new Date().toISOString(),
        });
      },
    },
  },
});
