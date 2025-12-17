// app/components/BotChatWidget.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";

type ChatRole = "user" | "bot" | "system";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: number;
};

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

async function askBot(userText: string) {
  // ✅ adapte l’URL à TON backend
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
  const url = `${baseUrl}/api/bot/chat`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Si tu utilises JWT: ajoute Authorization: `Bearer ${token}`
    body: JSON.stringify({ message: userText }),
  });

  if (!res.ok) {
    throw new Error(`Bot API error: ${res.status}`);
  }

  const data = await res.json();

  // On accepte plusieurs formats possibles pour éviter de bloquer
  return (
    data?.reply ??
    data?.message ??
    data?.text ??
    "Je n’ai pas compris la réponse du serveur."
  ) as string;
}

export function BotChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // (optionnel) petite persistence locale
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem("bot_chat_messages");
    if (!raw) return [];
    try {
      return JSON.parse(raw) as ChatMessage[];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("bot_chat_messages", JSON.stringify(messages));
  }, [messages]);

  const panelRef = useRef<HTMLDivElement | null>(null);

  // Click-outside pour fermer
  useEffect(() => {
    if (!open) return;

    const onDown = (e: MouseEvent) => {
      const el = panelRef.current;
      if (!el) return;
      if (el.contains(e.target as Node)) return;
      setOpen(false);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const canSend = useMemo(() => input.trim().length > 0 && !sending, [input, sending]);

  useEffect(() => {
    // auto-scroll à l’ouverture / nouveaux messages
    if (!open) return;
    const el = panelRef.current?.querySelector("[data-scroll='true']");
    if (!el) return;
    (el as HTMLDivElement).scrollTop = (el as HTMLDivElement).scrollHeight;
  }, [open, messages.length]);

  async function onSend() {
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    setSending(true);

    const userMsg: ChatMessage = { id: uid(), role: "user", text, createdAt: Date.now() };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const reply = await askBot(text);
      const botMsg: ChatMessage = { id: uid(), role: "bot", text: reply, createdAt: Date.now() };
      setMessages((prev) => [...prev, botMsg]);
    } catch (e) {
      // ✅ non bloquant: on affiche une bulle d’erreur, et on continue
      const botMsg: ChatMessage = {
        id: uid(),
        role: "bot",
        text: "⚠️ Impossible de contacter le bot pour le moment. Réessaie.",
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setSending(false);
    }
  }

  function clearChat() {
    setMessages([]);
    localStorage.removeItem("bot_chat_messages");
  }

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      {/* Popup */}
      <div
        ref={panelRef}
        className={cx(
          "pointer-events-none absolute bottom-16 right-0 w-[360px] max-w-[calc(100vw-3rem)]",
          "transition-all duration-200",
          open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        )}
      >
        <div
          className={cx(
            "pointer-events-auto overflow-hidden rounded-2xl border border-zinc-200 bg-white/95 shadow-xl backdrop-blur",
            "h-[520px] max-h-[calc(100vh-8rem)] flex flex-col"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-zinc-900">Bot Assistant</div>
              <div className="text-xs text-zinc-600">Pose une question sur l’app</div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearChat}
                className="rounded-lg px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
              >
                Effacer
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-zinc-100"
                aria-label="Fermer"
              >
                <X className="h-5 w-5 text-zinc-700" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div data-scroll="true" className="flex-1 overflow-auto px-4 py-3">
            {messages.length === 0 ? (
              <div className="mt-10 text-center text-sm text-zinc-600">
                Écris un message pour démarrer la discussion.
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={cx(
                      "flex",
                      m.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cx(
                        "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                        m.role === "user"
                          ? "bg-zinc-900 text-white"
                          : "bg-zinc-100 text-zinc-900"
                      )}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-start">
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-zinc-100 px-3 py-2 text-sm text-zinc-700">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Le bot réfléchit…
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-zinc-200 p-3">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSend();
                }}
                placeholder="Écris ton message…"
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-500 focus:border-zinc-400"
              />
              <button
                type="button"
                onClick={onSend}
                disabled={!canSend}
                className={cx(
                  "inline-flex h-11 w-11 items-center justify-center rounded-xl",
                  canSend ? "bg-zinc-900 text-white hover:bg-zinc-800" : "bg-zinc-200 text-zinc-500"
                )}
                aria-label="Envoyer"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bouton flottant */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cx(
          "inline-flex h-14 w-14 items-center justify-center rounded-full",
          "bg-zinc-900 text-white shadow-lg hover:bg-zinc-800",
          "border border-white/10"
        )}
        aria-label="Ouvrir le chat"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </div>
  );
}
