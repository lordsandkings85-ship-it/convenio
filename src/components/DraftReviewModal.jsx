import React, { useState, useEffect } from 'react';
import { sendEmail, saveCommunicationDraft, getTemplates } from '../lib/api';
import { useDialog } from './Dialog';
import { X, Send, Mail, MessageCircle, ArrowRight } from 'lucide-react';
import { openOrFocusTab, triggerWhatsAppMessage } from '../lib/openSingleTab';

const loadDynamicTemplate = async (channel, status, enquiry) => {
  try {
    const templates = await getTemplates();
    const template = templates.find(t => t.type === channel && t.status_trigger === status && t.is_system);
    
    if (template) {
      let parsedBody = template.body;
      parsedBody = parsedBody.replace(/\[Name\]/g, enquiry.name || '');
      parsedBody = parsedBody.replace(/\[Location\]/g, enquiry.location || '');
      parsedBody = parsedBody.replace(/\[Investment_Capacity\]/g, enquiry.investment_capacity || '');
      parsedBody = parsedBody.replace(/\[Date\]/g, new Date().toLocaleDateString());
      
      if (template.attachment_url) {
        if (channel === 'EMAIL') {
          parsedBody += `<br><br><a href="${template.attachment_url}">Download Attachment</a>`;
        } else {
          parsedBody += `\n\nDocument Link: ${template.attachment_url}`;
        }
      }
      
      return { body: parsedBody, subject: template.name };
    }
  } catch (e) {
    console.error("Failed to load templates", e);
  }
  return { body: `Default ${channel} message for ${status}. (Template missing in settings)`, subject: `Update for ${enquiry.name}` };
};

const htmlToPlainText = (html) => {
  if (!html) return '';
  return html
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
};

