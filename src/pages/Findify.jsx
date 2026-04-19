import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RotateCcw, History, User, Send, ExternalLink, Star, Loader2, Package, Calendar, X, Heart, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import FavoriteButton from "../components/FavoriteButton";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MAX_QUESTIONS = 15;

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/findify-ai`;
const callAI = async (action, payload, session) => {
  const res = await fetch(AI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      "Apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ action, payload }),
  });
  return res.json();
};

function MessageBubble({ message, isUser }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn("flex gap-3 max-w-[85%]", isUser ? "ml-auto" : "mr-auto")}
    >
      {!isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200/50">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
        </div>
      )}
      <div
        className={cn(
          "rounded-2xl px-4 py-3 text-[15px] leading-relaxed",
          isUser
            ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-br-md shadow-lg shadow-indigo-200/40"
            : "bg-white text-slate-700 rounded-bl-md border border-slate-100 shadow-sm"
        )}
      >
        <p className="whitespace-pre-wrap">{message}</p>
      </div>
    </motion.div>
  );
}

function QuestionProgress({ current, total }) {
  const percentage = Math.min((current / total) * 100, 100);

  return (
    <div className="flex items-center gap-3 px-1">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <span className="text-xs font-medium text-slate-400 tabular-nums whitespace-nowrap">
        {Math.min(current, total)}/{total}
      </span>
    </div>
  );
}

function ChatInput({ onSend, disabled, placeholder }) {
  const [value, setValue] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue("");
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex items-center gap-2 p-2 bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-100/50"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder || "Type your answer..."}
        disabled={disabled}
        className="flex-1 px-4 py-3 bg-transparent text-[15px] text-slate-700 placeholder:text-slate-300 outline-none disabled:opacity-50"
      />
      <Button
        type="submit"
        disabled={!value.trim() || disabled}
        size="icon"
        className="h-10 w-10 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-md shadow-indigo-200/50 disabled:opacity-30 disabled:shadow-none transition-all"
      >
        <Send className="h-4 w-4" />
      </Button>
    </motion.form>
  );
}

function ProductCard({ product, isLoading, user }) {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-sm"
      >
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="h-64 bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mx-auto mb-3" />
              <p className="text-sm text-indigo-400 font-medium">Finding your perfect match...</p>
            </div>
          </div>
          <div className="p-6 space-y-3">
            <div className="h-5 bg-slate-100 rounded-full w-3/4 animate-pulse" />
            <div className="h-4 bg-slate-50 rounded-full w-full animate-pulse" />
            <div className="h-4 bg-slate-50 rounded-full w-2/3 animate-pulse" />
          </div>
        </div>
      </motion.div>
    );
  }

  if (!product) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mx-auto max-w-sm"
    >
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        {product.image_url && (
          <div className="relative h-64 bg-gradient-to-br from-indigo-50 to-violet-50 overflow-hidden">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                <span className="text-xs font-semibold text-indigo-600">AI Pick</span>
              </div>
            </div>
            <div className="absolute top-4 right-4">
              <FavoriteButton product={product} user={user} />
            </div>
          </div>
        )}

        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 leading-tight">
              {product.name}
            </h3>
            {product.price && (
              <p className="text-indigo-600 font-semibold text-lg mt-1">{product.price}</p>
            )}
          </div>

          {product.budget_matched === false && product.budget_note && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs text-amber-800 leading-relaxed">
                <span className="font-semibold">Budget Note:</span> {product.budget_note}
              </p>
            </div>
          )}

          <p className="text-sm text-slate-500 leading-relaxed">
            {product.description}
          </p>

          {product.rating && (
            <div className="flex items-center gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.round(product.rating)
                      ? "text-amber-400 fill-amber-400"
                      : "text-slate-200"
                  }`}
                />
              ))}
              <span className="text-xs text-slate-400 ml-1">{product.rating}/5</span>
            </div>
          )}

          {product.features && product.features.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.features.map((f, i) => (
                <span
                  key={i}
                  className="text-xs bg-indigo-50 text-indigo-600 rounded-full px-2.5 py-1 font-medium"
                >
                  {f}
                </span>
              ))}
            </div>
          )}

          <a
            href={product.search_url || `https://www.google.com/search?q=${encodeURIComponent(product.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold shadow-lg shadow-indigo-200/50 transition-all">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Product
            </Button>
          </a>
        </div>
      </div>
    </motion.div>
  );
}

function HistoryModal({ onClose }) {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const { data: searches } = await supabase
          .from("search_history")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);
        setHistory(searches || []);
      } catch (e) {
        console.log("Failed to load history:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            {selectedItem && (
              <Button variant="ghost" size="icon" onClick={() => setSelectedItem(null)} className="rounded-xl -ml-2">
                <X className="h-4 w-4 rotate-0" />
              </Button>
            )}
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {selectedItem ? selectedItem.product_type : "Search History"}
              </h2>
              <p className="text-xs text-slate-400">
                {selectedItem
                  ? format(new Date(selectedItem.created_date), "MMM d, yyyy 'at' h:mm a")
                  : "Your previous product searches"}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {selectedItem ? (
            <div className="space-y-4">
              {selectedItem.messages && selectedItem.messages.length > 0 ? (
                selectedItem.messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 max-w-[85%] ${msg.isUser ? "ml-auto" : "mr-auto"}`}>
                    {!msg.isUser && (
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                    <div className={`rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${
                      msg.isUser
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-br-md"
                        : "bg-slate-50 text-slate-700 rounded-bl-md border border-slate-100"
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No chat messages saved for this search.
                </div>
              )}
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400">No search history yet</p>
              <p className="text-xs text-slate-300 mt-1">Your searches will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedItem(item)}
                  className="bg-slate-50 rounded-2xl p-4 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-100"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800 text-sm">
                        {item.product_type}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(item.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                    </div>
                    {!item.budget_matched && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                        Over Budget
                      </span>
                    )}
                  </div>

                  {item.recommended_product && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <div className="flex items-center gap-3">
                        {item.recommended_product.image_url && (
                          <img
                            src={item.recommended_product.image_url}
                            alt={item.recommended_product.name}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-700 truncate">
                            {item.recommended_product.name}
                          </p>
                          {item.recommended_product.price && (
                            <p className="text-xs text-indigo-600 font-semibold mt-0.5">
                              {item.recommended_product.price}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-2 flex items-center gap-1 text-xs text-indigo-500 font-medium">
                    <History className="h-3 w-3" />
                    View full chat
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Findify() {
  const [messages, setMessages] = useState([
    { text: "Hey there! 👋 I'm Findify, your personal shopping assistant. Tell me what you're looking for — the more detail you give, the better! (e.g. \"I want Sony over-ear Bluetooth headphones\")", isUser: false }
  ]);
  const [questionCount, setQuestionCount] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flowComplete, setFlowComplete] = useState(false);
  const [products, setProducts] = useState([]);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);
  const chatEndRef = useRef(null);
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking, isLoadingProduct]);

  const handleSend = async (text) => {
    const newMessages = [...messages, { text, isUser: true }];
    setMessages(newMessages);
    setIsThinking(true);
    setConversationStarted(true);

    const conversationHistory = newMessages
      .map((m) => `${m.isUser ? "User" : "Assistant"}: ${m.text}`)
      .join("\n");

    const { data: { session } } = await supabase.auth.getSession();
    const aiDecision = await callAI("chat_decision", {
      conversationHistory,
      questionCount,
      maxQuestions: MAX_QUESTIONS,
    }, session);

    if (aiDecision.ready || questionCount >= MAX_QUESTIONS) {
      const finalMessages = [...newMessages, {
        text: `Perfect, I've got everything I need! 🎯\n\nSearching for your ideal product now...`,
        isUser: false,
      }];
      setMessages(finalMessages);
      setIsThinking(false);
      setIsLoadingProduct(true);
      await runFindProduct(finalMessages);
    } else {
      setMessages((prev) => [...prev, { text: aiDecision.next_question, isUser: false }]);
      setQuestionCount((prev) => prev + 1);
      setIsThinking(false);
    }
  };

  const runFindProduct = async (msgs) => {
    const conversationHistory = (msgs || messages)
      .map((m) => `${m.isUser ? "User" : "Assistant"}: ${m.text}`)
      .join('\n');

    const prompt = `You are a product recommendation expert. Based on this full conversation, recommend 3 specific real products with variety (budget-friendly, mid-range, and premium options if possible).

Full conversation:
${conversationHistory}

CRITICAL RULES:
- Recommend exactly 3 different products with price variety
- For each product, if it exceeds the user's budget, set "budget_matched" to false
- In budget_note, explain: "Sorry, we couldn't find any [product type] within your budget that meet your requirements. This is the best option we found that matches your other needs."
- Always be honest about the price vs budget
- Provide diverse options (different brands, price points)

Return 3 specific, real product recommendations with current market data.`;

    const { data: { session } } = await supabase.auth.getSession();
    const productData = await callAI("recommend_products", { conversationHistory: prompt }, session);
    const productsWithImages = productData.products || [];

    setProducts(productsWithImages);
    setFlowComplete(true);
    setIsLoadingProduct(false);

    if (isAuthenticated && user) {
      try {
        await supabase.from("search_history").insert({
          user_id: user.id,
          product_type: (msgs || messages).find(m => m.isUser)?.text || "Product Search",
          answers: answers,
          recommended_product: productsWithImages[0],
          budget_matched: productsWithImages[0].budget_matched !== false,
          messages: msgs || messages
        });
      } catch (e) {
        console.log("Failed to save history:", e);
      }
    }
  };

  const handleRestart = () => {
    setMessages([
      { text: "Hey there! 👋 I'm Findify, your personal shopping assistant. Tell me what you're looking for — the more detail you give, the better! (e.g. \"I want Sony over-ear Bluetooth headphones\")", isUser: false }
    ]);
    setQuestionCount(0);
    setAnswers({});
    setFlowComplete(false);
    setProducts([]);
    setIsLoadingProduct(false);
    setIsThinking(false);
    setConversationStarted(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/Login");
  };

  const handleLogin = () => {
    navigate("/Login");
  };

  const showInput = !flowComplete && !isThinking && !isLoadingProduct;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50/30">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200/50">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800 tracking-tight">Findify</h1>
                <p className="text-xs text-slate-400">Your AI Shopping Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {conversationStarted && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRestart}
                  className="text-slate-400 hover:text-slate-600 rounded-xl"
                >
                  <RotateCcw className="h-4 w-4 mr-1.5" />
                  Start over
                </Button>
              )}
              {isAuthenticated && (
                <>
                  <Link to={createPageUrl("ForYou")}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-slate-600 rounded-xl"
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to={createPageUrl("MyFavorites")}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-slate-600 rounded-xl"
                    >
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHistory(true)}
                    className="text-slate-400 hover:text-slate-600 rounded-xl"
                  >
                    <History className="h-4 w-4" />
                  </Button>
                </>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-xl">
                    <User className="h-5 w-5 text-slate-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {user ? (
                    <>
                      <div className="px-2 py-2 border-b border-slate-100">
                        <p className="text-xs font-medium text-slate-900">{user.full_name || user.email}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      </div>
                      <DropdownMenuItem onClick={() => setShowHistory(true)}>
                        <History className="h-4 w-4 mr-2" />
                        Search History
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleLogout}>
                        Logout
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem onClick={handleLogin}>
                      Login / Sign Up
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="space-y-4 pb-4">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <MessageBubble
                key={i}
                message={msg.text}
                isUser={msg.isUser}
              />
            ))}
          </AnimatePresence>

          {isThinking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 max-w-[85%]"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200/50">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="bg-white rounded-2xl rounded-bl-md border border-slate-100 shadow-sm px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="h-2 w-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </motion.div>
          )}

          {isLoadingProduct && (
            <>
              <ProductCard isLoading />
              <ProductCard isLoading />
              <ProductCard isLoading />
            </>
          )}

          {products.length > 0 && (
            <div className="space-y-6">
              {products.map((product, i) => (
                <ProductCard key={i} product={product} user={user} />
              ))}
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {showInput && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-6 pb-4 px-4">
          <div className="max-w-lg mx-auto">
            <ChatInput
              onSend={handleSend}
              placeholder={!conversationStarted ? "e.g. Sony over-ear Bluetooth headphones..." : "Type your answer..."}
            />
          </div>
        </div>
      )}

      {showInput && <div className="h-24" />}

      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} />}
    </div>
  );
}
