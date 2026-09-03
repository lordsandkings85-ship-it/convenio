import React, { useState, useEffect } from 'react';
import { useEnquiries } from '../hooks/useEnquiries';
import { useLeadFilters } from '../hooks/useLeadFilters';
import LeadTableRow from './LeadTableRow';
import AnalyticsCharts from './AnalyticsCharts';
import EnquiryDetailsModal from './EnquiryDetailsModal';
import DraftReviewModal from './DraftReviewModal';
import FollowUpChoiceModal from './FollowUpChoiceModal';
import ScheduleReminderModal from './ScheduleReminderModal';
import { 
  RefreshCcw, Calendar, Phone, MapPin, ChevronDown, MessageSquare, 
  DollarSign, BellRing, Bot, FileText, Filter, Search, TrendingUp, 
  RotateCcw, Eye, Trash2, Users, BarChart3, CheckCircle2, X 
} from 'lucide-react';

const ENQUIRY_STATUSES = [
  'NEW', 'FIRST_CALL', 'INTERESTED', 'CALL_LATER',
  'NO_RESPONSE', 'NOT_INTERESTED', 'READY_TO_PAY', 'PAYMENT_RECEIVED', 
  'APPROVED', 'COMPLETED'
];

const STATUS_FILTER_OPTIONS = [
  { id: 'ALL', label: 'All Statuses', color: 'bg-inkLight/70' },
  { id: 'ACTIVE', label: 'Active Only', color: 'bg-blue-500' },
  { id: 'CLOSED', label: 'Closed/Won', color: 'bg-emerald-500' },
  { id: 'NEW', label: 'New', color: 'bg-inkLight' },
  { id: 'FIRST_CALL', label: 'First Call', color: 'bg-indigo-500' },
  { id: 'INTERESTED', label: 'Interested', color: 'bg-amber-500' },
  { id: 'READY_TO_PAY', label: 'Ready To Pay', color: 'bg-purple-500' },
  { id: 'APPROVED', label: 'Approved', color: 'bg-teal-500' },
  { id: 'NOT_INTERESTED', label: 'Not Interested', color: 'bg-rose-500' }
];

const getStatusColor = (status) => {
  if (['NEW', 'NO_RESPONSE'].includes(status)) return 'bg-borderMuted text-ink border-borderMuted';
  if (['FIRST_CALL'].includes(status)) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (['INTERESTED', 'CALL_LATER'].includes(status)) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
  if (['NOT_INTERESTED'].includes(status)) return 'bg-primary/10 text-primary-hover border-primary/20';
  if (['READY_TO_PAY'].includes(status)) return 'bg-purple-50 text-purple-700 border-purple-200';
  if (['PAYMENT_RECEIVED'].includes(status)) return 'bg-orange-50 text-orange-700 border-orange-200';
  if (['APPROVED', 'COMPLETED'].includes(status)) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  return 'bg-borderMuted text-ink border-borderMuted';
};

const getNextActionText = (status) => {
  switch(status) {
    case 'NEW': return 'Make First Call';
    case 'FIRST_CALL': return 'Awaiting Decision';
    case 'INTERESTED': return 'Send Brochure';
    case 'CALL_LATER': return 'Follow up later';
    case 'NO_RESPONSE': return 'Follow up again';
    case 'READY_TO_PAY': return 'Send Payment Details';
    case 'PAYMENT_RECEIVED': return 'Verify & Approve';
    case 'APPROVED': return 'Finalize Onboarding';
    case 'COMPLETED':
    case 'NOT_INTERESTED':
      return 'None';
    default: return 'None';
  }
};

