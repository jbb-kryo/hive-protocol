'use client';

import { useState } from 'react';
import { Plus, Webhook, MoreVertical, Trash2, RefreshCw, Eye, EyeOff, Copy, Check, History, Send, ExternalLink, AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useWebhooks, useWebhookDeliveries, WEBHOOK_EVENTS, Webhook as WebhookType } from '@/hooks/use-webhooks';
import { useToast } from '@/hooks/use-toast';
import { CreateWebhookDialog } from './create-webhook-dialog';
import { EditWebhookDialog } from './edit-webhook-dialog';
import { WebhookDeliveriesDialog } from './webhook-deliveries-dialog';
import { TestWebhookDialog } from './test-webhook-dialog';
import { formatDistanceToNow } from 'date-fns';

export function WebhooksTab() {
  const { webhooks, loading, toggleWebhook, deleteWebhook, regenerateSecret, refresh } = useWebhooks();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editWebhook, setEditWebhook] = useState<WebhookType | null>(null);
  const [deliveriesWebhook, setDeliveriesWebhook] = useState<WebhookType | null>(null);
  const [testWebhook, setTestWebhook] = useState<WebhookType | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleToggle = async (webhook: WebhookType) => {
    try {
      await toggleWebhook(webhook.id, !webhook.is_active);
      toast({
        title: webhook.is_active ? 'Webhook disabled' : 'Webhook enabled',
        description: `${webhook.name} has been ${webhook.is_active ? 'disabled' : 'enabled'}.`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update webhook status.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (webhook: WebhookType) => {
    try {
      await deleteWebhook(webhook.id);
      toast({
        title: 'Webhook deleted',
        description: `${webhook.name} has been deleted.`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete webhook.',
        variant: 'destructive',
      });
    }
  };

  const handleRegenerateSecret = async (webhook: WebhookType) => {
    try {
      await regenerateSecret(webhook.id);
      toast({
        title: 'Secret regenerated',
        description: 'A new signing secret has been generated.',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to regenerate secret.',
        variant: 'destructive',
      });
    }
  };

  const copySecret = (webhook: WebhookType) => {
    navigator.clipboard.writeText(webhook.secret);
    setCopiedId(webhook.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleSecretVisibility = (id: string) => {
    setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getEventLabel = (eventId: string) => {
    return WEBHOOK_EVENTS.find(e => e.id === eventId)?.label || eventId;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Webhooks</h3>
            <p className="text-sm text-muted-foreground">Receive real-time notifications for swarm events.</p>
          </div>
        </div>
        <div className="grid gap-4">
          {[1, 2].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 w-32 bg-muted rounded" />
                <div className="h-4 w-48 bg-muted rounded mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Webhooks</h3>
          <p className="text-sm text-muted-foreground">
            Receive real-time HTTP callbacks when events occur in your swarms.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Webhook
        </Button>
      </div>

      {webhooks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Webhook className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1">No webhooks configured</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
              Create a webhook to receive HTTP callbacks when events occur in your swarms.
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Webhook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {webhooks.map(webhook => (
            <Card key={webhook.id} className={!webhook.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${webhook.is_active ? 'bg-emerald-500/10' : 'bg-muted'}`}>
                      <Webhook className={`h-5 w-5 ${webhook.is_active ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {webhook.name}
                        {webhook.is_active ? (
                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 text-xs">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Disabled</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-0.5 flex items-center gap-1 font-mono text-xs">
                        <ExternalLink className="h-3 w-3" />
                        {webhook.url}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={webhook.is_active}
                      onCheckedChange={() => handleToggle(webhook)}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditWebhook(webhook)}>
                          <Webhook className="h-4 w-4 mr-2" />
                          Edit Webhook
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTestWebhook(webhook)}>
                          <Send className="h-4 w-4 mr-2" />
                          Send Test Event
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeliveriesWebhook(webhook)}>
                          <History className="h-4 w-4 mr-2" />
                          View Delivery History
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleRegenerateSecret(webhook)}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Regenerate Secret
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(webhook)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Webhook
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Events</p>
                  <div className="flex flex-wrap gap-1.5">
                    {webhook.events.map(event => (
                      <Badge key={event} variant="outline" className="text-xs">
                        {getEventLabel(event)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Signing Secret</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-md font-mono overflow-hidden">
                      {showSecrets[webhook.id] ? webhook.secret : '••••••••••••••••••••••••••••••••'}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => toggleSecretVisibility(webhook.id)}
                    >
                      {showSecrets[webhook.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => copySecret(webhook)}
                    >
                      {copiedId === webhook.id ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Created {formatDistanceToNow(new Date(webhook.created_at), { addSuffix: true })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateWebhookDialog open={createOpen} onOpenChange={setCreateOpen} onSuccess={refresh} />
      <EditWebhookDialog webhook={editWebhook} onOpenChange={(open) => !open && setEditWebhook(null)} onSuccess={refresh} />
      <WebhookDeliveriesDialog webhook={deliveriesWebhook} onOpenChange={(open) => !open && setDeliveriesWebhook(null)} />
      <TestWebhookDialog webhook={testWebhook} onOpenChange={(open) => !open && setTestWebhook(null)} onSuccess={refresh} />
    </div>
  );
}
