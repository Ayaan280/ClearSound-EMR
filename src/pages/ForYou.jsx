import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowLeft, Loader2, ExternalLink, Star, Heart, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import FavoriteButton from "../components/FavoriteButton";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";

function ProductRecommendationCard({ product, user }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden hover:shadow-xl transition-shadow"
    >
      {product.image_url && (
        <div className="relative h-48 bg-gradient-to-br from-indigo-50 to-violet-50 overflow-hidden">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 right-3">
            <FavoriteButton product={product} user={user} />
          </div>
        </div>
      )}

      <div className="p-5 space-y-3">
        <div>
          <h3 className="text-base font-bold text-slate-800 leading-tight line-clamp-2">
            {product.name}
          </h3>
          {product.price && (
            <p className="text-indigo-600 font-semibold text-lg mt-1">{product.price}</p>
          )}
        </div>

        <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">
          {product.description}
        </p>

        {product.rating && (
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${
                  i < Math.round(product.rating)
                    ? "text-amber-400 fill-amber-400"
                    : "text-slate-200"
                }`}
              />
            ))}
            <span className="text-xs text-slate-400 ml-1">{product.rating}/5</span>
          </div>
        )}

        {product.why_recommended && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
            <p className="text-xs text-indigo-700 leading-relaxed">
              <span className="font-semibold">Why for you:</span> {product.why_recommended}
            </p>
          </div>
        )}

        <a
          href={product.search_url || `https://www.google.com/search?q=${encodeURIComponent(product.name)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Button className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold shadow-md shadow-indigo-200/50 transition-all">
            <ExternalLink className="h-4 w-4 mr-2" />
            View Product
          </Button>
        </a>
      </div>
    </motion.div>
  );
}

export default function ForYou() {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadRecommendations = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: history } = await supabase
          .from("search_history")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20);
        if (!history) throw new Error("Failed to load history");

        if (history.length === 0) {
          setError("no_history");
          setIsLoading(false);
          return;
        }

        const historyText = history.map((h, i) =>
          `Search ${i + 1}:\n- Product: ${h.product_type}\n- Preferences: ${JSON.stringify(h.answers)}\n- Recommended: ${h.recommended_product?.name || 'N/A'}`
        ).join('\n\n');

        const recommendationsData = await base44.integrations.Core.InvokeLLM({
          prompt: `You are a personalized shopping assistant. Analyze this user's search history and recommend 6 new products they might love based on their preferences, budget range, and interests.

User's Search History:
${historyText}

Generate 6 diverse product recommendations that match their style and preferences. Include products they haven't searched for yet but would likely enjoy based on patterns in their history.

For each product:
- Find real, specific products with current market data
- Explain why it matches their preferences
- Include realistic pricing
- Vary the product types to show diversity`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    price: { type: "string" },
                    description: { type: "string" },
                    rating: { type: "number" },
                    why_recommended: { type: "string" },
                    image_prompt: { type: "string" }
                  }
                }
              }
            }
          }
        });

        const productsWithImages = await Promise.all(
          recommendationsData.recommendations.map(async (product) => {
            const imageResult = await base44.integrations.Core.GenerateImage({
              prompt: product.image_prompt || `Professional product photography of ${product.name}, clean white background, studio lighting`
            });
            return {
              ...product,
              image_url: imageResult.url,
              search_url: `https://www.google.com/search?q=${encodeURIComponent(product.name + " buy")}`
            };
          })
        );

        setRecommendations(productsWithImages);
      } catch (e) {
        console.error("Failed to load recommendations:", e);
        setError("failed");
      } finally {
        setIsLoading(false);
      }
    };

    loadRecommendations();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50/30 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Login Required</h2>
          <p className="text-slate-500 mb-4">Please log in to see personalized recommendations</p>
          <Button
            onClick={() => navigate("/Login")}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 rounded-xl"
          >
            Login / Sign Up
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50/30">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to={createPageUrl("Findify")}>
                <Button variant="ghost" size="icon" className="rounded-xl">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <Link to={createPageUrl("MyFavorites")}>
                <Button variant="ghost" size="icon" className="rounded-xl">
                  <Bookmark className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">For You</h1>
                <p className="text-xs text-slate-400">Personalized recommendations</p>
              </div>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-200/50">
              <Heart className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 text-indigo-400 animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Analyzing your preferences...</p>
            <p className="text-xs text-slate-400 mt-1">Finding products you'll love</p>
          </div>
        ) : error === "no_history" ? (
          <div className="text-center py-20">
            <div className="h-16 w-16 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">No Search History Yet</h2>
            <p className="text-slate-500 mb-6">Start searching for products to get personalized recommendations</p>
            <Link to={createPageUrl("Findify")}>
              <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 rounded-xl">
                <Sparkles className="h-4 w-4 mr-2" />
                Start Shopping
              </Button>
            </Link>
          </div>
        ) : error === "failed" ? (
          <div className="text-center py-20">
            <p className="text-slate-500">Failed to load recommendations. Please try again later.</p>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Products We Think You'll Love</h2>
              <p className="text-slate-500 text-sm mt-1">Based on your search history and preferences</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {recommendations.map((product, i) => (
                  <ProductRecommendationCard key={i} product={product} user={user} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
