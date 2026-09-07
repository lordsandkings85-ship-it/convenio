import React, { useState } from 'react';
import { X, Save, Clock, Calendar, MessageSquare, Mail, Send, Sparkles } from 'lucide-react';
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

  // Quick preset helper
  const applyPreset = (daysOffset, hours) => {
    const target = new Date();
    target.setDate(target.getDate() + daysOffset);
    const dateStr = target.toISOString().split('T')[0];
    const timeStr = `${String(hours).padStart(2, '0')}:00`;
    setDate(dateStr);
    setTime(timeStr);
  };

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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Clock className="w-4 h-4" />
            </span>
            <h2 className="text-base font-extrabold text-slate-900">Schedule Call Back</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-500 font-medium">
            Set a follow-up reminder for <strong className="text-slate-900">{enquiry?.name}</strong>:
          </p>

          {/* Quick Presets */}
          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Quick Presets</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset(1, 10)}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 transition-all"
              >
                Tomorrow 10 AM
              </button>
              <button
                type="button"
                onClick={() => applyPreset(1, 15)}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 transition-all"
              >
                Tomorrow 3 PM
              </button>
              <button
                type="button"
                onClick={() => applyPreset(2, 11)}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 transition-all"
              >
                In 2 Days
              </button>
              <button
                type="button"
                onClick={() => applyPreset(7, 11)}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 transition-all"
              >
                In 1 Week
              </button>
            </div>
          </div>

          {/* Date and Time Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition-all bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition-all bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Call Notes <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Applicant requested evening callback to discuss store location..."
              rows={2}
              className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:border-blue-500 outline-none resize-none transition-all bg-white leading-relaxed"
            />
          </div>

          {/* Confirmation Message Toggle */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={sendConfirmation}
                onChange={(e) => setSendConfirmation(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="text-xs font-extrabold text-slate-800">
                Send appointment confirmation to lead
              </span>
            </label>

            {sendConfirmation && (
              <div className="flex gap-2 pt-1 animate-in fade-in">
                <button
                  type="button"
                  onClick={() => setChannel('WHATSAPP')}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                    channel === 'WHATSAPP' 
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-extrabold shadow-xs' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp
                </button>

                <button
                  type="button"
                  onClick={() => setChannel('EMAIL')}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                    channel === 'EMAIL' 
                      ? 'bg-blue-50 border-blue-500 text-blue-700 font-extrabold shadow-xs' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 text-blue-600" /> Email
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-2.5">
          <button 
            onClick={onClose}
            className="admin-btn-outline px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="admin-btn-primary inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : sendConfirmation ? (
              <Send className="w-3.5 h-3.5" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {sendConfirmation ? 'Schedule & Send' : 'Save Task Only'}
          </button>
        </div>
      </div>
    </div>
  );
}

