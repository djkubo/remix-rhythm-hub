import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ManyChatResponse {
  status: string;
  data?: unknown;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ============================================
    // AUTHENTICATION: Require admin role
    // ============================================
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No token provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create client with user's token to verify auth
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getUser(token);
    
    if (claimsError || !claimsData?.user) {
      console.error('Auth error:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.user.id;

    // Check if user is admin using service role
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();

    if (adminError || !adminData) {
      console.error('User is not admin:', userId);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin authenticated:', userId);

    // ============================================
    // MANYCHAT SETUP (Admin only)
    // ============================================
    const MANYCHAT_API_KEY = Deno.env.get('MANYCHAT_API_KEY');

    if (!MANYCHAT_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'MANYCHAT_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: Record<string, unknown> = {
      customFields: [],
      tags: [],
      errors: [],
    };

    // Create custom fields
    const customFields = [
      { name: 'country', type: 'text', description: 'País del lead detectado automáticamente' },
      { name: 'lead_source', type: 'text', description: 'Fuente del lead (exit_intent, landing, etc)' },
      { name: 'phone_country_code', type: 'text', description: 'Código de país del teléfono' },
      { name: 'full_name', type: 'text', description: 'Nombre completo del DJ' },
      { name: 'signup_date', type: 'date', description: 'Fecha de registro' },
    ];

    console.log('Creating custom fields in ManyChat...');

    for (const field of customFields) {
      try {
        const response = await fetch('https://api.manychat.com/fb/page/createCustomField', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${MANYCHAT_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            caption: field.name,
            type: field.type,
            description: field.description,
          }),
        });

        const data: ManyChatResponse = await response.json();
        console.log(`Custom field "${field.name}" result:`, JSON.stringify(data));

        if (data.status === 'success') {
          (results.customFields as unknown[]).push({ name: field.name, status: 'created', data: data.data });
        } else {
          (results.customFields as unknown[]).push({ name: field.name, status: 'exists_or_error', data });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Error creating field "${field.name}":`, errorMessage);
        (results.errors as unknown[]).push({ type: 'custom_field', name: field.name, error: errorMessage });
      }
    }

    // Create tags
    const tags = [
      'exit_intent',
      'demo_request',
      'website_lead',
      'dj_prospect',
      'free_demos',
      'monthly_plan_interest',
      'annual_plan_interest',
      'spanish_speaker',
      'english_speaker',
    ];

    console.log('Creating tags in ManyChat...');

    for (const tagName of tags) {
      try {
        const response = await fetch('https://api.manychat.com/fb/page/createTag', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${MANYCHAT_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: tagName }),
        });

        const data: ManyChatResponse = await response.json();
        console.log(`Tag "${tagName}" result:`, JSON.stringify(data));

        if (data.status === 'success') {
          (results.tags as unknown[]).push({ name: tagName, status: 'created', data: data.data });
        } else {
          (results.tags as unknown[]).push({ name: tagName, status: 'exists_or_error', data });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Error creating tag "${tagName}":`, errorMessage);
        (results.errors as unknown[]).push({ type: 'tag', name: tagName, error: errorMessage });
      }
    }

    const summary = {
      success: true,
      message: 'ManyChat setup completed',
      customFieldsCreated: (results.customFields as unknown[]).filter((f: any) => f.status === 'created').length,
      customFieldsTotal: customFields.length,
      tagsCreated: (results.tags as unknown[]).filter((t: any) => t.status === 'created').length,
      tagsTotal: tags.length,
      errors: (results.errors as unknown[]).length,
      details: results,
    };

    console.log('Setup complete:', JSON.stringify(summary));

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in setup-manychat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
