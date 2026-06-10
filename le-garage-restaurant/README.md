# Le Garage Restaurant

Site statique de production pour `https://legaragerestaurant.ma/le-garage-restaurant/`.

## Local

Prerequis: Node.js 20 ou plus.

```bash
cd "/Users/salaheddinemimouni/Documents/New project/le-garage-restaurant"
cp .env.example .env.local
npm install
npm run dev
```

URL locale: `http://127.0.0.1:4321/le-garage-restaurant/`.

Si `npm` n'est pas disponible dans le terminal, les memes commandes existent via le runner local:

```bash
sh scripts/run.sh dev
sh scripts/run.sh check
sh scripts/run.sh build
sh scripts/run.sh preview
```

Commandes utiles:

```bash
npm run check
npm run build
npm run preview
```

`npm run preview` construit le dossier `public/` puis le sert comme Vercel.

## Production

Configuration Vercel recommandee:

- Project root: `le-garage-restaurant`
- Build command: `sh scripts/run.sh build`
- Output directory: `public`
- Install command: `npm install`

Variables a definir dans Vercel:

```bash
PUBLIC_SITE_URL=https://legaragerestaurant.ma
PUBLIC_BASE_PATH=/le-garage-restaurant
PUBLIC_RESERVATION_EMAIL=contact@legaragerestaurant.ma
PUBLIC_PHONE_E164=+212668608754
PUBLIC_PHONE_DISPLAY=+212 6 68 60 87 54
```

Deploiement:

```bash
npm run prod:preview
npm run prod:deploy
```

Le build genere:

- `public/le-garage-restaurant/index.html`
- `public/le-garage-restaurant/assets/`
- `public/robots.txt`
- `public/sitemap.xml`

Le formulaire de reservation ouvre un email pre-rempli vers `PUBLIC_RESERVATION_EMAIL`. Pour un CRM ou un module de reservation, remplacer ce fallback par un endpoint applicatif.
