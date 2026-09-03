import React from 'react';
import { Eye, RefreshCcw, CalendarClock, Trash2, Search, CheckCircle2 } from 'lucide-react';

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
    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-elevated border border-borderMuted/60 py-1.5 z-50 anim-scale-in">
      {actionMenuMode === 'main' ? (
        <>
          <button
            onClick={() => {
              onViewDetails(enquiry.id);
              onClose();
            }}
            className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-surface/60 flex items-center gap-2.5 font-medium transition-colors duration-200"
          >
            <Eye className="h-4 w-4 text-inkLight/60" /> View Details
          </button>
          <button
            onClick={() => {
              setActionMenuMode('status');
              setStatusSearchQuery('');
            }}
            className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-surface/60 flex items-center gap-2.5 font-medium transition-colors duration-200"
          >
            <RefreshCcw className="h-4 w-4 text-inkLight/60" /> Change Status
          </button>
          {(enquiry.status === 'CALL_LATER' || enquiry.status === 'NO_RESPONSE') && (
            <button
              onClick={() => {
                onManageFollowUp(enquiry);
                onClose();
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-blue-50/60 hover:text-blue-600 flex items-center gap-2.5 font-medium transition-colors duration-200"
            >
              <CalendarClock className="h-4 w-4 text-blue-500" /> Manage Follow-up
            </button>
          )}
          <div className="h-px bg-borderMuted/40 my-1 mx-3"></div>
          <button
            onClick={() => {
              onDeleteLead(enquiry);
              onClose();
            }}
            className="w-full text-left px-4 py-2.5 text-sm text-primary hover:bg-primary/5 flex items-center gap-2.5 font-medium transition-colors duration-200"
          >
            <Trash2 className="h-4 w-4 text-primary" /> Delete Lead
          </button>
        </>
      ) : (
        <div className="flex flex-col max-h-[300px]">
          <div className="px-2 py-1.5 sticky top-0 bg-white border-b border-borderMuted/40">
            <div className="flex items-center mb-2">
              <button
                onClick={() => setActionMenuMode('main')}
                className="text-xs text-inkLight hover:text-ink flex items-center gap-1 font-bold px-1 transition-colors duration-200"
              >
                &larr; Back
              </button>
            </div>
            <div className="relative">
              <Search className="h-3 w-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-inkLight/50" />
              <input
                type="text"
                autoFocus
                placeholder="Search status..."
                value={statusSearchQuery}
                onChange={e => setStatusSearchQuery(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 text-xs border border-borderMuted/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all duration-200"
              />
            </div>
          </div>
          <div className="overflow-y-auto px-1 py-1">
            {statuses.filter(s => s.replace(/_/g, ' ').toLowerCase().includes(statusSearchQuery.toLowerCase())).map(status => (
              <button
                key={status}
                onClick={() => {
                  onStatusChange(enquiry.id, status);
                  onClose();
                }}
                className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg flex justify-between items-center group transition-all duration-200 ${
                  enquiry.status === status ? 'bg-blue-50 text-blue-700' : 'text-inkLight hover:bg-surface/60 hover:text-navy'
                }`}
              >
                {status.replace(/_/g, ' ')}
                {enquiry.status === status && <CheckCircle2 className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
