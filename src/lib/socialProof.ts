// Social-proof figures shown on the "Votre dossier" screen (client mockup v13:
// "N entreprises accompagnées aujourd'hui" and "4,8/5 sur N avis artisans").
// There is no data source for them in the app, so they stay null (= hidden)
// until real, verifiable numbers are filled in here or wired to a backend
// stat. Never put an invented figure in this file.
export const SOCIAL_PROOF: {
  accompaniedToday: number | null;
  reviewsRating: number | null;
  reviewsCount: number | null;
} = {
  accompaniedToday: null,
  reviewsRating: null,
  reviewsCount: null,
};
