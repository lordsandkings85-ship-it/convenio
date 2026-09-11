import React, { useState, useEffect } from 'react';
import './LeadsPage.css';
import { getEnquiries, createEnquiry } from '../lib/api';

import { Plus, Search, Filter, Calendar, Phone, Mail, User, CheckCircle2, Flame, Snowflake, X, RotateCcw, MapPin, Sparkles, Building, Users } from 'lucide-react';
import EnquiryDetailsModal from './EnquiryDetailsModal';

const PIPELINE_STAGES = [
  { id: 'new', title: 'New', statuses: ['NEW'] },
  { id: 'contacted', title: 'Contacted', statuses: ['ASSIGNED', 'FIRST_CALL', 'CALL_LATER', 'NO_RESPONSE'] },
  { id: 'interested', title: 'Interested', statuses: ['INTERESTED', 'DOCUMENTS_REQUESTED', 'DOCUMENTS_RECEIVED'] },
  { id: 'payment', title: 'Payment', statuses: ['READY_TO_PAY', 'PAYMENT_DETAILS_SENT', 'PAYMENT_PENDING'] },
  { id: 'closed', title: 'Won', statuses: ['PAYMENT_RECEIVED', 'APPROVED', 'ONBOARDING', 'OPENED'] },
  { id: 'lost', title: 'Lost', statuses: ['NOT_INTERESTED'] }
];

const calculateLeadScore = (status, createdAt) => {
  const daysOld = Math.floor((new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24));
  let score = 50; 
  if (['NEW', 'ASSIGNED'].includes(status)) score = 40;
  if (['FIRST_CALL'].includes(status)) score = 50;
  if (['INTERESTED', 'CALL_LATER'].includes(status)) score = 70;
  if (['DOCUMENTS_REQUESTED', 'DOCUMENTS_RECEIVED'].includes(status)) score = 80;
  if (['READY_TO_PAY', 'PAYMENT_DETAILS_SENT', 'PAYMENT_PENDING'].includes(status)) score = 90;
  if (['PAYMENT_RECEIVED', 'APPROVED', 'ONBOARDING', 'OPENED'].includes(status)) score = 100;
  if (['NOT_INTERESTED', 'NO_RESPONSE'].includes(status)) score = 10;
  if (['NEW', 'ASSIGNED', 'FIRST_CALL'].includes(status) && daysOld > 3) score -= (daysOld * 2);
  return Math.max(0, Math.min(100, score));
};

const getTemperatureIcon = (score) => {
  if (score >= 80) return <Flame className="h-4 w-4 text-red-500 animate-pulse" />;
  if (score >= 50) return <Flame className="h-4 w-4 text-amber-500" />;
  return <Snowflake className="h-4 w-4 text-blue-400" />;
};

