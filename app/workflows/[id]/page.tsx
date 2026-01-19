'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWorkflow, useWorkflowExecutions, WorkflowNode, WorkflowEdge } from '@/hooks/use-workflows';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Save,
  Play,
  Plus,
  Trash2,
  Settings,
  History,
  Zap,
  GitBranch,
  Timer,
  MessageSquare,
  Bot,
  Mail,
  Webhook,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  GripVertical,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

const ALLOWED_PLANS = ['pro', 'unlimited', 'enterprise'];

const NODE_TYPES = [
  { type: 'action', icon: Zap, label: 'Action', color: 'bg-blue-500' },
  { type: 'condition', icon: GitBranch, label: 'Condition', color: 'bg-yellow-500' },
  { type: 'delay', icon: Timer, label: 'Delay', color: 'bg-purple-500' },
  { type: 'end', icon: CheckCircle, label: 'End', color: 'bg-green-500' },
];

const ACTION_TYPES = [
  { type: 'send_message', icon: MessageSquare, label: 'Send Message' },
  { type: 'run_agent', icon: Bot, label: 'Run Agent' },
  { type: 'send_email', icon: Mail, label: 'Send Email' },
  { type: 'webhook', icon: Webhook, label: 'Call Webhook' },
  { type: 'wait', icon: Clock, label: 'Wait' },
];

interface CanvasNode extends WorkflowNode {
  selected?: boolean;
}

