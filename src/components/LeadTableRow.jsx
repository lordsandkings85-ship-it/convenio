import React from 'react';
import { Calendar, Phone, Mail, MapPin, Bot, FileText, ChevronDown, CheckCircle2, MoreVertical } from 'lucide-react';
import LeadActionMenu from './LeadActionMenu';

const tdStyle = { padding: '12px 20px', verticalAlign: 'middle' };

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
    <tr style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}
      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <td style={tdStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
          <Calendar style={{ width: '12px', height: '12px' }} /> {formatDate(enquiry.created_at)}
        </div>
      </td>
      <td style={tdStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #dbeafe, #eff6ff)', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '15px', flexShrink: 0, border: '1px solid rgba(59,130,246,0.2)' }}>
            {enquiry.name.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontWeight: '700', color: '#0b1120', fontSize: '13px' }}>{enquiry.name}</span>
        </div>
      </td>
      <td style={tdStyle}>
        <div style={{ fontSize: '12px', color: '#475569' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: enquiry.email ? '3px' : 0 }}>
            <Phone style={{ width: '12px', height: '12px', color: '#94a3b8' }} /> {enquiry.phone}
          </div>
          {enquiry.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#94a3b8' }}>
              <Mail style={{ width: '12px', height: '12px' }} /> {enquiry.email}
            </div>
          )}
        </div>
      </td>
      <td style={tdStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#475569' }}>
          <MapPin style={{ width: '12px', height: '12px', color: '#94a3b8' }} /> {enquiry.location || 'N/A'}
        </div>
      </td>
      <td style={{ ...tdStyle, textAlign: 'center' }}>
        {enquiry.source === 'CHAT' ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f0fdf4', color: '#16a34a', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', border: '1px solid #dcfce7' }}>
            <Bot style={{ width: '11px', height: '11px' }} /> Chat
          </span>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', border: '1px solid #dbeafe' }}>
            <FileText style={{ width: '11px', height: '11px' }} /> Form
          </span>
        )}
      </td>
      <td style={{ ...tdStyle, textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button
            onClick={() => {
              setOpenStatusPopoverId(isStatusOpen ? null : enquiry.id);
              setOpenActionMenuId(null);
            }}
            className={`inline-flex items-center gap-1.5 w-fit px-3 py-1.5 text-xs rounded-full font-bold shadow-sm transition-all hover:ring-2 hover:ring-borderMuted hover:ring-offset-1 ${getStatusColor(enquiry.status)}`}
          >
            {enquiry.status.replace(/_/g, ' ')}
            <ChevronDown className={`h-3 w-3 transition-transform ${isStatusOpen ? 'rotate-180' : ''}`} />
          </button>
          {isStatusOpen && (
            <div className="absolute right-1/2 translate-x-1/2 mt-2 w-48 rounded-xl bg-white shadow-xl border border-borderMuted p-2 z-[60] animate-in fade-in zoom-in slide-in-from-top-2">
              <div className="text-[10px] uppercase font-bold text-inkLight/70 mb-2 px-2 text-left">Next Steps</div>
              {getNextStatusOptions(enquiry.status).length > 0 ? (
                <div className="flex flex-col gap-1">
                  {getNextStatusOptions(enquiry.status).map(opt => (
                    <button
                      key={opt}
                      onClick={() => {
                        onStatusChange(enquiry.id, opt);
                        setOpenStatusPopoverId(null);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-ink hover:bg-surface hover:text-blue-600 rounded-lg transition-colors flex items-center justify-between group"
                    >
                      {opt.replace(/_/g, ' ')}
                      <div className="h-4 w-4 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <CheckCircle2 className="h-3 w-3" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-2 py-2 text-xs text-inkLight italic text-left">No next steps available.</div>
              )}
            </div>
          )}
        </div>
      </td>
      <td style={{ ...tdStyle, fontSize: '12px', fontWeight: '700', color: '#64748b' }}>
        {getNextActionText(enquiry.status)}
      </td>
      <td style={{ ...tdStyle, textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button
            onClick={() => {
              setOpenActionMenuId(isActionOpen ? null : enquiry.id);
              setActionMenuMode('main');
              setStatusSearchQuery('');
            }}
            style={{ padding: '6px', borderRadius: '8px', color: '#94a3b8', background: 'transparent', border: '1px solid transparent', cursor: 'pointer', transition: 'all 0.15s ease' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
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
