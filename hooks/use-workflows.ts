'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface Workflow {
  id: string;
  user_id: string;
  organization_id: string | null;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  trigger_type: 'manual' | 'webhook' | 'schedule' | 'event';
  trigger_config: any;
  is_template: boolean;
  template_category: string;
  settings: any;
  created_at: string;
  updated_at: string;
}

export interface WorkflowNode {
  id: string;
  workflow_id: string;
  node_type: 'trigger' | 'condition' | 'action' | 'delay' | 'loop' | 'end';
  action_type: string;
  label: string;
  config: any;
  position_x: number;
  position_y: number;
  created_at: string;
}

export interface WorkflowEdge {
  id: string;
  workflow_id: string;
  source_node_id: string;
  target_node_id: string;
  source_handle: string;
  label: string;
  created_at: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  trigger_type: string;
  trigger_data: any;
  started_at: string | null;
  completed_at: string | null;
  error_message: string;
  duration_ms: number;
  created_at: string;
}

export interface WorkflowExecutionStep {
  id: string;
  execution_id: string;
  node_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  input_data: any;
  output_data: any;
  error_message: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export function useWorkflows(organizationId?: string) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setWorkflows([]);
        setLoading(false);
        return;
      }

      let query = supabase
        .from('workflows')
        .select('*')
        .eq('is_template', false)
        .order('updated_at', { ascending: false });

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      } else {
        query = query.eq('user_id', user.id).is('organization_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;
      setWorkflows(data || []);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      toast.error('Failed to load workflows');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  const createWorkflow = async (data: Partial<Workflow>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: workflow, error } = await supabase
        .from('workflows')
        .insert({
          user_id: user.id,
          name: data.name || 'New Workflow',
          description: data.description || '',
          trigger_type: data.trigger_type || 'manual',
          organization_id: data.organization_id || null,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;

      const { error: nodeError } = await supabase
        .from('workflow_nodes')
        .insert({
          workflow_id: workflow.id,
          node_type: 'trigger',
          action_type: data.trigger_type || 'manual',
          label: 'Start',
          position_x: 250,
          position_y: 50,
          config: {},
        });

      if (nodeError) throw nodeError;

      toast.success('Workflow created');
      fetchWorkflows();
      return workflow;
    } catch (error) {
      console.error('Error creating workflow:', error);
      toast.error('Failed to create workflow');
      throw error;
    }
  };

  const updateWorkflow = async (id: string, updates: Partial<Workflow>) => {
    try {
      const { error } = await supabase
        .from('workflows')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Workflow updated');
      fetchWorkflows();
    } catch (error) {
      console.error('Error updating workflow:', error);
      toast.error('Failed to update workflow');
      throw error;
    }
  };

  const deleteWorkflow = async (id: string) => {
    try {
      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Workflow deleted');
      fetchWorkflows();
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast.error('Failed to delete workflow');
      throw error;
    }
  };

  const duplicateWorkflow = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: original, error: fetchError } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !original) throw fetchError;

      const { data: newWorkflow, error: createError } = await supabase
        .from('workflows')
        .insert({
          user_id: user.id,
          name: `${original.name} (Copy)`,
          description: original.description,
          trigger_type: original.trigger_type,
          trigger_config: original.trigger_config,
          settings: original.settings,
          organization_id: original.organization_id,
          status: 'draft',
        })
        .select()
        .single();

      if (createError) throw createError;

      const { data: nodes } = await supabase
        .from('workflow_nodes')
        .select('*')
        .eq('workflow_id', id);

      if (nodes && nodes.length > 0) {
        const nodeMapping: Record<string, string> = {};
        const newNodes = nodes.map((node) => {
          const newId = crypto.randomUUID();
          nodeMapping[node.id] = newId;
          return {
            id: newId,
            workflow_id: newWorkflow.id,
            node_type: node.node_type,
            action_type: node.action_type,
            label: node.label,
            config: node.config,
            position_x: node.position_x,
            position_y: node.position_y,
          };
        });

        await supabase.from('workflow_nodes').insert(newNodes);

        const { data: edges } = await supabase
          .from('workflow_edges')
          .select('*')
          .eq('workflow_id', id);

        if (edges && edges.length > 0) {
          const newEdges = edges.map((edge) => ({
            workflow_id: newWorkflow.id,
            source_node_id: nodeMapping[edge.source_node_id],
            target_node_id: nodeMapping[edge.target_node_id],
            source_handle: edge.source_handle,
            label: edge.label,
          }));

          await supabase.from('workflow_edges').insert(newEdges);
        }
      }

      toast.success('Workflow duplicated');
      fetchWorkflows();
      return newWorkflow;
    } catch (error) {
      console.error('Error duplicating workflow:', error);
      toast.error('Failed to duplicate workflow');
      throw error;
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  return {
    workflows,
    loading,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    duplicateWorkflow,
    refetch: fetchWorkflows,
  };
}

