import React, { useState } from 'react';
import './AdminModals.css';
import { User, X, Plus, Phone, Mail, MapPin, DollarSign, FileText } from 'lucide-react';
import { createEnquiry } from '../lib/api';

export default function AddLeadModal({ isOpen, onClose, onSuccess }) {
  const [newLead, setNewLead] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    investment: '10L - 15L',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newLead.name.trim() || !newLead.phone.trim()) {
      setErrorMsg('Name and phone number are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await createEnquiry({
        name: newLead.name.trim(),
        phone: newLead.phone.trim(),
        email: newLead.email.trim() || undefined,
        location: newLead.location.trim() || undefined,
        notes: [newLead.investment ? `Budget: ${newLead.investment}` : '', newLead.notes].filter(Boolean).join(' | '),
        status: 'NEW',
        source: 'ADMIN'
      });
      setNewLead({ name: '', phone: '', email: '', location: '', investment: '10L - 15L', notes: '' });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to create lead', err);
      setErrorMsg(err.message || 'Failed to create lead. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div 
        className="admin-modal-card anim-scale-in" 
        style={{ maxWidth: '480px', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', background: 'rgba(224,26,34,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e01a22' }}>
              <User style={{ width: '18px', height: '18px' }} />
            </div>
            <div>
              <div style={{ fontSize: '15.5px', fontWeight: '900', color: '#0b1120', lineHeight: 1.2 }}>Add New Franchise Lead</div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', marginTop: '2px' }}>Directly register a phone or walk-in prospect</div>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="admin-icon-btn"
            style={{ width: '32px', height: '32px' }}
            aria-label="Close"
          >
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {errorMsg && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '10px', fontSize: '12.5px', fontWeight: '600' }}>
              {errorMsg}
            </div>
          )}

          <div className="admin-form-group" style={{ margin: 0 }}>
            <label className="admin-form-label">Applicant Full Name *</label>
            <input 
              type="text" 
              required
              value={newLead.name}
              onChange={e => setNewLead({ ...newLead, name: e.target.value })}
              className="admin-input"
              placeholder="e.g. Rajesh Kumar"
            />
          </div>

          <div className="admin-form-group" style={{ margin: 0 }}>
            <label className="admin-form-label">Phone Number *</label>
            <input 
              type="tel" 
              required
              value={newLead.phone}
              onChange={e => setNewLead({ ...newLead, phone: e.target.value })}
              className="admin-input"
              placeholder="e.g. +91 98765 43210"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="admin-form-group" style={{ margin: 0 }}>
              <label className="admin-form-label">Email (Optional)</label>
              <input 
                type="email" 
                value={newLead.email}
                onChange={e => setNewLead({ ...newLead, email: e.target.value })}
                className="admin-input"
                placeholder="rajesh@example.com"
              />
            </div>

            <div className="admin-form-group" style={{ margin: 0 }}>
              <label className="admin-form-label">Location</label>
              <input 
                type="text" 
                value={newLead.location}
                onChange={e => setNewLead({ ...newLead, location: e.target.value })}
                className="admin-input"
                placeholder="e.g. Chennai, TN"
              />
            </div>
          </div>

          <div className="admin-form-group" style={{ margin: 0 }}>
            <label className="admin-form-label">Preferred Investment Range</label>
            <select
              value={newLead.investment}
              onChange={e => setNewLead({ ...newLead, investment: e.target.value })}
              className="admin-select"
            >
              <option value="5L - 10L">5L - 10L (Compact Mart)</option>
              <option value="10L - 15L">10L - 15L (Standard Mart)</option>
              <option value="15L - 25L">15L - 25L (Super Mart)</option>
              <option value="25L+">25L+ (Multi-Unit Master)</option>
            </select>
          </div>

          <div className="admin-form-group" style={{ margin: 0 }}>
            <label className="admin-form-label">Initial Notes / Context</label>
            <textarea 
              rows={2}
              value={newLead.notes}
              onChange={e => setNewLead({ ...newLead, notes: e.target.value })}
              className="admin-textarea"
              placeholder="e.g. Inquired via direct phone call; interested in highway location."
            />
          </div>

          {/* Actions */}
          <div style={{ paddingTop: '14px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
            <button 
              type="button"
              onClick={onClose}
              className="admin-btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="admin-btn-primary"
            >
              <Plus style={{ width: '15px', height: '15px' }} />
              {isSubmitting ? 'Saving...' : 'Register Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
