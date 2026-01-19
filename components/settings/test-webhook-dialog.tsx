'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WEBHOOK_EVENTS, Webhook } from '@/hooks/use-webhooks';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, XCircle, Send, Loader2 } from 'lucide-react';

interface TestWebhookDialogProps {
  webhook: Webhook | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const SAMPLE_PAYLOADS: Record<string, Record<string, unknown>> = {
  message: {
    event: 'message',
    timestamp: new Date().toISOString(),
    data: {
      id: 'msg_sample_123',
      swarm_id: 'swarm_sample_456',
      agent_id: 'agent_sample_789',
      agent_name: 'Research Agent',
      content: 'This is a sample message from the Research Agent.',
      created_at: new Date().toISOString(),
    },
  },
  swarm_complete: {
    event: 'swarm_complete',
    timestamp: new Date().toISOString(),
    data: {
      swarm_id: 'swarm_sample_456',
      swarm_name: 'Market Analysis Swarm',
      duration_seconds: 342,
      message_count: 24,
      agent_count: 4,
      completed_at: new Date().toISOString(),
    },
  },
  agent_error: {
    event: 'agent_error',
    timestamp: new Date().toISOString(),
    data: {
      swarm_id: 'swarm_sample_456',
      agent_id: 'agent_sample_789',
      agent_name: 'Code Executor',
      error_type: 'execution_timeout',
      error_message: 'Task execution exceeded the maximum allowed time of 30 seconds.',
      occurred_at: new Date().toISOString(),
    },
  },
};

export function TestWebhookDialog({ webhook, onOpenChange, onSuccess }: TestWebhookDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [result, setResult] = useState<{ success: boolean; status?: number; duration?: number; error?: string } | null>(null);

  const availableEvents = WEBHOOK_EVENTS.filter(e => webhook?.events.includes(e.id));

  const handleTest = async () => {
    if (!webhook || !selectedEvent) return;

    try {
      setLoading(true);
      setResult(null);

      const payload = {
        ...SAMPLE_PAYLOADS[selectedEvent],
        webhook_id: webhook.id,
        test: true,
      };

      const startTime = Date.now();

      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/test-webhook`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            webhook_id: webhook.id,
            url: webhook.url,
            secret: webhook.secret,
            event_type: selectedEvent,
            payload,
          }),
        }
      );

      const duration = Date.now() - startTime;
      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          status: data.response_status,
          duration: data.duration_ms || duration,
        });
        toast({
          title: 'Test successful',
          description: `Webhook responded with status ${data.response_status}`,
        });
      } else {
        setResult({
          success: false,
          status: data.response_status,
          error: data.error || 'Request failed',
          duration: data.duration_ms || duration,
        });
      }

      onSuccess();
    } catch (err) {
      setResult({
        success: false,
        error: err instanceof Error ? err.message : 'Failed to send test webhook',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setSelectedEvent('');
      setResult(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={!!webhook} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Test Webhook</DialogTitle>
          <DialogDescription>
            Send a test event to {webhook?.name} to verify it&apos;s working correctly.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Event Type</Label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger>
                <SelectValue placeholder="Select an event to test" />
              </SelectTrigger>
              <SelectContent>
                {availableEvents.map(event => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedEvent && (
            <div>
              <Label className="text-xs text-muted-foreground">Sample Payload</Label>
              <pre className="mt-2 text-xs bg-muted p-3 rounded-lg overflow-x-auto max-h-48">
                {JSON.stringify(SAMPLE_PAYLOADS[selectedEvent], null, 2)}
              </pre>
            </div>
          )}

          {result && (
            <div className={`flex items-start gap-3 p-4 rounded-lg ${result.success ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
              {result.success ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${result.success ? 'text-emerald-600' : 'text-red-600'}`}>
                  {result.success ? 'Test Successful' : 'Test Failed'}
                </p>
                <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                  {result.status && <p>Status: {result.status}</p>}
                  {result.duration && <p>Duration: {result.duration}ms</p>}
                  {result.error && <p className="text-red-600">{result.error}</p>}
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleClose(false)}>
            Close
          </Button>
          <Button onClick={handleTest} disabled={loading || !selectedEvent}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Test Event
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
