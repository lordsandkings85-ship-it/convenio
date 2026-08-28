import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, keywords, schema }) => {
  const siteName = "Convenio Mart";
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  
  // Dynamically compute canonical link
  const canonicalUrl = typeof window !== 'undefined' 
    ? window.location.origin + window.location.pathname
    : '';

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={siteName} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />

      {/* Structured Schema Markup */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
