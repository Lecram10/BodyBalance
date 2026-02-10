import { useState, useRef, useEffect } from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import { Card } from '../components/ui/Card';
import { sendAIMessage, getAISettings } from '../lib/ai-service';
import { useUserStore } from '../store/user-store';
import { useMealStore } from '../store/meal-store';
import { Send, Loader2, Bot, User, AlertCircle } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function AIChat() {
  const profile = useUserStore((s) => s.profile);
  const { getTotalPoints } = useMealStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAISettings().then((s) => setHasApiKey(!!s?.apiKey));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getSystemPrompt = () => {
    const used = getTotalPoints();
    const budget = profile?.dailyPointsBudget ?? 30;
    const remaining = budget - used;

    return `Je bent een vriendelijke Nederlandse voedingsassistent voor de app BodyBalance.
De gebruiker volgt een puntensysteem vergelijkbaar met Weight Watchers.

Huidige status:
- Dagbudget: ${budget} punten
- Vandaag gebruikt: ${used} punten
- Resterend: ${remaining} punten

Puntenformule: (cal × 0.03) + (verz.vet × 0.28) + (suiker × 0.12) - (eiwit × 0.10) - (vezels × 0.10) - (onverz.vet × 0.05), minimum 0.

Regels:
- Antwoord altijd in het Nederlands
- Geef korte, praktische antwoorden
- Bij vragen over punten: bereken met de formule hierboven
- Bij suggesties: houd rekening met resterende punten
- Gebruik geen emojis tenzij de gebruiker ze gebruikt`;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendAIMessage(
        newMessages.map((m) => ({ role: m.role, content: m.content })),
        getSystemPrompt()
      );
      setMessages([...newMessages, { role: 'assistant', content: response }]);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Onbekende fout';
      setMessages([...newMessages, { role: 'assistant', content: `Fout: ${msg}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (hasApiKey === false) {
    return (
      <PageLayout title="AI Assistent">
        <div className="flex flex-col items-center justify-center py-16 px-6">
          <div className="w-20 h-20 rounded-full bg-ios-warning/10 flex items-center justify-center mb-4">
            <AlertCircle size={40} className="text-ios-warning" />
          </div>
          <h3 className="text-[17px] font-semibold mb-2 text-center">API-sleutel vereist</h3>
          <p className="text-[14px] text-ios-secondary text-center leading-relaxed">
            Om de AI assistent te gebruiken heb je een Anthropic API-sleutel nodig.
            Ga naar <strong>Profiel → AI Instellingen</strong> om je sleutel in te voeren.
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="AI Assistent">
      <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 180px)' }}>
        {/* Messages */}
        <div className="flex-1 flex flex-col gap-3 pb-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Bot size={48} className="text-ios-separator mx-auto mb-3" />
              <p className="text-[17px] text-ios-secondary font-medium">Hoi! Ik ben je voedingsassistent</p>
              <p className="text-[13px] text-ios-secondary mt-2 max-w-xs mx-auto leading-relaxed">
                Stel me vragen over punten, voedingswaarden of vraag om maaltijdsuggesties.
              </p>
              <div className="flex flex-col gap-2 mt-5 max-w-xs mx-auto">
                {[
                  'Hoeveel punten heeft een broodje kaas?',
                  'Wat kan ik eten met 5 punten?',
                  'Geef me een gezond lunch-idee',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                    }}
                    className="text-left px-4 py-2.5 bg-white rounded-xl text-[14px] text-primary border border-ios-separator cursor-pointer active:bg-gray-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot size={16} className="text-primary" />
                </div>
              )}
              <Card
                className={`max-w-[80%] px-4 py-3 ${
                  msg.role === 'user' ? 'bg-primary text-white' : ''
                }`}
              >
                <p className={`text-[15px] leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user' ? 'text-white' : ''
                }`}>
                  {msg.content}
                </p>
              </Card>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-ios-bg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User size={16} className="text-ios-secondary" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot size={16} className="text-primary" />
              </div>
              <Card className="px-4 py-3">
                <Loader2 size={18} className="text-ios-secondary animate-spin" />
              </Card>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input */}
        <div className="sticky bottom-[70px] bg-ios-bg pt-2 pb-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Stel een vraag..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-white rounded-xl px-4 py-3 text-[16px] border border-ios-separator"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`w-11 h-11 rounded-full flex items-center justify-center border-none cursor-pointer transition-colors ${
                input.trim() && !isLoading ? 'bg-primary text-white' : 'bg-ios-bg text-ios-separator'
              }`}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
