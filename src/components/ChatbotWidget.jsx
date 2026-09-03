import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Send, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { createEnquiry } from '../lib/api';
import { supabase } from '../lib/supabase';
import { WhatsAppIcon } from './Icons';
import './ChatbotWidget.css';

const getSystemPrompt = (collectBudget = false) => {
  const commonRules = `
ABOUT CONVENIO MART (KNOWLEDGE BASE):
- Convenio Mart is a modern, tech-enabled mini-supermarket chain set up inside premium residential apartment complexes and gated societies.
- USP & Business Model: Built-in captive footfall from society residents, attractive 70% profit share model, and a proprietary hyper-local delivery app for instant doorstep room delivery and monthly subscriptions.
- Investment: ₹15 Lakhs to ₹20 Lakhs per store (with up to 75% bank funding support arranged).
- Estimated Returns: High monthly profitability of ₹35,000 to ₹50,000+ per store with quick payback period.
- Support Provided: Complete end-to-end store setup, supply chain and inventory management, smart POS system, marketing, and staff training.

HANDLING USER QUESTIONS & FLOW:
- If the user asks ANY question about Convenio Mart or the franchise (e.g., "what is Convenio Mart?", "how much investment/cost?", "what is the profit/ROI?", "how does it work?", "why should I invest?"):
  1. Answer their question accurately, helpfully, and concisely (1-2 sentences max) using the knowledge base.
  2. In the same response, smoothly transition back to asking for the next pending lead detail.
- Keep all responses conversational, enthusiastic, and concise (2-3 short sentences max).

LEAD COLLECTION STEPS (COLLECT ONE DETAIL AT A TIME):
1. FIRST TURN: Ask for their **Name**. (If they just greeted, greet back warmly and ask for their name).
2. SECOND TURN: After they give Name, ask for their **City / Location**.
${collectBudget ? '3. THIRD TURN: After Location, ask for their **Investment Budget**.\n4. FOURTH TURN: Ask for their **10-digit Mobile Phone Number**.' : '3. THIRD TURN: After Location, ask for their **10-digit Mobile Phone Number**.'}

STRICT CONVERSATION RULES:
- Ask ONE contact detail per turn. Never bombard the user with multiple requests at once.
- NAME VALIDATION: If the user responds with a greeting (e.g. "hi", "hello", "hey", "good morning", "hola", "namaste") instead of their name, greet them back warmly and re-ask for their name. Never treat a greeting as their actual name!
- PHONE NUMBER VALIDATION: Verify phone number has exactly 10 digits. If not 10 digits, politely ask them to re-enter a valid 10-digit number.
`;

  if (!collectBudget) {
    return `You are Convi, the AI Franchise Consultant for Convenio Mart.
${commonRules}

***END OF CONVERSATION TRIGGER***
As soon as you have collected Name, Location, and valid 10-digit Phone Number:
Output the summary with EACH DETAIL ON A SEPARATE LINE using bullet points:

- **Name:** [Their Name]
- **Phone:** [Their Phone Number]
- **Area:** [Their Location]

After the summary on a new line, say:
"Great! Our team will reach out to you shortly to discuss further." and stop asking questions.`;
  }

  return `You are Convi, the AI Franchise Consultant for Convenio Mart.
${commonRules}

***END OF CONVERSATION TRIGGER***
As soon as you have collected Name, Location, Budget, and valid 10-digit Phone Number:
Output the summary with EACH DETAIL ON A SEPARATE LINE using bullet points:

- **Name:** [Their Name]
- **Phone:** [Their Phone Number]
- **Area:** [Their Location]
- **Budget:** [Their Budget]

After the summary on a new line, say:
"Great! Our team will reach out to you shortly to discuss further." and stop asking questions.`;
};

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [collectBudget, setCollectBudget] = useState(() => {
    return localStorage.getItem('collect_budget_setting') === 'true';
  });
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! 👋 I'm Convi, the AI Franchise Consultant. May I know your name?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const leadSavedRef = useRef(false);
  const messagesEndRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const fetchSetting = () => {
      const stored = localStorage.getItem('collect_budget_setting');
      if (stored !== null) {
        setCollectBudget(stored === 'true');
      }
    };
    fetchSetting();
  }, []);

  useEffect(() => {
    if (location.pathname === '/ai-chat') {
      setIsOpen(true);
    }
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('open-ai-chat', handleOpenChat);
    return () => window.removeEventListener('open-ai-chat', handleOpenChat);
  }, [location.pathname]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    const digitsOnly = userMessage.replace(/\D/g, '');
    const cleanWord = userMessage.toLowerCase().replace(/[^a-z]/g, '');
    const GREETINGS = ['hi', 'hello', 'hey', 'hlo', 'hlw', 'hola', 'namaste', 'goodmorning', 'goodevening', 'goodafternoon'];
    
    let systemHint = '';
    const userMsgCount = newMessages.filter(m => m.role === 'user').length;
    
    if (userMsgCount === 1 && GREETINGS.includes(cleanWord)) {
      systemHint = `[SYSTEM NOTE: User responded with a greeting "${userMessage}". Greet them back politely and ask for their full name. DO NOT treat "${userMessage}" as their name.]`;
    } else if (digitsOnly.length === 10) {
      systemHint = `[SYSTEM NOTE: User provided phone number "${digitsOnly}" which is VALID (exactly 10 digits). Accept it as valid immediately and output the final summary.]`;
    } else if (digitsOnly.length > 0 && digitsOnly.length !== 10 && !(digitsOnly.length === 12 && digitsOnly.startsWith('91'))) {
      systemHint = `[SYSTEM NOTE: User provided number "${userMessage}" which has ${digitsOnly.length} digits. It is NOT 10 digits. Ask them politely to re-enter a valid 10-digit mobile number.]`;
    }

    const payloadMessages = [
      { role: 'system', content: getSystemPrompt(collectBudget) },
      ...newMessages.map(m => ({ role: m.role, content: m.content }))
    ];

    if (systemHint) {
      payloadMessages.push({ role: 'system', content: systemHint });
    }

    try {
      const groqApiKey = import.meta.env.VITE_GROQ_API_KEY || '';
      const groqModel = import.meta.env.VITE_GROQ_MODEL || 'openai/gpt-oss-120b';

      const sendChatRequest = async (modelName) => {
        // 1. Try local dev proxy / Vercel proxy (/api/groq)
        try {
          const res = await fetch('/api/groq/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(groqApiKey ? { 'Authorization': `Bearer ${groqApiKey}` } : {})
            },
            body: JSON.stringify({
              model: modelName,
              messages: payloadMessages,
              temperature: 0.7,
              max_completion_tokens: 1024,
              top_p: 1
            })
          });
          if (res.ok) return res;
        } catch (proxyErr) {
          // Continue to next fallback
        }

        // 2. Try direct Groq API
        try {
          const directRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${groqApiKey}`
            },
            body: JSON.stringify({
              model: modelName,
              messages: payloadMessages,
              temperature: 0.7,
              max_completion_tokens: 1024,
              top_p: 1
            })
          });
          if (directRes.ok) return directRes;
        } catch (directErr) {
          // Continue to next fallback
        }

        // 3. Try Hostinger / Apache PHP endpoint (/api/chat.php)
        return await fetch('/api/chat.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: modelName,
            messages: payloadMessages,
            temperature: 0.7,
            max_completion_tokens: 1024,
            top_p: 1
          })
        });
      };

      let response = await sendChatRequest(groqModel);

      // If requested model was not found, fallback to available models
      if (response.status === 404) {
        response = await sendChatRequest('openai/gpt-oss-20b');
      }

      const rawText = await response.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        throw new Error(`API returned non-JSON response. Status: ${response.status}.`);
      }

      if (data.choices && data.choices[0]) {
        let aiResponse = data.choices[0].message.content;

        const cleanLines = aiResponse.split('\n').map(l => l.replace(/[*_#\-]/g, '').trim());
        let extractedName = null;
        let extractedPhone = null;
        let extractedArea = null;
        let extractedBudget = null;

        cleanLines.forEach(line => {
          if (!extractedName && /^(?:Name|Full Name)\s*:\s*(.+)$/i.test(line)) {
            extractedName = line.match(/^(?:Name|Full Name)\s*:\s*(.+)$/i)[1].trim();
          }
          if (!extractedPhone && /^(?:Phone|Mobile|Contact|Number)\s*:\s*(.+)$/i.test(line)) {
            extractedPhone = line.match(/^(?:Phone|Mobile|Contact|Number)\s*:\s*(.+)$/i)[1].trim();
          }
          if (!extractedArea && /^(?:Area|Location|City|Place)\s*:\s*(.+)$/i.test(line)) {
            extractedArea = line.match(/^(?:Area|Location|City|Place)\s*:\s*(.+)$/i)[1].trim();
          }
          if (!extractedBudget && /^(?:Budget|Investment)\s*:\s*(.+)$/i.test(line)) {
            extractedBudget = line.match(/^(?:Budget|Investment)\s*:\s*(.+)$/i)[1].trim();
          }
        });

        if (!extractedPhone) {
          for (let i = newMessages.length - 1; i >= 0; i--) {
            const msg = newMessages[i];
            if (msg.role === 'user') {
              const digits = msg.content.replace(/\D/g, '');
              if (digits.length === 10) {
                extractedPhone = digits;
                break;
              }
            }
          }
        }

        if (extractedPhone && !leadSavedRef.current) {
          leadSavedRef.current = true;
          try {
            const userMessages = newMessages.filter(m => m.role === 'user');
            const fallbackName = userMessages.length > 0 ? userMessages[0].content.trim() : 'Guest';

            const leadData = {
              name: extractedName || fallbackName,
              phone: extractedPhone,
              area: extractedArea || 'N/A',
              budget: extractedBudget || 'Not Provided'
            };

            const transcript = newMessages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');

            // 1. Save lead to Supabase enquiries database (for Admin Dashboard)
            try {
              const newEnquiry = await createEnquiry({
                name: leadData.name,
                phone: leadData.phone,
                location: leadData.area,
                investment_capacity: leadData.budget,
                status: 'NEW',
                source: 'CHAT'
              });

              await supabase.from('enquiry_timeline').insert([{
                enquiry_id: newEnquiry?.id || crypto.randomUUID(),
                action_type: 'CHAT_TRANSCRIPT',
                description: 'Initial chat transcript saved.\n\n' + transcript + `\n\nASSISTANT: ${aiResponse.trim()}`
              }]);
            } catch (dbError) {
              console.error("Supabase insert error:", dbError);
            }

            // 2. Send Instant Email Notification to conveniomart@lordsandkingsagro.com
            try {
              let emailSent = false;

              // Try Hostinger PHP endpoint (/api/send-email.php)
              try {
                const res = await fetch('/api/send-email.php', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    to: 'conveniomart@lordsandkingsagro.com',
                    subject: `New AI Chatbot Lead: ${leadData.name} (${leadData.area})`,
                    leadData,
                    transcript: transcript + `\n\nASSISTANT: ${aiResponse.trim()}`
                  })
                });
                if (res.ok) emailSent = true;
              } catch (err) {
                // Continue to next fallback
              }

              // Try Resend API proxy (/api/resend/emails)
              if (!emailSent) {
                try {
                  const res = await fetch('/api/resend/emails', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      from: 'Convenio Mart AI Bot <info@atyourdoor.life>',
                      to: ['conveniomart@lordsandkingsagro.com'],
                      subject: `New AI Chatbot Lead: ${leadData.name} (${leadData.area})`,
                      html: `
                        <h3>New AI Chatbot Lead</h3>
                        <p><strong>Name:</strong> ${leadData.name}</p>
                        <p><strong>Phone:</strong> ${leadData.phone}</p>
                        <p><strong>Area:</strong> ${leadData.area}</p>
                        <p><strong>Budget:</strong> ${leadData.budget}</p>
                        <p><strong>Source:</strong> AI Franchise Chatbot</p>
                        <hr/>
                        <h4>Chat Transcript:</h4>
                        <pre style="white-space: pre-wrap; font-family: sans-serif;">${transcript + `\n\nASSISTANT: ${aiResponse.trim()}`}</pre>
                      `
                    })
                  });
                  if (res.ok) emailSent = true;
                } catch (err) {
                  // Continue to next fallback
                }
              }

              // Fallback to FormSubmit to guarantee email delivery to conveniomart@lordsandkingsagro.com
              if (!emailSent) {
                try {
                  await fetch('https://formsubmit.co/ajax/conveniomart@lordsandkingsagro.com', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                      _subject: `New AI Chatbot Lead: ${leadData.name} (${leadData.area})`,
                      _template: 'table',
                      "Lead Name": leadData.name,
                      "Phone Number": leadData.phone,
                      "Location / Area": leadData.area,
                      "Budget / Capacity": leadData.budget,
                      "Source": "AI Franchise Chatbot",
                      "Transcript": transcript + `\n\nASSISTANT: ${aiResponse.trim()}`
                    })
                  });
                } catch (formSubmitErr) {
                  console.error("All email send methods failed:", formSubmitErr);
                }
              }
            } catch (emailErr) {
              console.error("Resend email notification error:", emailErr);
            }
          } catch (e) {
            console.error("Failed to save conversational lead details:", e);
          }
        }

        setMessages([...newMessages, { role: 'assistant', content: aiResponse }]);
      } else {
        const errorMsg = data.error ? data.error.message : "Unknown API error";
        if (errorMsg.toLowerCase().includes('invalid api key') || response.status === 401) {
          setMessages([...newMessages, { 
            role: 'assistant', 
            content: `⚠️ **Groq API Key Missing or Invalid**\n\nPlease add your Groq API key (\`gsk_...\`) to your \`.env\` file:\n\`\`\`env\nGROQ_API_KEY=gsk_your_key_here\n\`\`\`\nThen restart your dev server (\`npm run dev\`). You can get a free key at [console.groq.com/keys](https://console.groq.com/keys).` 
          }]);
        } else {
          setMessages([...newMessages, { role: 'assistant', content: `I'm having trouble connecting to my brain. The API said: ${errorMsg}` }]);
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages([...newMessages, { role: 'assistant', content: `Sorry, something went wrong on my end. Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <>
      {/* Floating Action Buttons */}
      {!isOpen && (
        <div className="chatbot-floating-buttons" aria-label="Contact and AI Support">
          <button
            onClick={() => setIsOpen(true)}
            title="Convi - AI Franchise Consultant"
            aria-label="Open AI Franchise Consultant Chat"
            className="chatbot-btn-bot"
          >
            <Bot size={26} />
          </button>

          <a
            href="https://wa.me/918072557159?text=Hi%20Convenio%20Mart,%20I%20am%20interested%20in%20franchise%20details."
            target="_blank"
            rel="noopener noreferrer"
            title="Chat on WhatsApp"
            aria-label="Chat on WhatsApp"
            className="chatbot-btn-whatsapp"
          >
            <WhatsAppIcon size={26} color="#ffffff" />
          </a>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window" role="dialog" aria-modal="true" aria-label="Convi AI Chat">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">
                <Bot size={22} color="#ffffff" />
              </div>
              <div>
                <h3 className="chatbot-title">Convi</h3>
                <p className="chatbot-subtitle">AI Franchise Consultant</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="chatbot-close-btn"
              aria-label="Close Chat"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`chatbot-msg-row ${msg.role === 'user' ? 'user' : 'assistant'}`}
              >
                <div className="chatbot-bubble">
                  <ReactMarkdown
                    components={{
                      p: ({ node, ...props }) => <p {...props} />,
                      ul: ({ node, ...props }) => <ul>{props.children}</ul>,
                      strong: ({ node, ...props }) => <strong>{props.children}</strong>
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="chatbot-msg-row assistant">
                <div className="chatbot-loading-bubble">
                  <span className="chatbot-dot"></span>
                  <span className="chatbot-dot"></span>
                  <span className="chatbot-dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="chatbot-input-area">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="chatbot-form"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about the franchise..."
                className="chatbot-input"
                autoFocus
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="chatbot-send-btn"
                aria-label="Send Message"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
