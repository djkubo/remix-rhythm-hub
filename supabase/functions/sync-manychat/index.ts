import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const LeadSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().min(5).max(30),
  country_code: z.string().max(10).nullable(),
  country_name: z.string().max(100).nullable(),
  source: z.string().max(50).nullable(),
  tags: z.array(z.string().max(50)).max(20).nullable(),
});

type LeadData = z.infer<typeof LeadSchema>;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MANYCHAT_API_KEY = Deno.env.get('MANYCHAT_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!MANYCHAT_API_KEY) {
      console.error('MANYCHAT_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'ManyChat API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate request body
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate lead data with Zod
    const parseResult = LeadSchema.safeParse(body.lead);
    if (!parseResult.success) {
      console.error('Validation failed:', parseResult.error.issues);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid lead data', 
          details: parseResult.error.issues 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lead: LeadData = parseResult.data;

    // Verify lead exists in database (prevents arbitrary data injection)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { data: dbLead, error: leadError } = await supabase
      .from('leads')
      .select('id, email')
      .eq('id', lead.id)
      .single();

    if (leadError || !dbLead) {
      console.error('Lead not found in database:', lead.id);
      return new Response(
        JSON.stringify({ error: 'Lead not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify email matches (extra security)
    if (dbLead.email.toLowerCase() !== lead.email.toLowerCase()) {
      console.error('Email mismatch for lead:', lead.id);
      return new Response(
        JSON.stringify({ error: 'Invalid lead data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing verified lead for ManyChat:', { id: lead.id, email: lead.email });

    // Parse name into first and last name
    const nameParts = lead.name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Format phone number with country code (remove leading zeros)
    const cleanPhone = lead.phone.replace(/^0+/, '').replace(/\s+/g, '').replace(/-/g, '');
    const fullPhone = lead.country_code 
      ? `${lead.country_code}${cleanPhone}` 
      : cleanPhone;

    console.log('Creating subscriber with phone:', fullPhone);

    // ============================================
    // 1. CREATE SUBSCRIBER IN MANYCHAT
    // ============================================
    const createResponse = await fetch('https://api.manychat.com/fb/subscriber/createSubscriber', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MANYCHAT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        phone: fullPhone,
        whatsapp_phone: fullPhone,
        email: lead.email,
        has_opt_in_sms: true,
        has_opt_in_email: true,
        consent_phrase: "Opted in via website exit intent popup for free demos",
      }),
    });

    const createData = await createResponse.json();
    console.log('ManyChat createSubscriber response:', JSON.stringify(createData));

    let subscriberId: string | null = null;

    if (createData.status === 'success' && createData.data?.id) {
      subscriberId = String(createData.data.id);
      console.log('Subscriber created with ID:', subscriberId);

      // Set custom fields
      const customFields = [
        { field_name: 'country', field_value: lead.country_name || 'Unknown' },
        { field_name: 'lead_source', field_value: lead.source || 'exit_intent' },
        { field_name: 'phone_country_code', field_value: lead.country_code || '' },
        { field_name: 'full_name', field_value: lead.name },
        { field_name: 'signup_date', field_value: new Date().toISOString().split('T')[0] },
      ];

      for (const field of customFields) {
        try {
          await fetch('https://api.manychat.com/fb/subscriber/setCustomField', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${MANYCHAT_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              subscriber_id: subscriberId,
              field_name: field.field_name,
              field_value: field.field_value,
            }),
          });
        } catch (fieldError) {
          console.error(`Failed to set field "${field.field_name}":`, fieldError);
        }
      }

      // Add tags
      const defaultTags = ['exit_intent', 'demo_request', 'website_lead', 'dj_prospect', 'free_demos'];
      const allTags = [...defaultTags, ...(lead.tags || [])];

      for (const tag of allTags) {
        try {
          await fetch('https://api.manychat.com/fb/subscriber/addTag', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${MANYCHAT_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              subscriber_id: subscriberId,
              tag_name: tag,
            }),
          });
        } catch (tagError) {
          console.error(`Failed to add tag "${tag}":`, tagError);
        }
      }

      // Set opt-in status
      try {
        await fetch('https://api.manychat.com/fb/subscriber/setSmsOptIn', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${MANYCHAT_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscriber_id: subscriberId,
            sms_opt_in: true,
            sms_phone: fullPhone,
          }),
        });
      } catch (err) {
        console.error('Failed to set SMS opt-in:', err);
      }

      try {
        await fetch('https://api.manychat.com/fb/subscriber/setEmailOptIn', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${MANYCHAT_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscriber_id: subscriberId,
            email_opt_in: true,
            email: lead.email,
          }),
        });
      } catch (err) {
        console.error('Failed to set Email opt-in:', err);
      }

    } else {
      console.error('ManyChat API error:', createData);
      
      // Try to find existing subscriber
      if (createData.status === 'error') {
        try {
          const findResponse = await fetch('https://api.manychat.com/fb/subscriber/findBySystemField', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${MANYCHAT_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ phone: fullPhone }),
          });
          const findData = await findResponse.json();
          
          if (findData.status === 'success' && findData.data?.id) {
            subscriberId = String(findData.data.id);
            console.log('Found existing subscriber:', subscriberId);
          }
        } catch (findErr) {
          console.error('Failed to find subscriber:', findErr);
        }
      }
    }

    // Update lead in database
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        manychat_synced: subscriberId !== null,
        manychat_subscriber_id: subscriberId,
      })
      .eq('id', lead.id);

    if (updateError) {
      console.error('Failed to update lead sync status:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        manychat_subscriber_id: subscriberId,
        synced: subscriberId !== null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync-manychat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
