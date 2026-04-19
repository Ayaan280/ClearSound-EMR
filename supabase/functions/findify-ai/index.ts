import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PEXELS_SEARCH = (query: string) =>
  `https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=400`;

function getPexelsUrl(productName: string): string {
  const encoded = encodeURIComponent(productName.replace(/[^a-zA-Z0-9 ]/g, "").trim());
  const seeds: Record<string, string> = {
    default: "90946",
    headphone: "3587478",
    laptop: "18105",
    phone: "1092644",
    camera: "90946",
    watch: "190819",
    shoe: "1598505",
    bag: "1152077",
    chair: "1350789",
    desk: "667838",
    keyboard: "1714208",
    monitor: "1029757",
    tablet: "1334597",
  };
  const lower = productName.toLowerCase();
  for (const [keyword, id] of Object.entries(seeds)) {
    if (lower.includes(keyword)) {
      return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=400`;
    }
  }
  return `https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=400`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { action, payload } = await req.json();

    if (action === "chat_decision") {
      const { conversationHistory, questionCount, maxQuestions } = payload;

      const session = new Supabase.ai.Session("gte-small");

      const prompt = `You are Findify, a smart AI shopping assistant. Analyze the conversation and decide if you have enough info to recommend products.

CONVERSATION:
${conversationHistory}

QUESTIONS ASKED: ${questionCount}
MAX QUESTIONS: ${maxQuestions}

You need at minimum: product type AND budget to proceed.
Rules:
- Always ask for budget if not mentioned
- Never re-ask what the user already told you
- Be friendly, use emojis
- If questions asked >= max, set ready to true

Respond with ONLY valid JSON in this exact format:
{"ready": boolean, "next_question": "string or empty if ready", "collected_info": {}}`;

      const result = await session.run(prompt, { mean_pool: true, normalize: true });

      let decision = { ready: false, next_question: "What's your budget for this purchase? 💰", collected_info: {} };
      try {
        const text = typeof result === "string" ? result : JSON.stringify(result);
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) decision = JSON.parse(jsonMatch[0]);
      } catch { /* use default */ }

      return new Response(JSON.stringify(decision), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "recommend_products") {
      const { conversationHistory } = payload;

      const session = new Supabase.ai.Session("gte-small");

      const prompt = `You are a product recommendation expert. Based on this conversation, recommend 3 real products.

${conversationHistory}

Respond with ONLY valid JSON:
{"products": [{"name": "Product Name", "price": "$XX", "description": "brief description", "rating": 4.5, "features": ["feat1","feat2"], "budget_matched": true, "budget_note": ""}]}

Include 3 products: budget, mid-range, premium. Be honest if price exceeds budget.`;

      const result = await session.run(prompt, { mean_pool: true, normalize: true });

      let productData = {
        products: [
          { name: "Budget Option", price: "$50", description: "A great budget-friendly choice", rating: 4.0, features: ["Reliable", "Affordable"], budget_matched: true, budget_note: "" },
          { name: "Mid-Range Option", price: "$150", description: "Best value for money", rating: 4.5, features: ["Quality", "Durable"], budget_matched: true, budget_note: "" },
          { name: "Premium Option", price: "$300", description: "Top of the line performance", rating: 4.8, features: ["Premium", "Advanced"], budget_matched: false, budget_note: "Above budget but best quality" },
        ]
      };

      try {
        const text = typeof result === "string" ? result : JSON.stringify(result);
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) productData = JSON.parse(jsonMatch[0]);
      } catch { /* use defaults */ }

      const productsWithImages = productData.products.map((product: { name: string; price: string; description: string; rating: number; features: string[]; budget_matched: boolean; budget_note: string }) => ({
        ...product,
        image_url: getPexelsUrl(product.name),
        search_url: `https://www.google.com/search?q=${encodeURIComponent(product.name + " buy")}`,
      }));

      return new Response(JSON.stringify({ products: productsWithImages }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "for_you_recommendations") {
      const { historyText } = payload;

      const session = new Supabase.ai.Session("gte-small");

      const prompt = `You are a personalized shopping assistant. Based on this user's search history, recommend 6 products they'd love.

${historyText}

Respond with ONLY valid JSON:
{"recommendations": [{"name": "Product Name", "price": "$XX", "description": "brief desc", "rating": 4.5, "why_recommended": "reason"}]}`;

      const result = await session.run(prompt, { mean_pool: true, normalize: true });

      let recData = {
        recommendations: [
          { name: "Recommended Item", price: "$99", description: "Based on your preferences", rating: 4.3, why_recommended: "Matches your search history" },
        ]
      };

      try {
        const text = typeof result === "string" ? result : JSON.stringify(result);
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) recData = JSON.parse(jsonMatch[0]);
      } catch { /* use defaults */ }

      const recsWithImages = recData.recommendations.map((product: { name: string; price: string; description: string; rating: number; why_recommended: string }) => ({
        ...product,
        image_url: getPexelsUrl(product.name),
        search_url: `https://www.google.com/search?q=${encodeURIComponent(product.name + " buy")}`,
      }));

      return new Response(JSON.stringify({ recommendations: recsWithImages }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
