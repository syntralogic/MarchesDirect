import { Link } from "react-router-dom";
import PageMeta from "@/components/common/PageMeta";
import { useLang } from '@/contexts/LangContext';

// DEV-12: unknown URLs land here (instead of silently redirecting to the home
// page) with a noindex robots tag, so search engines don't index junk paths.
export default function NotFound() {
  const { t } = useLang();

  return (
    <>
      <PageMeta
        title={`${t('notFoundTitle') || "Page non trouvée"} | Marchés Direct`}
        description=""
        noindex
      />
      <div className="page-fade-in flex flex-col items-center justify-center text-center px-6 py-24 min-h-[60vh]">
        <p className="text-xs font-bold text-orange uppercase tracking-widest mb-3">404</p>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
          {t('notFoundTitle') || "Page non trouvée"}
        </h1>
        <p className="text-sm text-[#B9BBC8] max-w-md mb-8">
          {t('notFoundMessage') || "La page a peut-être été supprimée ou n'existe pas. Veuillez vérifier que l'URL est correcte."}
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-xl bg-orange px-5 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          {t('notFoundBack') || "Retour à l'accueil"}
        </Link>
      </div>
    </>
  );
}
