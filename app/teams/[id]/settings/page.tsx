'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useOrganizations } from '@/hooks/use-organizations';
import { useStore } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Save, Trash2, AlertTriangle, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const ALLOWED_PLANS = ['unlimited', 'enterprise'];

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string;
  owner_id: string;
  plan: string;
  max_members: number;
  max_agents: number;
  max_swarms: number;
}

export default function TeamSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const organizationId = params.id as string;
  const { updateOrganization, deleteOrganization } = useOrganizations();
  const { user, isDemo } = useStore();

  const userPlan = user?.plan || 'free';
  const hasAccess = isDemo || ALLOWED_PLANS.includes(userPlan);

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });

  useEffect(() => {
    const fetchOrganization = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', organizationId)
          .single();

        if (error || !data) {
          toast.error('Organization not found');
          router.push('/teams');
          return;
        }

        setOrganization(data);
        setFormData({
          name: data.name,
          slug: data.slug,
          description: data.description || '',
        });
        setIsOwner(data.owner_id === user.id);
      } catch (error) {
        console.error('Error fetching organization:', error);
        toast.error('Failed to load organization');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [organizationId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateOrganization(organizationId, formData);
    } catch (error) {
      console.error('Error updating organization:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteOrganization(organizationId);
      router.push('/teams');
    } catch (error) {
      console.error('Error deleting organization:', error);
    }
  };

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
      <div className="max-w-4xl mx-auto">
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

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">{organization.name} Settings</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Manage your organization settings and preferences
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Information</CardTitle>
                <CardDescription>
                  Basic details about your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Organization Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter organization name"
                    disabled={!isOwner}
                  />
                </div>

                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    placeholder="organization-slug"
                    disabled={!isOwner}
                  />
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Your organization will be accessible at: /teams/{formData.slug}
                  </p>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your organization"
                    rows={4}
                    disabled={!isOwner}
                  />
                </div>

                {isOwner && (
                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving} className="gap-2">
                      <Save className="h-4 w-4" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plan & Limits</CardTitle>
                <CardDescription>
                  Current plan and resource limits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Label>Current Plan</Label>
                      <Badge>{organization.plan}</Badge>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <Label>Max Members</Label>
                    <div className="text-2xl font-bold mt-2">{organization.max_members}</div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <Label>Max Agents</Label>
                    <div className="text-2xl font-bold mt-2">{organization.max_agents}</div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <Label>Max Swarms</Label>
                    <div className="text-2xl font-bold mt-2">{organization.max_swarms}</div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Want to increase your limits? Upgrade to a higher plan in the billing section.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => router.push(`/teams/${organizationId}/billing`)}
                  >
                    View Billing
                  </Button>
                </div>
              </CardContent>
            </Card>

            {isOwner && (
              <Card className="border-red-200 dark:border-red-800">
                <CardHeader>
                  <CardTitle className="text-red-600 dark:text-red-400">
                    Danger Zone
                  </CardTitle>
                  <CardDescription>
                    Irreversible actions that will permanently affect your organization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-red-600 dark:text-red-400">
                        Delete Organization
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Permanently delete this organization and all associated data
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="gap-2">
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            Delete Organization?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the
                            organization &quot;{organization.name}&quot; and remove all associated data
                            including agents, swarms, and members.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Organization
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
}
