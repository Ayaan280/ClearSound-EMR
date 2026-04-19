import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function getPexelsUrl(productName: string): string {
  const seeds: Record<string, string> = {
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
    book: "159866",
    coffee: "312418",
    speaker: "1279107",
    tv: "1571457",
    printer: "4792271",
    vacuum: "4108715",
    blender: "3184183",
  };
  const lower = productName.toLowerCase();
  for (const [keyword, id] of Object.entries(seeds)) {
    if (lower.includes(keyword)) {
      return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=400`;
    }
  }
  return `https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=400`;
}

async function runLLM(systemPrompt: string, userMessage: string): Promise<string> {
  const session = new Supabase.ai.Session("mistral");
  const stream = await session.run(
    { messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMessage }] },
    { stream: false }
  ) as unknown as { choices: { message: { content: string } }[] };

  if (stream?.choices?.[0]?.message?.content) {
    return stream.choices[0].message.content;
  }
  return "";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { action, payload } = await req.json();

    if (action === "chat_decision") {
      const { conversationHistory, questionCount, maxQuestions } = payload;

      const systemPrompt = `You are Findify, a smart AI shopping assistant. Analyze the conversation and decide if you have enough info to recommend products.

You need at minimum: product type AND budget to proceed.
Rules:
- Always ask for budget if not mentioned
- Never re-ask what the user already told you
- Be conversational and friendly
- If questions asked >= max questions, set ready to true
- Keep questions short and focused

Respond with ONLY valid JSON in this exact format (no markdown, no code blocks):
{"ready": false, "next_question": "Your question here?", "collected_info": {}}`;

      const userMessage = `CONVERSATION:
${conversationHistory}

QUESTIONS ASKED: ${questionCount}
MAX QUESTIONS: ${maxQuestions}

Should we proceed to recommendations? If not, what should we ask next?`;

      let text = "";
      try {
        text = await runLLM(systemPrompt, userMessage);
      } catch (e) {
        console.error("LLM error:", e);
      }

      let decision = { ready: false, next_question: "What's your budget for this purchase?", collected_info: {} };
      try {
        const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) decision = JSON.parse(jsonMatch[0]);
      } catch { /* use default */ }

      return new Response(JSON.stringify(decision), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "recommend_products") {
      const { conversationHistory } = payload;

      const systemPrompt = `You are a product recommendation expert. Based on the conversation, recommend exactly 3 real products with variety (budget, mid-range, premium).

IMPORTANT:
- Return ONLY valid JSON, no markdown, no code blocks
- Include 3 products
- If price exceeds user budget, set budget_matched to false and explain in budget_note
- Be specific with real product names and realistic prices

Format (no markdown):
{"products": [{"name": "Exact Product Name", "price": "$XX", "description": "2-3 sentence description", "rating": 4.5, "features": ["feature1", "feature2", "feature3"], "budget_matched": true, "budget_note": ""}]}`;

      let text = "";
      try {
        text = await runLLM(systemPrompt, conversationHistory);
      } catch (e) {
        console.error("LLM error:", e);
      }

      let productData = {
        products: [
          { name: "Budget Option", price: "$50", description: "A great budget-friendly choice that meets your basic needs.", rating: 4.0, features: ["Reliable", "Affordable", "Easy to use"], budget_matched: true, budget_note: "" },
          { name: "Mid-Range Option", price: "$150", description: "Best value for money with excellent features.", rating: 4.5, features: ["Quality build", "Durable", "Great performance"], budget_matched: true, budget_note: "" },
          { name: "Premium Option", price: "$300", description: "Top of the line performance for demanding users.", rating: 4.8, features: ["Premium materials", "Advanced features", "Long warranty"], budget_matched: false, budget_note: "Above budget but best quality available" },
        ]
      };

      try {
        const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.products && Array.isArray(parsed.products) && parsed.products.length > 0) {
            productData = parsed;
          }
        }
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

      const systemPrompt = `You are a personalized shopping assistant. Based on the user's search history, recommend 6 products they would love.

Return ONLY valid JSON (no markdown, no code blocks):
{"recommendations": [{"name": "Product Name", "price": "$XX", "description": "2-3 sentence description", "rating": 4.5, "why_recommended": "1 sentence explaining why this suits them"}]}`;

      let text = "";
      try {
        text = await runLLM(systemPrompt, historyText);
      } catch (e) {
        console.error("LLM error:", e);
      }

      let recData = {
        recommendations: [
          { name: "Recommended Item", price: "$99", description: "Based on your preferences, this is a great match.", rating: 4.3, why_recommended: "Matches your search history and preferences" },
        ]
      };

      try {
        const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.recommendations && Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0) {
            recData = parsed;
          }
        }
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
