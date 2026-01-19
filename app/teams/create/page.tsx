'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOrganizations } from '@/hooks/use-organizations';
import { useStore } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Building2, Lock, ArrowRight, Users, Share2, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const ALLOWED_PLANS = ['unlimited', 'enterprise'];

export default function CreateTeamPage() {
  const router = useRouter();
  const { createOrganization } = useOrganizations();
  const { user, isDemo } = useStore();
  const [creating, setCreating] = useState(false);

  const userPlan = user?.plan || 'free';
  const hasAccess = isDemo || ALLOWED_PLANS.includes(userPlan);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.slug) {
      toast.error('Please fill in all required fields');
      return;
    }

    setCreating(true);
    try {
      const org = await createOrganization(formData);
      router.push(`/teams/${org.id}/settings`);
    } catch (error) {
      console.error('Error creating organization:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleSlugChange = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    setFormData({ ...formData, name, slug });
  };

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
          <h1 className="text-3xl font-bold mb-4">Upgrade to Create Teams</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Teams collaboration is available on Unlimited and Enterprise plans.
            Create organizations, invite team members, and manage shared resources together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/pricing">
                View Plans
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/settings?tab=billing">
                Manage Subscription
              </Link>
            </Button>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Team Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Invite unlimited team members and assign roles
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-primary" />
                  Shared Resources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Share agents, swarms, and tools across your team
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Access Control
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Fine-grained permissions and role management
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-2xl mx-auto">
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

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mb-4">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Create a Team</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Set up a new organization to collaborate with your team
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Team Information</CardTitle>
              <CardDescription>
                Basic details about your new organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name">
                    Team Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="My Awesome Team"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="slug">
                    Slug <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                      })
                    }
                    placeholder="my-awesome-team"
                    required
                  />
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    This will be your team&apos;s URL: /teams/{formData.slug || 'your-team-slug'}
                  </p>
                </div>

                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What does your team do?"
                    rows={4}
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">What&apos;s included:</h4>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    <li>• Up to 5 team members on the free plan</li>
                    <li>• 10 agents and 5 swarms</li>
                    <li>• Shared collaboration features</li>
                    <li>• Team billing and usage tracking</li>
                  </ul>
                </div>

                <Button type="submit" className="w-full" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Team'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
