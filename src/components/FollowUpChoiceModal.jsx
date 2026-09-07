import React from 'react';
import { X, CalendarClock, MessageCircleQuestion, ArrowRight } from 'lucide-react';

export default function FollowUpChoiceModal({ enquiry, onClose, onSelectSetReminder, onSelectAskCustomer }) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-base font-extrabold text-slate-900">Choose Follow-up Method</h2>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-xs text-slate-500 mb-5 font-medium">
            How would you like to handle the follow-up for <strong className="text-slate-900">{enquiry?.name}</strong>?
          </p>

          <div className="space-y-3">
            <button
              onClick={onSelectSetReminder}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all group text-left card-lift"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform">
                  <CalendarClock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-xs group-hover:text-blue-700">Set Reminder Now</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">I already know the specific date & time to call.</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-all group-hover:translate-x-1" />
            </button>

            <button
              onClick={onSelectAskCustomer}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group text-left card-lift"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform">
                  <MessageCircleQuestion className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-xs group-hover:text-emerald-700">Ask Applicant via WhatsApp</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Send a quick message inquiring their availability.</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-all group-hover:translate-x-1" />
            </button>
          </div>

          <div className="mt-6 flex justify-end">
            <button 
              onClick={onClose}
              className="admin-btn-outline px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

