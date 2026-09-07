import React, { useState, useEffect } from 'react';
import { getEnquiryDetails, updateEnquiryStatus, createFollowUpTask, updateTaskStatus, getTemplates, sendEmail } from '../lib/api';
import { useDialog } from './Dialog';
import { X, User, Phone, Mail, MapPin, Building, Calendar, Clock, CheckCircle2, MessageSquare, AlertCircle, Search, ChevronDown, Sparkles, Send, FileText, ArrowRight, ExternalLink } from 'lucide-react';
import DraftReviewModal from './DraftReviewModal';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { openOrFocusTab, triggerWhatsAppMessage } from '../lib/openSingleTab';

const ENQUIRY_STATUSES = [
  'NEW', 'ASSIGNED', 'FIRST_CALL', 'INTERESTED', 'CALL_LATER',
  'NO_RESPONSE', 'NOT_INTERESTED', 'DOCUMENTS_REQUESTED',
  'DOCUMENTS_RECEIVED', 'READY_TO_PAY', 'PAYMENT_DETAILS_SENT',
  'PAYMENT_PENDING', 'PAYMENT_RECEIVED', 'APPROVED', 'ONBOARDING', 'OPENED'
];

// Helper to convert HTML to clean plain text
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
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const formatTimelineDescription = (text) => {
  if (!text) return '';
  let clean = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  if (/<[a-z][\s\S]*>/i.test(clean)) {
    clean = htmlToPlainText(clean);
  }
  return clean;
};

