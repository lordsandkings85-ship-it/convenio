import React from 'react';
import { X, CalendarClock, MessageCircleQuestion } from 'lucide-react';

export default function FollowUpChoiceModal({ enquiry, onClose, onSelectSetReminder, onSelectAskCustomer }) {
  return (
    <div className="fixed inset-0 bg-navy/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-elevated anim-scale-in border border-borderMuted/40">
        <div className="flex items-center justify-between p-4 border-b border-borderMuted/60 bg-surface/60">
          <h2 className="text-lg font-bold text-navy">Follow-up Action</h2>
          <button 
            onClick={onClose}
            className="p-2 text-inkLight/60 hover:text-inkLight hover:bg-surface rounded-full transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-inkLight mb-6 text-center font-medium">
            How would you like to handle the follow-up for <strong className="text-navy">{enquiry?.name}</strong>?
          </p>

          <div className="space-y-4">
            <button
              onClick={onSelectSetReminder}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-borderMuted/60 hover:border-blue-500 hover:bg-blue-50/60 transition-all duration-300 group text-left card-base"
            >
              <div className="bg-blue-100 p-3 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 shadow-sm shadow-blue-500/10">
                <CalendarClock className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <div>
                <h3 className="font-bold text-navy group-hover:text-blue-700 transition-colors duration-300">Set Reminder Now</h3>
                <p className="text-xs text-inkLight mt-1 font-medium">I already know the date and time to call them back.</p>
              </div>
            </button>

            <button
              onClick={onSelectAskCustomer}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-borderMuted/60 hover:border-emerald-500 hover:bg-emerald-50/60 transition-all duration-300 group text-left card-base"
            >
              <div className="bg-emerald-100 p-3 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shadow-sm shadow-emerald-500/10">
                <MessageCircleQuestion className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <div>
                <h3 className="font-bold text-navy group-hover:text-emerald-700 transition-colors duration-300">Ask Customer via Message</h3>
                <p className="text-xs text-inkLight mt-1 font-medium">Send an automated message asking when to reach them.</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
