'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWebhookDeliveries, Webhook, WEBHOOK_EVENTS } from '@/hooks/use-webhooks';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface WebhookDeliveriesDialogProps {
  webhook: Webhook | null;
  onOpenChange: (open: boolean) => void;
}

export function WebhookDeliveriesDialog({ webhook, onOpenChange }: WebhookDeliveriesDialogProps) {
  const { deliveries, loading } = useWebhookDeliveries(webhook?.id || null);

  const getEventLabel = (eventId: string) => {
    return WEBHOOK_EVENTS.find(e => e.id === eventId)?.label || eventId;
  };

  const getStatusColor = (status: number | null) => {
    if (!status) return 'text-muted-foreground';
    if (status >= 200 && status < 300) return 'text-emerald-500';
    if (status >= 400 && status < 500) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <Dialog open={!!webhook} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Delivery History</DialogTitle>
          <DialogDescription>
            Recent webhook deliveries for {webhook?.name}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[500px] pr-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : deliveries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-10 w-10 text-muted-foreground mb-3" />
              <h4 className="font-medium">No deliveries yet</h4>
              <p className="text-sm text-muted-foreground max-w-xs mt-1">
                Webhook delivery attempts will appear here once events are triggered.
              </p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-2">
              {deliveries.map(delivery => (
                <AccordionItem key={delivery.id} value={delivery.id} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-3 text-left w-full pr-4">
                      {delivery.success ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {getEventLabel(delivery.event_type)}
                          </Badge>
                          {delivery.response_status && (
                            <span className={`text-xs font-mono ${getStatusColor(delivery.response_status)}`}>
                              {delivery.response_status}
                            </span>
                          )}
                          {delivery.duration_ms && (
                            <span className="text-xs text-muted-foreground">
                              {delivery.duration_ms}ms
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(delivery.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4">
                    <div className="space-y-3">
                      {delivery.error_message && (
                        <div className="flex items-start gap-2 p-3 bg-red-500/10 rounded-lg">
                          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                          <p className="text-sm text-red-600">{delivery.error_message}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">Request Payload</p>
                        <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                          {JSON.stringify(delivery.payload, null, 2)}
                        </pre>
                      </div>
                      {delivery.response_body && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1.5">Response</p>
                          <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto max-h-32">
                            {delivery.response_body}
                          </pre>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
