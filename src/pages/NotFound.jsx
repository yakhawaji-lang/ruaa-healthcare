import { Link } from 'react-router-dom';
import { useLang } from '../i18n.jsx';

export default function NotFound() {
  const { t } = useLang();
  return (
    <div className="container section center notfound">
      <h1>404</h1>
      <p>{t('page_not_found')}</p>
      <Link to="/" className="btn btn-primary">{t('nav_home')}</Link>
    </div>
  );
}
