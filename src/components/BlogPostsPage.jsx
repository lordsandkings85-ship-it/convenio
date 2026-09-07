import { useState, useEffect } from 'react';
import { Plus, Save, Trash2, Edit2, X, Eye, Calendar, User, Image as ImageIcon, Newspaper, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getBlogPosts, saveBlogPost, deleteBlogPost } from '../lib/api';
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

const emptyPost = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  cover_image: '',
  author: '',
  status: 'DRAFT'
};

export default function BlogPostsPage() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const { showToast, showConfirm } = useDialog();

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
    try {
      await saveBlogPost(editingPost);
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
    setEditingPost(post ? { ...post } : { ...emptyPost, slug: '' });
    setShowPreview(false);
    setIsEditing(true);
  };

  const publishedCount = posts.filter(p => p.status === 'PUBLISHED').length;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto w-full">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Newspaper className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Blog & Articles CMS</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Write, optimize, and publish SEO content to drive franchise organic discovery.
          </p>
        </div>
        
        {!isEditing && (
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex text-xs font-bold text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <strong className="text-emerald-600 mr-1">{publishedCount}</strong> Published / {posts.length} Total
            </span>
            <button
              onClick={() => startEdit(null)}
              className="admin-btn-primary inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" /> New Post
            </button>
          </div>
        )}
      </div>

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {posts.map(post => (
                <div key={post.id} className="bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group card-lift">
                  {/* Cover Image */}
                  <div className="h-44 bg-slate-100 relative overflow-hidden">
                    {post.cover_image ? (
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-slate-400">
                        <Newspaper className="h-10 w-10 opacity-30 mb-1" />
                        <span className="text-[11px] font-bold text-slate-400">No cover image</span>
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <span
                      className={`absolute top-3 left-3 inline-flex items-center gap-1.5 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm backdrop-blur-md ${
                        post.status === 'PUBLISHED'
                          ? 'bg-emerald-500/90 text-white shadow-emerald-500/20'
                          : 'bg-amber-500/90 text-white shadow-amber-500/20'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                      {post.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="font-extrabold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          onClick={() => startEdit(post)} 
                          className="admin-icon-btn p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100" 
                          title="Edit Post"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(post.id)} 
                          className="admin-icon-btn p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50" 
                          title="Delete Post"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {post.excerpt && (
                      <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2 flex-1">
                        {post.excerpt}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mt-auto pt-3 border-t border-slate-100">
                      <span className="flex items-center gap-1.5 truncate max-w-[140px]">
                        <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{post.author || 'Editorial Team'}</span>
                      </span>
                      <span className="flex items-center gap-1.5 shrink-0">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {formatDate(post.created_at)}
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
              <p className="text-xs text-slate-400 mt-1">Click "New Post" above to write your first franchise marketing article.</p>
            </div>
          )}
        </>
      ) : (
        /* Blog Post Editor */
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/80 p-6">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-black text-slate-900">{editingPost.id ? 'Edit Blog Post' : 'Create New Article'}</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Author SEO-friendly articles formatted with rich markdown.</p>
            </div>
            <button 
              onClick={() => { setIsEditing(false); setEditingPost(null); setShowPreview(false); }} 
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSavePost} className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Article Headline / Title</label>
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
                className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-emerald-500 transition-all font-bold text-sm text-slate-900 shadow-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">URL Slug</label>
                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 px-3 shadow-sm focus-within:border-emerald-500 focus-within:bg-white transition-all">
                  <span className="text-xs font-bold text-slate-400 select-none mr-1">/blog/</span>
                  <input
                    type="text"
                    required
                    placeholder="mini-supermarket-franchise-2026"
                    value={editingPost.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className="w-full py-3 bg-transparent outline-none font-mono text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Author Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. Convenio Mart Franchise Team"
                    value={editingPost.author}
                    onChange={(e) => setEditingPost({ ...editingPost, author: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-3 pl-10 outline-none focus:border-emerald-500 transition-all font-semibold text-xs text-slate-800 shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Short Excerpt / Meta Description</label>
              <textarea
                rows={2}
                placeholder="A compelling 1-2 sentence teaser shown on the blog index cards and search results."
                value={editingPost.excerpt}
                onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-emerald-500 transition-all font-medium text-xs text-slate-800 shadow-sm leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Cover Image URL</label>
              <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                  <ImageIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={editingPost.cover_image}
                    onChange={(e) => setEditingPost({ ...editingPost, cover_image: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-3 pl-10 outline-none focus:border-emerald-500 transition-all font-medium text-xs text-slate-800 shadow-sm"
                  />
                </div>
                {editingPost.cover_image && (
                  <div className="w-16 h-11 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                    <img src={editingPost.cover_image} alt="Preview" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Article Body (Markdown Supported)
                </label>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                    showPreview 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'text-slate-600 bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  {showPreview ? 'Switch to Markdown Editor' : 'Live Preview'}
                </button>
              </div>

              {showPreview ? (
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 prose max-w-none text-xs text-slate-800 leading-relaxed min-h-[300px]">
                  {editingPost.content ? (
                    <ReactMarkdown>{editingPost.content}</ReactMarkdown>
                  ) : (
                    <p className="text-slate-400 italic">No content typed yet. Switch back to editor to begin.</p>
                  )}
                </div>
              ) : (
                <textarea
                  required
                  rows={14}
                  placeholder={'## Introduction\n\nConvenio Mart offers an exceptional franchise opportunity...\n\n### Key Benefits\n- High ROI\n- Complete supply chain support'}
                  value={editingPost.content}
                  onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-4 outline-none focus:border-emerald-500 transition-all font-mono text-xs text-slate-800 shadow-sm leading-relaxed"
                />
              )}
            </div>

            {/* Publication Status & Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-5 border-t border-slate-100">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <button
                  type="button"
                  onClick={() => setEditingPost({ ...editingPost, status: editingPost.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' })}
                  className={`w-12 h-6 rounded-full transition-colors flex items-center px-0.5 ${editingPost.status === 'PUBLISHED' ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'}`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                </button>
                <span className="text-xs font-bold text-slate-700">
                  {editingPost.status === 'PUBLISHED' ? (
                    <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Published (Live on Website)
                    </span>
                  ) : (
                    <span className="text-slate-500">Draft (Hidden from Public)</span>
                  )}
                </span>
              </label>

              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => { setIsEditing(false); setEditingPost(null); setShowPreview(false); }}
                  className="admin-btn-outline flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn-primary flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm"
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