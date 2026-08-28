import React, { useState, useEffect } from 'react';
import { getEnquiryDetails, updateEnquiryStatus, createFollowUpTask, updateTaskStatus, getTemplates, sendEmail } from '../lib/api';
import { useDialog } from './Dialog';
import { X, User, Phone, Mail, MapPin, Building, Calendar, Clock, CheckCircle2, MessageSquare, AlertCircle, Search, ChevronDown } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('details'); // details, timeline, tasks

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
    
    // Get Admin Name (for now, assume we can get it or just use "Admin")
    // In a real app this would come from an auth context
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
          // Direct native mobile app launch for Email
          const mailtoUrl = `mailto:${encodeURIComponent(data.email)}?subject=${encodeURIComponent(previewTemplate.name)}&body=${encodeURIComponent(plainBody)}`;
          window.location.href = mailtoUrl;
        } else {
          // Desktop Web Gmail Compose
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
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm">
         <div className="bg-white rounded-2xl p-8 shadow-elevated flex flex-col items-center anim-scale-in">
            <div className="h-8 w-8 rounded-full border-4 border-borderMuted border-t-primary animate-spin mb-4"></div>
            <p className="text-inkLight font-bold">Loading Details...</p>
         </div>
      </div>
    );
  }

  const pendingTasks = data.tasks ? data.tasks.filter(t => t.status !== 'COMPLETED') : [];

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-navy/60 backdrop-blur-sm overflow-hidden">
      {isDropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />}
      <div className="bg-white shadow-elevated w-full max-w-md h-full flex flex-col overflow-hidden anim-slide-right border-l border-borderMuted/40 min-w-0">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-borderMuted/60 flex justify-between items-center bg-gradient-to-r from-surface to-white shrink-0">
          <div>
            <h2 className="font-bold text-navy text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary"/> {data.name}
            </h2>
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-borderMuted/60 text-ink mt-1 inline-block">
              {data.status.replace(/_/g, ' ')}
            </span>
          </div>
          <button onClick={onClose} className="p-2 text-inkLight/60 hover:text-inkLight hover:bg-surface rounded-full transition-all duration-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-borderMuted/60 bg-white shrink-0">
          <button 
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-3.5 text-sm font-bold border-b-2 transition-all duration-300 ${activeTab === 'details' ? 'border-primary text-primary' : 'border-transparent text-inkLight hover:text-ink'}`}
          >
            Lead Details
          </button>
          <button 
            onClick={() => setActiveTab('timeline')}
            className={`flex-1 py-3.5 text-sm font-bold border-b-2 transition-all duration-300 ${activeTab === 'timeline' ? 'border-primary text-primary' : 'border-transparent text-inkLight hover:text-ink'}`}
          >
            Timeline & Chat
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-surface relative p-6 min-w-0">
          
          {/* TAB: DETAILS */}
          {activeTab === 'details' && (
            <div className="flex flex-col gap-6 min-w-0">
              {/* Contact Info */}
              <div className="bg-white p-5 rounded-2xl shadow-card border border-borderMuted/60 flex flex-col gap-4 min-w-0 card-base">
                <h3 className="text-xs font-bold uppercase text-inkLight/60 tracking-wider">Contact Info</h3>
                <div className="grid grid-cols-1 gap-3 text-sm flex-1 min-w-0">
                  <div className="flex items-center gap-3 text-ink break-words min-w-0"><Phone className="h-4 w-4 text-inkLight/70 shrink-0"/> {data.phone}</div>
                  {data.email && <div className="flex items-center gap-3 text-ink break-words min-w-0"><Mail className="h-4 w-4 text-inkLight/70 shrink-0"/> {data.email}</div>}
                  <div className="flex items-center gap-3 text-ink break-words min-w-0"><MapPin className="h-4 w-4 text-inkLight/70 shrink-0"/> {data.location || 'N/A'}</div>
                  <div className="flex items-center gap-3 text-ink break-words min-w-0"><Building className="h-4 w-4 text-inkLight/70 shrink-0"/> {data.investment_capacity || 'N/A'}</div>
                  {data.property_status && <div className="flex items-center gap-3 text-ink break-words min-w-0"><Building className="h-4 w-4 text-inkLight/70 shrink-0"/> Property: {data.property_status}</div>}
                  {data.carpet_area && <div className="flex items-center gap-3 text-ink break-words min-w-0"><Building className="h-4 w-4 text-inkLight/70 shrink-0"/> Carpet Area: {data.carpet_area} sq.ft</div>}
                </div>
              </div>

              {/* Quick Actions (Templates) */}
              <div className="bg-white p-5 rounded-2xl shadow-card border border-borderMuted/60 flex flex-col gap-4 min-w-0 card-base">
                <h3 className="text-xs font-bold uppercase text-inkLight/60 tracking-wider">Quick Messages</h3>
                
                {previewTemplate ? (
                  <div className="border border-borderMuted rounded-xl p-4 bg-surface animate-in fade-in min-w-0 overflow-hidden">
                    <div className="flex justify-between items-center mb-3 border-b border-borderMuted pb-2">
                      <div className="font-bold text-navy text-sm flex items-center gap-2 min-w-0">
                        {previewTemplate.type === 'EMAIL' ? <Mail className="h-4 w-4 text-inkLight shrink-0"/> : <MessageSquare className="h-4 w-4 text-emerald-500 shrink-0"/>}
                        <span className="truncate">{previewTemplate.name}</span>
                      </div>
                      <button onClick={() => setPreviewTemplate(null)} className="text-inkLight/70 hover:text-inkLight shrink-0">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {previewTemplate.type === 'EMAIL' ? (
                      <div className="mb-3 max-w-full overflow-hidden">
                        <ReactQuill 
                          theme="snow" 
                          value={previewBody} 
                          onChange={setPreviewBody}
                          className="bg-white rounded-lg border border-borderMuted"
                        />
                      </div>
                    ) : (
                      <textarea 
                        className="w-full text-sm font-mono text-ink p-3 rounded-lg border border-borderMuted focus:border-primary outline-none mb-3 break-words resize-y"
                        rows={6}
                        value={previewBody}
                        onChange={(e) => setPreviewBody(e.target.value)}
                      />
                    )}
                    {previewTemplate.attachment_url && (
                      <div className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg mb-3 break-all overflow-hidden">
                        Attachment: {previewTemplate.attachment_url}
                      </div>
                    )}
                    <button 
                      onClick={handleSendTemplate}
                      disabled={isSending}
                      className="w-full bg-gradient-to-r from-navy to-[#1a2542] text-white font-bold text-sm py-2.5 rounded-lg hover:shadow-lg disabled:opacity-50 transition-all duration-300 active:scale-[0.98] btn-press"
                    >
                      {isSending ? 'Sending...' : `Send ${previewTemplate.type === 'EMAIL' ? 'Email' : 'WhatsApp'}`}
                    </button>
                  </div>
                ) : !selectedChannel ? (
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setSelectedChannel('EMAIL')}
                      className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-borderMuted/60 hover:border-blue-500 hover:bg-blue-50/60 transition-all duration-300 group card-base"
                    >
                      <div className="bg-blue-100 p-3 rounded-xl group-hover:bg-blue-500 transition-all duration-300 shadow-sm shadow-blue-500/10">
                        <Mail className="h-8 w-8 text-blue-600 group-hover:text-white transition-colors duration-300" />
                      </div>
                      <span className="font-bold text-ink group-hover:text-blue-700 transition-colors duration-300">Send Email</span>
                    </button>
                    <button 
                      onClick={() => setSelectedChannel('WHATSAPP')}
                      className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-borderMuted/60 hover:border-emerald-500 hover:bg-emerald-50/60 transition-all duration-300 group card-base"
                    >
                      <div className="bg-emerald-100 p-3 rounded-xl group-hover:bg-emerald-500 transition-all duration-300 shadow-sm shadow-emerald-500/10">
                        <MessageSquare className="h-8 w-8 text-emerald-600 group-hover:text-white transition-colors duration-300" />
                      </div>
                      <span className="font-bold text-ink group-hover:text-emerald-700 transition-colors duration-300">Send WhatsApp</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 min-w-0">
                    <button 
                      onClick={() => setSelectedChannel(null)}
                      className="text-xs font-bold text-inkLight hover:text-ink flex items-center gap-1 self-start"
                    >
                      &larr; Back to Options
                    </button>
                    <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1 animate-in fade-in slide-in-from-right-4 min-w-0">
                      {templates.filter(t => t.type === selectedChannel).length > 0 ? templates.filter(t => t.type === selectedChannel).map(t => (
                        <button 
                          key={t.id}
                          onClick={() => handlePreviewTemplate(t)}
                          className="flex items-center justify-between p-3 rounded-xl border border-borderMuted hover:border-primary/40 hover:bg-primary/10 text-left transition-colors group min-w-0"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-1.5 rounded-lg shrink-0 ${t.type === 'EMAIL' ? 'bg-borderMuted text-inkLight' : 'bg-emerald-100 text-emerald-600'}`}>
                              {t.type === 'EMAIL' ? <Mail className="h-4 w-4"/> : <MessageSquare className="h-4 w-4"/>}
                            </div>
                            <span className="font-bold text-ink text-sm group-hover:text-primary-hover truncate">{t.name}</span>
                          </div>
                          <span className="text-xs font-bold text-inkLight/70 group-hover:text-primary shrink-0 ml-2">Preview &rarr;</span>
                        </button>
                      )) : (
                        <p className="text-sm text-inkLight italic p-4 text-center border rounded-xl border-dashed">No {selectedChannel.toLowerCase()} templates found.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-card border border-borderMuted/60 min-h-full min-w-0 overflow-hidden card-base">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2 mb-6">
                <Calendar className="h-4 w-4 text-primary" /> Activity Timeline
              </h3>
              
              <div className="relative border-l-2 border-borderMuted/40 ml-2 sm:ml-3 space-y-6 min-w-0">
                {data.timeline && data.timeline.length > 0 ? data.timeline.map((event) => (
                  <div key={event.id} className="relative pl-5 sm:pl-6 min-w-0">
                    <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-white border-2 border-primary shadow-sm shadow-primary/10"></div>
                    <div className="bg-white p-4 rounded-xl shadow-card border border-borderMuted/40 hover:shadow-card-hover transition-shadow duration-300 min-w-0 overflow-hidden card-base">
                      <div className="flex justify-between items-center mb-2 gap-2 flex-wrap sm:flex-nowrap min-w-0">
                        <div className="text-[10px] font-bold tracking-widest uppercase px-2 py-1 bg-borderMuted text-inkLight rounded-lg shrink-0">
                          {event.action_type.replace(/_/g, ' ')}
                        </div>
                        <div className="text-xs text-inkLight/70 font-medium shrink-0">{formatDate(event.created_at)}</div>
                      </div>
                      <div className="text-sm text-ink whitespace-pre-wrap leading-relaxed break-words [overflow-wrap:anywhere] min-w-0 overflow-hidden">
                        {formatTimelineDescription(event.description)}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-sm text-inkLight/70 italic pl-4">No activity recorded yet.</div>
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
