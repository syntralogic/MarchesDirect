import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, X, Send, Loader2, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { chatbotApi, getApiErrorMessage, type ApiChatbotMessage } from '@/lib/apiClient';

// The backend has a full journey-aware, source-citing chatbot system
// (chatbotApi -> POST/GET /api/chatbot/conversations) that no UI anywhere in
// the app ever rendered. This widget is that missing UI: a floating launcher
// mounted once in AppLayout so it's present on every page, logged in or not.
//
// The launcher button itself is always visible (matches the reference
// screenshot - the client expects it as a persistent site-wide element, not
// something gated by auth). Only the *conversation* requires login, since
// every /chatbot/* route needs a company_id - so a logged-out visitor who
// opens the panel sees a real "log in to chat" prompt instead of the button
// just disappearing depending on auth state.
export function ChatbotWidget() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ApiChatbotMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!open || !isAuthenticated || initialized.current) return;
    initialized.current = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const conversations = await chatbotApi.listConversations();
        let conv = conversations[0];
        if (!conv) {
          conv = await chatbotApi.createConversation({ topic: 'general' });
        }
        setConversationId(conv.id);
        const history = await chatbotApi.getMessages(conv.id);
        setMessages(history);
      } catch (err) {
        setError(getApiErrorMessage(err, "Impossible de charger l'assistant."));
      } finally {
        setLoading(false);
      }
    })();
  }, [open, isAuthenticated]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !conversationId || sending) return;

    const optimisticUser: ApiChatbotMessage = {
      id: `optimistic-${Date.now()}`, conversation_id: conversationId, role: 'user', content: text, created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticUser]);
    setInput('');
    setSending(true);
    setError(null);
    try {
      const { response } = await chatbotApi.sendMessage(conversationId, text);
      setMessages(prev => [...prev, {
        id: `resp-${Date.now()}`, conversation_id: conversationId, role: 'assistant', content: response, created_at: new Date().toISOString(),
      }]);
    } catch (err) {
      setError(getApiErrorMessage(err, "Échec de l'envoi du message."));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Assistant Marchés Direct"
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 w-14 h-14 rounded-full bg-orange text-white shadow-lg shadow-orange/30 flex items-center justify-center hover:bg-orange/90 transition-colors"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {open && (
        <div className="fixed bottom-36 md:bottom-24 right-4 md:right-6 z-40 w-[calc(100vw-2rem)] max-w-sm h-[28rem] bg-[#061D32] border border-[#17334D] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-[#17334D] bg-[#031B30] flex items-center gap-2">
            <MessageCircle size={16} className="text-orange" />
            <p className="text-sm font-bold text-white">Assistant Marchés Direct</p>
          </div>

          {!isAuthenticated ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-3">
              <p className="text-xs text-[#B9BBC8]">Connectez-vous pour discuter avec l'assistant et obtenir de l'aide sur vos opportunités.</p>
              <Link to="/connexion" onClick={() => setOpen(false)} className="flex items-center gap-2 bg-orange text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-orange/90 transition-colors">
                <LogIn size={13} /> Se connecter
              </Link>
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center h-full text-[#B9BBC8] text-xs gap-2">
                    <Loader2 size={16} className="animate-spin" /> Chargement...
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-xs text-[#B9BBC8] text-center mt-6">
                    Posez une question sur vos opportunités, votre dossier ou la plateforme.
                  </p>
                ) : (
                  messages.map(m => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] text-xs rounded-xl px-3 py-2 whitespace-pre-wrap ${m.role === 'user' ? 'bg-orange text-white' : 'bg-[#031B30] text-white border border-[#17334D]'}`}>
                        {m.content}
                      </div>
                    </div>
                  ))
                )}
                {sending && (
                  <div className="flex justify-start">
                    <div className="bg-[#031B30] border border-[#17334D] rounded-xl px-3 py-2">
                      <Loader2 size={14} className="animate-spin text-orange" />
                    </div>
                  </div>
                )}
              </div>

              {error && <p className="text-[11px] text-red-400 px-4 pb-1">{error}</p>}

              <form onSubmit={handleSend} className="p-3 border-t border-[#17334D] flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Écrivez votre message..."
                  disabled={loading || !conversationId}
                  className="flex-1 bg-[#031B30] border border-[#17334D] rounded-xl px-3 py-2 text-xs text-white placeholder:text-[#B9BBC8] focus:outline-none focus:border-orange disabled:opacity-50"
                />
                <button type="submit" disabled={loading || sending || !input.trim()} className="bg-orange text-white rounded-xl w-9 h-9 flex items-center justify-center disabled:opacity-40 shrink-0">
                  <Send size={14} />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
