import { Helmet } from 'react-helmet-async';

const APP_NAME = 'Quản lý Công văn';

export default function SEO({ title, description }) {
  const fullTitle = title ? `${title} | ${APP_NAME}` : APP_NAME;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
    </Helmet>
  );
}
