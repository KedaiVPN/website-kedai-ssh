import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description?: string;
  canonical?: string;
  type?: string;
  name?: string;
  image?: string;
}

export const SEO = ({
  title,
  description,
  canonical,
  type = 'website',
  name = 'Kedai SSH',
  image
}: SEOProps) => {
  const siteTitle = 'Kedai SSH - Platform VPN Premium';
  const fullTitle = title === siteTitle ? title : `${title} | ${name}`;
  const defaultDescription = 'Platform premium untuk membuat akun VPN dengan protokol SSH, VMess, VLESS, dan Trojan. Nikmati akses internet aman dan cepat.';
  const metaDescription = description || defaultDescription;
  const defaultImage = 'https://lovable.dev/opengraph-image-p98pqg.png';
  const metaImage = image || defaultImage;

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{fullTitle}</title>
      <meta name='description' content={metaDescription} />
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:site_name" content={name} />

      {/* Twitter tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
    </Helmet>
  );
};
