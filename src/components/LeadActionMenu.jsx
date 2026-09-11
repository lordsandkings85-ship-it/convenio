import React from 'react';
import { Eye, RefreshCcw, CalendarClock, Trash2, Search, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';

export default function LeadActionMenu({
  enquiry,
  statuses,
  actionMenuMode,
  setActionMenuMode,
  statusSearchQuery,
  setStatusSearchQuery,
  onViewDetails,
  onStatusChange,
  onManageFollowUp,
  onDeleteLead,
  onClose
}) {
  return (
    <div
      className="admin-popover-menu"
      style={{ minWidth: '260px', right: '0', top: '100%', marginTop: '8px' }}
    >
      {actionMenuMode === 'main' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {/* Header pill */}
          <div className="admin-popover-header">
            <span className="admin-popover-header-title">Quick Actions</span>
            <span className="admin-popover-header-name" title={enquiry.name}>
              {enquiry.name}
            </span>
          </div>

          {/* Action 1: View Full Details */}
          <button
            onClick={() => {
              onViewDetails(enquiry.id);
              onClose();
            }}
            className="admin-popover-action-item"
          >
            <div className="admin-popover-action-left">
              <div className="admin-popover-action-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                <Eye style={{ width: '16px', height: '16px' }} />
              </div>
              <div>
                <p className="admin-popover-action-title">View Full Details</p>
                <p className="admin-popover-action-desc">Profile, notes & timeline</p>
              </div>
            </div>
            <ChevronRight style={{ width: '15px', height: '15px' }} className="admin-popover-action-arrow" />
          </button>

          {/* Action 2: Change Status */}
          <button
            onClick={() => {
              setActionMenuMode('status');
              setStatusSearchQuery('');
            }}
            className="admin-popover-action-item"
          >
            <div className="admin-popover-action-left">
              <div className="admin-popover-action-icon" style={{ background: '#fff7ed', color: '#ea580c' }}>
                <RefreshCcw style={{ width: '16px', height: '16px' }} />
              </div>
              <div>
                <p className="admin-popover-action-title">Change Status</p>
                <p className="admin-popover-action-desc">Advance pipeline stage</p>
              </div>
            </div>
            <ChevronRight style={{ width: '15px', height: '15px' }} className="admin-popover-action-arrow" />
          </button>

          {/* Action 3: Manage Follow-up */}
          <button
            onClick={() => {
              onManageFollowUp(enquiry);
              onClose();
            }}
            className="admin-popover-action-item"
          >
            <div className="admin-popover-action-left">
              <div className="admin-popover-action-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                <CalendarClock style={{ width: '16px', height: '16px' }} />
              </div>
              <div>
                <p className="admin-popover-action-title">Manage Follow-up</p>
                <p className="admin-popover-action-desc">Schedule call & task</p>
              </div>
            </div>
            <ChevronRight style={{ width: '15px', height: '15px' }} className="admin-popover-action-arrow" />
          </button>

          {/* Divider */}
          <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }} />

          {/* Action 4: Delete Lead */}
          <button
            onClick={() => {
              onDeleteLead(enquiry);
              onClose();
            }}
            className="admin-popover-action-item delete"
          >
            <div className="admin-popover-action-left">
              <div className="admin-popover-action-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
                <Trash2 style={{ width: '16px', height: '16px' }} />
              </div>
              <div>
                <p className="admin-popover-action-title" style={{ color: '#dc2626' }}>Delete Lead</p>
                <p className="admin-popover-action-desc" style={{ color: '#ef4444' }}>Remove from pipeline</p>
              </div>
            </div>
            <ChevronRight style={{ width: '15px', height: '15px' }} className="admin-popover-action-arrow" />
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '340px' }}>
          <div style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', borderRadius: '10px 10px 0 0', marginBottom: '6px' }}>
            <button
              onClick={() => setActionMenuMode('main')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: '800', color: '#475569', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer', marginBottom: '8px' }}
            >
              <ArrowLeft style={{ width: '13px', height: '13px' }} /> Back to Actions
            </button>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '13px', height: '13px', color: '#94a3b8' }} />
              <input
                type="text"
                autoFocus
                placeholder="Search pipeline status..."
                value={statusSearchQuery}
                onChange={e => setStatusSearchQuery(e.target.value)}
                style={{ width: '100%', paddingLeft: '30px', paddingRight: '10px', paddingTop: '6px', paddingBottom: '6px', fontSize: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none', background: '#ffffff', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <div className="admin-scroll" style={{ overflowY: 'auto', maxHeight: '220px', padding: '2px 4px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {statuses.filter(s => s.replace(/_/g, ' ').toLowerCase().includes(statusSearchQuery.toLowerCase())).map(status => {
              const isSelected = enquiry.status === status;
              return (
                <button
                  key={status}
                  onClick={() => {
                    onStatusChange(enquiry.id, status);
                    onClose();
                  }}
                  style={{
                    width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: '12px', fontWeight: '800',
                    borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer', border: '1px solid transparent',
                    background: isSelected ? '#fef2f2' : 'transparent',
                    color: isSelected ? '#b91c1c' : '#1e293b',
                    borderColor: isSelected ? '#fecaca' : 'transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{status.replace(/_/g, ' ')}</span>
                  {isSelected && <CheckCircle2 style={{ width: '14px', height: '14px', color: '#e01a22' }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
