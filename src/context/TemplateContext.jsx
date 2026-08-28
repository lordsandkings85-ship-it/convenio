import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTemplates, saveTemplate } from '../lib/api';

const defaultTemplatesList = [
  {
    id: 'sys_email_interested',
    isSystem: true,
    statusTrigger: 'INTERESTED',
    type: 'EMAIL',
    name: 'Send Franchise Brochure',
    body: '<p>Hi [Name],</p><p>Thank you for your interest in the Convenio Mart Franchise. As discussed, please find the franchise brochure attached.</p><p>Let us know if you have any questions or when you\'re ready to proceed to the next step.</p><p>Best regards,<br>Convenio Mart Franchise Team</p>',
    attachment_url: ''
  },
  {
    id: 'sys_email_ready',
    isSystem: true,
    statusTrigger: 'READY_TO_PAY',
    type: 'EMAIL',
    name: 'Send Payment Details',
    body: '<p>Hi [Name],</p><p>The next step is to process the franchise fee payment. Please transfer the amount to the following account:</p><p><strong>Bank:</strong> State Bank of India<br><strong>A/c:</strong> 38472938475<br><strong>IFSC:</strong> SBIN0001234</p><p>Best regards,<br>Convenio Mart Franchise Team</p>',
    attachment_url: ''
  },
  {
    id: 'sys_email_approved',
    isSystem: true,
    statusTrigger: 'APPROVED',
    type: 'EMAIL',
    name: 'Welcome & Approval',
    body: '<p>Hi [Name],</p><p>Congratulations! Your payment has been verified and your franchise application is officially approved.</p><p>Welcome to the Convenio Mart family! Our onboarding team will contact you shortly regarding agreement signing and training.</p><p>Best regards,<br>Convenio Mart Franchise Team</p>',
    attachment_url: ''
  },
  {
    id: 'sys_email_call_later',
    isSystem: true,
    statusTrigger: 'CALL_LATER',
    type: 'EMAIL',
    name: 'Ask Preferred Call Time',
    body: '<p>Hi [Name],</p><p>You mentioned you would like us to call you back later. Please let us know what date and time works best for you so we can connect!</p><p>Best regards,<br>Convenio Mart Franchise Team</p>',
    attachment_url: ''
  },
  {
    id: 'sys_email_call_later_confirm',
    isSystem: true,
    statusTrigger: 'CALL_LATER_CONFIRM',
    type: 'EMAIL',
    name: 'Confirm Scheduled Call Time',
    body: '<p>Hi [Name],</p><p>As per our discussion, we have scheduled a call back with you on <strong>[Date]</strong>. Please let us know if this time works best for you or if you need to adjust!</p><p>Best regards,<br>Convenio Mart Franchise Team</p>',
    attachment_url: ''
  },
  {
    id: 'sys_email_no_response',
    isSystem: true,
    statusTrigger: 'NO_RESPONSE',
    type: 'EMAIL',
    name: 'Follow Up - No Response',
    body: '<p>Hi [Name],</p><p>We tried to reach you recently regarding the Convenio Mart franchise opportunity but couldn\'t connect. Are you still interested?</p><p>Let us know a good time to reach you.</p><p>Best regards,<br>Convenio Mart Franchise Team</p>',
    attachment_url: ''
  },
  {
    id: 'sys_wa_interested',
    isSystem: true,
    statusTrigger: 'INTERESTED',
    type: 'WHATSAPP',
    name: 'Send Franchise Brochure',
    body: 'Hi [Name]! Thank you for your interest in Convenio Mart. We\'ve sent the franchise brochure to your email. Let us know when you\'re ready to proceed!',
    attachment_url: ''
  },
  {
    id: 'sys_wa_ready',
    isSystem: true,
    statusTrigger: 'READY_TO_PAY',
    type: 'WHATSAPP',
    name: 'Send Payment Details',
    body: 'Hi [Name]! You are now ready to make the franchise payment. Please transfer the amount to:\nBank: State Bank of India\nA/c: 38472938475\nIFSC: SBIN0001234',
    attachment_url: ''
  },
  {
    id: 'sys_wa_approved',
    isSystem: true,
    statusTrigger: 'APPROVED',
    type: 'WHATSAPP',
    name: 'Welcome & Approval',
    body: 'Congratulations [Name]! Your payment is verified and your Convenio Mart franchise is APPROVED! Welcome to the family. Our onboarding team will call you shortly.',
    attachment_url: ''
  },
  {
    id: 'sys_wa_call_later',
    isSystem: true,
    statusTrigger: 'CALL_LATER',
    type: 'WHATSAPP',
    name: 'Ask Preferred Call Time',
    body: 'Hi [Name], you mentioned you would like us to call you back later. Please let us know what date and time works best for you so we can connect!',
    attachment_url: ''
  },
  {
    id: 'sys_wa_call_later_confirm',
    isSystem: true,
    statusTrigger: 'CALL_LATER_CONFIRM',
    type: 'WHATSAPP',
    name: 'Confirm Scheduled Call Time',
    body: 'Hi [Name], as per our conversation, we have scheduled a call back with you on [Date]. Please let us know if this time works best for you or if you need to adjust!',
    attachment_url: ''
  },
  {
    id: 'sys_wa_no_response',
    isSystem: true,
    statusTrigger: 'NO_RESPONSE',
    type: 'WHATSAPP',
    name: 'Follow Up - No Response',
    body: 'Hi [Name], we tried to reach you recently regarding the Convenio Mart franchise opportunity but couldn\'t connect. Are you still interested? Let us know a good time to reach you.',
    attachment_url: ''
  }
];

const TemplateContext = createContext();

export function TemplateProvider({ children }) {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshTemplates = async () => {
    try {
      setIsLoading(true);
      const dbTemplates = await getTemplates();

      for (const dt of defaultTemplatesList) {
        const existing = dbTemplates.find(
          lt => lt.status_trigger === dt.statusTrigger && lt.type === dt.type && lt.is_system
        );
        if (!existing) {
          await saveTemplate(dt);
        } else if (existing.body !== dt.body || existing.name !== dt.name) {
          await saveTemplate({ ...dt, id: existing.id, name: dt.name, body: dt.body });
        }
      }

      const updated = await getTemplates();
      setTemplates(updated || []);
    } catch (err) {
      console.error('Failed to load/seed templates in context:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshTemplates();
  }, []);

  const getTemplateByTrigger = (channel, trigger) => {
    return templates.find(t => t.type === channel && t.status_trigger === trigger);
  };

  return (
    <TemplateContext.Provider value={{ templates, setTemplates, isLoading, refreshTemplates, getTemplateByTrigger }}>
      {children}
    </TemplateContext.Provider>
  );
}

export function useTemplates() {
  return useContext(TemplateContext);
}
