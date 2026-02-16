import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * check-abandoned-carts
 * ---------------------
 * Cron-triggered Edge Function that finds pre-checkout leads who never paid
 * and queues abandoned-cart recovery emails (+ adds ManyChat tag).
 *
 * Schedule: every 30 minutes via pg_cron or Supabase Dashboard cron.
 *
 * Logic:
 *  1. Find leads with intent_plan containing 'usb' AND paid_at IS NULL
 *  2. Only leads created between 30 min and 48 hours ago (configurable)
 *  3. Skip leads that already have an abandoned_cart email queued
 *  4. Queue recovery email via queue_email_for_lead()
 *  5. Add 'abandoned_cart' tag to ManyChat subscriber (if synced)
 *  6. Tag the lead in Supabase so we don't re-process
 */

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

// Minimum age (ms) before we consider a lead "abandoned"
const MIN_AGE_MS = 30 * 60 * 1000; // 30 minutes
// Maximum age — don't chase leads older than 48h
const MAX_AGE_MS = 48 * 60 * 60 * 1000; // 48 hours

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    if (req.method === "GET") {
        return new Response(
            JSON.stringify({ ok: true, function: "check-abandoned-carts" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        return new Response(JSON.stringify({ error: "Missing env vars" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
    });

    const now = Date.now();
    const minCreatedAt = new Date(now - MAX_AGE_MS).toISOString();
    const maxCreatedAt = new Date(now - MIN_AGE_MS).toISOString();

    try {
        // 1. Find abandoned leads
        const { data: leads, error: queryError } = await supabase
            .from("leads")
            .select("id, name, email, phone, tags, manychat_subscriber_id, source_page, created_at")
            .is("paid_at", null)
            .like("intent_plan", "%usb%")
            .gte("created_at", minCreatedAt)
            .lte("created_at", maxCreatedAt)
            .not("email", "like", "%@example.invalid")
            .limit(50);

        if (queryError) {
            console.error("[check-abandoned-carts] Query error:", queryError.message);
            return new Response(JSON.stringify({ error: "Query failed" }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if (!leads || leads.length === 0) {
            return new Response(
                JSON.stringify({ ok: true, processed: 0, message: "No abandoned carts found" }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 2. Filter out leads already tagged as abandoned_cart_emailed
        const abandonedLeads = leads.filter((lead) => {
            const tags = Array.isArray(lead.tags) ? lead.tags : [];
            return !tags.includes("abandoned_cart_emailed");
        });

        const summary = {
            found: leads.length,
            eligible: abandonedLeads.length,
            emailed: 0,
            manychat_tagged: 0,
            errors: [] as string[],
        };

        // 3. Process each abandoned lead
        for (const lead of abandonedLeads) {
            try {
                // Detect language from source page or default to es
                const lang = lead.source_page?.includes("/en") ? "en" : "es";

                // Queue abandoned cart email
                const { error: queueError } = await supabase.rpc("queue_email_for_lead", {
                    p_lead_id: lead.id,
                    p_template_key: "abandoned_cart",
                    p_subject: lang === "es"
                        ? `${lead.name}, tu USB te está esperando 🎵`
                        : `${lead.name}, your USB is waiting for you 🎵`,
                    p_lang: lang,
                    p_payload: {
                        name: lead.name,
                        checkout_url: "https://videoremixpack.com/usb500",
                        product_name: "USB 500GB",
                    },
                    p_dedupe_key: `abandoned_cart_${lead.id}`,
                });

                if (queueError) {
                    // Likely duplicate dedupe_key — already queued
                    if (queueError.message?.includes("duplicate") || queueError.message?.includes("unique")) {
                        continue; // skip, already queued
                    }
                    console.error(`[check-abandoned-carts] Queue error for ${lead.id}:`, queueError.message);
                    summary.errors.push(`queue:${lead.id}`);
                    continue;
                }

                summary.emailed++;

                // Tag lead as emailed to avoid re-processing
                const currentTags = Array.isArray(lead.tags) ? lead.tags : [];
                await supabase
                    .from("leads")
                    .update({ tags: [...currentTags, "abandoned_cart_emailed"] })
                    .eq("id", lead.id);

                // 4. Add ManyChat tag for WhatsApp follow-up (if subscriber exists)
                if (lead.manychat_subscriber_id) {
                    try {
                        await supabase.functions.invoke("sync-manychat", {
                            body: { leadId: lead.id },
                        });
                        summary.manychat_tagged++;
                    } catch {
                        // best effort
                    }
                }
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                console.error(`[check-abandoned-carts] Error processing ${lead.id}:`, msg);
                summary.errors.push(`process:${lead.id}`);
            }
        }

        console.log("[check-abandoned-carts] Summary:", JSON.stringify(summary));

        return new Response(JSON.stringify({ ok: true, summary }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[check-abandoned-carts] Unexpected error:", message);
        return new Response(JSON.stringify({ error: "Internal error" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