export function useWorkflow(workflowId: string) {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkflow = useCallback(async () => {
    if (!workflowId) return;

    setLoading(true);
    try {
      const { data: workflowData, error: workflowError } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (workflowError) throw workflowError;
      setWorkflow(workflowData);

      const { data: nodesData, error: nodesError } = await supabase
        .from('workflow_nodes')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('created_at');

      if (nodesError) throw nodesError;
      setNodes(nodesData || []);

      const { data: edgesData, error: edgesError } = await supabase
        .from('workflow_edges')
        .select('*')
        .eq('workflow_id', workflowId);

      if (edgesError) throw edgesError;
      setEdges(edgesData || []);
    } catch (error) {
      console.error('Error fetching workflow:', error);
      toast.error('Failed to load workflow');
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  const addNode = async (node: Partial<WorkflowNode>) => {
    try {
      const { data, error } = await supabase
        .from('workflow_nodes')
        .insert({
          workflow_id: workflowId,
          node_type: node.node_type || 'action',
          action_type: node.action_type || '',
          label: node.label || 'New Node',
          config: node.config || {},
          position_x: node.position_x || 250,
          position_y: node.position_y || 200,
        })
        .select()
        .single();

      if (error) throw error;

      setNodes((prev) => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error adding node:', error);
      toast.error('Failed to add node');
      throw error;
    }
  };

  const updateNode = async (nodeId: string, updates: Partial<WorkflowNode>) => {
    try {
      const { error } = await supabase
        .from('workflow_nodes')
        .update(updates)
        .eq('id', nodeId);

      if (error) throw error;

      setNodes((prev) =>
        prev.map((n) => (n.id === nodeId ? { ...n, ...updates } : n))
      );
    } catch (error) {
      console.error('Error updating node:', error);
      throw error;
    }
  };

  const deleteNode = async (nodeId: string) => {
    try {
      const { error } = await supabase
        .from('workflow_nodes')
        .delete()
        .eq('id', nodeId);

      if (error) throw error;

      setNodes((prev) => prev.filter((n) => n.id !== nodeId));
      setEdges((prev) =>
        prev.filter((e) => e.source_node_id !== nodeId && e.target_node_id !== nodeId)
      );
    } catch (error) {
      console.error('Error deleting node:', error);
      toast.error('Failed to delete node');
      throw error;
    }
  };

  const addEdge = async (edge: Partial<WorkflowEdge>) => {
    try {
      const existing = edges.find(
        (e) =>
          e.source_node_id === edge.source_node_id &&
          e.target_node_id === edge.target_node_id
      );

      if (existing) return existing;

      const { data, error } = await supabase
        .from('workflow_edges')
        .insert({
          workflow_id: workflowId,
          source_node_id: edge.source_node_id,
          target_node_id: edge.target_node_id,
          source_handle: edge.source_handle || 'default',
          label: edge.label || '',
        })
        .select()
        .single();

      if (error) throw error;

      setEdges((prev) => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error adding edge:', error);
      toast.error('Failed to connect nodes');
      throw error;
    }
  };

  const deleteEdge = async (edgeId: string) => {
    try {
      const { error } = await supabase
        .from('workflow_edges')
        .delete()
        .eq('id', edgeId);

      if (error) throw error;

      setEdges((prev) => prev.filter((e) => e.id !== edgeId));
    } catch (error) {
      console.error('Error deleting edge:', error);
      throw error;
    }
  };

  const savePositions = async (positions: { id: string; x: number; y: number }[]) => {
    try {
      for (const pos of positions) {
        await supabase
          .from('workflow_nodes')
          .update({ position_x: pos.x, position_y: pos.y })
          .eq('id', pos.id);
      }
    } catch (error) {
      console.error('Error saving positions:', error);
    }
  };

  useEffect(() => {
    fetchWorkflow();
  }, [fetchWorkflow]);

  return {
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
    refetch: fetchWorkflow,
  };
}

export function useWorkflowExecutions(workflowId: string) {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExecutions = useCallback(async () => {
    if (!workflowId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('workflow_executions')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setExecutions(data || []);
    } catch (error) {
      console.error('Error fetching executions:', error);
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  const triggerExecution = async (triggerData: any = {}) => {
    try {
      const { data, error } = await supabase
        .from('workflow_executions')
        .insert({
          workflow_id: workflowId,
          status: 'pending',
          trigger_type: 'manual',
          trigger_data: triggerData,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Workflow execution started');
      fetchExecutions();
      return data;
    } catch (error) {
      console.error('Error triggering execution:', error);
      toast.error('Failed to start workflow');
      throw error;
    }
  };

  useEffect(() => {
    fetchExecutions();
  }, [fetchExecutions]);

  return {
    executions,
    loading,
    triggerExecution,
    refetch: fetchExecutions,
  };
}

export function useWorkflowTemplates() {
  const [templates, setTemplates] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('workflows')
          .select('*')
          .eq('is_template', true)
          .order('name');

        if (error) throw error;
        setTemplates(data || []);
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const createFromTemplate = async (templateId: string, name: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: template, error: fetchError } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', templateId)
        .single();

      if (fetchError || !template) throw fetchError;

      const { data: newWorkflow, error: createError } = await supabase
        .from('workflows')
        .insert({
          user_id: user.id,
          name,
          description: template.description,
          trigger_type: template.trigger_type,
          trigger_config: template.trigger_config,
          settings: template.settings,
          status: 'draft',
        })
        .select()
        .single();

      if (createError) throw createError;

      const { data: nodes } = await supabase
        .from('workflow_nodes')
        .select('*')
        .eq('workflow_id', templateId);

      if (nodes && nodes.length > 0) {
        const nodeMapping: Record<string, string> = {};
        const newNodes = nodes.map((node) => {
          const newId = crypto.randomUUID();
          nodeMapping[node.id] = newId;
          return {
            id: newId,
            workflow_id: newWorkflow.id,
            node_type: node.node_type,
            action_type: node.action_type,
            label: node.label,
            config: node.config,
            position_x: node.position_x,
            position_y: node.position_y,
          };
        });

        await supabase.from('workflow_nodes').insert(newNodes);

        const { data: edges } = await supabase
          .from('workflow_edges')
          .select('*')
          .eq('workflow_id', templateId);

        if (edges && edges.length > 0) {
          const newEdges = edges.map((edge) => ({
            workflow_id: newWorkflow.id,
            source_node_id: nodeMapping[edge.source_node_id],
            target_node_id: nodeMapping[edge.target_node_id],
            source_handle: edge.source_handle,
            label: edge.label,
          }));

          await supabase.from('workflow_edges').insert(newEdges);
        }
      } else {
        await supabase
          .from('workflow_nodes')
          .insert({
            workflow_id: newWorkflow.id,
            node_type: 'trigger',
            action_type: template.trigger_type,
            label: 'Start',
            position_x: 250,
            position_y: 50,
            config: {},
          });
      }

      toast.success('Workflow created from template');
      return newWorkflow;
    } catch (error) {
      console.error('Error creating from template:', error);
      toast.error('Failed to create workflow');
      throw error;
    }
  };

  return {
    templates,
    loading,
    createFromTemplate,
  };
}
