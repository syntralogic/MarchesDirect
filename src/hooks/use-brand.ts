import { useEffect, useState } from 'react';
import { brandsApi, type ApiBrand } from '@/lib/apiClient';

// Resolves the current public brand (GET /api/brands/current) once and shares
// it across every mount via a module-level cache/in-flight promise, so the
// callback modal, appointment modal and contact page don't each fire their
// own request when they're all rendered together.
let cached: ApiBrand | null = null;
let inFlight: Promise<ApiBrand> | null = null;

function loadBrand(): Promise<ApiBrand> {
  if (cached) return Promise.resolve(cached);
  if (!inFlight) {
    inFlight = brandsApi.current().then((brand) => {
      cached = brand;
      inFlight = null;
      return brand;
    }).catch((err) => {
      inFlight = null;
      throw err;
    });
  }
  return inFlight;
}

export function useBrand() {
  const [brand, setBrand] = useState<ApiBrand | null>(cached);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (brand) return;
    let active = true;
    loadBrand()
      .then((b) => { if (active) setBrand(b); })
      .catch(() => { if (active) setError('Impossible de contacter le serveur.'); });
    return () => { active = false; };
  }, [brand]);

  return { brandId: brand?.id ?? null, error };
}
