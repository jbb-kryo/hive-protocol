'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  useOrganizationMembers,
  useOrganizationInvitations,
} from '@/hooks/use-organizations';
import { useStore } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Mail,
  Plus,
  MoreVertical,
  Trash2,
  Shield,
  Crown,
  Eye,
  X,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ALLOWED_PLANS = ['unlimited', 'enterprise'];

interface Organization {
  id: string;
  name: string;
  owner_id: string;
}

export default function TeamMembersPage() {
  const params = useParams();
  const router = useRouter();
  const organizationId = params.id as string;
  const { user, isDemo } = useStore();

  const userPlan = user?.plan || 'free';
  const hasAccess = isDemo || ALLOWED_PLANS.includes(userPlan);

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [loading, setLoading] = useState(true);

  const { members, updateMemberRole, removeMember, refetch: refetchMembers } =
    useOrganizationMembers(organizationId);
  const {
    invitations,
    createInvitation,
    deleteInvitation,
    refetch: refetchInvitations,
  } = useOrganizationInvitations(organizationId);

  useEffect(() => {
    const fetchOrganization = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', organizationId)
          .single();

        if (orgError || !org) {
          toast.error('Organization not found');
          router.push('/teams');
          return;
        }

        setOrganization(org);

        const { data: member } = await supabase
          .from('organization_members')
          .select('role')
          .eq('organization_id', organizationId)
          .eq('user_id', user.id)
          .single();

        setCurrentUserRole(member?.role || '');
      } catch (error) {
        console.error('Error fetching organization:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [organizationId, router]);

  const handleInvite = async () => {
    if (!inviteEmail) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      await createInvitation(inviteEmail, inviteRole);
      setInviteEmail('');
      setInviteDialogOpen(false);
      refetchInvitations();
    } catch (error) {
      console.error('Error inviting member:', error);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      await updateMemberRole(memberId, newRole as any);
      refetchMembers();
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeMember(memberId);
      refetchMembers();
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'viewer':
        return <Eye className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      owner: 'default',
      admin: 'secondary',
      member: 'outline',
      viewer: 'outline',
    };
    return (
      <Badge variant={variants[role] || 'outline'} className="gap-1">
        {getRoleIcon(role)}
        {role}
      </Badge>
    );
  };

  const canManageMembers = ['owner', 'admin'].includes(currentUserRole);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-2xl mx-auto text-center py-16"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Upgrade to Access Teams</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Teams collaboration is available on Unlimited and Enterprise plans.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/pricing">
                View Plans
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/teams">
                Back to Teams
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!organization) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            variant="ghost"
            onClick={() => router.push('/teams')}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Teams
          </Button>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">{organization.name} Members</h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage team members and invitations
              </p>
            </div>
            {canManageMembers && (
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                      Send an invitation to join your organization
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="colleague@company.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={inviteRole}
                        onValueChange={(value: any) => setInviteRole(value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                        {inviteRole === 'admin' &&
                          'Admins can manage members and organization settings'}
                        {inviteRole === 'member' &&
                          'Members can create and edit agents and swarms'}
                        {inviteRole === 'viewer' && 'Viewers can only view agents and swarms'}
                      </p>
                    </div>
                    <Button onClick={handleInvite} className="w-full gap-2">
                      <Mail className="h-4 w-4" />
                      Send Invitation
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Members ({members.length})</CardTitle>
                <CardDescription>People who have access to this organization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                          {(member.user?.full_name || member.user?.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{member.user?.full_name || 'Unknown'}</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {member.user?.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getRoleBadge(member.role)}
                        {canManageMembers && member.role !== 'owner' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {['admin', 'member', 'viewer'].map((role) => (
                                <DropdownMenuItem
                                  key={role}
                                  onClick={() => handleRoleChange(member.id, role)}
                                  disabled={member.role === role}
                                >
                                  Change to {role}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuItem
                                onClick={() => handleRemoveMember(member.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {invitations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Pending Invitations ({invitations.length})</CardTitle>
                  <CardDescription>Invitations waiting to be accepted</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {invitations.map((invitation) => (
                      <div
                        key={invitation.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                            <Mail className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                          </div>
                          <div>
                            <div className="font-medium">{invitation.email}</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              Invited{' '}
                              {new Date(invitation.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getRoleBadge(invitation.role)}
                          {canManageMembers && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteInvitation(invitation.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Role Permissions</CardTitle>
                <CardDescription>What each role can do</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Crown className="h-5 w-5 text-yellow-500" />
                        <h4 className="font-semibold">Owner</h4>
                      </div>
                      <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                        <li>• Full access</li>
                        <li>• Manage billing</li>
                        <li>• Delete organization</li>
                        <li>• Manage all members</li>
                      </ul>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-5 w-5 text-blue-500" />
                        <h4 className="font-semibold">Admin</h4>
                      </div>
                      <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                        <li>• Manage members</li>
                        <li>• Edit settings</li>
                        <li>• Create/edit resources</li>
                        <li>• Delete resources</li>
                      </ul>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">Member</h4>
                      </div>
                      <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                        <li>• Create agents</li>
                        <li>• Create swarms</li>
                        <li>• Edit resources</li>
                        <li>• View all resources</li>
                      </ul>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className="h-5 w-5 text-slate-500" />
                        <h4 className="font-semibold">Viewer</h4>
                      </div>
                      <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                        <li>• View agents</li>
                        <li>• View swarms</li>
                        <li>• Read-only access</li>
                        <li>• No editing</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
