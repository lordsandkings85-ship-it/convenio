import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { Newspaper, User, ArrowRight } from 'lucide-react';
import { getBlogPosts } from '../lib/api';
import './Blog.css';

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
};

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getBlogPosts({ publishedOnly: true })
      .then((data) => {
        if (mounted) setPosts(data || []);
      })
      .catch((err) => console.error('Failed to load blog posts:', err))
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="blog-page">
      <SEO
        title="Blog"
        description="Insights, news and guides from Convenio Mart on retail, franchising and the mini-supermarket industry."
        keywords="convenio mart blog, supermarket franchise blog, retail insights, convenience store guide"
        schema={{ "@context": "https://schema.org", "@type": "Blog", "name": "Convenio Mart Blog", "url": typeof window !== 'undefined' ? window.location.href : '' }}
      />

      <div className="container">
        <div className="blog-header">
          <span className="blog-badge"><Newspaper size={14} /> Insights & News</span>
          <h1 className="blog-title">Blog</h1>
          <p className="blog-subtitle">
            Insights, guides and updates on retail, franchising and the convenience store industry from the Convenio Mart team.
          </p>
        </div>

        {isLoading ? (
          <div className="text-center" style={{ padding: '4rem 0' }}>
            <div className="loading-spinner"></div>
          </div>
        ) : posts.length > 0 ? (
          <div className="blog-grid">
            {posts.map((post) => (
              <Link key={post.id} to={`/blog/${post.slug}`} className="blog-card">
                <div className="blog-card-img">
                  {post.cover_image ? (
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      loading="lazy"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="blog-card-placeholder">
                      <Newspaper size={40} />
                    </div>
                  )}
                </div>
                <div className="blog-card-body">
                  <h2 className="blog-card-title">{post.title}</h2>
                  {post.excerpt && <p className="blog-card-excerpt">{post.excerpt}</p>}
                  <div className="blog-card-meta">
                    <span>{post.author ? <><User size={14} /> {post.author}</> : <span>Convenio Mart</span>}</span>
                    <span className="blog-card-date">{formatDate(post.created_at)}</span>
                    <span className="blog-card-read">Read <ArrowRight size={14} /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="blog-empty">
            <p>No articles published yet. Check back soon for fresh insights from Convenio Mart!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;