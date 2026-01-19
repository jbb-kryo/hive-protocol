'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMarketplace, useMarketplaceAgent, useMarketplaceActions, MarketplaceAgent } from '@/hooks/use-marketplace';
import { useStore } from '@/store';
import { AgentReviews } from '@/components/marketplace/agent-reviews';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { JsonLd } from '@/components/seo/json-ld';
import { Star, Download, Eye, ArrowLeft, Shield, Zap, Users, Lock, ArrowRight, Store, Package } from 'lucide-react';
import { motion } from 'framer-motion';

const ALLOWED_PLANS = ['pro', 'unlimited', 'enterprise'];

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { agents } = useMarketplace();
  const { installAgent, loading: actionLoading } = useMarketplaceActions();
  const { user, isDemo } = useStore();

  const userPlan = user?.plan || 'free';
  const hasAccess = isDemo || ALLOWED_PLANS.includes(userPlan);

  const [currentAgent, setCurrentAgent] = useState<MarketplaceAgent | null>(null);
  const { agent, loading } = useMarketplaceAgent(currentAgent?.id || '');

  useEffect(() => {
    const foundAgent = agents.find((a) => a.slug === params.slug);
    if (foundAgent) {
      setCurrentAgent(foundAgent);
    }
  }, [params.slug, agents]);

  const handleInstall = async () => {
    if (!currentAgent) return;
    try {
      await installAgent(currentAgent.id);
      router.push('/agents');
    } catch (error) {
      console.error('Failed to install agent:', error);
    }
  };

  const formatPrice = (agent: MarketplaceAgent) => {
    if (agent.pricing_type === 'free') return 'Free';
    if (agent.pricing_type === 'one_time') return `$${agent.price_amount}`;
    return `$${agent.price_amount}/${agent.billing_interval}`;
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
          <h1 className="text-3xl font-bold mb-4">Upgrade to Access Marketplace</h1>
          <p className="text-lg text-muted-foreground mb-8">
            The AI Agent Marketplace is available on Pro, Unlimited, and Enterprise plans.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/pricing">
                View Plans
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/marketplace">
                Back to Marketplace
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading || !agent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-64 w-full mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div>
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <JsonLd
        data={{
          type: 'Product',
          name: agent.name,
          description: agent.description,
          brand: 'HIVE',
          category: agent.category?.name || 'AI Agent',
          offers: {
            price: agent.pricing_type === 'free' ? '0' : String(agent.price_amount || 0),
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
          },
        }}
      />
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs
          customItems={[
            { label: 'Marketplace', href: '/marketplace' },
            { label: agent.category?.name || 'Agents', href: `/marketplace?category=${agent.category?.slug || ''}` },
            { label: agent.name, href: `/marketplace/${agent.slug}` },
          ]}
          className="mb-6"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {agent.banner_url ? (
            <div className="h-64 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg mb-8" />
          ) : (
            <div className="h-64 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg mb-8 flex items-center justify-center">
              <div className="text-6xl text-white opacity-50">🤖</div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold mb-2">{agent.name}</h1>
                    <p className="text-xl text-slate-600 dark:text-slate-400">
                      {agent.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm mb-6">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-lg">{agent.average_rating.toFixed(1)}</span>
                    <span className="text-slate-600 dark:text-slate-400">
                      ({agent.review_count} {agent.review_count === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    <span>{agent.install_count} installs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    <span>{agent.view_count} views</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {agent.category && (
                    <Badge variant="outline" className="text-base px-3 py-1">
                      {agent.category.name}
                    </Badge>
                  )}
                  {agent.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-base px-3 py-1">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {agent.is_featured && (
                  <Badge className="bg-yellow-500 text-black mb-6">
                    ⭐ Featured Agent
                  </Badge>
                )}
              </div>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews ({agent.review_count})</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-xl font-semibold mb-4">About this Agent</h3>
                      <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line">
                        {agent.long_description || agent.description}
                      </p>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <Shield className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                        <h4 className="font-semibold mb-1">Verified</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Reviewed by our team
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                        <h4 className="font-semibold mb-1">Fast Setup</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Install in seconds
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <Users className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <h4 className="font-semibold mb-1">Community</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {agent.install_count}+ users
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="reviews">
                  <AgentReviews agentId={agent.id} />
                </TabsContent>

                <TabsContent value="details" className="space-y-6">
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Creator</h4>
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500" />
                          <span>{agent.creator?.full_name || 'Unknown Creator'}</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Version</h4>
                        <Badge variant="outline">{agent.version}</Badge>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Category</h4>
                        <Badge>{agent.category?.name || 'Uncategorized'}</Badge>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Published</h4>
                        <p className="text-slate-600 dark:text-slate-400">
                          {new Date(agent.published_at || agent.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Last Updated</h4>
                        <p className="text-slate-600 dark:text-slate-400">
                          {new Date(agent.updated_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <div>
              <Card className="sticky top-8">
                <CardContent className="pt-6 space-y-6">
                  <div>
                    <div className="text-3xl font-bold mb-2">{formatPrice(agent)}</div>
                    {agent.pricing_type !== 'free' && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {agent.pricing_type === 'one_time' ? 'One-time payment' : `Billed ${agent.billing_interval}`}
                      </p>
                    )}
                  </div>

                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleInstall}
                    disabled={actionLoading}
                  >
                    {agent.pricing_type === 'free' ? 'Install Free' : 'Purchase & Install'}
                  </Button>

                  <div className="space-y-3 pt-6 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Total Installs</span>
                      <span className="font-semibold">{agent.install_count}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Average Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{agent.average_rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Version</span>
                      <span className="font-semibold">{agent.version}</span>
                    </div>
                  </div>

                  <div className="pt-6 border-t">
                    <h4 className="font-semibold mb-3">What's Included</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="h-2 w-2 rounded-full bg-green-600" />
                        </div>
                        <span>Pre-configured agent</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="h-2 w-2 rounded-full bg-green-600" />
                        </div>
                        <span>Optimized prompts</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="h-2 w-2 rounded-full bg-green-600" />
                        </div>
                        <span>Ready to use</span>
                      </li>
                      {agent.pricing_type !== 'free' && (
                        <li className="flex items-start gap-2">
                          <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <div className="h-2 w-2 rounded-full bg-green-600" />
                          </div>
                          <span>Priority support</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
