/**
 * Centralized lead creation utility.
 *
 * Consolidates the duplicated insert logic from ExitIntentPopup,
 * LeadCaptureModal, and any future lead-capture surface into one
 * place so tags, consent handling, and the ManyChat sync always
 * behave identically.
 */

import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";

/* ─── types ─── */

export interface CreateLeadParams {
    /** Pre-generated UUID (crypto.randomUUID). */
    leadId: string;
    name: string;
    email: string;
    phone: string;

    /** Where this lead came from, e.g. "exit_intent", "usb_500gb_modal". */
    source: string;
    /** Current pathname, e.g. window.location.pathname. */
    sourcePage?: string;
    /** Product slug if applicable. */
    product?: string;
    /** Funnel step label, e.g. "pre_checkout". */
    funnelStep?: string;
    /** Arbitrary tags merged into the record. */
    tags?: string[];

    /* ── country ── */
    countryCode?: string;
    countryName?: string;

    /* ── consent ── */
    consentTransactional?: boolean;
    consentMarketing?: boolean;
}

/* ─── public API ─── */

/**
 * Insert a lead into Supabase and fire a best-effort ManyChat sync.
 *
 * If the DB lacks the optional consent columns (migration not applied),
 * it automatically retries without them so the lead is never lost.
 */
export async function createLead(params: CreateLeadParams): Promise<string> {
    const now = new Date().toISOString();

    const baseLead: TablesInsert<"leads"> = {
        id: params.leadId,
        name: params.name.trim(),
        email: params.email.trim().toLowerCase(),
        phone: params.phone.trim().replace(/\s+/g, ""),
        source: params.source,
        source_page: params.sourcePage ?? window.location.pathname,
        intent_plan: params.product ?? null,
        funnel_step: params.funnelStep ?? null,
        tags: params.tags ?? [params.source],
        country_code: params.countryCode ?? null,
        country_name: params.countryName ?? null,
    };

    const leadWithConsent: TablesInsert<"leads"> = {
        ...baseLead,
        consent_transactional: params.consentTransactional ?? false,
        consent_transactional_at: params.consentTransactional ? now : null,
        consent_marketing: params.consentMarketing ?? false,
        consent_marketing_at: params.consentMarketing ? now : null,
    };

    // Try with consent fields first; fall back if columns don't exist yet.
    let { error: insertError } = await supabase.from("leads").insert(leadWithConsent);

    if (insertError && /consent_(transactional|marketing)/i.test(insertError.message)) {
        if (import.meta.env.DEV) {
            console.warn("[leads] Consent columns missing. Retrying insert without consent fields.");
        }
        ({ error: insertError } = await supabase.from("leads").insert(baseLead));
    }

    if (insertError) throw insertError;

    // Best-effort ManyChat sync (fire-and-forget).
    supabase.functions.invoke("sync-manychat", { body: { leadId: params.leadId } }).catch(() => {
        // ignore – the lead is already saved
    });

    return params.leadId;
}
