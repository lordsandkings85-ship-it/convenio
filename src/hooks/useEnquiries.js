import { useState, useEffect, useCallback } from 'react';
import { getEnquiries, updateEnquiryStatus, getDueTasks, deleteEnquiry } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useDialog } from '../components/Dialog';

export function useEnquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [dueTasks, setDueTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);
  const { showToast, showConfirm } = useDialog();

  const fetchEnquiriesData = useCallback(async () => {
    setLoading(true);
    try {
      const [data, tasksData] = await Promise.all([
        getEnquiries(),
        getDueTasks()
      ]);
      setEnquiries(data || []);
      setDueTasks(tasksData || []);

      const currentTaskIds = (tasksData || []).map(t => t.id).sort().join(',');
      const dismissedTaskIds = localStorage.getItem('dismissedDueTasks');
      if (currentTaskIds && currentTaskIds === dismissedTaskIds) {
        setIsAlertDismissed(true);
      } else {
        setIsAlertDismissed(false);
      }
    } catch (error) {
      console.error('Error fetching enquiries:', error);
      showToast('Failed to fetch leads: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchEnquiriesData();

    // Supabase Realtime Subscription for instant lead notifications
    let channel;
    try {
      channel = supabase
        .channel('public:enquiries')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'enquiries' }, payload => {
          if (payload.new) {
            setEnquiries(prev => {
              const exists = prev.some(e => e.id === payload.new.id);
              return exists ? prev : [payload.new, ...prev];
            });
            showToast(`🔔 New Lead Received: ${payload.new.name || 'New Prospect'} (${payload.new.source === 'CHAT' ? 'AI Chatbot' : 'Form'})`, 'info');
          }
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'enquiries' }, payload => {
          if (payload.new) {
            setEnquiries(prev => prev.map(e => e.id === payload.new.id ? { ...e, ...payload.new } : e));
          }
        })
        .subscribe();
    } catch (err) {
      console.warn('Realtime subscription initialization skipped/failed:', err);
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchEnquiriesData, showToast]);

  const executeStatusUpdate = async (id, newStatus) => {
    try {
      setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e));
      await updateEnquiryStatus(id, newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Failed to update status', 'error');
      fetchEnquiriesData();
    }
  };

  const handleStatusChange = (id, newStatus, setFollowUpChoice, setDraftReview) => {
    const enquiry = enquiries.find(e => e.id === id);
    if (!enquiry || enquiry.status === newStatus) return;

    executeStatusUpdate(id, newStatus);

    if (newStatus === 'CALL_LATER') {
      if (setFollowUpChoice) setFollowUpChoice({ enquiry, newStatus });
      return;
    }

    const draftStatuses = ['INTERESTED', 'READY_TO_PAY', 'APPROVED', 'NO_RESPONSE'];
    if (draftStatuses.includes(newStatus)) {
      if (setDraftReview) setDraftReview({ enquiry, newStatus });
    }
  };

  const handleDeleteLead = async (enquiry) => {
    const ok = await showConfirm(
      `Delete lead "${enquiry.name}"? This action cannot be undone.`,
      { danger: true, confirmLabel: 'Yes, Delete' }
    );
    if (!ok) return false;
    try {
      await deleteEnquiry(enquiry.id);
      await fetchEnquiriesData();
      showToast(`Lead "${enquiry.name}" deleted.`, 'success');
      return true;
    } catch (err) {
      console.error(err);
      showToast('Failed to delete lead: ' + err.message, 'error');
      return false;
    }
  };

  const dismissAlert = () => {
    const currentTaskIds = dueTasks.map(t => t.id).sort().join(',');
    localStorage.setItem('dismissedDueTasks', currentTaskIds);
    setIsAlertDismissed(true);
  };

  return {
    enquiries,
    setEnquiries,
    dueTasks,
    loading,
    isAlertDismissed,
    dismissAlert,
    fetchEnquiriesData,
    executeStatusUpdate,
    handleStatusChange,
    handleDeleteLead
  };
}
