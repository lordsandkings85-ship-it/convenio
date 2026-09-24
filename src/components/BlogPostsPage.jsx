import { useState, useEffect, useRef, useMemo } from 'react';
import './BlogPostsPage.css';
import ReactQuill, { Quill as QuillStatic } from 'react-quill-new';
import QuillTable from 'quill/modules/table';
import QuillTableEmbed from 'quill/modules/tableEmbed';
import 'react-quill-new/dist/quill.snow.css';

QuillStatic.register({
  'modules/table': QuillTable,
  'modules/tableEmbed': QuillTableEmbed
}, true);
import { Plus, Save, Trash2, Edit3, X, Eye, Calendar, User, Image as ImageIcon, Newspaper, Sparkles, FileText, CheckCircle2, Link2, Code, FileCheck, UploadCloud, ImagePlus, Table, PenLine, AlignLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { getBlogPosts, saveBlogPost, deleteBlogPost, uploadBlogImage } from '../lib/api';
import { useDialog } from './Dialog';

const slugify = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const escapeCell = (cell) => (cell || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');

const tsvToMarkdownTable = (text) => {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) return '';
  const rows = lines.map((l) => l.split('\t').map((c) => c.trim()));
  const colCount = Math.max(...rows.map((r) => r.length));
  const cells = (r) => r.concat(new Array(colCount - r.length).fill(''));
  const fmt = (r) => `| ${cells(r).map(escapeCell).join(' | ')} |`;
  const header = fmt(rows[0]);
  const separator = `|${cells(rows[0]).map(() => ' --- ').join('|')}|`;
  const body = rows.slice(1).map(fmt);
  return [header, separator, ...body].join('\n');
};

const emptyPost = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  cover_image: '',
  author: '',
  status: 'DRAFT'
};

const looksLikeHtml = (content = '') =>
  /<(p|div|h[1-6]|ul|ol|li|table|blockquote|pre|strong|em|span)\b/gi.test(content || '');

export const normalizeContent = (text) => {
  if (!text) return '';
  return text
    .replace(/\u00A0/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '');
};

