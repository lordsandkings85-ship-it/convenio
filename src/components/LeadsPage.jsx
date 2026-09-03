import React, { useState, useEffect } from 'react';
import { getEnquiries, createEnquiry } from '../lib/api';
import { LayoutGrid, List, Plus, Search, Filter, Calendar, Phone, Mail, User, CheckCircle2, MoreVertical, Flame, Snowflake, X } from 'lucide-react';
import EnquiryDetailsModal from './EnquiryDetailsModal';

const PIPELINE_STAGES = [
  { id: 'new', title: 'New', statuses: ['NEW'] },
  { id: 'contacted', title: 'Contacted', statuses: ['ASSIGNED', 'FIRST_CALL', 'CALL_LATER', 'NO_RESPONSE'] },
  { id: 'interested', title: 'Interested', statuses: ['INTERESTED', 'DOCUMENTS_REQUESTED', 'DOCUMENTS_RECEIVED'] },
  { id: 'payment', title: 'Payment', statuses: ['READY_TO_PAY', 'PAYMENT_DETAILS_SENT', 'PAYMENT_PENDING'] },
  { id: 'closed', title: 'Closed (Won)', statuses: ['PAYMENT_RECEIVED', 'APPROVED', 'ONBOARDING', 'OPENED'] },
  { id: 'lost', title: 'Closed (Lost)', statuses: ['NOT_INTERESTED'] }
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
  if (score >= 80) return <Flame className="h-4 w-4 text-primary" />;
  if (score >= 50) return <Flame className="h-4 w-4 text-orange-400" />;
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
      // Small delay to ensure table is rendered if switching tabs
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
  const [showFilters, setShowFilters] = useState(false);

  const filteredEnquiries = enquiries.filter(lead => {
    const matchesSearch = 
      lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
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
      setEnquiries(data);
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

  return (
    <div className="flex flex-col gap-6 flex-1 min-h-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#0b1120', letterSpacing: '-0.02em', lineHeight: 1.2 }}>Leads Pipeline</div>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginTop: '4px' }}>Manage and track your incoming leads.</div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-[#b8151d] hover:shadow-lg hover:shadow-primary/20 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 shadow-sm w-full sm:w-auto active:scale-95 btn-press"
          >
            <Plus className="h-4 w-4" /> Add Lead
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-borderMuted/60 shadow-card overflow-hidden flex flex-col min-h-0 card-base">
        <div className="p-3 sm:p-4 border-b border-borderMuted/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-surface/60">
          <div style={{ position: 'relative', flex: 1 }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search leads by name, phone or email..."
              style={{ width: '100%', paddingLeft: '40px', paddingRight: '16px', paddingTop: '10px', paddingBottom: '10px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontWeight: '500', color: '#1e293b', background: '#ffffff', outline: 'none', transition: 'all 0.2s ease' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={e => { e.target.style.borderColor = '#e01a22'; e.target.style.boxShadow = '0 0 0 3px rgba(224,26,34,0.08)'; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <div className="relative shrink-0">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-bold transition-all duration-200 w-full sm:w-auto ${showFilters || stageFilter !== 'ALL' ? 'bg-primary/5 border-primary/15 text-primary' : 'bg-white border-borderMuted/60 text-inkLight hover:bg-surface'}`}
            >
              <Filter className="h-4 w-4" /> 
              Filters {stageFilter !== 'ALL' && <span className="bg-primary text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full ml-1">1</span>}
            </button>
            
            {showFilters && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowFilters(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-borderMuted py-2 z-50">
                  <div className="px-3 py-1.5 text-xs font-bold text-inkLight/70 uppercase tracking-wider">Pipeline Stage</div>
                  <button 
                    onClick={() => { setStageFilter('ALL'); setShowFilters(false); }}
                    className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-surface ${stageFilter === 'ALL' ? 'text-primary bg-primary/15' : 'text-ink'}`}
                  >
                    All Stages
                  </button>
                  {PIPELINE_STAGES.map(stage => (
                    <button 
                      key={stage.id}
                      onClick={() => { setStageFilter(stage.id); setShowFilters(false); }}
                      className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-surface ${stageFilter === stage.id ? 'text-primary bg-primary/15' : 'text-ink'}`}
                    >
                      {stage.title}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }} className="bg-borderMuted/40 p-3 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center w-full h-64 text-inkLight/60 font-bold">Loading leads...</div>
          ) : (
            <>
              {/* DESKTOP LIST VIEW */}
              <div className="hidden md:block flex-1 w-full overflow-y-auto bg-white rounded-xl border border-borderMuted/60 shadow-card">
                <table className="w-full text-left text-sm text-inkLight">
                  <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eaeaea', position: 'sticky', top: 0, zIndex: 10 }}>
                    <tr>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Applicant</th>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact</th>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stage</th>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Score</th>
                      <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borderMuted/40">
                    {filteredEnquiries.length === 0 ? (
                      <tr><td colSpan="5" className="text-center py-8 text-inkLight/60 italic">No leads found matching your criteria.</td></tr>
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
                            className={highlightClassId === lead.id ? 'bg-amber-100/80' : ''}
                            onMouseEnter={e => { if (highlightClassId !== lead.id) e.currentTarget.style.background = '#f8fafc'; }}
                            onMouseLeave={e => { if (highlightClassId !== lead.id) e.currentTarget.style.background = 'transparent'; }}
                          >
                            <td style={{ padding: '14px 20px' }}>
                              <div style={{ fontWeight: '700', color: '#0b1120', fontSize: '13px' }}>{lead.name}</div>
                              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Added {new Date(lead.created_at).toLocaleDateString()}</div>
                            </td>
                            <td style={{ padding: '14px 20px', fontSize: '12px', color: '#475569' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: lead.email ? '3px' : 0 }}><Phone style={{ width: '12px', height: '12px', color: '#94a3b8' }}/> {lead.phone}</div>
                              {lead.email && <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#94a3b8' }}><Mail style={{ width: '12px', height: '12px' }}/> {lead.email}</div>}
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                              <span style={{ fontWeight: '600', color: '#475569', background: '#f1f5f9', padding: '3px 10px', borderRadius: '6px', fontSize: '12px' }}>{stage}</span>
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {getTemperatureIcon(score)}
                                <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '13px' }}>{score}</span>
                              </div>
                            </td>
                            <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                              <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', border: '1px solid #e2e8f0', padding: '3px 10px', borderRadius: '50px', background: '#f8fafc' }}>
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
              <div className="md:hidden flex-1 overflow-y-auto space-y-3 pb-24">
                {filteredEnquiries.length === 0 ? (
                  <div className="text-center py-12 text-inkLight/60 italic bg-white rounded-xl border border-borderMuted/60 p-4">
                    No leads found matching your criteria.
                  </div>
                ) : (
                  filteredEnquiries.map(lead => {
                    const score = calculateLeadScore(lead.status, lead.created_at);
                    const stage = PIPELINE_STAGES.find(s => s.statuses.includes(lead.status))?.title || 'Unknown';
                    
                    return (
                      <div
                        key={lead.id}
                        onClick={() => setSelectedEnquiryId(lead.id)}
                        className={`bg-white rounded-xl border border-borderMuted/60 p-4 shadow-sm relative active:bg-surface transition-all ${
                          highlightClassId === lead.id ? 'bg-amber-50 border-amber-300' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <div style={{ fontWeight: '700', color: '#0b1120', fontSize: '14px' }} className="truncate">{lead.name}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Added {new Date(lead.created_at).toLocaleDateString()}</div>
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: '50px', background: '#f8fafc', whiteSpace: 'nowrap' }}>
                            {lead.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div className="mt-3 space-y-1.5 text-xs text-inkLight">
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

                        <div className="mt-3 pt-3 border-t border-borderMuted/60 flex items-center justify-between">
                          <span style={{ fontWeight: '600', color: '#475569', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', fontSize: '11px' }}>
                            {stage}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {getTemperatureIcon(score)}
                            <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '12px' }}>Score: {score}</span>
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

      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm">
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#0b1120' }}>Add New Lead</div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-inkLight/60 hover:text-inkLight hover:bg-borderMuted/60 rounded-lg transition-all duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateLead} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">Full Name *</label>
                <input 
                  type="text" 
                  required
                  value={newLead.name}
                  onChange={e => setNewLead({...newLead, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-surface/50 border border-borderMuted/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all duration-200 text-sm font-medium"
                  placeholder="Enter lead's name"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">Phone Number *</label>
                <input 
                  type="tel" 
                  required
                  value={newLead.phone}
                  onChange={e => setNewLead({...newLead, phone: e.target.value})}
                  className="w-full px-4 py-2.5 bg-surface/50 border border-borderMuted/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all duration-200 text-sm font-medium"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  value={newLead.email}
                  onChange={e => setNewLead({...newLead, email: e.target.value})}
                  className="w-full px-4 py-2.5 bg-surface/50 border border-borderMuted/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all duration-200 text-sm font-medium"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">Location</label>
                <input 
                  type="text" 
                  value={newLead.location}
                  onChange={e => setNewLead({...newLead, location: e.target.value})}
                  className="w-full px-4 py-2.5 bg-surface/50 border border-borderMuted/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all duration-200 text-sm font-medium"
                  placeholder="City, State"
                />
              </div>
              
              <div className="pt-4 flex justify-end gap-3 border-t border-borderMuted/60 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 text-sm font-bold text-inkLight hover:bg-surface rounded-xl transition-all duration-200 active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-primary to-[#b8151d] hover:shadow-lg hover:shadow-primary/20 rounded-xl transition-all duration-300 shadow-sm disabled:opacity-50 flex items-center gap-2 active:scale-95 btn-press"
                >
                  {isSubmitting ? 'Saving...' : 'Add Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
