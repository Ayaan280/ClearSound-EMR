import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";

export default function FavoriteButton({ product, className = "" }) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkFavorite = async () => {
      if (!isAuthenticated || !product?.name) return;

      try {
        const favorites = await base44.entities.FavoriteProduct.filter(
          { product_name: product.name },
          "-created_date",
          1
        );

        if (favorites.length > 0) {
          setIsFavorited(true);
          setFavoriteId(favorites[0].id);
        }
      } catch (e) {
        console.log("Failed to check favorite:", e);
      }
    };

    checkFavorite();
  }, [isAuthenticated, product?.name]);

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
        await base44.entities.FavoriteProduct.delete(favoriteId);
        setIsFavorited(false);
        setFavoriteId(null);
      } else {
        const newFavorite = await base44.entities.FavoriteProduct.create({
          product_name: product.name,
          price: product.price,
          description: product.description,
          image_url: product.image_url,
          product_url: product.search_url || `https://www.google.com/search?q=${encodeURIComponent(product.name)}`,
          rating: product.rating
        });
        setIsFavorited(true);
        setFavoriteId(newFavorite.id);
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