export default function LeadsPage({ highlightedLeadId }) {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnquiryId, setSelectedEnquiryId] = useState(null);
  const [highlightClassId, setHighlightClassId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLead, setNewLead] = useState({ name: '', phone: '', email: '', location: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (highlightedLeadId) {
      setTimeout(() => {
        setHighlightClassId(highlightedLeadId);
        const el = document.getElementById(`lead-row-${highlightedLeadId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      
      const timer = setTimeout(() => {
        setHighlightClassId(null);
      }, 2100);
      return () => clearTimeout(timer);
    } else {
      setHighlightClassId(null);
    }
  }, [highlightedLeadId]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');

  const filteredEnquiries = enquiries.filter(lead => {
    const matchesSearch = 
      lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.location?.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (!matchesSearch) return false;
    
    if (stageFilter !== 'ALL') {
      const stage = PIPELINE_STAGES.find(s => s.id === stageFilter);
      if (stage && !stage.statuses.includes(lead.status)) return false;
    }
    
    return true;
  });

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const data = await getEnquiries();
      setEnquiries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!newLead.name || !newLead.phone) return;
    
    setIsSubmitting(true);
    try {
      await createEnquiry({
        name: newLead.name,
        phone: newLead.phone,
        email: newLead.email,
        location: newLead.location,
        status: 'NEW',
        source: 'MANUAL',
      });
      setShowAddModal(false);
      setNewLead({ name: '', phone: '', email: '', location: '' });
      fetchLeads();
    } catch (error) {
      console.error('Failed to create lead:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const totalLeads = enquiries.length;
  const hotLeads = enquiries.filter(e => calculateLeadScore(e.status, e.created_at) >= 70).length;
  const activeLeads = enquiries.filter(e => ['ASSIGNED', 'FIRST_CALL', 'INTERESTED', 'CALL_LATER', 'DOCUMENTS_REQUESTED', 'DOCUMENTS_RECEIVED', 'READY_TO_PAY', 'PAYMENT_PENDING'].includes(e.status)).length;
  const wonLeads = enquiries.filter(e => ['PAYMENT_RECEIVED', 'APPROVED', 'COMPLETED', 'ONBOARDING', 'OPENED'].includes(e.status)).length;

  return (
    <div className="flex flex-col gap-5 flex-1 min-h-0 pb-4">
      
      {/* Page Header */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm" style={{ padding: '18px 24px' }}>
        <div className="flex items-center gap-3.5">
          <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-inner">
            <Users className="w-5 h-5" />
          </span>
          <div>
            <h1 className="admin-page-title m-0 leading-tight">Leads Pipeline</h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium m-0 mt-0.5 leading-normal">
              Track, score, and nurture prospective franchise partners across every conversion stage.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="admin-btn-primary inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" /> Add New Lead
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="admin-metrics-grid shrink-0">
        {[
          { label: 'Total Pipeline', value: totalLeads, trend: 'All-time enquiries', trendColor: '#2563eb', iconBg: '#eff6ff', iconColor: '#2563eb', Icon: Users },
          { label: 'High Potential', value: hotLeads, trend: 'Lead score ≥ 70', trendColor: '#ea580c', iconBg: '#fff7ed', iconColor: '#ea580c', Icon: Flame },
          { label: 'In Discussion', value: activeLeads, trend: totalLeads > 0 ? `${Math.round((activeLeads / totalLeads) * 100)}% active` : '0% active', trendColor: '#7c3aed', iconBg: '#f5f3ff', iconColor: '#7c3aed', Icon: Phone },
          { label: 'Won / Approved', value: wonLeads, trend: totalLeads > 0 ? `${Math.round((wonLeads / totalLeads) * 100)}% won` : '0% won', trendColor: '#059669', iconBg: '#ecfdf5', iconColor: '#059669', Icon: CheckCircle2 },
        ].map(({ label, value, trend, trendColor, iconBg, iconColor, Icon }) => (
          <div key={label} className="admin-metric-card card-base card-lift">
            <div className="admin-metric-info">
              <p className="admin-metric-label">{label}</p>
              <p className="admin-metric-value">{value}</p>
              <p className="admin-metric-trend" style={{ color: trendColor }}>{trend}</p>
            </div>
            <div className="admin-metric-icon-box" style={{ background: iconBg, color: iconColor }}>
              <Icon style={{ width: '22px', height: '22px' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Container */}
      <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.03)', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '420px' }}>
        
        {/* Search & 1-Click Stage Filter Chips */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search leads by name, phone, email, or city..."
                style={{ width: '100%', paddingLeft: '42px', paddingRight: searchQuery ? '36px' : '16px', paddingTop: '10px', paddingBottom: '10px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '13.5px', fontWeight: '500', color: '#0f172a', background: '#f8fafc', outline: 'none', transition: 'all 0.2s ease' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={e => { e.target.style.borderColor = '#e01a22'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(224,26,34,0.08)'; }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X style={{ width: '14px', height: '14px' }} />
                </button>
              )}
            </div>

            {(stageFilter !== 'ALL' || searchQuery !== '') && (
              <button
                onClick={() => { setStageFilter('ALL'); setSearchQuery(''); }}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '9px 14px', borderRadius: '12px', fontSize: '12.5px', fontWeight: '700', color: '#e01a22', background: 'rgba(224,26,34,0.06)', border: '1.5px solid rgba(224,26,34,0.18)', cursor: 'pointer', transition: 'all 0.2s ease' }}
                className="btn-press"
              >
                <RotateCcw style={{ width: '13px', height: '13px' }} />
                <span>Clear Filters</span>
              </button>
            )}
          </div>

          {/* 1-Click Pipeline Stage Filter Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }} className="admin-scroll">
            <button
              onClick={() => setStageFilter('ALL')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '800',
                border: stageFilter === 'ALL' ? '1.5px solid #0b1120' : '1px solid #e2e8f0',
                background: stageFilter === 'ALL' ? '#0b1120' : '#f8fafc',
                color: stageFilter === 'ALL' ? '#ffffff' : '#475569',
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.18s ease'
              }}
            >
              <span>All Stages</span>
              <span style={{ fontSize: '11px', opacity: 0.8 }}>({enquiries.length})</span>
            </button>

            {PIPELINE_STAGES.map(stage => {
              const count = enquiries.filter(e => stage.statuses.includes(e.status)).length;
              const isSelected = stageFilter === stage.id;
              return (
                <button
                  key={stage.id}
                  onClick={() => setStageFilter(stage.id)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '7px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '800',
                    border: isSelected ? '1.5px solid #e01a22' : '1px solid #e2e8f0',
                    background: isSelected ? 'rgba(224,26,34,0.08)' : '#f8fafc',
                    color: isSelected ? '#c1151c' : '#475569',
                    cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.18s ease'
                  }}
                >
                  <span>{stage.title}</span>
                  <span style={{ fontSize: '11px', opacity: 0.8, fontWeight: '700' }}>({count})</span>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Table Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center w-full py-24 text-center">
              <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-bold text-slate-700">Loading applicant pipeline...</p>
            </div>
          ) : (
            <>
              {/* DESKTOP LIST VIEW */}
              <div className="hidden md:block flex-1 w-full overflow-y-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10 }}>
                    <tr>
                      <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Applicant</th>
                      <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contact Info</th>
                      <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Location</th>
                      <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pipeline Stage</th>
                      <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Lead Score</th>
                      <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>Status Tag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEnquiries.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-16">
                          <User className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                          <p className="text-base font-bold text-slate-800">No leads found matching your criteria.</p>
                          <p className="text-xs text-slate-500 mt-1">Try switching pipeline stages or clearing the search query.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredEnquiries.map(lead => {
                        const score = calculateLeadScore(lead.status, lead.created_at);
                        const stage = PIPELINE_STAGES.find(s => s.statuses.includes(lead.status))?.title || 'Unknown';
                        
                        return (
                          <tr
                            id={`lead-row-${lead.id}`}
                            key={lead.id}
                            onClick={() => setSelectedEnquiryId(lead.id)}
                            style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.15s ease' }}
                            className={highlightClassId === lead.id ? 'bg-amber-100/90' : ''}
                            onMouseEnter={e => { if (highlightClassId !== lead.id) e.currentTarget.style.background = '#f8fafc'; }}
                            onMouseLeave={e => { if (highlightClassId !== lead.id) e.currentTarget.style.background = 'transparent'; }}
                          >
                            <td style={{ padding: '14px 20px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '14px', flexShrink: 0, border: '1px solid rgba(59,130,246,0.2)' }}>
                                  {lead.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontWeight: '800', color: '#0b1120', fontSize: '13.5px' }}>{lead.name}</div>
                                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', fontWeight: '500' }}>Added {new Date(lead.created_at).toLocaleDateString()}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '14px 20px', fontSize: '12.5px', color: '#334155' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: lead.email ? '3px' : 0, fontWeight: '600' }}>
                                <Phone style={{ width: '12px', height: '12px', color: '#94a3b8' }} /> {lead.phone}
                              </div>
                              {lead.email && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '11.5px' }}>
                                  <Mail style={{ width: '12px', height: '12px', color: '#94a3b8' }} /> {lead.email}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '14px 20px', fontSize: '12.5px', color: '#475569' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <MapPin style={{ width: '12px', height: '12px', color: '#94a3b8' }} />
                                <span>{lead.location || 'N/A'}</span>
                              </div>
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                              <span style={{ fontWeight: '700', color: '#334155', background: '#f1f5f9', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', border: '1px solid #e2e8f0' }}>
                                {stage}
                              </span>
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {getTemperatureIcon(score)}
                                <span style={{ fontWeight: '800', color: '#0b1120', fontSize: '13px' }}>{score}</span>
                                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>/ 100</span>
                              </div>
                            </td>
                            <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                              <span style={{ fontSize: '11px', fontWeight: '800', color: '#475569', border: '1px solid #e2e8f0', padding: '4px 12px', borderRadius: '50px', background: '#f8fafc' }}>
                                {lead.status.replace(/_/g, ' ')}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARD VIEW */}
              <div className="md:hidden flex-1 overflow-y-auto space-y-3 p-3 pb-24">
                {filteredEnquiries.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-6">
                    <User className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-bold text-slate-700">No leads found in this stage.</p>
                  </div>
                ) : (
                  filteredEnquiries.map(lead => {
                    const score = calculateLeadScore(lead.status, lead.created_at);
                    const stage = PIPELINE_STAGES.find(s => s.statuses.includes(lead.status))?.title || 'Unknown';
                    
                    return (
                      <div
                        key={lead.id}
                        onClick={() => setSelectedEnquiryId(lead.id)}
                        className={`bg-white rounded-2xl border border-slate-200 p-4 shadow-xs relative active:bg-slate-50 transition-all card-base ${
                          highlightClassId === lead.id ? 'bg-amber-50 border-amber-300' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-base shrink-0">
                              {lead.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div style={{ fontWeight: '800', color: '#0b1120', fontSize: '14.5px' }} className="truncate">{lead.name}</div>
                              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Added {new Date(lead.created_at).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: '800', color: '#475569', border: '1px solid #e2e8f0', padding: '3px 10px', borderRadius: '50px', background: '#f8fafc', whiteSpace: 'nowrap' }}>
                            {lead.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div className="mt-3 space-y-1.5 text-xs text-slate-600 font-medium">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Phone style={{ width: '13px', height: '13px', color: '#94a3b8' }}/>
                            <span>{lead.phone}</span>
                          </div>
                          {lead.email && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Mail style={{ width: '13px', height: '13px', color: '#94a3b8' }}/>
                              <span className="truncate">{lead.email}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span style={{ fontWeight: '700', color: '#475569', background: '#f1f5f9', padding: '3px 9px', borderRadius: '6px', fontSize: '11px' }}>
                            {stage}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {getTemperatureIcon(score)}
                            <span style={{ fontWeight: '800', color: '#0b1120', fontSize: '12.5px' }}>Score: {score}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {selectedEnquiryId && (
        <EnquiryDetailsModal 
          enquiryId={selectedEnquiryId} 
          onClose={() => setSelectedEnquiryId(null)} 
          onUpdate={fetchLeads}
        />
      )}

      {/* Add New Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm">
          <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxWidth: '480px', width: '100%', overflow: 'hidden' }} className="anim-scale-in">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', background: 'rgba(224,26,34,0.1)', borderRadius: '10px' }}>
                  <User style={{ width: '20px', height: '20px', color: '#e01a22' }} />
                </div>
                <div>
                  <div style={{ fontSize: '16.5px', fontWeight: '900', color: '#0b1120' }}>Add New Lead</div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Directly register a franchise prospect</div>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ padding: '6px', borderRadius: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateLead} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  Applicant Full Name *
                </label>
                <input 
                  type="text" 
                  required
                  value={newLead.name}
                  onChange={e => setNewLead({...newLead, name: e.target.value})}
                  className="admin-input"
                  placeholder="e.g. Ramesh Sharma"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  Phone Number *
                </label>
                <input 
                  type="tel" 
                  required
                  value={newLead.phone}
                  onChange={e => setNewLead({...newLead, phone: e.target.value})}
                  className="admin-input"
                  placeholder="e.g. +91 98765 43210"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  Email Address
                </label>
                <input 
                  type="email" 
                  value={newLead.email}
                  onChange={e => setNewLead({...newLead, email: e.target.value})}
                  className="admin-input"
                  placeholder="e.g. ramesh@example.com (optional)"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  Target City / Location
                </label>
                <input 
                  type="text" 
                  value={newLead.location}
                  onChange={e => setNewLead({...newLead, location: e.target.value})}
                  className="admin-input"
                  placeholder="e.g. Pune, Maharashtra"
                />
              </div>
              
              <div style={{ paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="admin-btn-outline"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="admin-btn-primary"
                >
                  {isSubmitting ? 'Creating Lead...' : 'Save & Add Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

