# Marchés Direct 🚀

> **Votre prochaine opportunité commence ici.**
> Plateforme de mise en relation pour les marchés publics, appels d'offres privés et la sous-traitance.

Bienvenue dans le dépôt officiel de **Marchés Direct**. Ce projet est une application web moderne construite avec **React**, **TypeScript**, **Vite** et **Supabase**, conçue pour connecter les entreprises françaises aux opportunités de marchés publics et privés.

---

## 📁 Project Directory

```text
├── README.md                    # Documentation
├── components.json              # Component library configuration
├── index.html                   # Entry file
├── package.json                 # Package management
├── postcss.config.js            # PostCSS configuration
├── public                        # Static resources directory
│   ├── favicon.png              # Icon
│   └── images                   # Image resources
├── src                           # Source code directory
│   ├── App.tsx                   # Main Application Router
│   ├── components                # Reusable UI components
│   │   ├── Header.tsx            # Global Header
│   │   ├── Footer.tsx            # Global Footer
│   │   ├── BottomNav.tsx         # Mobile Bottom Navigation
│   │   ├── AppointmentModal.tsx   # RDV Modal
│   │   ├── CallbackModal.tsx     # Callback Modal
│   │   └── ...
│   ├── context                    # Context (State) Management
│   │   ├── LangContext.tsx        # FR/EN Translations
│   │   └── ThemeContext.tsx       # Dark/Light Mode
│   ├── db                         # Database configuration
│   ├── hooks                      # Common hooks
│   ├── index.css                  # Global styles (Tailwind)
│   ├── layout                     # Layout directory
│   ├── lib                        # Utility library
│   ├── main.tsx                   # React Entry point
│   ├── routes.tsx                 # Legacy Routing configuration
│   ├── pages                      # Pages directory
│   │   ├── HomePage.tsx
│   │   ├── AppelsPage.tsx
│   │   ├── MarchesPublicsPage.tsx
│   │   ├── SousTraitancePage.tsx
│   │   ├── InfoPage.tsx           # About / Team / How-it-works / FAQ / Contact
│   │   ├── TarifsPage.tsx
│   │   ├── RecherchePage.tsx
│   │   └── ...
│   ├── services                   # Database interaction
│   └── types                      # Type definitions
├── tsconfig.app.json              # TypeScript frontend config
├── tsconfig.json                  # TypeScript config
├── tsconfig.node.json             # TypeScript Node.js config
└── vite.config.ts                 # Vite configuration
```

---

## 🛠️ Tech Stack

* **Frontend:** [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Build Tool:** [Vite](https://vitejs.dev/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Icons:** [Lucide React](https://lucide.dev/)
* **Database & Auth:** [Supabase](https://supabase.com/)
* **Routing:** [React Router DOM](https://reactrouter.com/)

---

## 🚀 Getting Started

### Prerequisites

* Node.js ≥ 20
* npm ≥ 10

### Installation

1. **Clone the repository** or download the code package.
2. **Open the project** in your preferred IDE (VSCode recommended).
3. **Install dependencies:**

```bash
npm install
```

4. **Start the development server:**

```bash
npm run dev -- --host 127.0.0.1
```

If the above command fails, try:

```bash
npx vite --host 127.0.0.1
```

---

## 🌍 Internationalization (i18n)

The app supports **French (FR)** and **English (EN)** out-of-the-box.

All UI text is managed in:

```text
src/context/LangContext.tsx
```

Use the `useLang()` hook in any component:

```tsx
const { t } = useLang();

<p>{t('home')}</p>
```

---

## 🗺️ Routing Structure

The app uses one unified single-route architecture for informational pages to keep the bundle slim and maintainable.

| Path               | Component            | Description                                 |
| ------------------ | -------------------- | ------------------------------------------- |
| `/`                | `HomePage`           | Landing page                                |
| `/appels-doffres`  | `AppelsPage`         | Private tenders                             |
| `/marches-publics` | `MarchesPublicsPage` | Public contracts                            |
| `/sous-traitance`  | `SousTraitancePage`  | Subcontracting                              |
| `/recherche`       | `RecherchePage`      | Global search                               |
| `/tarifs`          | `TarifsPage`         | Pricing plans                               |
| `/zones`           | `ZonesPage`          | Geographic zones                            |
| `/info`            | `InfoPage`           | About / Team / How-it-works / FAQ / Contact |

> **Note:** The `InfoPage` uses the URL path (`/info?section=...` or dedicated sub-routes) to display the correct content section dynamically.

---

## 🎨 Theming & Styling

**Dark Mode** is enabled by default.

The application uses a deep navy palette:

* `#001326`
* `#061D32`

with a vibrant orange accent:

* `#FF6500`

Tailwind CSS classes are used throughout the application, with custom colors defined in `tailwind.config`.

---

## 🗄️ Backend (Supabase)

Configure your environment variables in a `.env` file to connect to Supabase:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Install the Supabase client if it is not already present:

```bash
npm install @supabase/supabase-js
```

---

## 📚 Learn More

* [Vite Documentation](https://vitejs.dev/)
* [React Documentation](https://react.dev/)
* [Supabase Documentation](https://supabase.com/docs)
* [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## 📄 License

© 2026 MarchésDirect. All rights reserved.
