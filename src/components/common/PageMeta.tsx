import { HelmetProvider, Helmet } from "react-helmet-async";
import { TooltipProvider } from "@/components/ui/tooltip";

// DEV-12: every page gets a canonical URL (current origin + path, query string
// dropped so filtered/sorted variants point to the one clean page) and can opt
// out of indexing with `noindex` (e.g. unknown routes, filtered search variants;
// a noindex page carries no canonical so the two signals never contradict).
const PageMeta = ({
  title,
  description,
  noindex = false,
}: {
  title: string;
  description: string;
  noindex?: boolean;
}) => {
  const canonical =
    typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}` : undefined;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {canonical && !noindex && <link rel="canonical" href={canonical} />}
      {noindex && <meta name="robots" content="noindex, follow" />}
    </Helmet>
  );
};

export const AppWrapper = ({ children }: { children: React.ReactNode }) => (
  <HelmetProvider>
    <TooltipProvider>
      {children}
    </TooltipProvider>
  </HelmetProvider>
);

export default PageMeta;
