/*
  # Create Webhook Event Triggers

  1. Trigger Functions
    - Functions to capture database changes and queue webhook events
    - Covers swarms, agents, messages, tools operations

  2. Triggers
    - swarm_webhook_trigger - fires on swarm INSERT/UPDATE/DELETE
    - agent_webhook_trigger - fires on agent INSERT/UPDATE/DELETE
    - message_webhook_trigger - fires on message INSERT
    - tool_usage_webhook_trigger - fires on tool_usage INSERT

  3. Event Types Supported
    - swarm.created, swarm.updated, swarm.deleted
    - agent.created, agent.updated, agent.deleted
    - message.created
    - tool.executed
*/

CREATE OR REPLACE FUNCTION public.trigger_swarm_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_type text;
  v_payload jsonb;
  v_user_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_event_type := 'swarm.created';
    v_user_id := NEW.owner_id;
    v_payload := jsonb_build_object(
      'id', NEW.id,
      'name', NEW.name,
      'description', NEW.description,
      'status', NEW.status,
      'owner_id', NEW.owner_id,
      'created_at', NEW.created_at
    );
  ELSIF TG_OP = 'UPDATE' THEN
    v_event_type := 'swarm.updated';
    v_user_id := NEW.owner_id;
    v_payload := jsonb_build_object(
      'id', NEW.id,
      'name', NEW.name,
      'description', NEW.description,
      'status', NEW.status,
      'owner_id', NEW.owner_id,
      'updated_at', NEW.updated_at,
      'changes', jsonb_build_object(
        'name', CASE WHEN OLD.name != NEW.name THEN jsonb_build_object('old', OLD.name, 'new', NEW.name) ELSE NULL END,
        'description', CASE WHEN OLD.description != NEW.description THEN jsonb_build_object('old', OLD.description, 'new', NEW.description) ELSE NULL END,
        'status', CASE WHEN OLD.status != NEW.status THEN jsonb_build_object('old', OLD.status, 'new', NEW.status) ELSE NULL END
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_event_type := 'swarm.deleted';
    v_user_id := OLD.owner_id;
    v_payload := jsonb_build_object(
      'id', OLD.id,
      'name', OLD.name,
      'owner_id', OLD.owner_id,
      'deleted_at', now()
    );
  END IF;

  PERFORM public.queue_webhook_event(
    v_user_id,
    v_event_type,
    'swarm',
    COALESCE(NEW.id, OLD.id),
    v_payload
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_agent_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_type text;
  v_payload jsonb;
  v_user_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_event_type := 'agent.created';
    v_user_id := NEW.owner_id;
    v_payload := jsonb_build_object(
      'id', NEW.id,
      'name', NEW.name,
      'type', NEW.type,
      'role', NEW.role,
      'status', NEW.status,
      'model', NEW.model,
      'owner_id', NEW.owner_id,
      'created_at', NEW.created_at
    );
  ELSIF TG_OP = 'UPDATE' THEN
    v_event_type := 'agent.updated';
    v_user_id := NEW.owner_id;
    v_payload := jsonb_build_object(
      'id', NEW.id,
      'name', NEW.name,
      'type', NEW.type,
      'role', NEW.role,
      'status', NEW.status,
      'model', NEW.model,
      'owner_id', NEW.owner_id,
      'updated_at', NEW.updated_at
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_event_type := 'agent.deleted';
    v_user_id := OLD.owner_id;
    v_payload := jsonb_build_object(
      'id', OLD.id,
      'name', OLD.name,
      'owner_id', OLD.owner_id,
      'deleted_at', now()
    );
  END IF;

  PERFORM public.queue_webhook_event(
    v_user_id,
    v_event_type,
    'agent',
    COALESCE(NEW.id, OLD.id),
    v_payload
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_message_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payload jsonb;
  v_swarm_owner uuid;
BEGIN
  SELECT owner_id INTO v_swarm_owner
  FROM public.swarms
  WHERE id = NEW.swarm_id;

  IF v_swarm_owner IS NULL THEN
    RETURN NEW;
  END IF;

  v_payload := jsonb_build_object(
    'id', NEW.id,
    'swarm_id', NEW.swarm_id,
    'sender_type', NEW.sender_type,
    'sender_id', NEW.sender_id,
    'content', LEFT(NEW.content, 500),
    'message_type', NEW.message_type,
    'created_at', NEW.created_at
  );

  PERFORM public.queue_webhook_event(
    v_swarm_owner,
    'message.created',
    'message',
    NEW.id,
    v_payload
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_tool_usage_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payload jsonb;
  v_tool_name text;
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT name INTO v_tool_name
  FROM public.tools
  WHERE id = NEW.tool_id;

  v_payload := jsonb_build_object(
    'id', NEW.id,
    'tool_id', NEW.tool_id,
    'tool_name', v_tool_name,
    'agent_id', NEW.agent_id,
    'swarm_id', NEW.swarm_id,
    'action_type', NEW.action_type,
    'status', NEW.status,
    'execution_time_ms', NEW.execution_time_ms,
    'created_at', NEW.used_at
  );

  PERFORM public.queue_webhook_event(
    NEW.user_id,
    'tool.executed',
    'tool_usage',
    NEW.id,
    v_payload
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS swarm_webhook_trigger ON public.swarms;
CREATE TRIGGER swarm_webhook_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.swarms
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_swarm_webhook();

DROP TRIGGER IF EXISTS agent_webhook_trigger ON public.agents;
CREATE TRIGGER agent_webhook_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.agents
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_agent_webhook();

DROP TRIGGER IF EXISTS message_webhook_trigger ON public.messages;
CREATE TRIGGER message_webhook_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_message_webhook();

DROP TRIGGER IF EXISTS tool_usage_webhook_trigger ON public.tool_usage;
CREATE TRIGGER tool_usage_webhook_trigger
  AFTER INSERT ON public.tool_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_tool_usage_webhook();
