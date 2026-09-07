import { useState, useEffect } from 'react';
import { Plus, Save, Trash2, Edit2, X, Eye, Calendar, User, Image as ImageIcon, Newspaper } from 'lucide-react';
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

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#0b1120', letterSpacing: '-0.02em', lineHeight: 1.2 }}>Blog Posts</div>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginTop: '4px' }}>Write and publish articles that appear on the public blog page.</div>
        </div>
        {!isEditing && (
          <button
            onClick={() => startEdit(null)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-[#b8151d] hover:shadow-lg hover:shadow-primary/20 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 shadow-md w-full sm:w-auto shrink-0 active:scale-95 btn-press"
          >
            <Plus className="h-4 w-4" /> New Post
          </button>
        )}
      </div>

      {!isEditing ? (
        <>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="loading-spinner"></div>
            </div>
          ) : posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {posts.map(post => (
                <div key={post.id} className="bg-white border border-borderMuted/60 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col card-base card-lift overflow-hidden">
                  <div className="h-40 bg-surface relative overflow-hidden">
                    {post.cover_image ? (
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface to-borderMuted/40">
                        <Newspaper className="h-10 w-10 text-inkLight/30" />
                      </div>
                    )}
                    <span
                      className={`absolute top-3 left-3 inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border shadow-sm ${
                        post.status === 'PUBLISHED'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}
                    >
                      {post.status === 'PUBLISHED' ? <Eye className="h-3 w-3" /> : <Plus className="h-3 w-3 rotate-45" />}
                      {post.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div style={{ fontWeight: '700', color: '#0b1120', fontSize: '15px', lineHeight: 1.35 }}>{post.title}</div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => startEdit(post)} className="p-2 hover:bg-borderMuted text-inkLight/70 hover:text-inkLight rounded-lg transition-colors" title="Edit">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(post.id)} className="p-2 hover:bg-primary/10 text-inkLight/70 hover:text-primary rounded-lg transition-colors" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {post.excerpt && (
                      <p className="text-sm text-inkLight leading-relaxed mb-4 line-clamp-2 flex-1">{post.excerpt}</p>
                    )}

                    <div className="flex items-center gap-4 text-[11px] font-semibold text-inkLight/70 mt-auto pt-3 border-t border-borderMuted/60">
                      {post.author && (
                        <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {post.author}</span>
                      )}
                      <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {formatDate(post.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center bg-white border border-borderMuted rounded-2xl border-dashed">
              <Newspaper className="h-10 w-10 mx-auto mb-3 text-inkLight/30" />
              <p className="text-inkLight font-medium">No blog posts yet. Click "New Post" to create your first article!</p>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-2xl shadow-elevated border border-borderMuted/40 p-6 anim-scale-in">
          <div className="flex justify-between items-center mb-6 border-b border-borderMuted/60 pb-4">
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#0b1120' }}>{editingPost.id ? 'Edit Post' : 'New Post'}</div>
            <button onClick={() => { setIsEditing(false); setEditingPost(null); setShowPreview(false); }} className="p-2 text-inkLight/60 hover:text-inkLight hover:bg-surface rounded-full transition-all duration-200">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSavePost} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-bold text-ink mb-1.5">Title</label>
              <input
                type="text"
                required
                placeholder="e.g., Why a Mini-Supermarket Franchise Makes Sense in 2026"
                value={editingPost.title}
                onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                className="w-full border border-borderMuted rounded-xl p-3 outline-none focus:border-primary transition-colors font-medium text-ink"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-ink mb-1.5">Slug / URL</label>
                <div className="flex items-center">
                  <span className="text-sm text-inkLight/60 font-medium mr-2 whitespace-nowrap">/blog/</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g., mini-supermarket-franchise-2026"
                    value={editingPost.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className="w-full border border-borderMuted rounded-xl p-3 outline-none focus:border-primary transition-colors font-medium text-ink"
                  />
                </div>
                <p className="text-xs text-inkLight mt-1.5">Auto-generated from the title. Use only lowercase letters, numbers, and hyphens.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-ink mb-1.5">Author</label>
                <input
                  type="text"
                  placeholder="e.g., Convenio Mart Team"
                  value={editingPost.author}
                  onChange={(e) => setEditingPost({ ...editingPost, author: e.target.value })}
                  className="w-full border border-borderMuted rounded-xl p-3 outline-none focus:border-primary transition-colors font-medium text-ink"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-ink mb-1.5">Excerpt / Short Summary</label>
              <textarea
                rows={2}
                placeholder="A short teaser shown on the blog listing page and for SEO."
                value={editingPost.excerpt}
                onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                className="w-full border border-borderMuted rounded-xl p-3 outline-none focus:border-primary transition-colors font-medium text-ink"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-ink mb-1.5">Cover Image URL</label>
              <div className="flex items-center relative">
                <ImageIcon className="absolute left-3 h-5 w-5 text-inkLight/70" />
                <input
                  type="url"
                  placeholder="https://example.com/cover-image.jpg"
                  value={editingPost.cover_image}
                  onChange={(e) => setEditingPost({ ...editingPost, cover_image: e.target.value })}
                  className="w-full border border-borderMuted rounded-xl p-3 pl-10 outline-none focus:border-primary transition-colors font-medium text-ink"
                />
              </div>
              <p className="text-xs text-inkLight mt-1.5">Paste a hosted image URL. Shown as the post thumbnail on the blog listing page.</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-ink">Content (Markdown)</label>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${showPreview ? 'bg-primary/8 text-primary border-primary/30' : 'text-inkLight bg-surface border-borderMuted hover:bg-borderMuted/60'}`}
                >
                  <Eye className="h-3.5 w-3.5 inline-block mr-1" /> {showPreview ? 'Edit' : 'Preview'}
                </button>
              </div>
              {showPreview ? (
                <div className="bg-surface rounded-xl border border-borderMuted p-5 prose max-w-none">
                  {editingPost.content ? (
                    <ReactMarkdown>{editingPost.content}</ReactMarkdown>
                  ) : (
                    <p className="text-inkLight/60 italic">Nothing to preview yet — start writing below.</p>
                  )}
                </div>
              ) : (
                <textarea
                  required
                  rows={14}
                  placeholder={'# Heading&#10;&#10;Write your article in Markdown here...'}
                  value={editingPost.content}
                  onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                  className="w-full border border-borderMuted rounded-xl p-3 outline-none focus:border-primary transition-colors font-mono text-sm text-ink"
                />
              )}
            </div>

            <div className="flex items-center justify-between gap-4 pt-4 border-t border-borderMuted/60">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <button
                  type="button"
                  onClick={() => setEditingPost({ ...editingPost, status: editingPost.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' })}
                  style={{
                    width: '44px', height: '24px', borderRadius: '12px', padding: '2px',
                    background: editingPost.status === 'PUBLISHED' ? '#059669' : '#e2e8f0',
                    display: 'flex', alignItems: 'center',
                    justifyContent: editingPost.status === 'PUBLISHED' ? 'flex-end' : 'flex-start',
                    border: 'none', cursor: 'pointer', flexShrink: 0,
                    transition: 'all 0.3s ease',
                  }}
                >
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
                </button>
                <span className="text-sm font-bold text-ink">
                  {editingPost.status === 'PUBLISHED' ? 'Published — visible on the blog' : 'Draft — hidden from the blog'}
                </span>
              </label>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setIsEditing(false); setEditingPost(null); setShowPreview(false); }}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm text-inkLight bg-surface hover:bg-borderMuted/60 transition-all duration-200 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-gradient-to-r from-primary to-[#b8151d] hover:shadow-lg hover:shadow-primary/20 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 shadow-md active:scale-95 btn-press"
                >
                  <Save className="h-4 w-4" /> Save Post
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}