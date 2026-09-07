import React, { useState } from 'react';
import { Mail, MessageSquare, Plus, Save, Trash2, Edit2, FileText, X, Sparkles, Tag, ExternalLink, Info } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { saveTemplate, deleteTemplate } from '../lib/api';
import { useDialog } from './Dialog';
import { useTemplates } from '../context/TemplateContext';

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
    } catch(err) {
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
      } catch(err) {
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

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Communication Templates</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Standardized Email & WhatsApp messaging formats with automatic variable personalization.
          </p>
        </div>
        
        {!isEditing && (
          <button 
            onClick={() => {
              setEditingTemplate({ type: activeTab, name: '', body: '', attachment_url: '' });
              setIsEditing(true);
            }}
            className="admin-btn-primary inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" /> New Template
          </button>
        )}
      </div>

      {!isEditing ? (
        <>
          {/* Channel Selector Tabs */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 w-full sm:w-max">
            <button 
              onClick={() => setActiveTab('EMAIL')}
              className={`flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'EMAIL' 
                  ? 'bg-white text-slate-900 shadow-sm font-black' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Mail className="h-4 w-4 text-blue-500" />
              <span>Email Templates</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-extrabold ${activeTab === 'EMAIL' ? 'bg-blue-50 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
                {emailCount}
              </span>
            </button>
            <button 
              onClick={() => setActiveTab('WHATSAPP')}
              className={`flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'WHATSAPP' 
                  ? 'bg-white text-slate-900 shadow-sm font-black' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="h-4 w-4 text-emerald-500" />
              <span>WhatsApp Templates</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-extrabold ${activeTab === 'WHATSAPP' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                {whatsappCount}
              </span>
            </button>
          </div>

          {/* Template Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.length > 0 ? filteredTemplates.map(template => (
              <div key={template.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group card-lift">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-slate-900 text-base truncate">{template.name}</h3>
                      </div>
                      {template.is_system && (
                        <span className="inline-flex items-center gap-1 mt-1.5 bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-100 uppercase tracking-wider">
                          Auto-Trigger: {template.status_trigger}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={() => { setEditingTemplate(template); setIsEditing(true); }} 
                        className="admin-icon-btn p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        title="Edit Template"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {!template.is_system && (
                        <button 
                          onClick={() => handleDelete(template.id)} 
                          className="admin-icon-btn p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                          title="Delete Template"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-slate-50/80 rounded-xl p-3.5 text-xs text-slate-600 whitespace-pre-wrap font-mono overflow-hidden border border-slate-100 min-h-[90px] max-h-[140px] mb-4">
                    {template.type === 'EMAIL' ? (
                      <div dangerouslySetInnerHTML={{ __html: template.body.length > 180 ? template.body.substring(0, 180) + '...' : template.body }} />
                    ) : (
                      template.body.length > 180 ? template.body.substring(0, 180) + '...' : template.body
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                  {template.attachment_url ? (
                    <a 
                      href={template.attachment_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:underline bg-blue-50/60 px-2.5 py-1 rounded-md border border-blue-100"
                    >
                      <FileText className="h-3.5 w-3.5" /> PDF / Attachment Linked
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium">Text payload only</span>
                  )}
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
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
        /* Template Editor Form */
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/80 p-6">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-black text-slate-900">{editingTemplate.id ? 'Edit Template' : 'Create New Template'}</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Customize message body and dynamic variables for automatic franchise communication.</p>
            </div>
            <button 
              onClick={() => { setIsEditing(false); setEditingTemplate(null); }} 
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSaveTemplate} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Channel Type</label>
                <select 
                  value={editingTemplate.type}
                  onChange={(e) => setEditingTemplate({...editingTemplate, type: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-bold text-xs text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-sm"
                >
                  <option value="EMAIL">Email Format</option>
                  <option value="WHATSAPP">WhatsApp Format</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Template Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Franchise Prospectus & Brochure"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-emerald-500 transition-all font-semibold text-xs text-slate-800 shadow-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Template Content
                </label>
                <span className="text-[11px] text-slate-400 font-medium">Click a variable below to insert:</span>
              </div>
              
              {/* Dynamic Variables Pill Bar */}
              <div className="flex flex-wrap gap-1.5 mb-3 p-2 bg-slate-50 rounded-xl border border-slate-200/60">
                {['[Name]', '[Location]', '[Investment_Capacity]', '[Admin_Name]', '[Date]'].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleInsertTag(tag)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 px-2.5 py-1 rounded-lg transition-all shadow-2xs"
                  >
                    <Tag className="w-3 h-3 text-emerald-600" />
                    <span>{tag}</span>
                  </button>
                ))}
              </div>

              {editingTemplate.type === 'EMAIL' ? (
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                  <ReactQuill 
                    theme="snow" 
                    value={editingTemplate.body} 
                    onChange={(content) => setEditingTemplate({...editingTemplate, body: content})}
                    className="bg-white min-h-[160px]"
                  />
                </div>
              ) : (
                <textarea 
                  required
                  rows={8}
                  placeholder="Hi [Name],&#10;&#10;Thank you for showing interest in Convenio Mart Franchise opportunities in [Location]..."
                  value={editingTemplate.body}
                  onChange={(e) => setEditingTemplate({...editingTemplate, body: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl p-3.5 outline-none focus:border-emerald-500 transition-all font-mono text-xs text-slate-800 shadow-sm leading-relaxed"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Attachment / Brochure URL <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input 
                  type="url" 
                  placeholder="https://convenio.in/brochure.pdf"
                  value={editingTemplate.attachment_url || ''}
                  onChange={(e) => setEditingTemplate({...editingTemplate, attachment_url: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl p-3 pl-10 outline-none focus:border-emerald-500 transition-all font-medium text-xs text-slate-800 shadow-sm"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                <Info className="w-3 h-3" /> When sending WhatsApp or Email messages, this link is included as an attachment reference.
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-5 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => { setIsEditing(false); setEditingTemplate(null); }}
                className="admin-btn-outline px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="admin-btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm"
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

