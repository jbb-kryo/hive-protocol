import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createLogger, logRequestStart } from "../_shared/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function base32Encode(buffer: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  let bits = 0;
  let value = 0;

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      result += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += alphabet[(value << (5 - bits)) & 31];
  }

  return result;
}

function base32Decode(encoded: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleanedInput = encoded.toUpperCase().replace(/=+$/, '');
  
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < cleanedInput.length; i++) {
    const idx = alphabet.indexOf(cleanedInput[i]);
    if (idx === -1) continue;
    
    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(output);
}

async function generateHOTP(secret: Uint8Array, counter: number): Promise<string> {
  const counterBuffer = new ArrayBuffer(8);
  const counterView = new DataView(counterBuffer);
  counterView.setBigUint64(0, BigInt(counter), false);

  const key = await crypto.subtle.importKey(
    'raw',
    secret,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, counterBuffer);
  const signatureArray = new Uint8Array(signature);

  const offset = signatureArray[19] & 0xf;
  const code =
    ((signatureArray[offset] & 0x7f) << 24) |
    ((signatureArray[offset + 1] & 0xff) << 16) |
    ((signatureArray[offset + 2] & 0xff) << 8) |
    (signatureArray[offset + 3] & 0xff);

  return (code % 1000000).toString().padStart(6, '0');
}

async function generateTOTP(secret: string, timeStep = 30): Promise<string> {
  const secretBytes = base32Decode(secret);
  const counter = Math.floor(Date.now() / 1000 / timeStep);
  return generateHOTP(secretBytes, counter);
}

async function verifyTOTP(secret: string, token: string, window = 1): Promise<boolean> {
  const secretBytes = base32Decode(secret);
  const timeStep = 30;
  const counter = Math.floor(Date.now() / 1000 / timeStep);

  for (let i = -window; i <= window; i++) {
    const expectedToken = await generateHOTP(secretBytes, counter + i);
    if (expectedToken === token) {
      return true;
    }
  }

  return false;
}

function generateSecret(): string {
  const buffer = new Uint8Array(20);
  crypto.getRandomValues(buffer);
  return base32Encode(buffer);
}

function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const buffer = new Uint8Array(4);
    crypto.getRandomValues(buffer);
    const code = Array.from(buffer)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    codes.push(code.slice(0, 4) + '-' + code.slice(4, 8));
  }
  return codes;
}

async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code.replace('-', '').toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req: Request) => {
  const logger = createLogger("two-factor-auth", req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  logRequestStart(logger);

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    if (req.method === 'POST' && action === 'setup') {
      const secret = generateSecret();
      const backupCodes = generateBackupCodes();
      const hashedBackupCodes = await Promise.all(backupCodes.map(hashCode));

      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({
          totp_secret: secret,
          backup_codes: hashedBackupCodes,
          totp_enabled: false,
        })
        .eq('id', user.id);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: 'Failed to setup 2FA' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const issuer = 'HIVE';
      const accountName = user.email || user.id;
      const otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

      return new Response(
        JSON.stringify({
          secret,
          otpauthUrl,
          backupCodes,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST' && action === 'verify') {
      const { code } = await req.json();

      if (!code || typeof code !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Invalid code' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('totp_secret')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.totp_secret) {
        return new Response(
          JSON.stringify({ error: '2FA not setup' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const isValid = await verifyTOTP(profile.totp_secret, code.replace(/\s/g, ''));

      if (!isValid) {
        return new Response(
          JSON.stringify({ error: 'Invalid code', valid: false }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: enableError } = await supabaseClient
        .from('profiles')
        .update({
          totp_enabled: true,
          totp_verified_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (enableError) {
        return new Response(
          JSON.stringify({ error: 'Failed to enable 2FA' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ valid: true, enabled: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST' && action === 'validate') {
      const { code, userId } = await req.json();

      if (!code || typeof code !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Invalid code' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const targetUserId = userId || user.id;

      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('totp_secret, totp_enabled, backup_codes')
        .eq('id', targetUserId)
        .single();

      if (profileError || !profile) {
        return new Response(
          JSON.stringify({ error: 'Profile not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!profile.totp_enabled || !profile.totp_secret) {
        return new Response(
          JSON.stringify({ error: '2FA not enabled', valid: false }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const cleanCode = code.replace(/[\s-]/g, '');
      
      const isValidTOTP = await verifyTOTP(profile.totp_secret, cleanCode);
      
      if (isValidTOTP) {
        return new Response(
          JSON.stringify({ valid: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (profile.backup_codes && profile.backup_codes.length > 0) {
        const hashedInput = await hashCode(cleanCode);
        const backupIndex = profile.backup_codes.indexOf(hashedInput);
        
        if (backupIndex !== -1) {
          const updatedCodes = [...profile.backup_codes];
          updatedCodes.splice(backupIndex, 1);
          
          await supabaseClient
            .from('profiles')
            .update({ backup_codes: updatedCodes })
            .eq('id', targetUserId);

          return new Response(
            JSON.stringify({ valid: true, usedBackupCode: true, remainingBackupCodes: updatedCodes.length }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      return new Response(
        JSON.stringify({ valid: false, error: 'Invalid code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST' && action === 'disable') {
      const { code } = await req.json();

      if (!code || typeof code !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Code required to disable 2FA' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('totp_secret, totp_enabled')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.totp_secret || !profile?.totp_enabled) {
        return new Response(
          JSON.stringify({ error: '2FA not enabled' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const isValid = await verifyTOTP(profile.totp_secret, code.replace(/\s/g, ''));

      if (!isValid) {
        return new Response(
          JSON.stringify({ error: 'Invalid code' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: disableError } = await supabaseClient
        .from('profiles')
        .update({
          totp_secret: null,
          totp_enabled: false,
          backup_codes: null,
          totp_verified_at: null,
        })
        .eq('id', user.id);

      if (disableError) {
        return new Response(
          JSON.stringify({ error: 'Failed to disable 2FA' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ disabled: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST' && action === 'regenerate-backup') {
      const { code } = await req.json();

      if (!code || typeof code !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Code required to regenerate backup codes' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('totp_secret, totp_enabled')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.totp_secret || !profile?.totp_enabled) {
        return new Response(
          JSON.stringify({ error: '2FA not enabled' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const isValid = await verifyTOTP(profile.totp_secret, code.replace(/\s/g, ''));

      if (!isValid) {
        return new Response(
          JSON.stringify({ error: 'Invalid code' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const newBackupCodes = generateBackupCodes();
      const hashedBackupCodes = await Promise.all(newBackupCodes.map(hashCode));

      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({ backup_codes: hashedBackupCodes })
        .eq('id', user.id);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: 'Failed to regenerate backup codes' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ backupCodes: newBackupCodes }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'GET' && action === 'status') {
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('totp_enabled, totp_verified_at')
        .eq('id', user.id)
        .single();

      if (profileError) {
        return new Response(
          JSON.stringify({ error: 'Failed to get 2FA status' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          enabled: profile?.totp_enabled || false,
          verifiedAt: profile?.totp_verified_at || null,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logger.error('2FA operation failed', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', request_id: logger.getRequestId() }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-Id': logger.getRequestId() } }
    );
  }
});