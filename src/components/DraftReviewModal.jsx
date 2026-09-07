import React, { useState, useEffect } from 'react';
import { sendEmail, saveCommunicationDraft, getTemplates } from '../lib/api';
import { useDialog } from './Dialog';
import { X, Send, Mail, MessageCircle, ArrowRight, Sparkles } from 'lucide-react';
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
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 p-7 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-slate-900 mb-1">Select Communication Channel</h2>
          <p className="text-xs text-slate-500 mb-6 font-medium">How would you like to notify <strong className="text-slate-900">{enquiry.name}</strong> regarding this status change?</p>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setSelectedChannel('WHATSAPP')}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/50 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <div className="font-extrabold text-slate-900 text-sm group-hover:text-emerald-700">WhatsApp Message</div>
                  <div className="text-xs text-slate-500 font-medium">{enquiry.phone || 'No phone on file'}</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-all group-hover:translate-x-1" />
            </button>
            
            <button 
              onClick={() => setSelectedChannel('EMAIL')}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-500 hover:bg-blue-50/50 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform">
                  <Mail className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <div className="font-extrabold text-slate-900 text-sm group-hover:text-blue-700">Official Email</div>
                  <div className="text-xs text-slate-500 font-medium truncate max-w-[180px]">{enquiry.email || 'No email on file'}</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-all group-hover:translate-x-1" />
            </button>
          </div>
          
          <button 
            onClick={onClose} 
            className="mt-6 text-xs font-bold text-slate-400 hover:text-slate-700 uppercase tracking-wider transition-colors"
          >
            Cancel & Keep Status Only
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
          <div>
            <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              {selectedChannel === 'WHATSAPP' ? <MessageCircle className="h-5 w-5 text-emerald-600"/> : <Mail className="h-5 w-5 text-blue-600"/>} 
              Review & Customize {selectedChannel === 'WHATSAPP' ? 'WhatsApp' : 'Email'} Draft
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Edit before launching the application.</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 flex flex-col gap-4 overflow-y-auto bg-white">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Recipient {selectedChannel === 'WHATSAPP' ? '(Phone)' : '(Email)'}:
            </label>
            <div className="text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold">
              {selectedChannel === 'WHATSAPP' 
                ? (enquiry.phone || <span className="text-red-600">Missing Phone Number</span>)
                : (enquiry.email ? `${enquiry.name} <${enquiry.email}>` : <span className="text-red-600">Missing Email Address</span>)
              }
            </div>
          </div>

          {selectedChannel === 'EMAIL' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Subject Line:</label>
              <input 
                type="text" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full text-xs font-semibold px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          )}

          <div className="flex-1 flex flex-col">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {selectedChannel === 'WHATSAPP' ? 'WhatsApp Message Content:' : 'Email Body (Markdown/HTML Supported):'}
            </label>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isLoadingTemplate}
              placeholder={isLoadingTemplate ? "Loading template from database..." : ""}
              rows={8}
              className="w-full flex-1 min-h-[180px] text-xs font-mono p-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 focus:border-emerald-500 outline-none resize-y transition-all leading-relaxed"
            />
            {selectedChannel === 'WHATSAPP' && (
              <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
                Clicking "Send" will open a pre-filled WhatsApp Web / App chat with the applicant.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
          <button 
            onClick={() => setSelectedChannel(null)}
            disabled={isSending}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            &larr; Switch Channel
          </button>
          
          <div className="flex gap-2.5">
            <button 
              onClick={onClose}
              disabled={isSending}
              className="admin-btn-outline px-4 py-2 text-xs font-bold uppercase tracking-wider"
            >
              Cancel
            </button>
            <button 
              onClick={handleSend}
              disabled={isSending}
              className={`inline-flex items-center gap-2 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white rounded-xl transition-all shadow-sm disabled:opacity-50 ${
                selectedChannel === 'WHATSAPP' 
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' 
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
              }`}
            >
              <Send className="h-3.5 w-3.5" />
              {isSending ? 'Launching...' : 'Send Message'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

