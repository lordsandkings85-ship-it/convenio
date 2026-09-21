import React, { useState } from 'react';
import './TemplatesPage.css';
import { Mail, MessageSquare, Plus, Save, Trash2, Edit3, FileText, X, Sparkles, Tag, ExternalLink, Info, Zap, CheckCircle2 } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { saveTemplate, deleteTemplate } from '../lib/api';
import { useDialog } from './Dialog';
import { useTemplates } from '../context/TemplateContext';
import { WhatsAppIcon } from './Icons';

export default function TemplatesPage() {
  const [activeTab, setActiveTab] = useState('EMAIL'); // EMAIL or WHATSAPP
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const { templates, isLoading, refreshTemplates } = useTemplates();
  const { showToast, showConfirm } = useDialog();

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...editingTemplate,
        isSystem: editingTemplate.is_system || editingTemplate.isSystem,
        statusTrigger: editingTemplate.status_trigger || editingTemplate.statusTrigger
      };
      
      await saveTemplate(payload);
      await refreshTemplates();
      
      setIsEditing(false);
      setEditingTemplate(null);
      showToast('Template saved successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to save template', 'error');
    }
  };

  const handleDelete = async (id) => {
    const templateToDelete = templates.find(t => t.id === id);
    if (templateToDelete?.is_system) {
      showToast('System templates cannot be deleted.', 'warning');
      return;
    }
    const ok = await showConfirm('Are you sure you want to delete this template?', {
      danger: true, confirmLabel: 'Yes, Delete'
    });
    if (ok) {
      try {
        await deleteTemplate(id);
        await refreshTemplates();
        showToast('Template deleted.', 'success');
      } catch (err) {
        console.error(err);
        showToast('Failed to delete template', 'error');
      }
    }
  };

  const handleInsertTag = (tag) => {
    setEditingTemplate({
      ...editingTemplate,
      body: (editingTemplate.body || '') + tag
    });
  };

  const emailCount = templates.filter(t => t.type === 'EMAIL').length;
  const whatsappCount = templates.filter(t => t.type === 'WHATSAPP').length;
  const filteredTemplates = templates.filter(t => t.type === activeTab);

  const renderHighlightedBody = (body, type) => {
    if (!body) return <span className="text-slate-400 italic">No content configured</span>;

    let cleanText = body;
    if (type === 'EMAIL') {
      cleanText = body.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    }

    const tokens = cleanText.split(/(\[[A-Za-z0-9_]+\])/g);

    return (
      <>
        {tokens.map((token, idx) => {
          if (/^\[[A-Za-z0-9_]+\]$/.test(token)) {
            return (
              <span key={idx} className="template-token-pill">
                {token}
              </span>
            );
          }
          return token;
        })}
      </>
    );
  };

  const getTriggerBadge = (trigger) => {
    if (!trigger) return null;
    
    const map = {
      'INTERESTED': { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', label: 'INTERESTED' },
      'READY_TO_PAY': { bg: '#fffbeb', text: '#b45309', border: '#fde68a', label: 'READY_TO_PAY' },
      'APPROVED': { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', label: 'APPROVED' },
      'NO_RESPONSE': { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe', label: 'NO_RESPONSE' },
    };

    const style = map[trigger] || { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1', label: trigger };

    return (
      <span 
        className="template-trigger-pill"
        style={{ background: style.bg, color: style.text, borderColor: style.border }}
      >
        <Zap className="w-3 h-3" /> AUTO-TRIGGER: {style.label}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs" style={{ padding: '18px 24px' }}>
        <div className="flex items-center gap-3.5">
          <span className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-inner">
            <Sparkles className="w-5 h-5" />
          </span>
          <div>
            <h1 className="admin-page-title m-0 leading-tight">Templates</h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium m-0 mt-0.5 leading-normal">
              Standardized Email & WhatsApp messaging formats with automatic variable personalization.
            </p>
          </div>
        </div>
        
        {!isEditing && (
          <button 
            onClick={() => {
              setEditingTemplate({ type: activeTab, name: '', body: '', attachment_url: '' });
              setIsEditing(true);
            }}
            className="admin-btn-primary inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" /> New Template
          </button>
        )}
      </div>

      {!isEditing && (
        <div className="admin-metrics-grid shrink-0">
          {[
            { label: 'Total Templates', value: templates.length, trend: 'Standardized messaging', trendColor: '#2563eb', iconBg: '#eff6ff', iconColor: '#2563eb', Icon: FileText },
            { label: 'Email Templates', value: emailCount, trend: templates.length > 0 ? `${Math.round((emailCount / templates.length) * 100)}% of library` : '0%', trendColor: '#2563eb', iconBg: '#eff6ff', iconColor: '#2563eb', Icon: Mail },
            { label: 'WhatsApp Templates', value: whatsappCount, trend: templates.length > 0 ? `${Math.round((whatsappCount / templates.length) * 100)}% of library` : '0%', trendColor: '#059669', iconBg: '#ecfdf5', iconColor: '#059669', Icon: MessageSquare },
            { label: 'Automated Triggers', value: templates.filter(t => t.is_system || t.isSystem || t.status_trigger).length, trend: 'Stage auto-drafts', trendColor: '#ea580c', iconBg: '#fff7ed', iconColor: '#ea580c', Icon: Sparkles },
          ].map(({ label, value, trend, trendColor, iconBg, iconColor, Icon }) => (
            <div key={label} className="admin-metric-card card-base card-lift">
              <div className="admin-metric-info">
                <p className="admin-metric-label">{label}</p>
                <p className="admin-metric-value">{value}</p>
                <p className="admin-metric-trend" style={{ color: trendColor }}>{trend}</p>
              </div>
              <div className="admin-metric-icon-box" style={{ background: iconBg, color: iconColor }}>
                <Icon style={{ width: '22px', height: '22px' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isEditing ? (
        <>
          {/* Channel Selector Segmented Control */}
          <div className="templates-channel-tabs">
            <button 
              onClick={() => setActiveTab('EMAIL')}
              className={`templates-channel-btn ${activeTab === 'EMAIL' ? 'is-active' : ''}`}
            >
              <Mail className="h-4 w-4 text-blue-600" />
              <span>Email Templates</span>
              <span className="templates-badge-count email">
                {emailCount}
              </span>
            </button>
            <button 
              onClick={() => setActiveTab('WHATSAPP')}
              className={`templates-channel-btn ${activeTab === 'WHATSAPP' ? 'is-active' : ''}`}
            >
              <MessageSquare className="h-4 w-4 text-emerald-600" />
              <span>WhatsApp Templates</span>
              <span className="templates-badge-count whatsapp">
                {whatsappCount}
              </span>
            </button>
          </div>

          {/* Template Cards Grid */}
          <div className="templates-grid">
            {filteredTemplates.length > 0 ? filteredTemplates.map(template => (
              <div 
                key={template.id} 
                className={`template-card ${template.type === 'EMAIL' ? 'email' : 'whatsapp'}`}
              >
                <div>
                  <div className="template-card-header">
                    <div className="flex-1 min-w-0">
                      <h3 className="template-card-title truncate" title={template.name}>
                        {template.name}
                      </h3>
                      {template.is_system && getTriggerBadge(template.status_trigger)}
                    </div>
                    
                    <div className="template-action-btn-group">
                      <button 
                        onClick={() => { setEditingTemplate(template); setIsEditing(true); }} 
                        className="template-action-btn"
                        title="Edit Template"
                        aria-label="Edit Template"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      {!template.is_system && (
                        <button 
                          onClick={() => handleDelete(template.id)} 
                          className="template-action-btn delete"
                          title="Delete Template"
                          aria-label="Delete Template"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Clean Formatted Body Preview with Highlighted Variables */}
                  <div className="template-preview-box mt-3.5">
                    {renderHighlightedBody(template.body, template.type)}
                  </div>
                </div>

                {/* Footer with Attachment & Channel Badges */}
                <div className="template-card-footer">
                  {template.attachment_url ? (
                    <a 
                      href={template.attachment_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="template-attachment-badge"
                    >
                      <FileText className="h-3.5 w-3.5" /> Attachment Linked
                    </a>
                  ) : (
                    <span className="template-text-badge">
                      <FileText className="h-3.5 w-3.5" /> Text payload only
                    </span>
                  )}
                  <span className={`template-channel-pill ${template.type === 'EMAIL' ? 'email' : 'whatsapp'}`}>
                    {template.type === 'EMAIL' ? <Mail className="w-3 h-3" /> : <WhatsAppIcon size={12} color="#059669" />}
                    {template.type}
                  </span>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-16 text-center bg-white border border-slate-200 rounded-2xl border-dashed">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Mail className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-slate-700">No {activeTab.toLowerCase()} templates configured</p>
                <p className="text-xs text-slate-400 mt-1">Create your first standardized template to streamline communication.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Executive Template Editor Form */
        <div className="template-editor-card">
          <div className="template-editor-header">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                {editingTemplate.type === 'EMAIL' ? <Mail className="w-5 h-5 text-blue-600" /> : <MessageSquare className="w-5 h-5 text-emerald-600" />}
              </span>
              <div>
                <h2 className="template-editor-title">
                  {editingTemplate.id ? 'Edit Template' : 'Create New Template'}
                </h2>
                <p className="template-editor-subtext">
                  Customize message body and dynamic variables for automatic franchise communication.
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => { setIsEditing(false); setEditingTemplate(null); }} 
              className="template-action-btn"
              title="Close"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSaveTemplate} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="template-form-label">
                  Channel Type
                </label>
                <select 
                  value={editingTemplate.type}
                  onChange={(e) => setEditingTemplate({...editingTemplate, type: e.target.value})}
                  className="template-form-input cursor-pointer"
                >
                  <option value="EMAIL">Email Format</option>
                  <option value="WHATSAPP">WhatsApp Format</option>
                </select>
              </div>
              
              <div>
                <label className="template-form-label">
                  Template Title
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Send Franchise Brochure"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
                  className="template-form-input"
                />
              </div>
            </div>

            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <label className="template-form-label m-0">
                  Template Content
                </label>
                <span className="text-[11.5px] text-slate-500 font-medium flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-primary" /> Click a variable below to insert:
                </span>
              </div>
              
              {/* Interactive Dynamic Variables Pill Bar */}
              <div className="template-vars-bar admin-scroll">
                {['[Name]', '[Location]', '[Investment_Capacity]', '[Admin_Name]', '[Date]'].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleInsertTag(tag)}
                    className="template-var-btn"
                    title={`Insert ${tag} placeholder`}
                  >
                    <Tag className="w-3.5 h-3.5 text-primary" />
                    <span>{tag}</span>
                  </button>
                ))}
              </div>

              {editingTemplate.type === 'EMAIL' ? (
                <div className="admin-quill-wrapper">
                  <ReactQuill 
                    theme="snow" 
                    value={editingTemplate.body} 
                    onChange={(content) => setEditingTemplate({...editingTemplate, body: content})}
                    placeholder="Compose your email template here..."
                  />
                </div>
              ) : (
                <textarea 
                  required
                  rows={8}
                  placeholder="Hi [Name],&#10;&#10;Thank you for your interest in the Convenio Mart Franchise in [Location]..."
                  value={editingTemplate.body}
                  onChange={(e) => setEditingTemplate({...editingTemplate, body: e.target.value})}
                  className="template-whatsapp-textarea"
                />
              )}
            </div>

            <div>
              <label className="template-form-label">
                Attachment / Brochure URL <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                <input 
                  type="url" 
                  placeholder="https://convenio.in/brochure.pdf"
                  value={editingTemplate.attachment_url || ''}
                  onChange={(e) => setEditingTemplate({...editingTemplate, attachment_url: e.target.value})}
                  className="template-form-input pl-10"
                />
              </div>
              <p className="text-[11.5px] text-slate-500 mt-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" /> When sending WhatsApp or Email messages, this link is included as an attachment reference.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => { setIsEditing(false); setEditingTemplate(null); }}
                className="admin-btn-outline w-full sm:w-auto cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="admin-btn-primary w-full sm:w-auto cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" /> Save Template
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