const getNextStatusOptions = (status) => {
  switch(status) {
    case 'NEW': return ['FIRST_CALL'];
    case 'FIRST_CALL': return ['INTERESTED', 'CALL_LATER', 'NO_RESPONSE', 'NOT_INTERESTED'];
    case 'CALL_LATER': return ['FIRST_CALL', 'NO_RESPONSE', 'NOT_INTERESTED'];
    case 'NO_RESPONSE': return ['FIRST_CALL', 'NOT_INTERESTED'];
    case 'INTERESTED': return ['READY_TO_PAY', 'NOT_INTERESTED'];
    case 'READY_TO_PAY': return ['PAYMENT_RECEIVED'];
    case 'PAYMENT_RECEIVED': return ['APPROVED'];
    case 'APPROVED': return ['COMPLETED'];
    case 'COMPLETED': return [];
    default: return [];
  }
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

export default function FranchiseDashboard() {
  const {
    enquiries,
    dueTasks,
    loading,
    isAlertDismissed,
    dismissAlert,
    fetchEnquiriesData,
    handleStatusChange,
    handleDeleteLead
  } = useEnquiries();

  const {
    statusFilter,
    setStatusFilter,
    sourceFilter,
    setSourceFilter,
    dateFilter,
    setDateFilter,
    searchQuery,
    setSearchQuery,
    filteredEnquiries,
    resetFilters
  } = useLeadFilters(enquiries);

  const [selectedEnquiryId, setSelectedEnquiryId] = useState(null);
  const [draftReview, setDraftReview] = useState(null);
  const [followUpChoice, setFollowUpChoice] = useState(null);
  const [scheduleReminder, setScheduleReminder] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [openStatusPopoverId, setOpenStatusPopoverId] = useState(null);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [actionMenuMode, setActionMenuMode] = useState('main');
  const [statusSearchQuery, setStatusSearchQuery] = useState('');
  const [showCharts, setShowCharts] = useState(false);

  const isAnyModalOpen = Boolean(selectedEnquiryId || draftReview || followUpChoice || scheduleReminder || showFilterModal);

  useEffect(() => {
    if (!isAnyModalOpen) return;
    window.history.pushState({ modalOpen: true }, '');

    const handlePopState = () => {
      setSelectedEnquiryId(null);
      setDraftReview(null);
      setFollowUpChoice(null);
      setScheduleReminder(null);
      setShowFilterModal(false);
      setIsStatusDropdownOpen(false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isAnyModalOpen]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 w-full">
        <RefreshCcw className="h-8 w-8 animate-spin text-inkLight/70" />
      </div>
    );
  }

  const totalEnquiries = enquiries.length;
  const chatLeads = enquiries.filter(e => e.source === 'CHAT').length;
  const formLeads = enquiries.filter(e => e.source === 'FORM').length;
  const conversions = enquiries.filter(e => ['APPROVED', 'COMPLETED'].includes(e.status)).length;

  return (
    <div className="flex flex-col gap-4 flex-1 relative">
      
      {/* Click-away overlay for popovers */}
      {(openStatusPopoverId || openActionMenuId) && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => {
            setOpenStatusPopoverId(null);
            setOpenActionMenuId(null);
          }}
        />
      )}
      
      {/* Due Tasks Alert Banner */}
      {/* Due Tasks Alert Banner */}
      {(dueTasks.length > 0 && !isAlertDismissed) && (
        <div 
          style={{ 
            flexShrink: 0, 
            width: '100%', 
            boxSizing: 'border-box',
            backgroundColor: 'rgba(224, 26, 34, 0.06)',
            border: '1px solid rgba(224, 26, 34, 0.15)',
            display: 'flex',
            alignItems: 'center',
            padding: '16px',
            gap: '16px',
            borderRadius: '16px',
            position: 'relative'
          }}
          className="shrink-0 shadow-sm anim-slide-up"
        >
          <div 
            style={{ 
              backgroundColor: 'rgba(224, 26, 34, 0.12)',
              padding: '10px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <BellRing style={{ width: '20px', height: '20px', color: '#e01a22' }} className="animate-bounce" />
          </div>
          <div className="flex-1">
            <h4 style={{ color: '#c1151c', margin: 0 }} className="font-bold text-sm">Action Required: Pending Follow-ups</h4>
            <p style={{ color: 'rgba(193, 21, 28, 0.8)', margin: '2px 0 0 0' }} className="text-xs">
              You have {dueTasks.length} scheduled follow-up{dueTasks.length !== 1 ? 's' : ''} currently due for: <span className="font-bold">{dueTasks.map(t => t.enquiries?.name || 'Unknown').join(', ')}</span>.
            </p>
          </div>
          <button 
            onClick={() => setSelectedEnquiryId(dueTasks[0].enquiry_id)}
            style={{
              background: 'linear-gradient(135deg, #e01a22 0%, #b8151d 100%)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(224, 26, 34, 0.15)',
              padding: '10px 18px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold',
              lineHeight: 1,
              whiteSpace: 'nowrap',
              marginRight: '24px',
              transition: 'all 0.2s'
            }}
            className="active:scale-95 btn-press"
          >
            Review Now
          </button>
          
          <button 
            onClick={dismissAlert}
            style={{ 
              color: 'rgba(224, 26, 34, 0.6)', 
              cursor: 'pointer',
              position: 'absolute',
              top: '8px',
              right: '8px',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              background: 'transparent',
              borderRadius: '8px'
            }}
            className="hover:text-[#e01a22] hover:bg-red-50 transition-all duration-200"
            title="Dismiss Alert"
          >
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 shrink-0">
        {[
          { label: 'Total Leads', value: totalEnquiries, trend: '↑ 2 today', trendColor: '#10b981', iconBg: '#eff6ff', iconColor: '#3b82f6', Icon: Users },
          { label: 'Chat Leads', value: chatLeads, trend: '0%', trendColor: '#94a3b8', iconBg: '#faf5ff', iconColor: '#a855f7', Icon: MessageSquare },
          { label: 'Form Leads', value: formLeads, trend: '↑ 100%', trendColor: '#10b981', iconBg: '#f0fdf4', iconColor: '#22c55e', Icon: FileText },
          { label: 'Conversions', value: conversions, trend: '0%', trendColor: '#94a3b8', iconBg: '#fff7ed', iconColor: '#f97316', Icon: DollarSign },
        ].map(({ label, value, trend, trendColor, iconBg, iconColor, Icon }) => (
          <div key={label} style={{ background: '#ffffff', border: '1px solid #eaeaea', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)', transition: 'box-shadow 0.2s ease' }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{label}</p>
              <p style={{ fontSize: '28px', fontWeight: '900', color: '#0b1120', lineHeight: 1, marginBottom: '8px' }}>{value}</p>
              <p style={{ fontSize: '11px', fontWeight: '700', color: trendColor, display: 'flex', alignItems: 'center', gap: '4px' }}>{trend}</p>
            </div>
            <div style={{ background: iconBg, color: iconColor, padding: '14px', borderRadius: '14px', flexShrink: 0 }}>
              <Icon style={{ width: '22px', height: '22px' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts toggle + Charts */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          onClick={() => setShowCharts(!showCharts)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', border: '1px solid #eaeaea', color: '#1e293b', fontWeight: '700', fontSize: '13px', padding: '8px 16px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', cursor: 'pointer', transition: 'all 0.2s ease' }}
        >
          <BarChart3 style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
          {showCharts ? 'Hide Charts' : 'Charts'}
        </button>
      </div>

      {showCharts && <AnalyticsCharts />}

      <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #eaeaea', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
        
        {/* Filter Bar */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #eaeaea', background: '#ffffff', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', flexShrink: 0, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads by name, phone, city..."
              style={{ width: '100%', paddingLeft: '42px', paddingRight: '16px', paddingTop: '10px', paddingBottom: '10px', border: '1.5px solid #e2e8f0', borderRadius: '50px', fontSize: '13px', fontWeight: '500', color: '#1e293b', background: '#f8f9fa', outline: 'none', transition: 'all 0.2s ease', boxShadow: 'none' }}
              onFocus={e => { e.target.style.borderColor = '#e01a22'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(224,26,34,0.08)'; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8f9fa'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => setShowFilterModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '9px 16px', borderRadius: '50px', fontSize: '12px', fontWeight: '700',
                border: statusFilter !== 'ALL' || sourceFilter !== 'ALL' || dateFilter !== 'ALL' ? '1.5px solid #bfdbfe' : '1.5px solid #e2e8f0',
                background: statusFilter !== 'ALL' || sourceFilter !== 'ALL' || dateFilter !== 'ALL' ? '#eff6ff' : '#f8f9fa',
                color: statusFilter !== 'ALL' || sourceFilter !== 'ALL' || dateFilter !== 'ALL' ? '#1d4ed8' : '#475569',
                cursor: 'pointer', transition: 'all 0.2s ease'
              }}
            >
              <Filter style={{ width: '14px', height: '14px', color: '#3b82f6' }} />
              <span>Filters</span>
              {(statusFilter !== 'ALL' || sourceFilter !== 'ALL' || dateFilter !== 'ALL') && (
                <span className="h-5 w-5 bg-blue-600 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center shadow-sm">
                  {[statusFilter !== 'ALL', sourceFilter !== 'ALL', dateFilter !== 'ALL'].filter(Boolean).length}
                </span>
              )}
            </button>

            {(statusFilter !== 'ALL' || sourceFilter !== 'ALL' || dateFilter !== 'ALL' || searchQuery !== '') && (
              <button
                onClick={resetFilters}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '9px 14px', borderRadius: '50px', fontSize: '12px', fontWeight: '700', color: '#e01a22', background: 'rgba(224,26,34,0.05)', border: '1.5px solid rgba(224,26,34,0.15)', cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0 }}
              >
                <RotateCcw style={{ width: '13px', height: '13px' }} /> Reset
              </button>
            )}
          </div>
        </div>

        {/* MOBILE CARD VIEW (< md) */}
        <div className="md:hidden flex-1 overflow-y-auto pb-32 px-2 pt-2 space-y-2.5">
          {filteredEnquiries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-inkLight/60">
              <Users className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-base font-bold text-inkLight">No franchise enquiries found.</p>
              <p className="text-xs text-inkLight/60 mt-1">Try resetting filters or searching another keyword.</p>
            </div>
          ) : (
            filteredEnquiries.map(enquiry => (
              <div
                key={enquiry.id}
                className="bg-white rounded-2xl border border-borderMuted/60 shadow-card relative active:bg-surface/60 transition-all duration-200 card-base"
              >
                <div className="p-3.5 flex items-center gap-3">
                  <div
                    className="flex-1 flex items-center gap-3 cursor-pointer min-w-0"
                    onClick={() => setSelectedEnquiryId(enquiry.id)}
                  >
                    <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-extrabold text-lg shrink-0 border border-blue-200/60 shadow-xs">
                      {enquiry.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-navy text-base truncate leading-tight">{enquiry.name}</div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs text-inkLight font-medium">
                        <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-inkLight/70" />{enquiry.phone}</span>
                        {enquiry.location && (
                          <>
                            <span className="text-borderMuted">•</span>
                            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-inkLight/70" />{enquiry.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="relative shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenStatusPopoverId(openStatusPopoverId === enquiry.id ? null : enquiry.id);
                        setOpenActionMenuId(null);
                      }}
                      className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full font-bold border shadow-xs transition-transform active:scale-95 ${getStatusColor(enquiry.status)}`}
                    >
                      {enquiry.status.replace(/_/g, ' ')}
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openStatusPopoverId === enquiry.id ? 'rotate-180' : ''}`} />
                    </button>

                    {openStatusPopoverId === enquiry.id && (
                      <div className="absolute right-0 top-full mt-1.5 w-52 rounded-2xl bg-white shadow-2xl border border-borderMuted p-2 z-[65] animate-in fade-in zoom-in-95 duration-150">
                        <div className="text-xs uppercase font-extrabold text-inkLight/70 mb-1.5 px-2 tracking-wider">Change Status</div>
                        <div className="max-h-56 overflow-y-auto flex flex-col gap-1">
                          {ENQUIRY_STATUSES.map(status => (
                            <button
                              key={status}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(enquiry.id, status, setFollowUpChoice, setDraftReview);
                                setOpenStatusPopoverId(null);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl flex justify-between items-center transition-colors ${
                                enquiry.status === status ? 'bg-blue-50 text-blue-700' : 'text-ink hover:bg-surface'
                              }`}
                            >
                              {status.replace(/_/g, ' ')}
                              {enquiry.status === status && <CheckCircle2 className="h-4 w-4" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-3.5 pb-3 flex items-center justify-between border-t border-borderMuted pt-2.5">
                  <div className="flex items-center gap-2">
                    {enquiry.source === 'CHAT' ? (
                      <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-0.5 rounded-md text-xs font-bold border border-green-200">
                        <Bot className="h-3.5 w-3.5" /> Chat
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md text-xs font-bold border border-blue-200">
                        <FileText className="h-3.5 w-3.5" /> Form
                      </span>
                    )}
                    <span className="text-xs font-medium text-inkLight/70 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-inkLight/70" />
                      {formatDate(enquiry.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedEnquiryId(enquiry.id)}
                      className="p-2 rounded-xl text-inkLight/70 hover:bg-borderMuted hover:text-blue-600 transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4.5 w-4.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteLead(enquiry)}
                      className="p-2 rounded-xl text-inkLight/70 hover:bg-primary/10 hover:text-primary transition-colors"
                      title="Delete Lead"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* DESKTOP TABLE VIEW (>= md) */}
        <div className="hidden md:block overflow-x-auto flex-1" style={{ paddingBottom: '80px' }}>
          {openStatusPopoverId && (
            <div className="fixed inset-0 z-[55]" onClick={() => setOpenStatusPopoverId(null)} />
          )}
          {openActionMenuId && (
            <div className="fixed inset-0 z-[45]" onClick={() => setOpenActionMenuId(null)} />
          )}
          <table className="w-full text-left text-sm text-inkLight">
            <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eaeaea' }}>
              <tr>
                <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Date</th>
                <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Applicant</th>
                <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact</th>
                <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location</th>
                <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Source</th>
                <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Next Action</th>
                <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderMuted/40">
              {filteredEnquiries.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-inkLight/60 italic">No franchise enquiries yet.</td></tr>
              ) : (
                filteredEnquiries.map(enquiry => (
                  <LeadTableRow
                    key={enquiry.id}
                    enquiry={enquiry}
                    enquiryStatuses={ENQUIRY_STATUSES}
                    openStatusPopoverId={openStatusPopoverId}
                    setOpenStatusPopoverId={setOpenStatusPopoverId}
                    openActionMenuId={openActionMenuId}
                    setOpenActionMenuId={setOpenActionMenuId}
                    actionMenuMode={actionMenuMode}
                    setActionMenuMode={setActionMenuMode}
                    statusSearchQuery={statusSearchQuery}
                    setStatusSearchQuery={setStatusSearchQuery}
                    getStatusColor={getStatusColor}
                    getNextActionText={getNextActionText}
                    getNextStatusOptions={getNextStatusOptions}
                    formatDate={formatDate}
                    onStatusChange={(id, newStatus) => handleStatusChange(id, newStatus, setFollowUpChoice, setDraftReview)}
                    onViewDetails={setSelectedEnquiryId}
                    onManageFollowUp={(e) => setFollowUpChoice({ enquiry: e, newStatus: e.status })}
                    onDeleteLead={handleDeleteLead}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Details Modal */}
        {selectedEnquiryId && (
          <EnquiryDetailsModal 
            enquiryId={selectedEnquiryId} 
            onClose={() => setSelectedEnquiryId(null)} 
            onUpdate={fetchEnquiriesData}
          />
        )}

        {/* Draft Review Modal */}
        {draftReview && (
          <DraftReviewModal 
            enquiry={draftReview.enquiry}
            newStatus={draftReview.newStatus}
            onClose={() => setDraftReview(null)}
            onSent={() => setDraftReview(null)}
          />
        )}

        {/* Follow-up Choice Modal */}
        {followUpChoice && (
          <FollowUpChoiceModal
            enquiry={followUpChoice.enquiry}
            onClose={() => setFollowUpChoice(null)}
            onSelectSetReminder={() => {
              setScheduleReminder(followUpChoice);
              setFollowUpChoice(null);
            }}
            onSelectAskCustomer={() => {
              setDraftReview(followUpChoice);
              setFollowUpChoice(null);
            }}
          />
        )}

        {/* Schedule Reminder Modal */}
        {scheduleReminder && (
          <ScheduleReminderModal
            enquiry={scheduleReminder.enquiry}
            onClose={() => setScheduleReminder(null)}
            onSaved={() => {
              setScheduleReminder(null);
              fetchEnquiriesData();
            }}
          />
        )}

        {/* Filter Overlay Popup Modal */}
        {showFilterModal && (
          <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-elevated border border-borderMuted/40 relative anim-scale-in">
              <div className="flex items-center justify-between pb-4 border-b border-borderMuted mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Filter className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-navy text-lg">Filter Leads</h3>
                    <p className="text-xs text-inkLight font-medium">Refine your lead dashboard results</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="p-1.5 text-inkLight/70 hover:text-inkLight hover:bg-borderMuted rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-extrabold text-inkLight/70 uppercase tracking-wider mb-2">Lead Status</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                      className="w-full bg-surface hover:bg-borderMuted/80 border border-borderMuted text-navy text-sm font-semibold rounded-2xl px-4 py-3 flex items-center justify-between transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-xs"
                    >
                      <span className="font-bold text-navy text-sm">
                        {STATUS_FILTER_OPTIONS.find(o => o.id === statusFilter)?.label || 'All Statuses'}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-inkLight/70 transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
                    </button>

                    {isStatusDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setIsStatusDropdownOpen(false)}
                        />
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-borderMuted/80 rounded-2xl shadow-xl z-20 overflow-hidden p-1.5 space-y-0.5 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                          {STATUS_FILTER_OPTIONS.map(opt => {
                            const isSelected = statusFilter === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => {
                                  setStatusFilter(opt.id);
                                  setIsStatusDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                  isSelected
                                    ? 'bg-blue-50 text-blue-700 shadow-xs font-bold'
                                    : 'text-ink hover:bg-surface hover:text-navy'
                                }`}
                              >
                                <span className="text-sm font-semibold">{opt.label}</span>
                                {isSelected && (
                                  <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-inkLight/70 uppercase tracking-wider mb-2">Lead Source</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'ALL', label: 'All Sources' },
                      { id: 'CHAT', label: 'AI Chatbot' },
                      { id: 'FORM', label: 'Enquiry Form' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setSourceFilter(opt.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                          sourceFilter === opt.id
                            ? 'bg-navy border-navy text-white shadow-xs'
                            : 'bg-surface border-borderMuted text-inkLight hover:bg-borderMuted'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-inkLight/70 uppercase tracking-wider mb-2">Time Period</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'ALL', label: 'All Time' },
                      { id: 'TODAY', label: 'Today' },
                      { id: 'LAST_7_DAYS', label: 'Last 7 Days' },
                      { id: 'LAST_30_DAYS', label: 'Last 30 Days' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setDateFilter(opt.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                          dateFilter === opt.id
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                            : 'bg-surface border-borderMuted text-inkLight hover:bg-borderMuted'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-borderMuted flex items-center justify-between gap-3">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-primary hover:bg-primary/10 transition-colors"
                >
                  Reset Filters
                </button>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
