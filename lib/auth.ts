import { supabase, Profile } from './supabase'

export const CURRENT_TOS_VERSION = '2026-01-01'
export const CURRENT_PRIVACY_VERSION = '2026-01-01'

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  emailVerificationEnabled = false,
  tosAccepted = false
) {
  if (!tosAccepted) {
    throw new Error('You must accept the Terms of Service and Privacy Policy to create an account')
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: emailVerificationEnabled ? `${typeof window !== 'undefined' ? window.location.origin : ''}/verify-email` : undefined,
      data: {
        full_name: fullName,
      }
    }
  })

  if (error) throw error

  if (data.user) {
    const now = new Date().toISOString()
    await supabase.from('profiles').insert({
      id: data.user.id,
      full_name: fullName,
      tos_accepted_at: now,
      tos_version: CURRENT_TOS_VERSION,
      privacy_accepted_at: now,
      privacy_version: CURRENT_PRIVACY_VERSION,
    })
  }

  return data
}

export async function acceptTermsOfService() {
  const session = await getSession()
  if (!session) throw new Error('Not authenticated')

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('profiles')
    .update({
      tos_accepted_at: now,
      tos_version: CURRENT_TOS_VERSION,
      privacy_accepted_at: now,
      privacy_version: CURRENT_PRIVACY_VERSION,
    })
    .eq('id', session.user.id)
    .select()
    .maybeSingle()

  if (error) throw error
  return data
}

export async function checkTermsAcceptance(): Promise<{
  tosAccepted: boolean
  tosOutdated: boolean
  privacyOutdated: boolean
  currentTosVersion: string
  currentPrivacyVersion: string
  userTosVersion: string | null
  userPrivacyVersion: string | null
}> {
  const session = await getSession()
  if (!session) {
    return {
      tosAccepted: false,
      tosOutdated: false,
      privacyOutdated: false,
      currentTosVersion: CURRENT_TOS_VERSION,
      currentPrivacyVersion: CURRENT_PRIVACY_VERSION,
      userTosVersion: null,
      userPrivacyVersion: null,
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tos_version, privacy_version')
    .eq('id', session.user.id)
    .maybeSingle()

  const tosAccepted = !!profile?.tos_version
  const tosOutdated = profile?.tos_version !== CURRENT_TOS_VERSION
  const privacyOutdated = profile?.privacy_version !== CURRENT_PRIVACY_VERSION

  return {
    tosAccepted,
    tosOutdated: tosAccepted && tosOutdated,
    privacyOutdated: tosAccepted && privacyOutdated,
    currentTosVersion: CURRENT_TOS_VERSION,
    currentPrivacyVersion: CURRENT_PRIVACY_VERSION,
    userTosVersion: profile?.tos_version || null,
    userPrivacyVersion: profile?.privacy_version || null,
  }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function checkTwoFactorEnabled(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('totp_enabled')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) return false
  return data.totp_enabled === true
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export async function getProfile(): Promise<Profile | null> {
  const session = await getSession()
  if (!session) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function updateProfile(updates: Partial<Profile>) {
  const session = await getSession()
  if (!session) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', session.user.id)
    .select()
    .maybeSingle()

  if (error) throw error
  return data
}

export async function resetPasswordForEmail(email: string, redirectTo?: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo || `${window.location.origin}/reset-password`,
  })

  if (error) throw error
  return data
}

export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  })

  if (error) throw error
  return data
}

export async function resendVerificationEmail(email: string) {
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/verify-email`,
    }
  })

  if (error) throw error
  return data
}