export default function BlogPostsPage() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [isContentUploading, setIsContentUploading] = useState(false);
  const [editorMode, setEditorMode] = useState('rich'); // 'rich' | 'markdown'
  const coverInputRef = useRef(null);
  const contentInputRef = useRef(null);
  const markdownRef = useRef(null);
  const quillRef = useRef(null);
  const { showToast, showConfirm } = useDialog();

  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        [{ size: ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ align: [] }],
        ['blockquote', 'code-block'],
        ['link', 'image'],
        ['table'],
        ['clean']
      ],
      handlers: {
        image: () => contentInputRef.current?.click(),
        table: function () {
          const table = this.quill.getModule('table');
          if (table) table.insertTable(3, 3);
        }
      }
    }
  }), []);

  const quillFormats = ['header', 'size', 'bold', 'italic', 'underline', 'strike', 'color', 'background', 'list', 'align', 'blockquote', 'code-block', 'link', 'image', 'table'];

  const loadPosts = async () => {
    try {
      const data = await getBlogPosts();
      setPosts(data || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load blog posts', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    getBlogPosts()
      .then((data) => { if (mounted) setPosts(data || []); })
      .catch((err) => { if (mounted) console.error(err); })
      .finally(() => { if (mounted) setIsLoading(false); });
    return () => { mounted = false; };
  }, []);

  const handleSlugChange = (value) => {
    setEditingPost({ ...editingPost, slug: slugify(value) });
  };

  const handleSavePost = async (e) => {
    e.preventDefault();
    if (!editingPost.slug) {
      showToast('Please fill in a valid slug', 'error');
      return;
    }
    const cleanPost = {
      ...editingPost,
      title: normalizeContent(editingPost.title).trim(),
      slug: slugify(editingPost.slug),
      excerpt: normalizeContent(editingPost.excerpt || '').trim(),
      content: normalizeContent(editingPost.content || '')
    };
    try {
      await saveBlogPost(cleanPost);
      await loadPosts();
      setIsEditing(false);
      setEditingPost(null);
      setShowPreview(false);
      showToast('Blog post saved successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to save blog post', 'error');
    }
  };

  const handleDelete = async (id) => {
    const ok = await showConfirm('Are you sure you want to delete this blog post?', {
      danger: true, confirmLabel: 'Yes, Delete'
    });
    if (ok) {
      try {
        await deleteBlogPost(id);
        await loadPosts();
        showToast('Blog post deleted.', 'success');
      } catch (err) {
        console.error(err);
        showToast('Failed to delete blog post', 'error');
      }
    }
  };

  const startEdit = (post) => {
    const p = post ? {
      ...post,
      title: normalizeContent(post.title || ''),
      excerpt: normalizeContent(post.excerpt || ''),
      content: normalizeContent(post.content || '')
    } : { ...emptyPost, slug: '' };
    setEditingPost(p);
    setShowPreview(false);
    setEditorMode(looksLikeHtml(p.content) ? 'rich' : 'markdown');
    setIsEditing(true);
  };

  const handleCoverImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCoverUploading(true);
    try {
      const url = await uploadBlogImage(file);
      setEditingPost({ ...editingPost, cover_image: url });
      showToast('Cover image uploaded successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Cover image upload failed', 'error');
    } finally {
      setIsCoverUploading(false);
      e.target.value = '';
    }
  };

  const handleContentImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsContentUploading(true);
    try {
      const url = await uploadBlogImage(file);
      if (editorMode === 'rich' && quillRef.current) {
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection() || { index: quill.getLength() - 1, length: 0 };
        quill.insertEmbed(range.index, 'image', url);
        quill.setSelection(range.index + 1, 0);
        setEditingPost({ ...editingPost, content: quill.root.innerHTML });
      } else {
        const alt = file.name.replace(/\.[^.]+$/, '') || 'blog-image';
        const snippet = `\n\n![${alt}](${url})\n`;
        const el = markdownRef.current;
        const current = editingPost.content || '';
        let next;
        if (el) {
          const start = el.selectionStart ?? current.length;
          const end = el.selectionEnd ?? current.length;
          next = current.slice(0, start) + snippet + current.slice(end);
        } else {
          next = current.endsWith('\n') ? current + snippet.trimStart() : current + snippet;
        }
        setEditingPost({ ...editingPost, content: next });
      }
      showToast('Image uploaded and inserted into article', 'success');
    } catch (err) {
      console.error(err);
      showToast('Image upload failed', 'error');
    } finally {
      setIsContentUploading(false);
      e.target.value = '';
    }
  };

  const insertAtCursor = (snippet) => {
    const el = markdownRef.current;
    const current = editingPost.content || '';
    if (el) {
      const start = el.selectionStart ?? current.length;
      const end = el.selectionEnd ?? current.length;
      return current.slice(0, start) + snippet + current.slice(end);
    }
    return current.endsWith('\n') ? current + snippet.trimStart() : current + snippet;
  };

  const handleMarkdownPaste = (e) => {
    const text = e.clipboardData.getData('text/plain');
    if (!text || !text.includes('\t')) return;
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return;
    e.preventDefault();
    const table = tsvToMarkdownTable(text);
    if (!table) return;
    const snippet = `\n\n${table}\n\n`;
    const next = insertAtCursor(snippet);
    setEditingPost({ ...editingPost, content: next });
    showToast('Table detected on paste — converted to markdown table', 'success');
  };

  const handleInsertTable = () => {
    const snippet = '\n\n| Column 1 | Column 2 | Column 3 |\n| --- | --- | --- |\n|  |  |  |\n\n';
    setEditingPost({ ...editingPost, content: insertAtCursor(snippet) });
    showToast('Markdown table template inserted', 'success');
  };

  const publishedCount = posts.filter(p => p.status === 'PUBLISHED').length;

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header Banner */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs" style={{ padding: '18px 24px' }}>
        <div className="flex items-center gap-3.5">
          <span className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-inner">
            <Newspaper className="w-5 h-5" />
          </span>
          <div>
            <h1 className="admin-page-title m-0 leading-tight">Blog Posts</h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium m-0 mt-0.5 leading-normal">
              Write, optimize, and publish SEO content to drive franchise organic discovery.
            </p>
          </div>
        </div>
        
        {!isEditing && (
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex text-xs font-bold text-slate-600 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80">
              <strong className="text-emerald-600 mr-1">{publishedCount}</strong> Published / {posts.length} Total
            </span>
            <button
              onClick={() => startEdit(null)}
              className="admin-btn-primary inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" /> New Article
            </button>
          </div>
        )}
      </div>

      {!isEditing && (
        <div className="admin-metrics-grid shrink-0">
          {[
            { label: 'Total Articles', value: posts.length, trend: 'SEO organic content', trendColor: '#2563eb', iconBg: '#eff6ff', iconColor: '#2563eb', Icon: Newspaper },
            { label: 'Published Live', value: publishedCount, trend: posts.length > 0 ? `${Math.round((publishedCount / posts.length) * 100)}% live online` : '0%', trendColor: '#059669', iconBg: '#ecfdf5', iconColor: '#059669', Icon: CheckCircle2 },
            { label: 'Draft Content', value: posts.filter(p => p.status === 'DRAFT' || !p.status).length, trend: 'Work-in-progress', trendColor: '#ea580c', iconBg: '#fff7ed', iconColor: '#ea580c', Icon: Edit3 },
            { label: 'Featured Media', value: posts.filter(p => p.cover_image).length, trend: `${posts.filter(p => p.cover_image).length} with cover`, trendColor: '#7c3aed', iconBg: '#f5f3ff', iconColor: '#7c3aed', Icon: ImageIcon },
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
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading articles...</p>
              </div>
            </div>
          ) : posts.length > 0 ? (
            <div className="blog-posts-grid">
              {posts.map(post => (
                <div key={post.id} className="blog-post-card">
                  {/* Cover Image */}
                  <div className="blog-card-cover">
                    {post.cover_image ? (
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        className="blog-card-cover-img"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="blog-card-placeholder">
                        <Newspaper className="h-10 w-10 opacity-30" />
                        <span>No cover image</span>
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <span
                      className={`blog-status-badge ${post.status === 'PUBLISHED' ? 'published' : 'draft'}`}
                    >
                      <span className="blog-status-badge-dot"></span>
                      {post.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="blog-card-body">
                    <div className="blog-card-header">
                      <h3 className="blog-card-title" title={post.title}>
                        {post.title}
                      </h3>
                      <div className="blog-card-actions">
                        <button 
                          onClick={() => startEdit(post)} 
                          className="blog-card-action-btn edit" 
                          title="Edit Post"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button 
                          onClick={() => handleDelete(post.id)} 
                          className="blog-card-action-btn delete" 
                          title="Delete Post"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {post.excerpt ? (
                      <p className="blog-card-excerpt">
                        {post.excerpt}
                      </p>
                    ) : (
                      <p className="blog-card-excerpt is-empty">
                        No excerpt provided.
                      </p>
                    )}

                    <div className="blog-card-footer">
                      <span className="blog-card-author" title={post.author || 'Editorial Team'}>
                        <User size={13} className="blog-card-icon" />
                        <span>{post.author || 'Editorial Team'}</span>
                      </span>
                      <span className="blog-card-date">
                        <Calendar size={13} className="blog-card-icon" />
                        <span>{formatDate(post.created_at)}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-white border border-slate-200 rounded-2xl border-dashed">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Newspaper className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">No blog posts found</p>
              <p className="text-xs text-slate-400 mt-1">Click "New Article" above to author your first franchise marketing post.</p>
            </div>
          )}
        </>
      ) : (
        /* Executive Blog Post Editor */
        <div className="blog-editor-card">
          <div className="blog-editor-header">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Newspaper className="w-5 h-5 text-emerald-600" />
              </span>
              <div>
                <h2 className="blog-editor-title">
                  {editingPost.id ? 'Edit Blog Post' : 'Create New Article'}
                </h2>
                <p className="blog-editor-subtext">
                  Author SEO-friendly articles formatted with rich markdown.
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => { setIsEditing(false); setEditingPost(null); setShowPreview(false); }} 
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              title="Close"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSavePost} className="flex flex-col gap-6">
            {/* Prominent Publish Bar */}
            <div className={`blog-publish-bar ${editingPost.status === 'PUBLISHED' ? 'is-published' : ''}`}>
              <div className="blog-publish-status">
                <span className={`blog-publish-indicator ${editingPost.status === 'PUBLISHED' ? 'published' : 'draft'}`}></span>
                <div>
                  <p className="blog-publish-title">
                    {editingPost.status === 'PUBLISHED' ? 'Article is LIVE on the website' : 'Article is a private Draft'}
                  </p>
                  <p className="blog-publish-sub">
                    {editingPost.status === 'PUBLISHED'
                      ? 'Anyone can view this article on /blog right now.'
                      : 'Only you can see this. Toggle to Publish and it will appear on /blog.'}
                  </p>
                </div>
              </div>
              <div className="blog-publish-actions">
                <div
                  className="blog-toggle-wrapper"
                  onClick={() => setEditingPost({ ...editingPost, status: editingPost.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' })}
                >
                  <div
                    className={`blog-toggle-track ${editingPost.status === 'PUBLISHED' ? 'is-published' : ''}`}
                    role="switch"
                    aria-checked={editingPost.status === 'PUBLISHED'}
                  >
                    <div className="blog-toggle-thumb" />
                  </div>
                  <span className="blog-toggle-label">
                    {editingPost.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                  </span>
                </div>
                <button
                  type="submit"
                  className="admin-btn-primary inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  {editingPost.status === 'PUBLISHED' ? (
                    <><CheckCircle2 className="h-4 w-4" /> Save & Publish</>
                  ) : (
                    <><Save className="h-4 w-4" /> Save as Draft</>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="blog-form-label">
                <span>Article Headline / Title</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Why Mini-Supermarket Franchises Are Booming in 2026"
                value={editingPost.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setEditingPost({
                    ...editingPost,
                    title,
                    slug: editingPost.id ? editingPost.slug : slugify(title)
                  });
                }}
                className="blog-form-input font-bold text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="blog-form-label">
                  <span>URL Slug</span>
                </label>
                <div className="blog-slug-container">
                  <span className="blog-slug-prefix">/blog/</span>
                  <input
                    type="text"
                    required
                    placeholder="mini-supermarket-franchise-2026"
                    value={editingPost.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className="blog-slug-input"
                  />
                </div>
              </div>

              <div>
                <label className="blog-form-label">
                  <span>Author Name</span>
                </label>
                <div className="blog-input-wrapper">
                  <span className="blog-input-icon">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. Convenio Mart Franchise Team"
                    value={editingPost.author}
                    onChange={(e) => setEditingPost({ ...editingPost, author: e.target.value })}
                    className="blog-form-input has-icon"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="blog-form-label">
                <span>Short Excerpt / Meta Description</span>
              </label>
              <textarea
                rows={2}
                placeholder="A compelling 1-2 sentence teaser shown on the blog index cards and search results."
                value={editingPost.excerpt}
                onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                className="blog-form-textarea"
              />
            </div>

            <div>
              <label className="blog-form-label">
                <span>Cover Image</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="blog-input-wrapper flex-1">
                  <span className="blog-input-icon">
                    <ImageIcon size={16} />
                  </span>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-... or upload below"
                    value={editingPost.cover_image}
                    onChange={(e) => setEditingPost({ ...editingPost, cover_image: e.target.value })}
                    className="blog-form-input has-icon"
                  />
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleCoverImageUpload}
                  />
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={isCoverUploading}
                    className="blog-upload-btn"
                  >
                    <UploadCloud className="h-4 w-4" />
                    {isCoverUploading ? 'Uploading...' : 'Upload Image'}
                  </button>
                  {editingPost.cover_image && (
                    <div className="w-16 h-11 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100 shadow-xs">
                      <img src={editingPost.cover_image} alt="Preview" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="blog-markdown-toolbar">
                <div className="blog-markdown-hints">
                  <span className="blog-editor-mode-seg">
                    <button
                      type="button"
                      onClick={() => setEditorMode('rich')}
                      className={editorMode === 'rich' ? 'is-active' : ''}
                      title="Rich text editor with formatting toolbar"
                    >
                      <PenLine className="w-3.5 h-3.5" /> Rich Text
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorMode('markdown')}
                      className={editorMode === 'markdown' ? 'is-active' : ''}
                      title="Plain markdown editor (supports tables)"
                    >
                      <AlignLeft className="w-3.5 h-3.5" /> Markdown
                    </button>
                  </span>
                  {editorMode === 'markdown' && (
                    <span className="text-[11.5px] font-bold text-slate-600 mr-1 flex items-center gap-1">
                      <Code className="w-3.5 h-3.5 text-primary" /> Markdown Formatting:
                    </span>
                  )}
                  {editorMode === 'markdown' && (
                    <>
                      <span className="blog-markdown-pill">## H2</span>
                      <span className="blog-markdown-pill">### H3</span>
                      <span className="blog-markdown-pill">**bold**</span>
                      <span className="blog-markdown-pill">*italic*</span>
                      <span className="blog-markdown-pill">- list</span>
                      <span className="blog-markdown-pill">| table |</span>
                      <span className="blog-markdown-pill">Paste from Excel auto-converts</span>
                    </>
                  )}
                </div>

                {editorMode === 'markdown' && (
                  <button
                    type="button"
                    onClick={handleInsertTable}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0"
                    title="Insert a markdown table"
                  >
                    <Table className="h-3.5 w-3.5" />
                    Table
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => contentInputRef.current?.click()}
                  disabled={isContentUploading}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0"
                  title="Upload an image and insert it into the article"
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                  {isContentUploading ? 'Uploading...' : 'Insert Image'}
                  <input
                    ref={contentInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleContentImageUpload}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0"
                >
                  <Eye className="h-3.5 w-3.5" />
                  {showPreview ? 'Back to Editor' : 'Live Preview'}
                </button>
              </div>

              {showPreview ? (
                <div className="blog-preview-container">
                  {editingPost.content ? (
                    <div className="ql-container ql-snow">
                      {looksLikeHtml(editingPost.content) ? (
                        <div
                          className="ql-editor blog-preview-body"
                          dangerouslySetInnerHTML={{ __html: normalizeContent(editingPost.content) }}
                        />
                      ) : (
                        <div className="ql-editor blog-preview-body">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                            {normalizeContent(editingPost.content)}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic p-6 text-center">No content written yet. Go back to the editor to compose.</p>
                  )}
                </div>
              ) : editorMode === 'rich' ? (
                <div className="admin-quill-wrapper blog-quill-wrapper">
                  <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    modules={quillModules}
                    formats={quillFormats}
                    value={editingPost.content}
                    onChange={(content) => setEditingPost({ ...editingPost, content })}
                    placeholder="Start writing your article here... Use the toolbar for headings, bullet lists, font sizes, and images."
                  />
                </div>
              ) : (
                <textarea
                  ref={markdownRef}
                  required
                  rows={12}
                  onPaste={handleMarkdownPaste}
                  placeholder={'## Introduction\n\nConvenio Mart offers an exceptional franchise opportunity...\n\n### Key Benefits\n- High ROI & 70% profit share\n- Complete supply chain & POS support\n- Captive customer base in gated apartments'}
                  value={editingPost.content}
                  onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                  className="blog-markdown-textarea"
                />
              )}
            </div>

            {/* Publication Status Toggle & Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-5 border-t border-slate-100">
              <div 
                className="blog-toggle-wrapper"
                onClick={() => setEditingPost({ ...editingPost, status: editingPost.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' })}
              >
                <div 
                  className={`blog-toggle-track ${editingPost.status === 'PUBLISHED' ? 'is-published' : ''}`}
                  role="switch"
                  aria-checked={editingPost.status === 'PUBLISHED'}
                >
                  <div className="blog-toggle-thumb" />
                </div>
                <span className="blog-toggle-label">
                  {editingPost.status === 'PUBLISHED' ? (
                    <span className="text-emerald-700 font-extrabold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Published (Live on Website)
                    </span>
                  ) : (
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-slate-400" /> Draft (Hidden from Public)
                    </span>
                  )}
                </span>
              </div>

              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => { setIsEditing(false); setEditingPost(null); setShowPreview(false); }}
                  className="admin-btn-outline flex-1 sm:flex-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn-primary flex-1 sm:flex-none inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save className="h-4 w-4" /> Save Article
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}