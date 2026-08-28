import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X, Send, User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { createEnquiry } from '../lib/api';
import { supabase } from '../lib/supabase';

// Base URL for the Groq / Resend proxy endpoints.
// Defaults to same-origin /api (works with the Vite dev proxy and Vercel/Netlify
// serverless functions). For pure static hosting (Hostinger, static Vercel/Netlify),
// point VITE_API_BASE at an external API host, e.g. https://api.example.com/api
const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');

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
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    // Precise JS digit validation & greeting validation
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
      const response = await fetch(`${API_BASE}/groq/openai/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: import.meta.env.VITE_GROQ_MODEL || 'openai/gpt-oss-120b',
          messages: payloadMessages,
          temperature: 1,
          max_completion_tokens: 2048,
          top_p: 1,
          reasoning_effort: 'medium'
        })
      });

      const rawText = await response.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        throw new Error(`API returned non-JSON response. Status: ${response.status}. Response: ${rawText.substring(0, 100)}...`);
      }

      if (data.choices && data.choices[0]) {
        let aiResponse = data.choices[0].message.content;

        // Line-by-line extraction of lead details
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

        // Fallback: Scan user messages for a 10-digit phone number if missing from summary
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

        // If phone is found (or Name + Phone present) and lead hasn't been saved for this session yet
        if (extractedPhone && !leadSavedRef.current) {
          leadSavedRef.current = true;
          try {
            // Find name fallback from early user messages if not explicitly captured
            const userMessages = newMessages.filter(m => m.role === 'user');
            const fallbackName = userMessages.length > 0 ? userMessages[0].content.trim() : 'Guest';

            const leadData = {
              name: extractedName || fallbackName,
              phone: extractedPhone,
              area: extractedArea || 'N/A',
              budget: extractedBudget || 'Not Provided'
            };

            const transcript = newMessages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');

            console.log("Saving lead to Supabase enquiries:", leadData);

            // Save to Supabase using createEnquiry
            try {
              const newEnquiry = await createEnquiry({
                name: leadData.name,
                phone: leadData.phone,
                location: leadData.area,
                investment_capacity: leadData.budget,
                status: 'NEW',
                source: 'CHAT'
              });

              // Also add the transcript as a timeline event
              await supabase.from('enquiry_timeline').insert([{
                enquiry_id: newEnquiry.id,
                action_type: 'CHAT_TRANSCRIPT',
                description: 'Initial chat transcript saved.\n\n' + transcript + `\n\nASSISTANT: ${aiResponse.trim()}`
              }]);
              
              console.log("Successfully saved lead to Supabase enquiries!");
            } catch (dbError) {
              console.error("Supabase insert error:", dbError);
            }

            // Send Instant Email Notification via Resend API
            try {
              await fetch(`${API_BASE}/resend/emails`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  from: 'Convenio Mart AI Bot <info@atyourdoor.life>',
                  to: ['conveniomart@lordsandkingsagro.com'],
                  subject: `New AI Chatbot Lead: ${leadData.name} (${leadData.area})`,
                  html: `
                    <h3>New Chatbot Lead</h3>
                    <p><strong>Name:</strong> ${leadData.name}</p>
                    <p><strong>Phone:</strong> ${leadData.phone}</p>
                    <p><strong>Area:</strong> ${leadData.area}</p>
                    <p><strong>Budget:</strong> ${leadData.budget}</p>
                    <p><strong>Source:</strong> AI Chatbot</p>
                    <hr/>
                    <h4>Chat Transcript:</h4>
                    <pre style="white-space: pre-wrap; font-family: sans-serif;">${transcript + `\n\nASSISTANT: ${aiResponse.trim()}`}</pre>
                  `
                })
              });
              console.log("Resend chatbot email notification sent successfully!");
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
        setMessages([...newMessages, { role: 'assistant', content: `I'm having trouble connecting to my brain. The API said: ${errorMsg}` }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages([...newMessages, { role: 'assistant', content: `Sorry, something went wrong on my end. Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const isLandingPage = location.pathname === '/landing' || location.pathname === '/home';

  return (
    <>
      {/* Bottom-Right Floating Action Buttons */}
      {!isOpen && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          zIndex: 50, display: 'flex', flexDirection: 'column',
          alignItems: 'flex-end', gap: '12px',
        }}>
          {/* WhatsApp Button */}
          <a
            href="https://wa.me/918072557159?text=Hi%20Convenio%20Mart,%20I%20am%20interested%20in%20franchise%20details."
            target="_blank"
            rel="noopener noreferrer"
            title="Chat on WhatsApp"
            style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: '#25D366', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(37,211,102,0.35)',
              transition: 'all 0.25s ease', textDecoration: 'none',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,211,102,0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,211,102,0.35)'; }}
          >
            {/* WhatsApp SVG icon */}
            <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </a>

          {/* AI Chat Button — UXWing robot-bot-icon */}
          <button
            onClick={() => setIsOpen(true)}
            title="Chat with Convi – AI Consultant"
            style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #e01a22 0%, #b8151d 100%)',
              color: '#fff', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(224,26,34,0.35)',
              transition: 'all 0.25s ease', padding: '10px',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(224,26,34,0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(224,26,34,0.35)'; }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" shapeRendering="geometricPrecision" textRendering="geometricPrecision" imageRendering="optimizeQuality" fillRule="evenodd" clipRule="evenodd" viewBox="0 0 411 512.455" style={{ width: '100%', height: '100%', filter: 'brightness(0) invert(1)' }}>
              <path fill="#213853" fillRule="nonzero" d="M372.051 147.174c10.205 1 19.394 5.584 26.275 12.467 7.82 7.818 12.674 18.613 12.674 30.497v40.881c0 11.883-4.854 22.678-12.674 30.497-6.871 6.872-16.042 11.453-26.228 12.463-2.76 35.268-32.451 63.241-68.401 63.241H248.96v17.858c7.963 2.394 13.813 9.792 13.861 18.485h25.01c43.316 0 78.72 35.404 78.72 78.72v49.752c0 5.755-4.665 10.42-10.419 10.42H57.101c-5.754 0-10.419-4.665-10.419-10.42v-49.752c0-43.316 35.404-78.72 78.72-78.72h24.063c.048-8.668 5.917-16.076 13.861-18.479V337.22h-54.737c-35.914 0-65.579-27.915-68.391-63.133-10.704-.735-20.363-5.408-27.524-12.571C4.854 253.697 0 242.902 0 231.019v-40.881c0-11.884 4.854-22.679 12.674-30.497 7.171-7.173 16.847-11.85 27.571-12.574 3.063-34.97 32.609-62.609 68.344-62.609h87.316V61.51a31.659 31.659 0 01-11.948-7.508c-5.724-5.725-9.266-13.635-9.266-22.368 0-8.734 3.542-16.643 9.266-22.368C189.682 3.542 197.592 0 206.324 0c8.733 0 16.643 3.542 22.367 9.267 5.725 5.723 9.267 13.632 9.267 22.367 0 8.733-3.542 16.643-9.267 22.367a31.649 31.649 0 01-11.948 7.509v22.948h86.954c35.772 0 65.342 27.695 68.354 62.716z"/>
              <path fill="#495F7C" d="M238.541 337.22v17.044h-64.797V337.22z"/>
              <path fill="#DD786D" d="M39.977 263.614c-16.53-1.618-29.558-15.658-29.558-32.595v-40.881c0-16.937 13.028-30.977 29.558-32.595v106.071z"/>
              <path fill="#EE9983" d="M39.977 250.267c-16.53-1.618-29.558-15.659-29.558-32.596v-27.533c0-16.937 13.028-30.976 29.558-32.595v92.724z"/>
              <path fill="#DD786D" d="M372.309 263.462c15.914-2.202 28.272-15.948 28.272-32.443v-40.881c0-16.495-12.358-30.241-28.272-32.443v105.767z"/>
              <path fill="#EE9983" d="M372.309 250.115c15.914-2.202 28.272-15.948 28.272-32.444v-27.533c0-16.495-12.358-30.241-28.272-32.442v92.419z"/>
              <path fill="#DFDCDF" d="M108.589 94.937h195.108c31.974 0 58.133 26.159 58.133 58.132v115.54c0 31.973-26.159 58.132-58.133 58.132H108.589c-31.974 0-58.133-26.159-58.133-58.132v-115.54c0-31.973 26.159-58.132 58.133-58.132z"/>
              <path fill="#F9F2F5" d="M104.421 94.937h182.605c31.972 0 58.133 26.168 58.133 58.132v115.54c0 16.042-6.594 30.633-17.203 41.18a57.64 57.64 0 01-21.377 4.096H123.974c-31.965 0-58.133-26.16-58.133-58.132v-115.54c0-25.373 11.859-45.276 38.58-45.276z"/>
              <path fill="#F0AB9E" d="M206.325 10.419c11.716 0 21.214 9.498 21.214 21.215s-9.498 21.214-21.214 21.214c-11.717 0-21.215-9.497-21.215-21.214 0-11.717 9.498-21.215 21.215-21.215z"/>
              <path fill="#EA8D7A" d="M227.501 32.89c-.65 11.133-9.881 19.959-21.177 19.959-9.487 0-17.519-6.228-20.232-14.819.651-11.132 9.882-19.958 21.176-19.958 9.488 0 17.52 6.228 20.233 14.818z"/>
              <path fill="#FAF4F4" d="M168.871 364.682h74.543c4.908 0 8.929 3.986 8.988 8.881h-92.518c.058-4.895 4.08-8.881 8.987-8.881z"/>
              <path fill="#F2EBEC" d="M132.26 383.982h148.364c.225.416.526.8.901 1.132 4.08 3.602 7.715 7.879 10.912 12.302 3.222 4.459 6.025 9.122 8.403 13.424 4.133 7.479 6.384 13.587 7.591 19.801 1.22 6.285 1.412 12.9 1.412 21.225v49.998c0 .058.001.115.004.172h-206.81c.002-.057.004-.114.004-.172v-49.998c0-8.325.192-14.94 1.412-21.225 1.207-6.214 3.457-12.322 7.591-19.801 2.378-4.302 5.182-8.965 8.404-13.424 3.197-4.423 6.831-8.7 10.912-12.302a4.14 4.14 0 00.9-1.132zm160.087.154c35.481 2.346 63.785 32.099 63.785 68.147v20.154a4.002 4.002 0 00-.219-.006h-37.734v-20.565c0-8.754-.215-15.773-1.576-22.787-1.376-7.086-3.89-13.956-8.47-22.243-2.486-4.499-5.457-9.429-8.956-14.272-2.093-2.896-4.367-5.744-6.83-8.428zm63.785 96.626v21.274h-37.957c.002-.057.004-.114.004-.172v-21.097h37.734c.073 0 .146-.002.219-.005zM94.709 502.036H57.101v-21.273c.062.003.124.004.187.004h37.417v21.097c0 .058.002.115.004.172zm-.004-29.605H57.288c-.063 0-.125.002-.187.004v-20.152c0-35.923 28.106-65.596 63.414-68.123-2.454 2.676-4.72 5.517-6.807 8.404-3.499 4.842-6.47 9.772-8.957 14.272-4.58 8.288-7.094 15.157-8.47 22.243-1.362 7.014-1.576 14.033-1.576 22.787v20.565z"/>
              <path fill="#233551" fillRule="nonzero" d="M98.871 472.431a4.168 4.168 0 010 8.336H57.288a4.169 4.169 0 010-8.336h41.583zM162.039 408.205h89.154c12.956 0 23.565 10.618 23.565 23.565v24.569c0 12.977-10.587 23.565-23.565 23.565h-89.154c-12.96 0-23.565-10.617-23.565-23.565V431.77c0-12.982 10.583-23.565 23.565-23.565z"/>
              <path fill="#EE9A87" d="M162.039 418.624h89.154c7.231 0 13.146 5.918 13.146 13.146v24.569c0 7.228-5.918 13.146-13.146 13.146h-89.154c-7.228 0-13.146-5.915-13.146-13.146V431.77c0-7.231 5.915-13.146 13.146-13.146z"/>
              <path fill="#213853" fillRule="nonzero" d="M137.619 159.185c11.492 0 21.899 4.66 29.43 12.192 7.532 7.531 12.192 17.938 12.192 29.43 0 22.985-18.637 41.623-41.622 41.623-11.493 0-21.899-4.66-29.431-12.192s-12.192-17.939-12.192-29.431 4.66-21.899 12.192-29.43c7.532-7.532 17.938-12.192 29.431-12.192z"/>
              <path fill="#3A506D" d="M137.619 165.437c19.535 0 35.37 15.835 35.37 35.37 0 19.534-15.835 35.371-35.37 35.371-19.535 0-35.371-15.837-35.371-35.371 0-19.535 15.836-35.37 35.371-35.37z"/>
              <path fill="#213853" fillRule="nonzero" d="M137.619 170.483c8.372 0 15.953 3.395 21.442 8.882 5.487 5.487 8.882 13.07 8.882 21.442 0 8.373-3.395 15.954-8.882 21.443-5.489 5.487-13.07 8.882-21.442 8.882-8.374 0-15.955-3.395-21.442-8.883-5.488-5.487-8.883-13.07-8.883-21.442s3.395-15.954 8.882-21.442c5.489-5.487 13.07-8.882 21.443-8.882z"/>
              <path fill="#AFE3F1" d="M137.619 176.734c13.296 0 24.073 10.777 24.073 24.073 0 13.295-10.777 24.073-24.073 24.073-13.295 0-24.074-10.778-24.074-24.073 0-13.296 10.779-24.073 24.074-24.073z"/>
              <path fill="#213853" fillRule="nonzero" d="M275.443 159.185c22.986 0 41.623 18.637 41.623 41.622 0 11.492-4.66 21.899-12.192 29.431-7.531 7.532-17.938 12.192-29.431 12.192-11.492 0-21.899-4.66-29.431-12.192-7.531-7.532-12.191-17.939-12.191-29.431s4.66-21.899 12.191-29.43c7.532-7.532 17.939-12.192 29.431-12.192z"/>
              <path fill="#374B66" d="M275.443 165.437c19.535 0 35.371 15.835 35.371 35.37 0 19.534-15.836 35.371-35.371 35.371-19.535 0-35.371-15.837-35.371-35.371 0-19.535 15.836-35.37 35.371-35.37z"/>
              <path fill="#213853" fillRule="nonzero" d="M275.443 170.483c8.373 0 15.954 3.395 21.443 8.882 5.487 5.488 8.882 13.07 8.882 21.442s-3.395 15.955-8.883 21.442c-5.487 5.488-13.07 8.883-21.442 8.883-8.373 0-15.955-3.395-21.442-8.883-5.487-5.487-8.883-13.07-8.883-21.442s3.396-15.954 8.883-21.442c5.488-5.487 13.07-8.882 21.442-8.882z"/>
              <path fill="#AFE3F1" d="M275.443 176.734c13.295 0 24.073 10.777 24.073 24.073 0 13.295-10.778 24.073-24.073 24.073s-24.073-10.778-24.073-24.073c0-13.296 10.778-24.073 24.073-24.073z"/>
              <path fill="#213853" fillRule="nonzero" d="M237.741 265.105a6.252 6.252 0 110 12.503h-63.197a6.252 6.252 0 110-12.503h63.197zM191.366 111.116a9.653 9.653 0 016.842 2.835 9.649 9.649 0 012.835 6.843 9.652 9.652 0 01-2.835 6.843 9.648 9.648 0 01-6.842 2.835 9.65 9.65 0 01-6.844-2.835 9.657 9.657 0 01-2.835-6.843 9.653 9.653 0 012.835-6.843 9.657 9.657 0 016.844-2.835z"/>
              <path fill="#3A506D" d="M191.366 115.284a5.51 5.51 0 110 11.02 5.51 5.51 0 110-11.02z"/>
              <path fill="#213853" fillRule="nonzero" d="M221.017 111.116a9.642 9.642 0 016.828 2.835h.015a9.649 9.649 0 012.835 6.843 9.652 9.652 0 01-2.835 6.843l-.296.269a9.634 9.634 0 01-13.374-.269h-.016a9.653 9.653 0 01-2.836-6.843 9.65 9.65 0 012.836-6.843l.296-.269a9.63 9.63 0 016.547-2.566z"/>
              <path fill="#3A506D" d="M221.017 115.284a5.51 5.51 0 11-5.511 5.51 5.51 5.51 0 015.511-5.51z"/>
              <path fill="#fff" d="M131.395 180.117c5.614 0 10.164 4.55 10.164 10.163 0 5.615-4.55 10.164-10.164 10.164s-10.164-4.549-10.164-10.164c0-5.613 4.55-10.163 10.164-10.163zM275.757 180.117c5.614 0 10.163 4.55 10.163 10.163 0 5.615-4.549 10.164-10.163 10.164s-10.164-4.549-10.164-10.164c0-5.613 4.55-10.163 10.164-10.163z"/>
              <path fill="#213853" fillRule="nonzero" d="M172.22 434.377a9.649 9.649 0 016.843 2.835 9.648 9.648 0 012.835 6.842 9.653 9.653 0 01-2.835 6.844 9.653 9.653 0 01-6.843 2.835 9.653 9.653 0 01-6.843-2.835 9.657 9.657 0 01-2.835-6.844 9.653 9.653 0 012.835-6.842 9.652 9.652 0 016.843-2.835z"/>
              <path fill="#3A506D" d="M172.22 438.544a5.51 5.51 0 11.001 11.02 5.51 5.51 0 01-.001-11.02z"/>
              <path fill="#213853" fillRule="nonzero" d="M241.012 434.377a9.632 9.632 0 016.827 2.835h.016a9.65 9.65 0 012.836 6.842 9.654 9.654 0 01-2.836 6.844l-.296.269a9.633 9.633 0 01-6.547 2.566 9.642 9.642 0 01-6.828-2.835h-.015a9.653 9.653 0 01-2.835-6.844 9.648 9.648 0 012.835-6.842l.296-.269a9.628 9.628 0 016.547-2.566z"/>
              <path fill="#3A506D" d="M241.012 438.544a5.511 5.511 0 110 11.022 5.511 5.511 0 010-11.022z"/>
            </svg>
          </button>
        </div>
      )}


      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white rounded-2xl border border-borderMuted/60 z-50 flex flex-col overflow-hidden anim-scale-in" style={{ height: '500px', maxHeight: '80vh', boxShadow: '0 12px 48px rgba(0,0,0,0.25)' }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(to right, #e01a22, #b8151d)', color: '#fff', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '50%', backdropFilter: 'blur(4px)' }}>
                <Bot style={{ width: '20px', height: '20px' }} />
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '18px', lineHeight: '1.2', margin: 0, padding: 0 }}>Convi</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: 0, padding: 0 }}>AI Franchise Consultant</div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'transparent'; }}>
              <X style={{ width: '20px', height: '20px' }} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }} className="anim-fade-up">
                <div style={{
                  maxWidth: '85%', padding: '12px 16px', borderRadius: '16px',
                  ...(msg.role === 'user'
                    ? { background: 'linear-gradient(135deg, #e01a22, #b8151d)', color: '#fff', borderBottomRightRadius: '4px', boxShadow: '0 2px 8px rgba(224,26,34,0.15)' }
                    : { background: '#fff', color: '#0f172a', borderBottomLeftRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' })
                }}>
                  <ReactMarkdown
                    components={{
                      p: ({ node, ...props }) => <div style={{ fontSize: '14px', lineHeight: '1.5', margin: 0, padding: 0, marginBottom: '8px' }} {...props} />,
                      ul: ({ node, ...props }) => <ul style={{ listStyleType: 'disc', paddingLeft: '20px', margin: 0, marginBottom: '8px', fontSize: '14px' }} {...props} />,
                      strong: ({ node, ...props }) => <strong style={{ fontWeight: '700' }} {...props} />
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }} className="anim-fade-up">
                <div style={{ background: '#fff', padding: '12px 16px', borderRadius: '16px', borderBottomLeftRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <div style={{ width: '8px', height: '8px', background: 'rgba(224,26,34,0.5)', borderRadius: '50%', animation: 'dot-bounce 1.2s ease-in-out infinite' }}></div>
                  <div style={{ width: '8px', height: '8px', background: 'rgba(224,26,34,0.5)', borderRadius: '50%', animation: 'dot-bounce 1.2s ease-in-out 0.2s infinite' }}></div>
                  <div style={{ width: '8px', height: '8px', background: 'rgba(224,26,34,0.5)', borderRadius: '50%', animation: 'dot-bounce 1.2s ease-in-out 0.4s infinite' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px', background: '#fff', borderTop: '1px solid #f1f5f9' }}>
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                style={{
                  flex: 1, padding: '10px 16px', background: '#f8fafc',
                  border: '1px solid #e2e8f0', borderRadius: '99px',
                  fontSize: '14px', outline: 'none', color: '#0f172a',
                  boxShadow: 'none', minWidth: 0, height: '44px'
                }}
                onFocus={(e) => { e.target.style.border = '1px solid #e01a22'; e.target.style.background = '#fff'; }}
                onBlur={(e) => { e.target.style.border = '1px solid #e2e8f0'; e.target.style.background = '#f8fafc'; }}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: (isLoading || !input.trim()) ? '#cbd5e1' : 'linear-gradient(to right, #e01a22, #b8151d)',
                  color: '#fff', border: 'none', cursor: (isLoading || !input.trim()) ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: (isLoading || !input.trim()) ? 0.6 : 1,
                  transition: 'all 0.2s', flexShrink: 0
                }}
              >
                <Send style={{ width: '18px', height: '18px', marginLeft: '-2px' }} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