export default function DraftReviewModal({ enquiry, newStatus, onClose, onSent }) {
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { showToast } = useDialog();
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);

  useEffect(() => {
    async function loadTemplate() {
      if (selectedChannel) {
        setIsLoadingTemplate(true);
        const { body, subject: newSubject } = await loadDynamicTemplate(selectedChannel, newStatus, enquiry);
        setContent(body);
        if (selectedChannel === 'EMAIL') {
          setSubject(newSubject);
        }
        setIsLoadingTemplate(false);
      }
    }
    loadTemplate();
  }, [selectedChannel, enquiry, newStatus]);

  const handleSend = async () => {
    setIsSending(true);
    try {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      if (selectedChannel === 'EMAIL') {
        if (enquiry.email) {
          const plainBody = htmlToPlainText(content);
          if (isMobile) {
            const mailtoUrl = `mailto:${encodeURIComponent(enquiry.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(plainBody)}`;
            window.location.href = mailtoUrl;
          } else {
            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(enquiry.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(plainBody)}`;
            openOrFocusTab('EMAIL', gmailUrl);
          }
          showToast('Email composer opened with pre-filled details!', 'success');
        } else {
          showToast('Warning: No email address found.', 'warning');
        }
        
        await saveCommunicationDraft({
          enquiry_id: enquiry.id,
          channel: 'EMAIL',
          content: content,
          status: 'APPROVED_SENT',
          sent_at: new Date().toISOString()
        });
      } else if (selectedChannel === 'WHATSAPP') {
        if (enquiry.phone) {
          triggerWhatsAppMessage(enquiry.phone, content);
          showToast('WhatsApp launched with pre-filled message!', 'success');
        } else {
          showToast('Warning: No phone number found.', 'warning');
        }
        
        await saveCommunicationDraft({
          enquiry_id: enquiry.id,
          channel: 'WHATSAPP',
          content: content,
          status: 'APPROVED_SENT',
          sent_at: new Date().toISOString()
        });
      }

      onSent();
    } catch (err) {
      console.error(err);
      showToast(`Failed to open message: ${err.message}`, 'error');
    } finally {
      setIsSending(false);
    }
  };

  if (!selectedChannel) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-elevated w-full max-w-md overflow-hidden border border-borderMuted/40 p-8 text-center anim-scale-in">
          <h2 className="text-xl font-bold text-navy mb-2">How do you want to contact {enquiry.name}?</h2>
          <p className="text-sm text-inkLight mb-8 font-medium">Choose a channel to review and send the automated update.</p>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setSelectedChannel('WHATSAPP')}
              className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-borderMuted/60 bg-white hover:border-emerald-500 hover:bg-emerald-50/60 hover:shadow-md transition-all duration-300 group card-base"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shadow-sm shadow-emerald-500/10">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-navy group-hover:text-emerald-700 transition-colors duration-300">WhatsApp</div>
                  <div className="text-xs text-inkLight font-medium">{enquiry.phone || 'No phone number'}</div>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-borderMuted group-hover:text-emerald-500 transition-all duration-300 group-hover:translate-x-1" />
            </button>
            
            <button 
              onClick={() => setSelectedChannel('EMAIL')}
              className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-borderMuted/60 bg-white hover:border-blue-500 hover:bg-blue-50/60 hover:shadow-md transition-all duration-300 group card-base"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 shadow-sm shadow-blue-500/10">
                  <Mail className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-navy group-hover:text-blue-700 transition-colors duration-300">Email</div>
                  <div className="text-xs text-inkLight font-medium">{enquiry.email || 'No email address'}</div>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-borderMuted group-hover:text-blue-500 transition-all duration-300 group-hover:translate-x-1" />
            </button>
          </div>
          
          <button onClick={onClose} className="mt-6 text-sm font-bold text-inkLight/60 hover:text-inkLight transition-colors">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-elevated w-full max-w-3xl flex flex-col overflow-hidden border border-borderMuted/40 anim-scale-in">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-borderMuted/60 flex justify-between items-center bg-gradient-to-r from-surface to-white shrink-0">
          <div>
            <h2 className="font-bold text-navy text-lg flex items-center gap-2">
              {selectedChannel === 'WHATSAPP' ? <MessageCircle className="h-5 w-5 text-emerald-500"/> : <Mail className="h-5 w-5 text-blue-500"/>} 
              Review {selectedChannel === 'WHATSAPP' ? 'WhatsApp' : 'Email'} Message
            </h2>
            <p className="text-xs text-inkLight mt-0.5 font-medium">Please review the template before sending.</p>
          </div>
          <button onClick={onClose} className="p-2 text-inkLight/60 hover:text-inkLight hover:bg-surface rounded-full transition-all duration-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 flex flex-col gap-4 overflow-y-auto bg-white">
          <div>
            <label className="block text-xs font-bold text-ink mb-1.5">
              To {selectedChannel === 'WHATSAPP' ? '(Phone)' : '(Email)'}:
            </label>
            <div className="text-sm px-3 py-2.5 bg-surface/80 border border-borderMuted/60 rounded-xl text-inkLight font-medium">
              {selectedChannel === 'WHATSAPP' 
                ? (enquiry.phone || <span className="text-primary font-bold">Missing Phone Number</span>)
                : (enquiry.email ? `${enquiry.name} <${enquiry.email}>` : <span className="text-primary font-bold">Missing Email Address</span>)
              }
            </div>
          </div>

          {selectedChannel === 'EMAIL' && (
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">Subject:</label>
              <input 
                type="text" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full text-sm px-3 py-2.5 bg-white border border-borderMuted/60 rounded-xl text-navy focus:ring-2 focus:ring-primary/15 focus:border-primary outline-none transition-all duration-200"
              />
            </div>
          )}

          <div className="flex-1 flex flex-col">
            <label className="block text-xs font-bold text-ink mb-1.5">
              {selectedChannel === 'WHATSAPP' ? 'WhatsApp Message:' : 'Message Body (HTML Supported):'}
            </label>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isLoadingTemplate}
              placeholder={isLoadingTemplate ? "Loading template from database..." : ""}
              className="w-full flex-1 min-h-[250px] text-sm p-4 bg-white border border-borderMuted/60 rounded-xl text-navy focus:ring-2 focus:ring-primary/15 focus:border-primary outline-none resize-y disabled:opacity-50 transition-all duration-200"
            />
            {selectedChannel === 'WHATSAPP' && (
              <p className="text-xs text-inkLight mt-2 font-medium">
                Clicking "Send" will open a new WhatsApp Web tab with this message ready.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-borderMuted/60 bg-surface/60 flex justify-between items-center shrink-0">
          <button 
            onClick={() => setSelectedChannel(null)}
            disabled={isSending}
            className="px-4 py-2 text-sm font-bold text-inkLight hover:text-ink transition-colors"
          >
            &larr; Back to Channels
          </button>
          
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              disabled={isSending}
              className="px-4 py-2.5 text-sm font-bold text-inkLight bg-white border border-borderMuted/60 hover:bg-surface rounded-xl transition-all duration-200 active:scale-95"
            >
              Cancel
            </button>
            <button 
              onClick={handleSend}
              disabled={isSending}
              className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all duration-300 shadow-sm disabled:opacity-70 active:scale-95 btn-press ${
                selectedChannel === 'WHATSAPP' 
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:shadow-lg hover:shadow-emerald-500/20' 
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg hover:shadow-blue-500/20'
              }`}
            >
              <Send className="h-4 w-4" />
              {isSending ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