export default function EnquiryDetailsModal({ enquiryId, onClose, onUpdate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  
  // Dynamic fields for specific statuses
  const [followUpDate, setFollowUpDate] = useState('');
  const [closingReason, setClosingReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Templates State
  const [templates, setTemplates] = useState([]);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [previewBody, setPreviewBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const { showToast } = useDialog();

  // Tabs
  const [activeTab, setActiveTab] = useState('details'); // details, timeline

  useEffect(() => {
    fetchDetails();
    loadTemplates();
  }, [enquiryId]);

  const loadTemplates = async () => {
    try {
      const data = await getTemplates();
      setTemplates(data || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const details = await getEnquiryDetails(enquiryId);
      setData(details);
      setNewStatus(details.status);
    } catch (error) {
      console.error('Failed to fetch details', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdateClick = () => {
    if (newStatus === data.status) return;
    
    const draftStatuses = ['INTERESTED', 'READY_TO_PAY', 'APPROVED'];
    if (draftStatuses.includes(newStatus)) {
      setShowDraftModal(true); // Open draft review first
    } else {
      executeStatusUpdate(); // Execute immediately
    }
  };

  const executeStatusUpdate = async () => {
    setIsUpdating(true);
    try {
      // 1. Update the status
      await updateEnquiryStatus(enquiryId, newStatus);
      
      // 2. Handle side-effects (State Machine logic)
      if (newStatus === 'CALL_LATER' && followUpDate) {
        await createFollowUpTask({
          enquiry_id: enquiryId,
          task_type: 'CALL',
          scheduled_at: new Date(followUpDate).toISOString()
        });
      }
      
      onUpdate(); // Refresh parent list
      await fetchDetails(); // Refresh modal data
      setFollowUpDate('');
      setClosingReason('');
      setShowDraftModal(false);
    } catch (error) {
      console.error('Update failed', error);
      showToast('Failed to update status', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await updateTaskStatus(taskId, 'COMPLETED');
      await fetchDetails(); // Refresh
      onUpdate(); // Refresh parent in case due banner needs updating
    } catch (error) {
      showToast('Failed to update task', 'error');
    }
  };

  // Strips corrupted chars AND all emojis from WhatsApp text
  const sanitizeTemplateText = (text) =>
    text
      .replace(/\uFFFD/g, '')                        // Unicode replacement character
      .replace(/[\u25A0-\u25FF]/g, '')               // Geometric shapes block (◆ ■ □ etc.)
      .replace(/[\u2600-\u27BF]/g, '')               // Misc symbols & dingbats
      .replace(/[\uFE00-\uFE0F]/g, '')               // Variation selectors
      .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')        // All emoji (emoticons, pictographs, flags…)
      .replace(/[\u{2300}-\u{23FF}]/gu, '')          // Misc technical (clocks etc.)
      .replace(/  +/g, ' ')                          // Collapse extra spaces
      .trim();

  const handlePreviewTemplate = (template) => {
    setPreviewTemplate(template);
    
    const adminName = "Admin"; 

    // Replace Tags
    let populated = template.body
      .replace(/\[Name\]/gi, data.name || 'there')
      .replace(/\[Location\]/gi, data.location || 'your preferred location')
      .replace(/\[Investment_Capacity\]/gi, data.investment_capacity || 'your investment range')
      .replace(/\[Admin_Name\]/gi, adminName)
      .replace(/\[Date\]/gi, new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }));

    // For WhatsApp, sanitize broken characters from DB right away
    if (template.type === 'WHATSAPP') {
      populated = sanitizeTemplateText(populated);
    }
      
    setPreviewBody(populated);
  };

  const handleSendTemplate = async () => {
    setIsSending(true);
    try {
      if (previewTemplate.type === 'EMAIL') {
        if (!data.email) throw new Error("No email address on file for this lead.");

        const plainBody = htmlToPlainText(previewBody);

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
          const mailtoUrl = `mailto:${encodeURIComponent(data.email)}?subject=${encodeURIComponent(previewTemplate.name)}&body=${encodeURIComponent(plainBody)}`;
          window.location.href = mailtoUrl;
        } else {
          const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(data.email)}&su=${encodeURIComponent(previewTemplate.name)}&body=${encodeURIComponent(plainBody)}`;
          openOrFocusTab('EMAIL', gmailUrl);
        }

      } else {
        if (!data.phone) throw new Error("No phone number on file for this lead.");
        const cleanMessage = sanitizeTemplateText(previewBody);
        triggerWhatsAppMessage(data.phone, cleanMessage);
      }

      // Log to timeline
      const { supabase } = await import('../lib/supabase.js');
      await supabase.from('enquiry_timeline').insert([{
        enquiry_id: enquiryId,
        action_type: previewTemplate.type === 'EMAIL' ? 'EMAIL_SENT' : 'WHATSAPP_SENT',
        description: `Sent template: ${previewTemplate.name}\n\n${htmlToPlainText(previewBody)}`
      }]);
      await fetchDetails();
      setPreviewTemplate(null);
      setPreviewBody('');
      showToast(`${previewTemplate.type === 'EMAIL' ? 'Gmail compose' : 'WhatsApp'} opened successfully!`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to open message.', 'error');
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading || !data) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 shadow-xl flex flex-col items-center">
          <div className="h-9 w-9 rounded-full border-3 border-slate-200 border-t-emerald-600 animate-spin mb-3"></div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Applicant Dossier...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-slate-900/60 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200">
      {isDropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />}
      <div className="bg-white shadow-2xl w-full max-w-lg h-full flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 border-l border-slate-200 min-w-0">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200/80 bg-white shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                {data.name ? data.name.charAt(0).toUpperCase() : 'L'}
              </div>
              <div>
                <h2 className="font-extrabold text-slate-900 text-lg leading-tight">{data.name || 'Unnamed Applicant'}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
                    {data.status?.replace(/_/g, ' ')}
                  </span>
                  {data.score && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      Score: {data.score}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-slate-100 p-1 rounded-xl mt-4 border border-slate-200/80">
            <button 
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'details' 
                  ? 'bg-white text-slate-900 shadow-xs font-extrabold' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Applicant Details
            </button>
            <button 
              onClick={() => setActiveTab('timeline')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'timeline' 
                  ? 'bg-white text-slate-900 shadow-xs font-extrabold' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Activity & History
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-5 space-y-5 min-w-0">
          
          {/* TAB: DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-5 min-w-0">
              {/* Contact Information Card */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Contact & Property Dossier
                </h3>
                
                <div className="grid grid-cols-1 gap-3.5 text-xs font-semibold">
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-500 flex items-center gap-2"><Phone className="h-4 w-4 text-emerald-600 shrink-0"/> Phone</span>
                    <a href={`tel:${data.phone}`} className="text-slate-900 hover:text-emerald-600 font-bold">{data.phone || 'N/A'}</a>
                  </div>

                  {data.email && (
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-500 flex items-center gap-2"><Mail className="h-4 w-4 text-blue-600 shrink-0"/> Email</span>
                      <a href={`mailto:${data.email}`} className="text-slate-900 hover:text-blue-600 font-bold truncate max-w-[200px]">{data.email}</a>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-500 flex items-center gap-2"><MapPin className="h-4 w-4 text-purple-600 shrink-0"/> Location</span>
                    <span className="text-slate-900 font-bold">{data.location || 'N/A'}</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-500 flex items-center gap-2"><Building className="h-4 w-4 text-amber-600 shrink-0"/> Investment</span>
                    <span className="text-slate-900 font-bold">{data.investment_capacity || 'N/A'}</span>
                  </div>

                  {data.property_status && (
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-500 flex items-center gap-2"><Building className="h-4 w-4 text-slate-400 shrink-0"/> Property Status</span>
                      <span className="text-slate-900 font-bold">{data.property_status}</span>
                    </div>
                  )}

                  {data.carpet_area && (
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-500 flex items-center gap-2"><Building className="h-4 w-4 text-slate-400 shrink-0"/> Carpet Area</span>
                      <span className="text-slate-900 font-bold">{data.carpet_area} sq.ft</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Communication Actions */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> One-Click Communication
                </h3>
                
                {previewTemplate ? (
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 min-w-0">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-200">
                      <div className="font-extrabold text-slate-900 text-xs flex items-center gap-2 min-w-0">
                        {previewTemplate.type === 'EMAIL' ? <Mail className="h-4 w-4 text-blue-600 shrink-0"/> : <MessageSquare className="h-4 w-4 text-emerald-600 shrink-0"/>}
                        <span className="truncate">{previewTemplate.name}</span>
                      </div>
                      <button onClick={() => setPreviewTemplate(null)} className="text-slate-400 hover:text-slate-700">
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {previewTemplate.type === 'EMAIL' ? (
                      <div className="mb-3 max-w-full rounded-lg overflow-hidden border border-slate-200 bg-white">
                        <ReactQuill 
                          theme="snow" 
                          value={previewBody} 
                          onChange={setPreviewBody}
                        />
                      </div>
                    ) : (
                      <textarea 
                        className="w-full text-xs font-mono text-slate-800 p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none mb-3 resize-y bg-white"
                        rows={6}
                        value={previewBody}
                        onChange={(e) => setPreviewBody(e.target.value)}
                      />
                    )}

                    {previewTemplate.attachment_url && (
                      <div className="text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg mb-3 break-all flex items-center gap-1.5 border border-blue-100">
                        <FileText className="w-3.5 h-3.5 shrink-0" /> Attachment: {previewTemplate.attachment_url}
                      </div>
                    )}

                    <button 
                      onClick={handleSendTemplate}
                      disabled={isSending}
                      className="admin-btn-primary w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isSending ? 'Launching App...' : `Send via ${previewTemplate.type === 'EMAIL' ? 'Gmail' : 'WhatsApp'}`}
                    </button>
                  </div>
                ) : !selectedChannel ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setSelectedChannel('EMAIL')}
                      className="flex flex-col items-center gap-2.5 p-5 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all group"
                    >
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                        <Mail className="h-6 w-6" />
                      </div>
                      <span className="font-bold text-xs text-slate-800 group-hover:text-blue-700">Send Email</span>
                    </button>
                    
                    <button 
                      onClick={() => setSelectedChannel('WHATSAPP')}
                      className="flex flex-col items-center gap-2.5 p-5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group"
                    >
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                        <MessageSquare className="h-6 w-6" />
                      </div>
                      <span className="font-bold text-xs text-slate-800 group-hover:text-emerald-700">Send WhatsApp</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 min-w-0">
                    <button 
                      onClick={() => setSelectedChannel(null)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1"
                    >
                      &larr; Choose Different Channel
                    </button>
                    
                    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                      {templates.filter(t => t.type === selectedChannel).length > 0 ? (
                        templates.filter(t => t.type === selectedChannel).map(t => (
                          <button 
                            key={t.id}
                            onClick={() => handlePreviewTemplate(t)}
                            className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition-all group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`p-1.5 rounded-lg shrink-0 ${t.type === 'EMAIL' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                {t.type === 'EMAIL' ? <Mail className="h-3.5 w-3.5"/> : <MessageSquare className="h-3.5 w-3.5"/>}
                              </div>
                              <span className="font-bold text-xs text-slate-800 group-hover:text-emerald-700 truncate">{t.name}</span>
                            </div>
                            <span className="text-[11px] font-bold text-slate-400 group-hover:text-emerald-700 shrink-0 ml-2">Preview &rarr;</span>
                          </button>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic p-4 text-center border rounded-xl border-dashed">
                          No {selectedChannel.toLowerCase()} templates available.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 min-h-full min-w-0">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-6 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-emerald-600" /> Applicant Activity Log
              </h3>
              
              <div className="relative border-l-2 border-slate-200 ml-3 space-y-6 min-w-0">
                {data.timeline && data.timeline.length > 0 ? data.timeline.map((event) => (
                  <div key={event.id} className="relative pl-6 min-w-0">
                    <div className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white shadow-xs"></div>
                    <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/70 min-w-0">
                      <div className="flex justify-between items-center mb-2 gap-2 flex-wrap">
                        <span className="text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 bg-white text-slate-700 rounded-md border border-slate-200">
                          {event.action_type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">{formatDate(event.created_at)}</span>
                      </div>
                      <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed break-words">
                        {formatTimelineDescription(event.description)}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-xs text-slate-400 italic pl-4">No activity recorded yet for this applicant.</div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {showDraftModal && (
        <DraftReviewModal 
          enquiry={data}
          newStatus={newStatus}
          onClose={() => setShowDraftModal(false)}
          onSent={() => executeStatusUpdate()}
        />
      )}
    </div>
  );
}

