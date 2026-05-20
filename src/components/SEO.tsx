import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  schema?: any;
}

const SEO: React.FC<SEOProps> = ({
  title = "UFR Collection | Luxury Women's Fashion Pakistan",
  description = "Discover premium Pakistani women's fashion at UFR Collection. Shop luxury pret, formal wear, party dresses, and bridal collections with exquisite craftsmanship.",
  keywords = "Pakistani fashion, luxury pret, formal wear, party dresses, bridal collection, UFR Collection, Pakistani designer wear",
  image = "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=1200",
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = 'website',
  schema
}) => {
  const siteName = "UFR Collection";
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD Schema */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
      
      {!schema && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "UFR Collection",
            "url": "https://ufrcollection.com",
            "logo": "https://ufrcollection.com/logo.png",
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "+92-300-1234567",
              "contactType": "customer service"
            }
          })}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
