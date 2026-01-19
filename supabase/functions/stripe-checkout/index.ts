import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@14.14.0";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

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

interface PlanConfig {
  name: string;
  priceId: string;
  trialDays: number;
  features: string[];
}

const PLANS: Record<string, PlanConfig> = {
  pro: {
    name: "Pro",
    priceId: Deno.env.get("STRIPE_PRO_PRICE_ID") || "",
    trialDays: 0,
    features: [
      "10 agents",
      "10 active swarms",
      "50,000 messages/month",
      "Priority support",
      "All integrations",
      "Custom tools",
      "API access",
    ],
  },
  unlimited: {
    name: "Unlimited",
    priceId: Deno.env.get("STRIPE_UNLIMITED_PRICE_ID") || "",
    trialDays: 0,
    features: [
      "Unlimited agents",
      "Unlimited swarms",
      "Unlimited messages",
      "Priority support",
      "All integrations",
      "Custom tools",
      "API access",
      "Advanced analytics",
    ],
  },
  enterprise: {
    name: "Enterprise",
    priceId: Deno.env.get("STRIPE_ENTERPRISE_PRICE_ID") || "",
    trialDays: 0,
    features: [
      "Everything in Unlimited",
      "Dedicated support",
      "Custom integrations",
      "SSO & SAML",
      "SLA guarantee",
      "On-premise option",
      "Custom contracts",
      "Dedicated account manager",
    ],
  },
};

function validatePriceId(plan: string): boolean {
  const config = PLANS[plan];
  if (!config) return false;
  if (!config.priceId) {
    console.error(`Missing price ID for plan: ${plan}. Set STRIPE_${plan.toUpperCase()}_PRICE_ID`);
    return false;
  }
  return true;
}

async function getOrCreateCustomer(userId: string, email: string): Promise<string> {
  const { data: existingCustomer } = await supabaseAdmin
    .from("stripe_customers")
    .select("customer_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingCustomer?.customer_id) {
    return existingCustomer.customer_id;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { user_id: userId },
  });

  await supabaseAdmin.from("stripe_customers").insert({
    user_id: userId,
    customer_id: customer.id,
  });

  return customer.id;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, plan, returnUrl } = await req.json();
    const baseUrl = returnUrl || Deno.env.get("SITE_URL") || "http://localhost:3000";

    if (action === "create-checkout") {
      const planConfig = PLANS[plan as keyof typeof PLANS];
      if (!planConfig) {
        return new Response(
          JSON.stringify({ error: "Invalid plan. Available plans: pro, unlimited, enterprise" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!validatePriceId(plan)) {
        return new Response(
          JSON.stringify({ error: `Stripe price ID not configured for ${plan} plan` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const customerId = await getOrCreateCustomer(user.id, user.email!);

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        customer: customerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: planConfig.priceId, quantity: 1 }],
        success_url: `${baseUrl}/settings?tab=billing&success=true`,
        cancel_url: `${baseUrl}/settings?tab=billing&canceled=true`,
        metadata: { user_id: user.id, plan },
        allow_promotion_codes: true,
      };

      if (planConfig.trialDays > 0) {
        sessionParams.subscription_data = {
          trial_period_days: planConfig.trialDays,
          metadata: { user_id: user.id, plan },
        };
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      return new Response(
        JSON.stringify({ url: session.url, sessionId: session.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "create-portal") {
      const { data: customer } = await supabaseAdmin
        .from("stripe_customers")
        .select("customer_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!customer?.customer_id) {
        return new Response(
          JSON.stringify({ error: "No billing account found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customer.customer_id,
        return_url: `${baseUrl}/settings?tab=billing`,
      });

      return new Response(
        JSON.stringify({ url: portalSession.url }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get-subscription") {
      const { data: customer } = await supabaseAdmin
        .from("stripe_customers")
        .select("customer_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!customer?.customer_id) {
        return new Response(
          JSON.stringify({ subscription: null, plan: "free" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: subscription } = await supabaseAdmin
        .from("stripe_subscriptions")
        .select("*")
        .eq("customer_id", customer.customer_id)
        .maybeSingle();

      return new Response(
        JSON.stringify({
          subscription,
          plan: subscription?.plan_name || "free",
          isActive: subscription?.status === "active" || subscription?.status === "trialing",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get-billing-history") {
      const { data: history } = await supabaseAdmin
        .from("billing_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      return new Response(
        JSON.stringify({ history: history || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "cancel-subscription") {
      const { data: customer } = await supabaseAdmin
        .from("stripe_customers")
        .select("customer_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!customer?.customer_id) {
        return new Response(
          JSON.stringify({ error: "No billing account found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: sub } = await supabaseAdmin
        .from("stripe_subscriptions")
        .select("subscription_id")
        .eq("customer_id", customer.customer_id)
        .maybeSingle();

      if (!sub?.subscription_id) {
        return new Response(
          JSON.stringify({ error: "No active subscription found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await stripe.subscriptions.update(sub.subscription_id, {
        cancel_at_period_end: true,
      });

      await supabaseAdmin
        .from("stripe_subscriptions")
        .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
        .eq("subscription_id", sub.subscription_id);

      return new Response(
        JSON.stringify({ success: true, message: "Subscription will cancel at period end" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get-plans") {
      const availablePlans = Object.entries(PLANS)
        .filter(([key]) => validatePriceId(key))
        .map(([key, config]) => ({
          id: key,
          name: config.name,
          features: config.features,
          trialDays: config.trialDays,
        }));

      return new Response(
        JSON.stringify({ plans: availablePlans }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "resume-subscription") {
      const { data: customer } = await supabaseAdmin
        .from("stripe_customers")
        .select("customer_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!customer?.customer_id) {
        return new Response(
          JSON.stringify({ error: "No billing account found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: sub } = await supabaseAdmin
        .from("stripe_subscriptions")
        .select("subscription_id")
        .eq("customer_id", customer.customer_id)
        .maybeSingle();

      if (!sub?.subscription_id) {
        return new Response(
          JSON.stringify({ error: "No subscription found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await stripe.subscriptions.update(sub.subscription_id, {
        cancel_at_period_end: false,
      });

      await supabaseAdmin
        .from("stripe_subscriptions")
        .update({ cancel_at_period_end: false, updated_at: new Date().toISOString() })
        .eq("subscription_id", sub.subscription_id);

      return new Response(
        JSON.stringify({ success: true, message: "Subscription resumed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});