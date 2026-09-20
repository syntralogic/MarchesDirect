import { createPortal } from 'react-dom';
import { X, PlayCircle, Clock } from 'lucide-react';

// Client brief (10-image spec): a visible "Voir la démo — 40 sec" button on
// the first mobile screen, next to "Guide d'utilisation". VITE_DEMO_VIDEO_URL
// still lets an external host (Vimeo/YouTube/CDN) override this with a
// single env var and no code change, but the client has since provided the
// actual video - bundled at public/demo.mp4 (compressed from the original
// 8.6 MB WhatsApp export to ~2.4 MB, H.264/AAC, faststart for streaming) so
// there's a real default instead of the "coming soon" placeholder.
const DEMO_VIDEO_URL = (import.meta.env.VITE_DEMO_VIDEO_URL as string | undefined) || '/demo.mp4';

const toEmbedUrl = (url: string): string => {
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([\w-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return url; // direct .mp4 or already-an-embed URL
};

export default function DemoVideoModal({ open, onClose, videoUrl, title }: { open: boolean; onClose: () => void; videoUrl?: string; title?: string }) {
  if (!open) return null;
  const url = videoUrl !== undefined ? videoUrl : DEMO_VIDEO_URL;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xs sm:max-w-sm bg-[#061D32] border border-[#17334D] rounded-2xl overflow-hidden">
        <button onClick={onClose} aria-label="Fermer" className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors">
          <X size={16} />
        </button>

        {url ? (
          url.endsWith('.mp4') ? (
            // The bundled demo.mp4 is a portrait screen recording
            // (478x850, ~9:16) - forcing it into a 16:9 aspect-video box
            // (the embed case below) pillarboxed it down to a small strip
            // with large black bars on either side. Sized to the actual
            // clip's aspect ratio and capped by viewport height instead, so
            // it fills the modal properly on a phone.
            <div className="aspect-[478/850] max-h-[80vh] mx-auto bg-black">
              <video src={url} controls autoPlay className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="aspect-video bg-black">
              <iframe
                src={toEmbedUrl(url)}
                className="w-full h-full"
                allow="autoplay; fullscreen"
                allowFullScreen
                title={title || "Démo Marchés Direct"}
              />
            </div>
          )
        ) : (
          <div className="aspect-video flex flex-col items-center justify-center gap-3 p-6 text-center">
            <PlayCircle size={40} className="text-orange/60" />
            <p className="text-sm font-semibold text-white">{title ? `${title} — vidéo bientôt disponible` : 'Vidéo de démonstration bientôt disponible'}</p>
            <p className="text-xs text-[#B9BBC8] flex items-center gap-1.5">
              <Clock size={12} /> En attendant, découvrez le fonctionnement dans le guide d'utilisation.
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
