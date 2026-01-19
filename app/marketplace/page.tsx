'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useMarketplace, useMarketplaceActions, MarketplaceAgent } from '@/hooks/use-marketplace';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Star, Download, Eye, Search, Filter, Sparkles, TrendingUp, Clock, DollarSign, Lock, ArrowRight, Store, Package, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const ALLOWED_PLANS = ['pro', 'unlimited', 'enterprise'];

export default function MarketplacePage() {
  const { agents, categories, loading, fetchAgents, getFeaturedAgents } = useMarketplace();
  const { installAgent, loading: actionLoading } = useMarketplaceActions();
  const { user, isDemo } = useStore();

  const userPlan = user?.plan || 'free';
  const hasAccess = isDemo || ALLOWED_PLANS.includes(userPlan);

  const [featuredAgents, setFeaturedAgents] = useState<MarketplaceAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<MarketplaceAgent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [pricingFilter, setPricingFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'rating' | 'price_low' | 'price_high'>('popular');

  useEffect(() => {
    const loadFeatured = async () => {
      const featured = await getFeaturedAgents();
      setFeaturedAgents(featured);
    };
    loadFeatured();
  }, [getFeaturedAgents]);

  const handleSearch = () => {
    fetchAgents({
      search: searchQuery,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      pricing: pricingFilter,
      sort: sortBy,
    });
  };

  useEffect(() => {
    handleSearch();
  }, [selectedCategory, pricingFilter, sortBy]);

  const handleInstall = async (agentId: string) => {
    try {
      await installAgent(agentId);
      fetchAgents({
        search: searchQuery,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        pricing: pricingFilter,
        sort: sortBy,
      });
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
            Browse, install, and deploy pre-built AI agents to supercharge your workflows.
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
                  <Store className="w-5 h-5 text-primary" />
                  Pre-built Agents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Access hundreds of ready-to-use AI agents
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  One-Click Install
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Deploy agents instantly to your workspace
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Sell Your Agents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Publish and monetize your own AI agents
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
              AI Agent Marketplace
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Discover and deploy pre-built AI agents for research, coding, writing, and analysis
            </p>
          </div>

          {featuredAgents.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="h-6 w-6 text-yellow-500" />
                <h2 className="text-3xl font-bold">Featured Agents</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredAgents.slice(0, 3).map((agent) => (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="overflow-hidden border-2 border-yellow-200 dark:border-yellow-800 shadow-lg hover:shadow-xl transition-shadow">
                      {agent.banner_url && (
                        <div className="h-40 bg-gradient-to-br from-blue-500 to-cyan-500 relative">
                          <Badge className="absolute top-2 right-2 bg-yellow-500 text-black">
                            Featured
                          </Badge>
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-2">
                              {agent.name}
                            </CardTitle>
                            <CardDescription className="mt-2">{agent.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {agent.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              {agent.average_rating.toFixed(1)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Download className="h-4 w-4" />
                              {agent.install_count}
                            </span>
                          </div>
                          <span className="font-semibold text-lg">{formatPrice(agent)}</span>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button
                          className="w-full"
                          onClick={() => setSelectedAgent(agent)}
                        >
                          View Details
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-8">
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search agents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch}>
                  Search
                </Button>
              </div>
              <div className="flex gap-2">
                <Select value={pricingFilter} onValueChange={(value: any) => setPricingFilter(value)}>
                  <SelectTrigger className="w-[140px]">
                    <DollarSign className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Pricing</SelectItem>
                    <SelectItem value="free">Free Only</SelectItem>
                    <SelectItem value="paid">Paid Only</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="flex-wrap h-auto justify-start">
                <TabsTrigger value="all">All Categories</TabsTrigger>
                {categories.map((category) => (
                  <TabsTrigger key={category.id} value={category.id}>
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-semibold mb-2">No agents found</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Try adjusting your filters or search query
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            {agent.name}
                          </CardTitle>
                          {agent.category && (
                            <Badge variant="outline" className="mt-2">
                              {agent.category.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardDescription className="mt-2 line-clamp-2">
                        {agent.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {agent.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            {agent.average_rating > 0 ? agent.average_rating.toFixed(1) : 'New'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Download className="h-4 w-4" />
                            {agent.install_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {agent.view_count}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{formatPrice(agent)}</span>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setSelectedAgent(agent)}
                      >
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <Dialog open={!!selectedAgent} onOpenChange={(open) => !open && setSelectedAgent(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedAgent?.name}</DialogTitle>
            <DialogDescription className="text-base">
              {selectedAgent?.description}
            </DialogDescription>
          </DialogHeader>
          {selectedAgent && (
            <div className="space-y-6">
              {selectedAgent.banner_url && (
                <div className="h-48 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg" />
              )}

              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{selectedAgent.average_rating.toFixed(1)}</span>
                  <span className="text-slate-600 dark:text-slate-400">
                    ({selectedAgent.review_count} reviews)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  <span>{selectedAgent.install_count} installs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  <span>{selectedAgent.view_count} views</span>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Category</h3>
                <Badge>{selectedAgent.category?.name || 'Uncategorized'}</Badge>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedAgent.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line">
                  {selectedAgent.long_description || selectedAgent.description}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Creator</h3>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500" />
                  <span>{selectedAgent.creator?.full_name || 'Unknown'}</span>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Version</h3>
                <span className="text-slate-600 dark:text-slate-400">{selectedAgent.version}</span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <div className="text-2xl font-bold">{formatPrice(selectedAgent)}</div>
                  {selectedAgent.pricing_type !== 'free' && (
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {selectedAgent.pricing_type === 'one_time' ? 'One-time payment' : 'Subscription'}
                    </div>
                  )}
                </div>
                <Button
                  size="lg"
                  onClick={() => handleInstall(selectedAgent.id)}
                  disabled={actionLoading}
                >
                  {selectedAgent.pricing_type === 'free' ? 'Install Free' : 'Purchase & Install'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
