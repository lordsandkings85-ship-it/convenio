import React, { useState } from 'react';
import { X, Save, Clock, Calendar, MessageSquare, Mail, Send } from 'lucide-react';
import { createFollowUpTask, getTemplates } from '../lib/api';
import { useDialog } from './Dialog';
import { openOrFocusTab, triggerWhatsAppMessage } from '../lib/openSingleTab';

export default function ScheduleReminderModal({ enquiry, onClose, onSaved }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [sendConfirmation, setSendConfirmation] = useState(true);
  const [channel, setChannel] = useState('WHATSAPP');
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useDialog();

  const handleSave = async () => {
    if (!date || !time) {
      showToast('Please select both date and time.', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const scheduledDateTime = new Date(`${date}T${time}`);
      const scheduledAt = scheduledDateTime.toISOString();

      await createFollowUpTask({
        enquiry_id: enquiry.id,
        task_type: 'CALL',
        scheduled_at: scheduledAt,
        status: 'PENDING'
      });

      if (sendConfirmation && enquiry) {
        const formattedDate = scheduledDateTime.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
        const formattedTime = scheduledDateTime.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit'
        });
        const timeString = `${formattedDate} at ${formattedTime}`;

        let confirmationMsg = `Hi ${enquiry.name || 'there'},\n\nAs discussed, we have scheduled a call back with you on ${timeString}. Please let us know if you would like to adjust this time!\n\nBest regards,\nConvenio Mart Team`;

        try {
          const dbTemplates = await getTemplates();
          const matchTmpl = dbTemplates.find(t => t.type === channel && t.status_trigger === 'CALL_LATER_CONFIRM') ||
                            dbTemplates.find(t => t.type === channel && t.status_trigger === 'CALL_LATER');
          if (matchTmpl && matchTmpl.body) {
            let bodyText = matchTmpl.body;
            if (channel === 'EMAIL') {
              bodyText = bodyText
                .replace(/<\/p>/gi, '\n\n')
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<[^>]+>/g, '')
                .replace(/&nbsp;/g, ' ')
                .trim();
            }
            confirmationMsg = bodyText
              .replace(/\[Name\]/gi, enquiry.name || 'there')
              .replace(/\[Date\]/gi, timeString)
              .replace(/\[Location\]/gi, enquiry.location || '')
              .replace(/\[Investment_Capacity\]/gi, enquiry.investment_capacity || '');
          }
        } catch (tmplErr) {
          console.warn('Using fallback call-back confirmation template', tmplErr);
        }

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (channel === 'WHATSAPP' && enquiry.phone) {
          triggerWhatsAppMessage(enquiry.phone, confirmationMsg);
          try {
            const { supabase } = await import('../lib/supabase.js');
            await supabase.from('enquiry_timeline').insert([{
              enquiry_id: enquiry.id,
              action_type: 'WHATSAPP_SENT',
              description: `Sent call-back confirmation for ${timeString}`
            }]);
          } catch (tErr) {
            console.error('Failed to log timeline', tErr);
          }
        } else if (channel === 'EMAIL' && enquiry.email) {
          const mailSubject = `Confirming our Call Back for ${formattedDate}`;
          const mailUrl = isMobile
            ? `mailto:${encodeURIComponent(enquiry.email)}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(confirmationMsg)}`
            : `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(enquiry.email)}&su=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(confirmationMsg)}`;

          if (isMobile) {
            window.open(mailUrl, '_blank');
          } else {
            openOrFocusTab('EMAIL', mailUrl);
          }
          try {
            const { supabase } = await import('../lib/supabase.js');
            await supabase.from('enquiry_timeline').insert([{
              enquiry_id: enquiry.id,
              action_type: 'EMAIL_SENT',
              description: `Sent call-back confirmation email for ${timeString}`
            }]);
          } catch (tErr) {
            console.error('Failed to log timeline', tErr);
          }
        }
      }

      showToast(sendConfirmation ? 'Reminder saved & confirmation message launched!' : 'Reminder saved successfully!', 'success');
      onSaved();
    } catch (err) {
      console.error(err);
      showToast('Failed to save reminder.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-navy/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-elevated anim-scale-in border border-borderMuted/40">
        <div className="flex items-center justify-between p-4 border-b border-borderMuted/60 bg-surface/60">
          <h2 className="text-lg font-bold text-navy">Set Call Back & Confirm</h2>
          <button 
            onClick={onClose}
            className="p-2 text-inkLight/60 hover:text-inkLight hover:bg-surface rounded-full transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-inkLight font-medium">
            Set the call-back reminder for <strong className="text-navy">{enquiry?.name}</strong>:
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-inkLight" /> Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-2.5 text-sm border border-borderMuted/60 rounded-xl focus:ring-2 focus:ring-primary/15 focus:border-primary outline-none transition-all duration-200 bg-surface/50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-inkLight" /> Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-2.5 text-sm border border-borderMuted/60 rounded-xl focus:ring-2 focus:ring-primary/15 focus:border-primary outline-none transition-all duration-200 bg-surface/50 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink mb-1.5">
              Admin Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g., Client requested call back after 3 PM..."
              rows={2}
              className="w-full p-2.5 text-sm border border-borderMuted/60 rounded-xl focus:ring-2 focus:ring-primary/15 focus:border-primary outline-none resize-none transition-all duration-200 bg-surface/50 focus:bg-white"
            />
          </div>

          {/* Instant Client Confirmation Toggle */}
          <div className="bg-surface/80 border border-borderMuted/60 p-3.5 rounded-xl space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input 
                type="checkbox"
                checked={sendConfirmation}
                onChange={(e) => setSendConfirmation(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-borderMuted focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-navy">
                Send confirmation message to client
              </span>
            </label>

            {sendConfirmation && (
              <div className="flex gap-2 pt-1 anim-fade-up">
                <button
                  type="button"
                  onClick={() => setChannel('WHATSAPP')}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all duration-200 ${
                    channel === 'WHATSAPP' 
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm shadow-emerald-500/10' 
                      : 'bg-white border-borderMuted/60 text-inkLight hover:bg-surface'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp
                </button>

                <button
                  type="button"
                  onClick={() => setChannel('EMAIL')}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all duration-200 ${
                    channel === 'EMAIL' 
                      ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm shadow-blue-500/10' 
                      : 'bg-white border-borderMuted/60 text-inkLight hover:bg-surface'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 text-blue-600" /> Email
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-surface/80 border-t border-borderMuted/60 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2.5 font-bold text-sm text-inkLight hover:text-navy transition-colors active:scale-95"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg hover:shadow-blue-500/20 text-white font-bold text-sm rounded-xl flex items-center gap-2 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed active:scale-95 btn-press"
          >
            {isSaving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : sendConfirmation ? (
              <Send className="w-3.5 h-3.5" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {sendConfirmation ? 'Save & Send Confirmation' : 'Save Reminder Only'}
          </button>
        </div>
      </div>
    </div>
  );
}
