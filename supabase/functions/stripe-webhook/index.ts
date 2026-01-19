import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@14.14.0";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import { createLogger, logRequestStart } from "../_shared/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const PRICE_TO_PLAN: Record<string, string> = {};

function initPriceMappings() {
  const proPriceId = Deno.env.get("STRIPE_PRO_PRICE_ID");
  const unlimitedPriceId = Deno.env.get("STRIPE_UNLIMITED_PRICE_ID");
  const enterprisePriceId = Deno.env.get("STRIPE_ENTERPRISE_PRICE_ID");

  if (proPriceId) PRICE_TO_PLAN[proPriceId] = "pro";
  if (unlimitedPriceId) PRICE_TO_PLAN[unlimitedPriceId] = "unlimited";
  if (enterprisePriceId) PRICE_TO_PLAN[enterprisePriceId] = "enterprise";
}

initPriceMappings();

function getPlanFromPriceId(priceId: string, logger?: ReturnType<typeof createLogger>): string {
  if (PRICE_TO_PLAN[priceId]) {
    return PRICE_TO_PLAN[priceId];
  }
  logger?.warn("Unknown price ID, defaulting to pro", { price_id: priceId });
  return "pro";
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, logger: ReturnType<typeof createLogger>) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  const userId = session.metadata?.user_id;
  const plan = session.metadata?.plan || "pro";

  if (!userId) {
    logger.error("No user_id in session metadata", null, { session_id: session.id });
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price?.id;

  await supabaseAdmin.from("stripe_subscriptions").upsert(
    {
      customer_id: customerId,
      subscription_id: subscriptionId,
      price_id: priceId,
      status: subscription.status as any,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      trial_ends_at: subscription.trial_end,
      plan_name: plan,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "customer_id" }
  );

  await supabaseAdmin
    .from("profiles")
    .update({ plan, updated_at: new Date().toISOString() })
    .eq("id", userId);

  await supabaseAdmin.from("stripe_orders").insert({
    checkout_session_id: session.id,
    payment_intent_id: session.payment_intent as string || null,
    customer_id: customerId,
    amount_subtotal: session.amount_subtotal || 0,
    amount_total: session.amount_total || 0,
    currency: session.currency || "usd",
    payment_status: session.payment_status,
    status: "completed",
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription, logger: ReturnType<typeof createLogger>) {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price?.id;
  const plan = getPlanFromPriceId(priceId || "", logger);

  await supabaseAdmin.from("stripe_subscriptions").upsert(
    {
      customer_id: customerId,
      subscription_id: subscription.id,
      price_id: priceId,
      status: subscription.status as any,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      trial_ends_at: subscription.trial_end,
      plan_name: plan,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "customer_id" }
  );

  const { data: customer } = await supabaseAdmin
    .from("stripe_customers")
    .select("user_id")
    .eq("customer_id", customerId)
    .maybeSingle();

  if (customer?.user_id) {
    const isActive = subscription.status === "active" || subscription.status === "trialing";
    await supabaseAdmin
      .from("profiles")
      .update({
        plan: isActive ? plan : "free",
        updated_at: new Date().toISOString(),
      })
      .eq("id", customer.user_id);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  await supabaseAdmin
    .from("stripe_subscriptions")
    .update({
      status: "canceled",
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("customer_id", customerId);

  const { data: customer } = await supabaseAdmin
    .from("stripe_customers")
    .select("user_id")
    .eq("customer_id", customerId)
    .maybeSingle();

  if (customer?.user_id) {
    await supabaseAdmin
      .from("profiles")
      .update({ plan: "free", updated_at: new Date().toISOString() })
      .eq("id", customer.user_id);
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const { data: customer } = await supabaseAdmin
    .from("stripe_customers")
    .select("user_id")
    .eq("customer_id", customerId)
    .maybeSingle();

  if (!customer?.user_id) return;

  await supabaseAdmin.from("billing_history").upsert(
    {
      user_id: customer.user_id,
      stripe_invoice_id: invoice.id,
      stripe_payment_intent_id: invoice.payment_intent as string || null,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: "paid",
      description: invoice.lines.data[0]?.description || "Subscription payment",
      invoice_pdf: invoice.invoice_pdf || null,
      hosted_invoice_url: invoice.hosted_invoice_url || null,
      period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
      period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
      metadata: { invoice_number: invoice.number },
    },
    { onConflict: "stripe_invoice_id" }
  );
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const { data: customer } = await supabaseAdmin
    .from("stripe_customers")
    .select("user_id")
    .eq("customer_id", customerId)
    .maybeSingle();

  if (!customer?.user_id) return;

  await supabaseAdmin.from("billing_history").upsert(
    {
      user_id: customer.user_id,
      stripe_invoice_id: invoice.id,
      stripe_payment_intent_id: invoice.payment_intent as string || null,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: "failed",
      description: invoice.lines.data[0]?.description || "Failed payment",
      invoice_pdf: invoice.invoice_pdf || null,
      hosted_invoice_url: invoice.hosted_invoice_url || null,
      period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
      period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
      metadata: { invoice_number: invoice.number, failure_reason: "Payment failed" },
    },
    { onConflict: "stripe_invoice_id" }
  );
}

async function handlePaymentMethodUpdated(paymentMethod: Stripe.PaymentMethod) {
  const customerId = paymentMethod.customer as string;
  if (!customerId) return;

  const card = paymentMethod.card;
  if (!card) return;

  await supabaseAdmin
    .from("stripe_subscriptions")
    .update({
      payment_method_brand: card.brand,
      payment_method_last4: card.last4,
      updated_at: new Date().toISOString(),
    })
    .eq("customer_id", customerId);
}

async function handleTrialWillEnd(subscription: Stripe.Subscription, logger: ReturnType<typeof createLogger>) {
  const customerId = subscription.customer as string;
  const trialEnd = subscription.trial_end;

  const { data: customer } = await supabaseAdmin
    .from("stripe_customers")
    .select("user_id")
    .eq("customer_id", customerId)
    .maybeSingle();

  if (!customer?.user_id) return;

  logger.info("Trial ending soon", { trial_ends_at: trialEnd });

  await supabaseAdmin.from("activity_log").insert({
    user_id: customer.user_id,
    action: "trial_ending_soon",
    resource_type: "subscription",
    resource_id: subscription.id,
    metadata: {
      trial_end: trialEnd ? new Date(trialEnd * 1000).toISOString() : null,
      days_remaining: trialEnd ? Math.ceil((trialEnd * 1000 - Date.now()) / (1000 * 60 * 60 * 24)) : 0,
    },
  });
}

async function handleSubscriptionPaused(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  await supabaseAdmin
    .from("stripe_subscriptions")
    .update({
      status: "paused",
      updated_at: new Date().toISOString(),
    })
    .eq("customer_id", customerId);

  const { data: customer } = await supabaseAdmin
    .from("stripe_customers")
    .select("user_id")
    .eq("customer_id", customerId)
    .maybeSingle();

  if (customer?.user_id) {
    await supabaseAdmin
      .from("profiles")
      .update({ plan: "free", updated_at: new Date().toISOString() })
      .eq("id", customer.user_id);
  }
}

async function handleSubscriptionResumed(subscription: Stripe.Subscription, logger: ReturnType<typeof createLogger>) {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price?.id;
  const plan = getPlanFromPriceId(priceId || "", logger);

  await supabaseAdmin
    .from("stripe_subscriptions")
    .update({
      status: subscription.status,
      plan_name: plan,
      updated_at: new Date().toISOString(),
    })
    .eq("customer_id", customerId);

  const { data: customer } = await supabaseAdmin
    .from("stripe_customers")
    .select("user_id")
    .eq("customer_id", customerId)
    .maybeSingle();

  if (customer?.user_id) {
    await supabaseAdmin
      .from("profiles")
      .update({ plan, updated_at: new Date().toISOString() })
      .eq("id", customer.user_id);
  }
}

Deno.serve(async (req: Request) => {
  const logger = createLogger("stripe-webhook", req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  logRequestStart(logger);

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      logger.error("Webhook signature verification failed", err);
      return new Response(
        JSON.stringify({ error: "Invalid signature", request_id: logger.getRequestId() }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-Id": logger.getRequestId() } }
      );
    }

    logger.info("Processing webhook event", { event_type: event.type, event_id: event.id });

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, logger);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, logger);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.paused":
        await handleSubscriptionPaused(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.resumed":
        await handleSubscriptionResumed(event.data.object as Stripe.Subscription, logger);
        break;

      case "customer.subscription.trial_will_end":
        await handleTrialWillEnd(event.data.object as Stripe.Subscription, logger);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoiceFailed(event.data.object as Stripe.Invoice);
        break;

      case "payment_method.attached":
      case "payment_method.updated":
        await handlePaymentMethodUpdated(event.data.object as Stripe.PaymentMethod);
        break;

      default:
        logger.debug("Unhandled event type", { event_type: event.type });
    }

    return new Response(
      JSON.stringify({ received: true, request_id: logger.getRequestId() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-Id": logger.getRequestId() } }
    );
  } catch (error) {
    logger.error("Webhook processing failed", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal error", request_id: logger.getRequestId() }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-Id": logger.getRequestId() } }
    );
  }
});