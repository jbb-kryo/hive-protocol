import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createLogger, logRequestStart } from "../_shared/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  const logger = createLogger("delete-account", req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  logRequestStart(logger);

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { password, confirmText } = await req.json();

    if (!password || typeof password !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Password is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (confirmText !== 'DELETE') {
      return new Response(
        JSON.stringify({ error: 'Please type DELETE to confirm' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: user.email!,
      password: password,
    });

    if (signInError) {
      return new Response(
        JSON.stringify({ error: 'Invalid password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: userSwarms } = await supabaseAdmin
      .from('swarms')
      .select('id')
      .eq('user_id', user.id);

    if (userSwarms && userSwarms.length > 0) {
      const swarmIds = userSwarms.map(s => s.id);
      
      await supabaseAdmin
        .from('messages')
        .delete()
        .in('swarm_id', swarmIds);

      await supabaseAdmin
        .from('context_blocks')
        .delete()
        .in('swarm_id', swarmIds);

      await supabaseAdmin
        .from('swarm_agents')
        .delete()
        .in('swarm_id', swarmIds);

      await supabaseAdmin
        .from('message_flags')
        .delete()
        .in('swarm_id', swarmIds);

      await supabaseAdmin
        .from('swarm_shares')
        .delete()
        .in('swarm_id', swarmIds);
    }

    await supabaseAdmin
      .from('swarms')
      .delete()
      .eq('user_id', user.id);

    await supabaseAdmin
      .from('agents')
      .delete()
      .eq('user_id', user.id);

    await supabaseAdmin
      .from('integrations')
      .delete()
      .eq('user_id', user.id);

    await supabaseAdmin
      .from('user_integrations')
      .delete()
      .eq('user_id', user.id);

    await supabaseAdmin
      .from('user_tools')
      .delete()
      .eq('user_id', user.id);

    await supabaseAdmin
      .from('webhooks')
      .delete()
      .eq('user_id', user.id);

    await supabaseAdmin
      .from('activity_log')
      .delete()
      .eq('user_id', user.id);

    await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', user.id);

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      logger.error('Failed to delete auth user', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete account. Please contact support.', request_id: logger.getRequestId() }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-Id': logger.getRequestId() } }
      );
    }

    logger.info('Account deleted successfully', { user_id: user.id });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Your account has been permanently deleted.',
        request_id: logger.getRequestId(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-Id': logger.getRequestId() } }
    );

  } catch (error) {
    logger.error('Account deletion failed', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred. Please try again.', request_id: logger.getRequestId() }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-Id': logger.getRequestId() } }
    );
  }
});