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
      className="absolute right-0 mt-2 w-60 rounded-2xl bg-white shadow-2xl border border-borderMuted/60 py-2 z-50 anim-scale-in"
      style={{ boxShadow: '0 20px 40px -10px rgba(0,0,0,0.18)' }}
    >
      {actionMenuMode === 'main' ? (
        <>
          <div className="px-3 py-1.5 mb-1 text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100">
            Quick Actions
          </div>

          <button
            onClick={() => {
              onViewDetails(enquiry.id);
              onClose();
            }}
            className="w-full text-left px-3.5 py-2.5 text-xs text-slate-800 hover:bg-slate-50 flex items-center justify-between font-bold transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Eye className="h-3.5 w-3.5" />
              </div>
              <span>View Full Details</span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <button
            onClick={() => {
              setActionMenuMode('status');
              setStatusSearchQuery('');
            }}
            className="w-full text-left px-3.5 py-2.5 text-xs text-slate-800 hover:bg-slate-50 flex items-center justify-between font-bold transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <RefreshCcw className="h-3.5 w-3.5" />
              </div>
              <span>Change Status</span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          {(enquiry.status === 'CALL_LATER' || enquiry.status === 'NO_RESPONSE') && (
            <button
              onClick={() => {
                onManageFollowUp(enquiry);
                onClose();
              }}
              className="w-full text-left px-3.5 py-2.5 text-xs text-slate-800 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between font-bold transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <CalendarClock className="h-3.5 w-3.5" />
                </div>
                <span>Manage Follow-up</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}

          <div className="h-px bg-slate-100 my-1.5 mx-2"></div>

          <button
            onClick={() => {
              onDeleteLead(enquiry);
              onClose();
            }}
            className="w-full text-left px-3.5 py-2.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2.5 font-bold transition-colors rounded-b-xl"
          >
            <div className="p-1.5 rounded-lg bg-red-100 text-red-600">
              <Trash2 className="h-3.5 w-3.5" />
            </div>
            <span>Delete Lead</span>
          </button>
        </>
      ) : (
        <div className="flex flex-col max-h-[320px]">
          <div className="px-3 py-2 border-b border-slate-100 bg-white">
            <button
              onClick={() => setActionMenuMode('main')}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1.5 font-bold mb-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Actions
            </button>
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search status..."
                value={statusSearchQuery}
                onChange={e => setStatusSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 bg-slate-50 font-medium"
              />
            </div>
          </div>
          <div className="overflow-y-auto px-1.5 py-1.5 admin-scroll max-h-56">
            {statuses.filter(s => s.replace(/_/g, ' ').toLowerCase().includes(statusSearchQuery.toLowerCase())).map(status => (
              <button
                key={status}
                onClick={() => {
                  onStatusChange(enquiry.id, status);
                  onClose();
                }}
                className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl flex justify-between items-center transition-all ${
                  enquiry.status === status ? 'bg-red-50 text-red-700 font-black' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>{status.replace(/_/g, ' ')}</span>
                {enquiry.status === status && <CheckCircle2 className="h-3.5 w-3.5 text-red-600" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

