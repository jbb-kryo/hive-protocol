'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useWebhooks, WEBHOOK_EVENTS } from '@/hooks/use-webhooks';
import { useToast } from '@/hooks/use-toast';

interface CreateWebhookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateWebhookDialog({ open, onOpenChange, onSuccess }: CreateWebhookDialogProps) {
  const { createWebhook } = useWebhooks();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim() || events.length === 0) return;

    try {
      setLoading(true);
      await createWebhook({ name: name.trim(), url: url.trim(), events });
      toast({
        title: 'Webhook created',
        description: 'Your webhook has been created successfully.',
      });
      onOpenChange(false);
      onSuccess();
      setName('');
      setUrl('');
      setEvents([]);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create webhook.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleEvent = (eventId: string) => {
    setEvents(prev =>
      prev.includes(eventId)
        ? prev.filter(e => e !== eventId)
        : [...prev, eventId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Webhook</DialogTitle>
            <DialogDescription>
              Configure a new webhook endpoint to receive event notifications.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="My Webhook"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">Endpoint URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://your-server.com/webhook"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                We&apos;ll send POST requests to this URL when events occur.
              </p>
            </div>
            <div className="space-y-3">
              <Label>Events</Label>
              <div className="space-y-3">
                {WEBHOOK_EVENTS.map(event => (
                  <div key={event.id} className="flex items-start space-x-3">
                    <Checkbox
                      id={event.id}
                      checked={events.includes(event.id)}
                      onCheckedChange={() => toggleEvent(event.id)}
                    />
                    <div className="grid gap-0.5 leading-none">
                      <label
                        htmlFor={event.id}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {event.label}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {event.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim() || !url.trim() || events.length === 0}>
              {loading ? 'Creating...' : 'Create Webhook'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
