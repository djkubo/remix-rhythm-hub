import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeadData {
  id: string;
  name: string;
  email: string;
  phone: string;
  country_code: string | null;
  country_name: string | null;
  source: string | null;
  tags: string[] | null;
}

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

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const lead: LeadData = body.lead;

    if (!lead) {
      return new Response(
        JSON.stringify({ error: 'Lead data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing lead for ManyChat:', { email: lead.email, phone: lead.phone });

    // Parse name into first and last name
    const nameParts = lead.name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Format phone number with country code (remove leading zeros)
    const cleanPhone = lead.phone.replace(/^0+/, '').replace(/\s+/g, '').replace(/-/g, '');
    const fullPhone = lead.country_code 
      ? `${lead.country_code}${cleanPhone}` 
      : cleanPhone;

    console.log('Creating subscriber with phone:', fullPhone, 'email:', lead.email);

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
        whatsapp_phone: fullPhone, // WhatsApp number
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

      // ============================================
      // 2. SET ALL CUSTOM FIELDS
      // ============================================
      const customFields = [
        { field_name: 'country', field_value: lead.country_name || 'Unknown' },
        { field_name: 'lead_source', field_value: lead.source || 'exit_intent' },
        { field_name: 'phone_country_code', field_value: lead.country_code || '' },
        { field_name: 'full_name', field_value: lead.name },
        { field_name: 'signup_date', field_value: new Date().toISOString().split('T')[0] }, // YYYY-MM-DD format
      ];

      console.log('Setting custom fields for subscriber:', subscriberId);

      for (const field of customFields) {
        try {
          const fieldResponse = await fetch('https://api.manychat.com/fb/subscriber/setCustomField', {
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
          const fieldData = await fieldResponse.json();
          console.log(`Field "${field.field_name}" set:`, fieldData.status);
        } catch (fieldError) {
          console.error(`Failed to set field "${field.field_name}":`, fieldError);
        }
      }

      // ============================================
      // 3. SET SYSTEM FIELDS (Email & Phone directly)
      // ============================================
      // Set email system field
      try {
        const emailResponse = await fetch('https://api.manychat.com/fb/subscriber/setCustomField', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${MANYCHAT_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscriber_id: subscriberId,
            field_name: 'email',
            field_value: lead.email,
          }),
        });
        const emailData = await emailResponse.json();
        console.log('Email system field set:', emailData.status);
      } catch (err) {
        console.error('Failed to set email:', err);
      }

      // Set phone system field
      try {
        const phoneResponse = await fetch('https://api.manychat.com/fb/subscriber/setCustomField', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${MANYCHAT_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscriber_id: subscriberId,
            field_name: 'phone',
            field_value: fullPhone,
          }),
        });
        const phoneData = await phoneResponse.json();
        console.log('Phone system field set:', phoneData.status);
      } catch (err) {
        console.error('Failed to set phone:', err);
      }

      // ============================================
      // 4. ADD ALL TAGS
      // ============================================
      const defaultTags = ['exit_intent', 'demo_request', 'website_lead', 'dj_prospect', 'free_demos'];
      const allTags = [...defaultTags, ...(lead.tags || [])];

      console.log('Adding tags to subscriber:', allTags);

      for (const tag of allTags) {
        try {
          const tagResponse = await fetch('https://api.manychat.com/fb/subscriber/addTag', {
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
          const tagData = await tagResponse.json();
          console.log(`Tag "${tag}" added:`, tagData.status);
        } catch (tagError) {
          console.error(`Failed to add tag "${tag}":`, tagError);
        }
      }

      // ============================================
      // 5. SET OPT-IN STATUS EXPLICITLY
      // ============================================
      try {
        // Set SMS opt-in
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
        console.log('SMS opt-in set');
      } catch (err) {
        console.error('Failed to set SMS opt-in:', err);
      }

      try {
        // Set Email opt-in
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
        console.log('Email opt-in set');
      } catch (err) {
        console.error('Failed to set Email opt-in:', err);
      }

    } else {
      console.error('ManyChat API error:', createData);
      
      // Try to find existing subscriber by phone or email
      if (createData.status === 'error') {
        console.log('Attempting to find existing subscriber...');
        
        try {
          const findResponse = await fetch('https://api.manychat.com/fb/subscriber/findBySystemField', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${MANYCHAT_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              phone: fullPhone,
            }),
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

    // ============================================
    // 6. UPDATE LEAD IN DATABASE
    // ============================================
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        manychat_synced: subscriberId !== null,
        manychat_subscriber_id: subscriberId,
      })
      .eq('id', lead.id);

    if (updateError) {
      console.error('Failed to update lead sync status:', updateError);
    } else {
      console.log('Lead updated in database with ManyChat subscriber ID:', subscriberId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        manychat_subscriber_id: subscriberId,
        synced: subscriberId !== null,
        phone_used: fullPhone,
        email_used: lead.email,
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
