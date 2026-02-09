'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronLeft, Download, RefreshCw, Loader2, BarChart3,
  Copy, Users, Star, Bot, TrendingUp, ArrowUpRight,
  Award, Layers
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { PageTransition } from '@/components/ui/page-transition'
import { EmptyState } from '@/components/ui/empty-state'
import {
  CloneTrendChart,
  RatingTrendChart,
  RatingDistributionChart,
  CategoryComparisonChart,
  CategoryPieChart,
} from '@/components/admin/template-analytics-charts'
import {
  useTemplateAnalytics,
  type TimeRange,
  type TemplateOverviewStats,
  type TemplateMetric,
  type CategoryMetric,
  type RatingDistribution,
  type CloneTrendPoint,
  type RatingTrendPoint,
} from '@/hooks/use-template-analytics'
import { toast } from 'sonner'

function StatCard({
  title, value, icon: Icon, subtitle, color,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  subtitle?: string
  color: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
            <div className={`p-2.5 rounded-xl ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function TemplateAnalyticsPage() {
  const router = useRouter()
  const {
    getOverviewStats,
    getTemplateMetrics,
    getCategoryMetrics,
    getRatingDistribution,
    getCloneTrend,
    getRatingTrend,
    exportCSV,
  } = useTemplateAnalytics()

  const [range, setRange] = useState<TimeRange>('30d')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [overview, setOverview] = useState<TemplateOverviewStats | null>(null)
  const [metrics, setMetrics] = useState<TemplateMetric[]>([])
  const [categories, setCategories] = useState<CategoryMetric[]>([])
  const [ratingDist, setRatingDist] = useState<RatingDistribution[]>([])
  const [cloneTrend, setCloneTrend] = useState<CloneTrendPoint[]>([])
  const [ratingTrend, setRatingTrend] = useState<RatingTrendPoint[]>([])

  const fetchAll = useCallback(async () => {
    try {
      const [ov, tm, cm, rd, ct, rt] = await Promise.all([
        getOverviewStats(),
        getTemplateMetrics(range),
        getCategoryMetrics(range),
        getRatingDistribution(),
        getCloneTrend(range),
        getRatingTrend(range),
      ])
      setOverview(ov)
      setMetrics(tm)
      setCategories(cm)
      setRatingDist(rd)
      setCloneTrend(ct)
      setRatingTrend(rt)
    } catch {
      toast.error('Failed to load analytics')
    }
  }, [range, getOverviewStats, getTemplateMetrics, getCategoryMetrics, getRatingDistribution, getCloneTrend, getRatingTrend])

  useEffect(() => {
    setLoading(true)
    fetchAll().finally(() => setLoading(false))
  }, [fetchAll])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAll()
    setRefreshing(false)
    toast.success('Analytics refreshed')
  }

  const handleExport = () => {
    exportCSV(metrics)
    toast.success('Exported to CSV')
  }

  if (loading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="space-y-6 p-4 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/admin/templates')}
              className="shrink-0 mt-0.5"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-primary" />
                Template Analytics
              </h1>
              <p className="text-muted-foreground">
                Usage metrics, adoption rates, and feedback for {overview?.totalTemplates || 0} templates
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={range} onValueChange={(v) => setRange(v as TimeRange)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {overview && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Total Templates"
              value={overview.totalTemplates}
              icon={Layers}
              subtitle={`${overview.activeTemplates} active`}
              color="bg-sky-500/10 text-sky-600"
            />
            <StatCard
              title="Total Clones"
              value={overview.totalClones.toLocaleString()}
              icon={Copy}
              color="bg-teal-500/10 text-teal-600"
            />
            <StatCard
              title="Active Agents"
              value={metrics.reduce((s, m) => s + m.activeAgents, 0).toLocaleString()}
              icon={Bot}
              subtitle="From templates"
              color="bg-emerald-500/10 text-emerald-600"
            />
            <StatCard
              title="Avg Rating"
              value={overview.averageRating > 0 ? overview.averageRating.toFixed(2) : '--'}
              icon={Star}
              subtitle={`${overview.totalReviews} reviews`}
              color="bg-amber-500/10 text-amber-600"
            />
            <StatCard
              title="Avg Retention"
              value={
                metrics.length > 0
                  ? `${(metrics.reduce((s, m) => s + m.retentionRate, 0) / metrics.length).toFixed(0)}%`
                  : '--'
              }
              icon={TrendingUp}
              subtitle="30-day retention"
              color="bg-rose-500/10 text-rose-600"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {cloneTrend.length > 0 ? (
            <CloneTrendChart data={cloneTrend} />
          ) : (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={Copy}
                  title="No clone data yet"
                  description="Clone trends will appear as users adopt templates"
                />
              </CardContent>
            </Card>
          )}
          {ratingTrend.length > 0 ? (
            <RatingTrendChart data={ratingTrend} />
          ) : (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={Star}
                  title="No rating data yet"
                  description="Rating trends will appear as users submit reviews"
                />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <RatingDistributionChart data={ratingDist} />
          {categories.length > 0 ? (
            <CategoryComparisonChart data={categories} />
          ) : (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={Layers}
                  title="No category data"
                  description="Category metrics require active templates"
                />
              </CardContent>
            </Card>
          )}
          {categories.length > 0 ? (
            <CategoryPieChart data={categories} />
          ) : (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={Layers}
                  title="No category data"
                  description="Category share requires active templates"
                />
              </CardContent>
            </Card>
          )}
        </div>

        {categories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Category Breakdown</CardTitle>
              <CardDescription>Aggregated metrics per category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Templates</TableHead>
                      <TableHead className="text-right">Clones</TableHead>
                      <TableHead className="text-right">Active Agents</TableHead>
                      <TableHead className="text-right">Avg Rating</TableHead>
                      <TableHead className="text-right">Reviews</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map(cat => (
                      <TableRow key={cat.category}>
                        <TableCell className="font-medium capitalize">{cat.category}</TableCell>
                        <TableCell className="text-right">{cat.templateCount}</TableCell>
                        <TableCell className="text-right">{cat.totalClones.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{cat.activeAgents.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {cat.avgRating > 0 ? (
                            <div className="flex items-center justify-end gap-1">
                              <Star className="w-3 h-3 text-amber-500" />
                              {cat.avgRating.toFixed(2)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">--</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{cat.totalReviews}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Template Performance</CardTitle>
            <CardDescription>
              Individual template metrics sorted by popularity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.length === 0 ? (
              <EmptyState
                icon={Bot}
                title="No template data"
                description="Template metrics will appear once templates are created and active"
              />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Template</TableHead>
                      <TableHead className="text-right">Clones</TableHead>
                      <TableHead className="text-right">Active Agents</TableHead>
                      <TableHead className="text-center">Retention</TableHead>
                      <TableHead className="text-right">Rating</TableHead>
                      <TableHead className="text-right">Reviews</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics.map(m => (
                      <TableRow key={m.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{m.name}</span>
                            <Badge variant="outline" className="text-[10px] font-mono">v{m.version}</Badge>
                            {m.isFeatured && (
                              <Award className="w-3.5 h-3.5 text-amber-500" />
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground capitalize">{m.category}</p>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {m.cloneCount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {m.activeAgents.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 justify-center">
                            <Progress
                              value={m.retentionRate}
                              className="w-16 h-1.5"
                            />
                            <span className="text-xs text-muted-foreground w-10 text-right">
                              {m.retentionRate.toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {m.reviewCount > 0 ? (
                            <div className="flex items-center justify-end gap-1">
                              <Star className="w-3 h-3 text-amber-500" />
                              {m.averageRating.toFixed(1)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">--</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {m.reviewCount}
                        </TableCell>
                        <TableCell className="text-center">
                          {m.isFeatured ? (
                            <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/25 text-[10px]">
                              Featured
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">Active</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}
