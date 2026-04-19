import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";

export default function FavoriteButton({ product, className = "" }) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkFavorite = async () => {
      if (!isAuthenticated || !user || !product?.name) return;

      const { data } = await supabase
        .from("favorite_products")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_name", product.name)
        .maybeSingle();

      if (data) {
        setIsFavorited(true);
        setFavoriteId(data.id);
      }
    };

    checkFavorite();
  }, [isAuthenticated, user, product?.name]);

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate("/Login");
      return;
    }

    setIsLoading(true);

    try {
      if (isFavorited && favoriteId) {
        await supabase.from("favorite_products").delete().eq("id", favoriteId);
        setIsFavorited(false);
        setFavoriteId(null);
      } else {
        const { data } = await supabase
          .from("favorite_products")
          .insert({
            user_id: user.id,
            product_name: product.name,
            price: product.price || "",
            description: product.description || "",
            image_url: product.image_url || "",
            product_url: product.search_url || `https://www.google.com/search?q=${encodeURIComponent(product.name)}`,
            rating: product.rating || 0,
          })
          .select("id")
          .single();
        setIsFavorited(true);
        setFavoriteId(data?.id);
      }
    } catch (e) {
      console.log("Failed to toggle favorite:", e);
    }

    setIsLoading(false);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={`h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm transition-all ${className}`}
    >
      <Heart
        className={`h-4 w-4 transition-all ${
          isFavorited
            ? "text-rose-500 fill-rose-500"
            : "text-slate-400"
        }`}
      />
    </Button>
  );
}
