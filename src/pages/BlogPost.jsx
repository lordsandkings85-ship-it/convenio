import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import SEO from '../components/SEO';
import { ArrowLeft, ArrowRight, Calendar, User, Tag } from 'lucide-react';
import { getBlogPostBySlug } from '../lib/api';
import './BlogPost.css';

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
};

const BlogPost = () => {
  const { slug } = useParams();
  const [result, setResult] = useState({ slug: null, post: null, notFound: false });

  const current = result.slug === slug ? result : { slug, post: null, notFound: false };
  const { post, notFound } = current;
  const isLoading = !post && !notFound;

  useEffect(() => {
    let mounted = true;
    getBlogPostBySlug(slug)
      .then((data) => {
        if (mounted) setResult({ slug, post: data, notFound: false });
      })
      .catch(() => {
        if (mounted) setResult({ slug, post: null, notFound: true });
      });
    return () => { mounted = false; };
  }, [slug]);

  if (isLoading) {
    return (
      <div className="blog-post-page">
        <div className="container text-center" style={{ padding: '6rem 0' }}>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="blog-post-page">
        <SEO title="Article Not Found" description="The blog article you are looking for could not be found." />
        <div className="container">
          <div className="blog-empty">
            <h2 style={{ marginBottom: '0.75rem' }}>Article Not Found</h2>
            <p style={{ marginBottom: '1.5rem' }}>The blog post you are looking for may have been removed or the link is incorrect.</p>
            <Link to="/blog" className="btn-primary">Back to Blog</Link>
          </div>
        </div>
      </div>
    );
  }

  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "image": post.cover_image,
    "datePublished": post.created_at,
    "dateModified": post.updated_at,
    "author": {
      "@type": "Organization",
      "name": post.author || "Convenio Mart"
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": typeof window !== 'undefined' ? window.location.href : ''
    }
  };

  return (
    <div className="blog-post-page">
      <SEO
        title={post.title}
        description={post.excerpt || `Read "${post.title}" on the Convenio Mart blog.`}
        keywords={`convenio mart ${post.title.toLowerCase()}`}
        schema={blogPostingSchema}
      />

      <div className="container">
        <article className="blog-post-article">
          <Link to="/blog" className="blog-post-back">
            <ArrowLeft size={16} /> Back to Blog
          </Link>

          <header className="blog-post-header">
            <h1>{post.title}</h1>
            <div className="blog-post-meta">
              <span><User size={15} /> {post.author || 'Convenio Mart Team'}</span>
              <span><Calendar size={15} /> {formatDate(post.created_at)}</span>
              <span><Tag size={15} /> Blog</span>
            </div>
            {post.excerpt && <p className="blog-post-excerpt">{post.excerpt}</p>}
          </header>

          {post.cover_image && (
            <div className="blog-post-cover">
              <img src={post.cover_image} alt={post.title} />
            </div>
          )}

          <div className="blog-post-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
              {post.content}
            </ReactMarkdown>
          </div>

          <div className="blog-post-footer">
            <Link to="/blog" className="btn-primary">
              Read More Articles <ArrowRight size={16} />
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
};

export default BlogPost;