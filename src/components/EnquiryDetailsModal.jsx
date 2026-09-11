import React, { useState, useEffect } from 'react';
import './AdminModals.css';
import { getEnquiryDetails, updateEnquiryStatus, createFollowUpTask, updateTaskStatus, getTemplates } from '../lib/api';
import { useDialog } from './Dialog';
import { 
  X, User, Phone, Mail, MapPin, Building, Calendar, Clock, 
  CheckCircle2, MessageSquare, AlertCircle, Search, ChevronDown, 
  Sparkles, Send, FileText, ArrowRight, ExternalLink, Copy, Check,
  Bot, RefreshCw, Flame, Store, Maximize2
} from 'lucide-react';
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

const getStatusBadgeStyle = (status) => {
  switch (status) {
    case 'NEW':
    case 'ASSIGNED':
      return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
    case 'FIRST_CALL':
    case 'INTERESTED':
    case 'CALL_LATER':
      return { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' };
    case 'DOCUMENTS_REQUESTED':
    case 'DOCUMENTS_RECEIVED':
      return { bg: '#fdf4ff', color: '#a21caf', border: '#f5d0fe' };
    case 'READY_TO_PAY':
    case 'PAYMENT_PENDING':
    case 'PAYMENT_DETAILS_SENT':
      return { bg: '#fefce8', color: '#a16207', border: '#fef08a' };
    case 'PAYMENT_RECEIVED':
    case 'APPROVED':
    case 'ONBOARDING':
    case 'OPENED':
      return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' };
    case 'NOT_INTERESTED':
    case 'NO_RESPONSE':
      return { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' };
    default:
      return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
  }
};

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
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [statusSearchQuery, setStatusSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Templates State
  const [templates, setTemplates] = useState([]);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [previewBody, setPreviewBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState('EMAIL');
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

  const handleSelectStatus = (status) => {
    if (status === data.status) {
      setIsDropdownOpen(false);
      return;
    }
    setNewStatus(status);
    setIsDropdownOpen(false);
    
    const draftStatuses = ['INTERESTED', 'READY_TO_PAY', 'APPROVED'];
    if (draftStatuses.includes(status)) {
      setShowDraftModal(true);
    } else {
      executeStatusUpdate(status);
    }
  };

  const executeStatusUpdate = async (targetStatus = newStatus) => {
    setIsUpdating(true);
    try {
      await updateEnquiryStatus(enquiryId, targetStatus);
      
      if (targetStatus === 'CALL_LATER' && followUpDate) {
        await createFollowUpTask({
          enquiry_id: enquiryId,
          task_type: 'CALL',
          scheduled_at: new Date(followUpDate).toISOString()
        });
      }
      
      onUpdate();
      await fetchDetails();
      setFollowUpDate('');
      setShowDraftModal(false);
      showToast(`Status updated to ${targetStatus.replace(/_/g, ' ')}`, 'success');
    } catch (error) {
      console.error('Update failed', error);
      showToast('Failed to update status', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopyDetails = () => {
    if (!data) return;
    const text = `Name: ${data.name || 'N/A'}\nPhone: ${data.phone || 'N/A'}\nEmail: ${data.email || 'N/A'}\nLocation: ${data.location || 'N/A'}\nInvestment: ${data.investment_capacity || 'N/A'}\nStatus: ${data.status?.replace(/_/g, ' ') || 'N/A'}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Applicant details copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const sanitizeTemplateText = (text) =>
    text
      .replace(/\uFFFD/g, '')
      .replace(/[\u25A0-\u25FF]/g, '')
      .replace(/[\u2600-\u27BF]/g, '')
      .replace(/[\uFE00-\uFE0F]/g, '')
      .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
      .replace(/[\u{2300}-\u{23FF}]/gu, '')
      .replace(/  +/g, ' ')
      .trim();

  const handlePreviewTemplate = (template) => {
    setPreviewTemplate(template);
    const adminName = "Admin"; 

    let populated = template.body
      .replace(/\[Name\]/gi, data.name || 'there')
      .replace(/\[Location\]/gi, data.location || 'your preferred location')
      .replace(/\[Investment_Capacity\]/gi, data.investment_capacity || 'your investment range')
      .replace(/\[Admin_Name\]/gi, adminName)
      .replace(/\[Date\]/gi, new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }));

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
      <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 shadow-xl flex flex-col items-center">
          <div className="h-9 w-9 rounded-full border-3 border-slate-200 border-t-red-600 animate-spin mb-3"></div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Applicant Dossier...</p>
        </div>
      </div>
    );
  }

  const badgeStyle = getStatusBadgeStyle(data.status);
  const emailTemplates = templates.filter(t => t.type === 'EMAIL');
  const whatsappTemplates = templates.filter(t => t.type === 'WHATSAPP');

  return (
    <div className="admin-drawer-backdrop">
      {isDropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />}
      
      <div className="admin-drawer-panel">
        
        {/* Drawer Header */}
        <div className="admin-drawer-header">
          <div className="admin-drawer-header-top">
            
            {/* Monogram & Title */}
            <div className="admin-drawer-monogram-row">
              <div className="admin-drawer-avatar">
                {data.name ? data.name.charAt(0).toUpperCase() : 'L'}
              </div>
              <div className="admin-drawer-title-group">
                <h2 className="admin-drawer-title">{data.name || 'Unnamed Applicant'}</h2>
                
                {/* Status Trigger Pill & Score */}
                <div className="admin-drawer-badges">
                  <div className="relative">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.color, borderColor: badgeStyle.border }}
                      className="admin-status-dropdown-btn"
                    >
                      <span>{data.status?.replace(/_/g, ' ')}</span>
                      <ChevronDown className={`h-3 w-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Status Dropdown Popover */}
                    {isDropdownOpen && (
                      <div className="absolute left-0 mt-2 w-64 bg-white/98 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl z-50 p-2 anim-scale-in">
                        <div className="p-2 border-b border-slate-100 bg-slate-50/80 rounded-t-xl mb-1.5">
                          <div className="relative">
                            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              autoFocus
                              placeholder="Search status..."
                              value={statusSearchQuery}
                              onChange={e => setStatusSearchQuery(e.target.value)}
                              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 bg-white font-medium"
                            />
                          </div>
                        </div>
                        <div className="overflow-y-auto px-1 py-1 admin-scroll max-h-56 space-y-1">
                          {ENQUIRY_STATUSES.filter(s => s.replace(/_/g, ' ').toLowerCase().includes(statusSearchQuery.toLowerCase())).map(status => {
                            const isSelected = data.status === status;
                            return (
                              <button
                                key={status}
                                onClick={() => handleSelectStatus(status)}
                                className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl flex justify-between items-center transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-red-50 text-red-700 font-black border border-red-100'
                                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                              >
                                <span>{status.replace(/_/g, ' ')}</span>
                                {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-red-600" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {data.score !== undefined && (
                    <span className="admin-badge-score">
                      <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                      Score {data.score}
                    </span>
                  )}

                  {data.source && (
                    <span className="admin-badge-source">
                      {data.source === 'CHAT' ? <Bot className="w-3.5 h-3.5 text-emerald-600" /> : <FileText className="w-3.5 h-3.5 text-blue-600" />}
                      {data.source === 'CHAT' ? 'Chat' : 'Form'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button 
              onClick={onClose} 
              className="admin-drawer-close"
              title="Close drawer"
              aria-label="Close drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Outreach Action Bar */}
          <div className="admin-drawer-outreach-grid">
            {data.phone ? (
              <a 
                href={`tel:${data.phone}`}
                className="admin-outreach-btn call"
              >
                <Phone className="w-3.5 h-3.5 shrink-0" /> <span>Call</span>
              </a>
            ) : (
              <div className="admin-outreach-btn disabled">
                <Phone className="w-3.5 h-3.5 shrink-0" /> <span>Call</span>
              </div>
            )}

            {data.phone ? (
              <button 
                onClick={() => triggerWhatsAppMessage(data.phone, `Hi ${data.name || 'there'}, greeting from Convenio Mart!`)}
                className="admin-outreach-btn whatsapp"
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0" /> <span>WhatsApp</span>
              </button>
            ) : (
              <div className="admin-outreach-btn disabled">
                <MessageSquare className="w-3.5 h-3.5 shrink-0" /> <span>WhatsApp</span>
              </div>
            )}

            {data.email ? (
              <button 
                onClick={() => {
                  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(data.email)}&su=${encodeURIComponent("Convenio Mart Franchise Opportunity")}`;
                  openOrFocusTab('EMAIL', gmailUrl);
                }}
                className="admin-outreach-btn email"
              >
                <Mail className="w-3.5 h-3.5 shrink-0" /> <span>Email</span>
              </button>
            ) : (
              <div className="admin-outreach-btn disabled">
                <Mail className="w-3.5 h-3.5 shrink-0" /> <span>Email</span>
              </div>
            )}

            <button 
              onClick={handleCopyDetails}
              className="admin-outreach-btn copy"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />} 
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="admin-drawer-tabs">
            <button 
              onClick={() => setActiveTab('details')}
              className={`admin-drawer-tab ${activeTab === 'details' ? 'active' : ''}`}
            >
              Applicant Details
            </button>
            <button 
              onClick={() => setActiveTab('timeline')}
              className={`admin-drawer-tab ${activeTab === 'timeline' ? 'active' : ''}`}
            >
              <span>Activity & History</span>
              {data.timeline?.length > 0 && (
                <span className="admin-tab-count-pill">
                  {data.timeline.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="admin-drawer-body admin-scroll">
          
          {/* TAB: DETAILS */}
          {activeTab === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Contact Information Card */}
              <div className="admin-dossier-card">
                <div className="admin-dossier-header">
                  <h3 className="admin-dossier-title">
                    <User style={{ width: '15px', height: '15px', color: '#e01a22' }} /> Contact & Property Dossier
                  </h3>
                  <span className="admin-dossier-id">
                    ID: #{String(data.id).slice(0, 8)}
                  </span>
                </div>
                
                <div className="admin-dossier-grid">
                  
                  {/* Phone */}
                  <div className="admin-dossier-item">
                    <div className="admin-dossier-item-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                      <Phone style={{ width: '16px', height: '16px' }} />
                    </div>
                    <div className="admin-dossier-item-info">
                      <p className="admin-dossier-item-label">Phone</p>
                      <a href={`tel:${data.phone}`} className="admin-dossier-item-value" style={{ display: 'block' }}>
                        {data.phone || 'N/A'}
                      </a>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="admin-dossier-item">
                    <div className="admin-dossier-item-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                      <Mail style={{ width: '16px', height: '16px' }} />
                    </div>
                    <div className="admin-dossier-item-info">
                      <p className="admin-dossier-item-label">Email</p>
                      <a href={`mailto:${data.email}`} className="admin-dossier-item-value" title={data.email} style={{ display: 'block' }}>
                        {data.email || 'N/A'}
                      </a>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="admin-dossier-item">
                    <div className="admin-dossier-item-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                      <MapPin style={{ width: '16px', height: '16px' }} />
                    </div>
                    <div className="admin-dossier-item-info">
                      <p className="admin-dossier-item-label">Target Location</p>
                      <p className="admin-dossier-item-value">{data.location || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Investment */}
                  <div className="admin-dossier-item">
                    <div className="admin-dossier-item-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
                      <Building style={{ width: '16px', height: '16px' }} />
                    </div>
                    <div className="admin-dossier-item-info">
                      <p className="admin-dossier-item-label">Investment Capacity</p>
                      <p className="admin-dossier-item-value">{data.investment_capacity || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Property Status */}
                  {data.property_status && (
                    <div className="admin-dossier-item">
                      <div className="admin-dossier-item-icon" style={{ background: '#ecfeff', color: '#0891b2' }}>
                        <Store style={{ width: '16px', height: '16px' }} />
                      </div>
                      <div className="admin-dossier-item-info">
                        <p className="admin-dossier-item-label">Property Status</p>
                        <p className="admin-dossier-item-value">{data.property_status}</p>
                      </div>
                    </div>
                  )}

                  {/* Carpet Area */}
                  {data.carpet_area && (
                    <div className="admin-dossier-item">
                      <div className="admin-dossier-item-icon" style={{ background: '#f1f5f9', color: '#475569' }}>
                        <Maximize2 style={{ width: '16px', height: '16px' }} />
                      </div>
                      <div className="admin-dossier-item-info">
                        <p className="admin-dossier-item-label">Carpet Area</p>
                        <p className="admin-dossier-item-value">{data.carpet_area} sq.ft</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* One-Click Templates & Communication */}
              <div className="admin-templates-card">
                <div className="admin-dossier-header">
                  <h3 className="admin-dossier-title">
                    <Sparkles style={{ width: '15px', height: '15px', color: '#e01a22' }} /> One-Click Templates & Messaging
                  </h3>
                </div>
                
                {previewTemplate ? (
                  /* Template Editor Preview */
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {previewTemplate.type === 'EMAIL' ? (
                          <div style={{ padding: '6px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', display: 'flex' }}>
                            <Mail style={{ width: '16px', height: '16px' }} />
                          </div>
                        ) : (
                          <div style={{ padding: '6px', borderRadius: '8px', background: '#f0fdf4', color: '#16a34a', display: 'flex' }}>
                            <MessageSquare style={{ width: '16px', height: '16px' }} />
                          </div>
                        )}
                        <span>{previewTemplate.name}</span>
                      </div>
                      <button 
                        onClick={() => setPreviewTemplate(null)} 
                        className="admin-drawer-close"
                        style={{ width: '30px', height: '30px' }}
                        title="Close preview"
                      >
                        <X style={{ width: '16px', height: '16px' }} />
                      </button>
                    </div>

                    {previewTemplate.type === 'EMAIL' ? (
                      <div style={{ marginBottom: '12px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#ffffff' }}>
                        <ReactQuill 
                          theme="snow" 
                          value={previewBody} 
                          onChange={setPreviewBody}
                        />
                      </div>
                    ) : (
                      <textarea 
                        style={{ width: '100%', fontSize: '12px', fontWeight: '500', color: '#1e293b', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', marginBottom: '12px', resize: 'vertical', background: '#ffffff', boxSizing: 'border-box' }}
                        rows={6}
                        value={previewBody}
                        onChange={(e) => setPreviewBody(e.target.value)}
                      />
                    )}

                    {previewTemplate.attachment_url && (
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#1d4ed8', background: '#eff6ff', padding: '8px 12px', borderRadius: '10px', marginBottom: '12px', wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #bfdbfe' }}>
                        <FileText style={{ width: '14px', height: '14px', flexShrink: 0 }} /> 
                        <span>Attachment: {previewTemplate.attachment_url}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => setPreviewTemplate(null)}
                        className="admin-btn-secondary"
                        style={{ padding: '9px 16px', fontSize: '12px', borderRadius: '10px' }}
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSendTemplate}
                        disabled={isSending}
                        className="admin-btn-primary"
                        style={{ flex: 1, padding: '9px 16px', fontSize: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        <Send style={{ width: '14px', height: '14px' }} />
                        <span>{isSending ? 'Opening App...' : `Send via ${previewTemplate.type === 'EMAIL' ? 'Gmail' : 'WhatsApp'}`}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Channel Selector & Template Items */
                  <div>
                    
                    {/* Channel Selector Switcher */}
                    <div className="admin-templates-channel-tabs">
                      <button 
                        onClick={() => setSelectedChannel('EMAIL')}
                        className={`admin-templates-channel-tab ${selectedChannel === 'EMAIL' ? 'active email' : ''}`}
                      >
                        <Mail style={{ width: '14px', height: '14px' }} />
                        <span>Email Templates</span>
                        <span className="admin-channel-pill">
                          {emailTemplates.length}
                        </span>
                      </button>

                      <button 
                        onClick={() => setSelectedChannel('WHATSAPP')}
                        className={`admin-templates-channel-tab ${selectedChannel === 'WHATSAPP' ? 'active whatsapp' : ''}`}
                      >
                        <MessageSquare style={{ width: '14px', height: '14px' }} />
                        <span>WhatsApp Templates</span>
                        <span className="admin-channel-pill">
                          {whatsappTemplates.length}
                        </span>
                      </button>
                    </div>

                    {/* Template List Cards */}
                    <div className="admin-templates-list admin-scroll">
                      {(selectedChannel === 'EMAIL' ? emailTemplates : whatsappTemplates).length > 0 ? (
                        (selectedChannel === 'EMAIL' ? emailTemplates : whatsappTemplates).map(t => (
                          <div 
                            key={t.id}
                            onClick={() => handlePreviewTemplate(t)}
                            className={`admin-template-item ${selectedChannel === 'EMAIL' ? 'email' : 'whatsapp'}`}
                          >
                            <div className="admin-template-item-left">
                              <div className="admin-template-item-icon">
                                {t.type === 'EMAIL' ? <Mail style={{ width: '16px', height: '16px' }}/> : <MessageSquare style={{ width: '16px', height: '16px' }}/>}
                              </div>
                              <div className="admin-template-item-info">
                                <h5 className="admin-template-item-title">{t.name}</h5>
                                <p className="admin-template-item-desc">{htmlToPlainText(t.body)}</p>
                              </div>
                            </div>
                            <span className="admin-template-item-use">
                              Use &rarr;
                            </span>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '24px', textAlign: 'center', border: '2px dashed #e2e8f0', borderRadius: '14px' }}>
                          <p style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', margin: 0 }}>No {selectedChannel.toLowerCase()} templates available.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="admin-timeline-card">
              <h3 className="admin-dossier-title" style={{ marginBottom: '16px' }}>
                <Calendar style={{ width: '15px', height: '15px', color: '#e01a22' }} /> Activity & Audit Log
              </h3>
              
              <div className="admin-timeline-tree">
                {data.timeline && data.timeline.length > 0 ? data.timeline.map((event) => (
                  <div key={event.id} className="admin-timeline-node">
                    <div className="admin-timeline-dot"></div>
                    <div className="admin-timeline-content-box">
                      <div className="admin-timeline-meta">
                        <span className="admin-timeline-type">
                          {event.action_type.replace(/_/g, ' ')}
                        </span>
                        <span className="admin-timeline-date">{formatDate(event.created_at)}</span>
                      </div>
                      <div className="admin-timeline-text">
                        {formatTimelineDescription(event.description)}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', paddingLeft: '8px' }}>No activity recorded yet for this applicant.</div>
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
