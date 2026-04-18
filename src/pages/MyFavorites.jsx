import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ArrowLeft, Loader2, ExternalLink, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

function FavoriteCard({ favorite, onRemove }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden"
    >
      {favorite.image_url && (
        <div className="relative h-48 bg-gradient-to-br from-indigo-50 to-violet-50 overflow-hidden">
          <img
            src={favorite.image_url}
            alt={favorite.product_name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 right-3">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onRemove(favorite.id)}
              className="h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm"
            >
              <Trash2 className="h-4 w-4 text-rose-500" />
            </Button>
          </div>
        </div>
      )}

      <div className="p-5 space-y-3">
        <div>
          <h3 className="text-base font-bold text-slate-800 leading-tight">
            {favorite.product_name}
          </h3>
          {favorite.price && (
            <p className="text-indigo-600 font-semibold text-lg mt-1">{favorite.price}</p>
          )}
        </div>

        {favorite.description && (
          <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">
            {favorite.description}
          </p>
        )}

        {favorite.rating && (
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${
                  i < Math.round(favorite.rating)
                    ? "text-amber-400 fill-amber-400"
                    : "text-slate-200"
                }`}
              />
            ))}
            <span className="text-xs text-slate-400 ml-1">{favorite.rating}/5</span>
          </div>
        )}

        <a
          href={favorite.product_url}
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

export default function MyFavorites() {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadFavorites = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        const userFavorites = await base44.entities.FavoriteProduct.list("-created_date", 100);
        setFavorites(userFavorites);
      } catch (e) {
        console.error("Failed to load favorites:", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadFavorites();
  }, [isAuthenticated]);

  const handleRemove = async (id) => {
    await base44.entities.FavoriteProduct.delete(id);
    setFavorites(favorites.filter(f => f.id !== id));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50/30 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center mx-auto mb-4">
            <Heart className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Login Required</h2>
          <p className="text-slate-500 mb-4">Please log in to view your favorites</p>
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
              <div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">My Favorites</h1>
                <p className="text-xs text-slate-400">{favorites.length} saved products</p>
              </div>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-200/50">
              <Heart className="h-5 w-5 text-white fill-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 text-indigo-400 animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Loading favorites...</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-20">
            <div className="h-16 w-16 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">No Favorites Yet</h2>
            <p className="text-slate-500 mb-6">Start saving products you love</p>
            <Link to={createPageUrl("Findify")}>
              <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 rounded-xl">
                Discover Products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {favorites.map((favorite) => (
                <FavoriteCard key={favorite.id} favorite={favorite} onRemove={handleRemove} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
