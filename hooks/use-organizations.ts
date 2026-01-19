'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string;
  avatar_url: string;
  owner_id: string;
  plan: 'free' | 'pro' | 'enterprise';
  max_members: number;
  max_agents: number;
  max_swarms: number;
  settings: any;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions: any;
  invited_by: string;
  joined_at: string;
  created_at: string;
  user?: {
    email: string;
    full_name: string;
  };
}

export interface OrganizationInvitation {
  id: string;
  organization_id: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  invited_by: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface OrganizationUsage {
  agents_count: number;
  swarms_count: number;
  messages_count: number;
  tokens_used: number;
  total_cost: number;
}

export function useOrganizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setOrganizations([]);
        setLoading(false);
        return;
      }

      const { data: memberships, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      if (!memberships || memberships.length === 0) {
        setOrganizations([]);
        setLoading(false);
        return;
      }

      const orgIds = memberships.map(m => m.organization_id);

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .in('id', orgIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrganizations(data || []);

      const savedOrgId = localStorage.getItem('currentOrganizationId');
      if (savedOrgId && data?.find(org => org.id === savedOrgId)) {
        setCurrentOrganization(data.find(org => org.id === savedOrgId) || data[0]);
      } else if (data && data.length > 0) {
        setCurrentOrganization(data[0]);
        localStorage.setItem('currentOrganizationId', data[0].id);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast.error('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  }, []);

  const createOrganization = async (data: {
    name: string;
    slug: string;
    description?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: org, error } = await supabase
        .from('organizations')
        .insert({
          name: data.name,
          slug: data.slug,
          description: data.description || '',
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Organization created successfully');
      fetchOrganizations();
      return org;
    } catch (error: any) {
      console.error('Error creating organization:', error);
      if (error.code === '23505') {
        toast.error('This organization name is already taken');
      } else {
        toast.error('Failed to create organization');
      }
      throw error;
    }
  };

  const updateOrganization = async (
    organizationId: string,
    updates: Partial<Organization>
  ) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', organizationId);

      if (error) throw error;

      toast.success('Organization updated successfully');
      fetchOrganizations();
    } catch (error) {
      console.error('Error updating organization:', error);
      toast.error('Failed to update organization');
      throw error;
    }
  };

  const deleteOrganization = async (organizationId: string) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', organizationId);

      if (error) throw error;

      toast.success('Organization deleted successfully');
      fetchOrganizations();
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast.error('Failed to delete organization');
      throw error;
    }
  };

  const switchOrganization = (organization: Organization) => {
    setCurrentOrganization(organization);
    localStorage.setItem('currentOrganizationId', organization.id);
    toast.success(`Switched to ${organization.name}`);
  };

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  return {
    organizations,
    currentOrganization,
    loading,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    switchOrganization,
    refetch: fetchOrganizations,
  };
}

export function useOrganizationMembers(organizationId: string) {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    if (!organizationId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          *,
          user:user_id (
            email,
            raw_user_meta_data
          )
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedMembers = data?.map((member: any) => ({
        ...member,
        user: {
          email: member.user?.email || '',
          full_name: member.user?.raw_user_meta_data?.full_name || member.user?.email || 'Unknown',
        },
      })) || [];

      setMembers(formattedMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  const updateMemberRole = async (memberId: string, role: OrganizationMember['role']) => {
    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ role })
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Member role updated');
      fetchMembers();
    } catch (error) {
      console.error('Error updating member role:', error);
      toast.error('Failed to update member role');
      throw error;
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Member removed');
      fetchMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
      throw error;
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return {
    members,
    loading,
    updateMemberRole,
    removeMember,
    refetch: fetchMembers,
  };
}

export function useOrganizationInvitations(organizationId: string) {
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvitations = useCallback(async () => {
    if (!organizationId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('organization_invitations')
        .select('*')
        .eq('organization_id', organizationId)
        .is('accepted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  const createInvitation = async (email: string, role: OrganizationInvitation['role']) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const token = crypto.randomUUID();

      const { error } = await supabase
        .from('organization_invitations')
        .insert({
          organization_id: organizationId,
          email,
          role,
          invited_by: user.id,
          token,
        });

      if (error) throw error;

      toast.success(`Invitation sent to ${email}`);
      fetchInvitations();
    } catch (error) {
      console.error('Error creating invitation:', error);
      toast.error('Failed to send invitation');
      throw error;
    }
  };

  const deleteInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('organization_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      toast.success('Invitation cancelled');
      fetchInvitations();
    } catch (error) {
      console.error('Error deleting invitation:', error);
      toast.error('Failed to cancel invitation');
      throw error;
    }
  };

  const acceptInvitation = async (token: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: invitation, error: invError } = await supabase
        .from('organization_invitations')
        .select('*')
        .eq('token', token)
        .is('accepted_at', null)
        .single();

      if (invError || !invitation) {
        toast.error('Invalid or expired invitation');
        throw new Error('Invalid invitation');
      }

      if (new Date(invitation.expires_at) < new Date()) {
        toast.error('This invitation has expired');
        throw new Error('Expired invitation');
      }

      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: invitation.organization_id,
          user_id: user.id,
          role: invitation.role,
          invited_by: invitation.invited_by,
        });

      if (memberError) throw memberError;

      const { error: updateError } = await supabase
        .from('organization_invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitation.id);

      if (updateError) throw updateError;

      toast.success('Invitation accepted!');
      return invitation.organization_id;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to accept invitation');
      throw error;
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  return {
    invitations,
    loading,
    createInvitation,
    deleteInvitation,
    acceptInvitation,
    refetch: fetchInvitations,
  };
}

export function useOrganizationUsage(organizationId: string) {
  const [usage, setUsage] = useState<OrganizationUsage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      if (!organizationId) return;

      setLoading(true);
      try {
        const { data: agentsData } = await supabase
          .from('agents')
          .select('id', { count: 'exact' })
          .eq('organization_id', organizationId);

        const { data: swarmsData } = await supabase
          .from('swarms')
          .select('id', { count: 'exact' })
          .eq('organization_id', organizationId);

        setUsage({
          agents_count: agentsData?.length || 0,
          swarms_count: swarmsData?.length || 0,
          messages_count: 0,
          tokens_used: 0,
          total_cost: 0,
        });
      } catch (error) {
        console.error('Error fetching usage:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, [organizationId]);

  return { usage, loading };
}
