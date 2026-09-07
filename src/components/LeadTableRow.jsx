import React from 'react';
import { Calendar, Phone, Mail, MapPin, Bot, FileText, ChevronDown, CheckCircle2, MoreVertical, ArrowRight } from 'lucide-react';
import LeadActionMenu from './LeadActionMenu';

const tdStyle = { padding: '14px 20px', verticalAlign: 'middle' };

export default function LeadTableRow({
  enquiry,
  enquiryStatuses,
  openStatusPopoverId,
  setOpenStatusPopoverId,
  openActionMenuId,
  setOpenActionMenuId,
  actionMenuMode,
  setActionMenuMode,
  statusSearchQuery,
  setStatusSearchQuery,
  getStatusColor,
  getNextActionText,
  getNextStatusOptions,
  formatDate,
  onStatusChange,
  onViewDetails,
  onManageFollowUp,
  onDeleteLead
}) {
  const isStatusOpen = openStatusPopoverId === enquiry.id;
  const isActionOpen = openActionMenuId === enquiry.id;

  return (
    <tr
      style={{ borderBottom: '1px solid #f1f5f9', transition: 'all 0.15s ease' }}
      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Date */}
      <td style={tdStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', fontWeight: '600', whiteSpace: 'nowrap' }}>
          <Calendar style={{ width: '13px', height: '13px', color: '#94a3b8' }} />
          <span>{formatDate(enquiry.created_at)}</span>
        </div>
      </td>

      {/* Applicant Name & Avatar */}
      <td style={tdStyle}>
        <div
          onClick={() => onViewDetails(enquiry.id)}
          style={{ display: 'flex', alignItems: 'center', gap: '11px', cursor: 'pointer' }}
          className="group"
        >
          <div style={{
            width: '36px', height: '36px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '900', fontSize: '14px', flexShrink: 0,
            border: '1px solid rgba(59,130,246,0.25)', boxShadow: '0 2px 5px rgba(59,130,246,0.1)'
          }}>
            {enquiry.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <span style={{ fontWeight: '800', color: '#0b1120', fontSize: '13.5px', transition: 'color 0.15s' }} className="group-hover:text-red-600">
              {enquiry.name}
            </span>
          </div>
        </div>
      </td>

      {/* Contact Info */}
      <td style={tdStyle}>
        <div style={{ fontSize: '12.5px', color: '#334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: enquiry.email ? '3px' : 0, fontWeight: '600' }}>
            <Phone style={{ width: '12px', height: '12px', color: '#94a3b8' }} />
            <span>{enquiry.phone}</span>
          </div>
          {enquiry.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '11.5px' }}>
              <Mail style={{ width: '12px', height: '12px', color: '#94a3b8' }} />
              <span className="truncate max-w-[180px]">{enquiry.email}</span>
            </div>
          )}
        </div>
      </td>

      {/* Location */}
      <td style={tdStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#475569', fontWeight: '500' }}>
          <MapPin style={{ width: '13px', height: '13px', color: '#94a3b8', flexShrink: 0 }} />
          <span>{enquiry.location || 'N/A'}</span>
        </div>
      </td>

      {/* Source */}
      <td style={{ ...tdStyle, textAlign: 'center' }}>
        {enquiry.source === 'CHAT' ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', border: '1px solid #d1fae5' }}>
            <Bot style={{ width: '12px', height: '12px' }} /> Chatbot
          </span>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', border: '1px solid #dbeafe' }}>
            <FileText style={{ width: '12px', height: '12px' }} /> Web Form
          </span>
        )}
      </td>

      {/* Status Popover Trigger */}
      <td style={{ ...tdStyle, textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button
            onClick={() => {
              setOpenStatusPopoverId(isStatusOpen ? null : enquiry.id);
              setOpenActionMenuId(null);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs rounded-full font-extrabold shadow-xs transition-all duration-150 active:scale-95 ${getStatusColor(enquiry.status)}`}
            style={{ cursor: 'pointer' }}
          >
            <span>{enquiry.status.replace(/_/g, ' ')}</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isStatusOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isStatusOpen && (
            <div className="absolute right-1/2 translate-x-1/2 mt-2 w-52 rounded-2xl bg-white shadow-2xl border border-borderMuted p-2.5 z-[60] anim-scale-in">
              <div className="text-[10.5px] uppercase font-black text-inkLight/70 mb-2 px-2 text-left tracking-wider">Suggested Next Step</div>
              {getNextStatusOptions(enquiry.status).length > 0 ? (
                <div className="flex flex-col gap-1">
                  {getNextStatusOptions(enquiry.status).map(opt => (
                    <button
                      key={opt}
                      onClick={() => {
                        onStatusChange(enquiry.id, opt);
                        setOpenStatusPopoverId(null);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-ink hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors flex items-center justify-between group"
                    >
                      <span>{opt.replace(/_/g, ' ')}</span>
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-2 py-2 text-xs text-inkLight italic text-left">No automated next step. Use 3-dots to change status.</div>
              )}
            </div>
          )}
        </div>
      </td>

      {/* Next Action */}
      <td style={{ ...tdStyle, fontSize: '12.5px', fontWeight: '700', color: '#64748b' }}>
        {getNextActionText(enquiry.status)}
      </td>

      {/* Action Menu (3 dots) */}
      <td style={{ ...tdStyle, textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button
            onClick={() => {
              setOpenActionMenuId(isActionOpen ? null : enquiry.id);
              setActionMenuMode('main');
              setStatusSearchQuery('');
            }}
            style={{
              padding: '7px', borderRadius: '10px',
              color: isActionOpen ? '#0b1120' : '#64748b',
              background: isActionOpen ? '#f1f5f9' : 'transparent',
              border: isActionOpen ? '1px solid #e2e8f0' : '1px solid transparent',
              cursor: 'pointer', transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => { if (!isActionOpen) { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#e2e8f0'; } }}
            onMouseLeave={e => { if (!isActionOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; } }}
            title="Lead Actions"
          >
            <MoreVertical style={{ width: '18px', height: '18px' }} />
          </button>
          
          {isActionOpen && (
            <LeadActionMenu
              enquiry={enquiry}
              statuses={enquiryStatuses}
              actionMenuMode={actionMenuMode}
              setActionMenuMode={setActionMenuMode}
              statusSearchQuery={statusSearchQuery}
              setStatusSearchQuery={setStatusSearchQuery}
              onViewDetails={onViewDetails}
              onStatusChange={onStatusChange}
              onManageFollowUp={onManageFollowUp}
              onDeleteLead={onDeleteLead}
              onClose={() => setOpenActionMenuId(null)}
            />
          )}
        </div>
      </td>
    </tr>
  );
}