export default function WorkflowBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;
  const { user, isDemo } = useStore();

  const userPlan = user?.plan || 'free';
  const hasAccess = isDemo || ALLOWED_PLANS.includes(userPlan);

  const {
    workflow,
    nodes,
    edges,
    loading,
    addNode,
    updateNode,
    deleteNode,
    addEdge,
    deleteEdge,
    savePositions,
    refetch,
  } = useWorkflow(workflowId);
  const { executions, triggerExecution } = useWorkflowExecutions(workflowId);

  const [selectedNode, setSelectedNode] = useState<CanvasNode | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [triggerType, setTriggerType] = useState('manual');

  useEffect(() => {
    if (workflow) {
      setWorkflowName(workflow.name);
      setWorkflowDescription(workflow.description);
      setTriggerType(workflow.trigger_type);
    }
  }, [workflow]);

  const handleSaveWorkflow = async () => {
    try {
      await supabase
        .from('workflows')
        .update({
          name: workflowName,
          description: workflowDescription,
          trigger_type: triggerType,
          updated_at: new Date().toISOString(),
        })
        .eq('id', workflowId);

      toast.success('Workflow saved');
      refetch();
    } catch (error) {
      console.error('Error saving workflow:', error);
      toast.error('Failed to save workflow');
    }
  };

  const handleActivateWorkflow = async () => {
    try {
      await supabase
        .from('workflows')
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', workflowId);

      toast.success('Workflow activated');
      refetch();
    } catch (error) {
      console.error('Error activating workflow:', error);
      toast.error('Failed to activate workflow');
    }
  };

  const handleAddNode = async (type: string) => {
    const newNode = await addNode({
      node_type: type as any,
      label: type === 'condition' ? 'If Condition' : type === 'delay' ? 'Wait' : type === 'end' ? 'End' : 'New Action',
      action_type: type === 'action' ? 'send_message' : '',
      position_x: 250 + Math.random() * 100,
      position_y: 200 + nodes.length * 100,
      config: {},
    });
    setSelectedNode(newNode);
  };

  const handleNodeClick = (node: CanvasNode) => {
    if (connectingFrom) {
      if (connectingFrom !== node.id) {
        addEdge({
          source_node_id: connectingFrom,
          target_node_id: node.id,
        });
      }
      setConnectingFrom(null);
    } else {
      setSelectedNode(node);
    }
  };

  const handleNodeDragStart = (e: React.MouseEvent, node: CanvasNode) => {
    e.stopPropagation();
    setIsDragging(true);
    setSelectedNode(node);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !selectedNode || !canvasRef.current) return;

      const canvasRect = canvasRef.current.getBoundingClientRect();
      const newX = e.clientX - canvasRect.left - dragOffset.x;
      const newY = e.clientY - canvasRect.top - dragOffset.y;

      updateNode(selectedNode.id, {
        position_x: Math.max(0, newX),
        position_y: Math.max(0, newY),
      });
    },
    [isDragging, selectedNode, dragOffset, updateNode]
  );

  const handleCanvasMouseUp = useCallback(() => {
    if (isDragging && selectedNode) {
      const node = nodes.find((n) => n.id === selectedNode.id);
      if (node) {
        savePositions([{ id: node.id, x: node.position_x, y: node.position_y }]);
      }
    }
    setIsDragging(false);
  }, [isDragging, selectedNode, nodes, savePositions]);

  const handleDeleteNode = async (nodeId: string) => {
    await deleteNode(nodeId);
    setSelectedNode(null);
  };

  const handleUpdateNodeConfig = (config: any) => {
    if (!selectedNode) return;
    updateNode(selectedNode.id, { config: { ...selectedNode.config, ...config } });
    setSelectedNode({ ...selectedNode, config: { ...selectedNode.config, ...config } });
  };

  const handleRunWorkflow = async () => {
    try {
      await triggerExecution({});
    } catch (error) {
      console.error('Error running workflow:', error);
    }
  };

  const getNodePosition = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    return node ? { x: node.position_x + 75, y: node.position_y + 30 } : { x: 0, y: 0 };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
        <Skeleton className="h-16 mb-4" />
        <Skeleton className="h-[calc(100vh-120px)]" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-4 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-2xl mx-auto text-center py-16"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Upgrade to Access Workflows</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Workflow automation is available on Pro, Unlimited, and Enterprise plans.
            Automate multi-agent processes, schedule tasks, and build powerful integrations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/pricing">
                View Plans
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/workflows">
                Back to Workflows
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!workflow) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex flex-col">
      <header className="bg-white dark:bg-slate-800 border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/workflows')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
          <Input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="font-semibold border-0 bg-transparent focus-visible:ring-0 text-lg w-64"
          />
          <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
            {workflow.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" size="sm" onClick={handleRunWorkflow}>
            <Play className="h-4 w-4 mr-2" />
            Run
          </Button>
          <Button size="sm" onClick={handleSaveWorkflow}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          {workflow.status !== 'active' && (
            <Button size="sm" onClick={handleActivateWorkflow} className="bg-green-600 hover:bg-green-700">
              Activate
            </Button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-white dark:bg-slate-800 border-r p-4 space-y-4">
          <div>
            <h3 className="font-semibold mb-3">Add Node</h3>
            <div className="space-y-2">
              {NODE_TYPES.map((nodeType) => (
                <Button
                  key={nodeType.type}
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => handleAddNode(nodeType.type)}
                >
                  <div className={`p-1 rounded ${nodeType.color} text-white`}>
                    <nodeType.icon className="h-3 w-3" />
                  </div>
                  {nodeType.label}
                </Button>
              ))}
            </div>
          </div>

          {selectedNode && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Node Properties</h3>
              <div className="space-y-3">
                <div>
                  <Label>Label</Label>
                  <Input
                    value={selectedNode.label}
                    onChange={(e) => {
                      updateNode(selectedNode.id, { label: e.target.value });
                      setSelectedNode({ ...selectedNode, label: e.target.value });
                    }}
                  />
                </div>

                {selectedNode.node_type === 'action' && (
                  <div>
                    <Label>Action Type</Label>
                    <Select
                      value={selectedNode.action_type}
                      onValueChange={(value) => {
                        updateNode(selectedNode.id, { action_type: value });
                        setSelectedNode({ ...selectedNode, action_type: value });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTION_TYPES.map((action) => (
                          <SelectItem key={action.type} value={action.type}>
                            {action.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedNode.node_type === 'condition' && (
                  <div>
                    <Label>Condition</Label>
                    <Input
                      value={selectedNode.config?.condition || ''}
                      onChange={(e) => handleUpdateNodeConfig({ condition: e.target.value })}
                      placeholder="e.g., data.value > 10"
                    />
                  </div>
                )}

                {selectedNode.node_type === 'delay' && (
                  <div>
                    <Label>Delay (seconds)</Label>
                    <Input
                      type="number"
                      value={selectedNode.config?.delay || 0}
                      onChange={(e) => handleUpdateNodeConfig({ delay: parseInt(e.target.value) })}
                    />
                  </div>
                )}

                {selectedNode.node_type !== 'trigger' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => handleDeleteNode(selectedNode.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Node
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setConnectingFrom(selectedNode.id)}
                >
                  Connect to Node
                </Button>
              </div>
            </div>
          )}
        </aside>

        <div
          ref={canvasRef}
          className="flex-1 relative overflow-auto bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAyMCAwIEwgMCAwIDAgMjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzIwMjAyMCIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]"
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: '2000px', minHeight: '1000px' }}>
            {edges.map((edge) => {
              const source = getNodePosition(edge.source_node_id);
              const target = getNodePosition(edge.target_node_id);
              return (
                <g key={edge.id}>
                  <path
                    d={`M ${source.x} ${source.y} C ${source.x} ${(source.y + target.y) / 2}, ${target.x} ${(source.y + target.y) / 2}, ${target.x} ${target.y}`}
                    stroke="#3b82f6"
                    strokeWidth="2"
                    fill="none"
                    markerEnd="url(#arrowhead)"
                  />
                </g>
              );
            })}
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
              </marker>
            </defs>
          </svg>

          {nodes.map((node) => (
            <motion.div
              key={node.id}
              className={`absolute cursor-pointer select-none ${
                selectedNode?.id === node.id ? 'ring-2 ring-blue-500' : ''
              } ${connectingFrom === node.id ? 'ring-2 ring-green-500' : ''}`}
              style={{
                left: node.position_x,
                top: node.position_y,
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => handleNodeClick(node)}
              onMouseDown={(e) => handleNodeDragStart(e, node)}
            >
              <Card className="w-[150px] shadow-lg">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1.5 rounded ${
                        node.node_type === 'trigger'
                          ? 'bg-orange-500'
                          : node.node_type === 'condition'
                          ? 'bg-yellow-500'
                          : node.node_type === 'delay'
                          ? 'bg-purple-500'
                          : node.node_type === 'end'
                          ? 'bg-green-500'
                          : 'bg-blue-500'
                      } text-white`}
                    >
                      {node.node_type === 'trigger' ? (
                        <Play className="h-3 w-3" />
                      ) : node.node_type === 'condition' ? (
                        <GitBranch className="h-3 w-3" />
                      ) : node.node_type === 'delay' ? (
                        <Timer className="h-3 w-3" />
                      ) : node.node_type === 'end' ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <Zap className="h-3 w-3" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{node.label}</div>
                      <div className="text-xs text-slate-500 capitalize truncate">
                        {node.action_type || node.node_type}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {connectingFrom && (
            <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
              Click on a node to connect, or press Escape to cancel
            </div>
          )}
        </div>
      </div>

      <Sheet open={showSettings} onOpenChange={setShowSettings}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Workflow Settings</SheetTitle>
            <SheetDescription>Configure your workflow settings</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div>
              <Label>Name</Label>
              <Input
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div>
              <Label>Trigger Type</Label>
              <Select value={triggerType} onValueChange={setTriggerType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                  <SelectItem value="schedule">Schedule</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSaveWorkflow} className="w-full">
              Save Settings
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={showHistory} onOpenChange={setShowHistory}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Execution History</SheetTitle>
            <SheetDescription>View past workflow executions</SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-150px)] mt-4">
            <div className="space-y-3">
              {executions.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No executions yet</p>
              ) : (
                executions.map((execution) => (
                  <Card key={execution.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {execution.status === 'completed' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : execution.status === 'failed' ? (
                            <XCircle className="h-4 w-4 text-red-500" />
                          ) : execution.status === 'running' ? (
                            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                          ) : (
                            <Clock className="h-4 w-4 text-slate-400" />
                          )}
                          <span className="font-medium capitalize">{execution.status}</span>
                        </div>
                        <Badge variant="outline">{execution.trigger_type}</Badge>
                      </div>
                      <div className="text-sm text-slate-500">
                        {formatDistanceToNow(new Date(execution.created_at), { addSuffix: true })}
                      </div>
                      {execution.duration_ms > 0 && (
                        <div className="text-xs text-slate-400 mt-1">
                          Duration: {execution.duration_ms}ms
                        </div>
                      )}
                      {execution.error_message && (
                        <div className="text-xs text-red-500 mt-1">{execution.error_message}</div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
