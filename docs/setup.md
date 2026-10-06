# Running locally

## Requirements

Use Node.js 22 and npm. Puppeteer installs a compatible Chrome browser on first installation. Internet is needed for dependency installation; the included demo itself does not need a database. On Linux, Chrome may need OS libraries; see the official [Puppeteer troubleshooting guide](https://pptr.dev/troubleshooting).

From the repository root:

```sh
npm ci
npm ci --prefix server
npm ci --prefix client
npm run demo
```

Visit http://localhost:5173. The server listens on loopback port 3001. Vite proxies `/api` to that server. Do not run the MongoDB server simultaneously.

The fictional offer is ready to edit or export. People contains the rooming-list workflow; Service Conf. contains service-confirmation versions. Changes disappear on server restart. A browser refresh alone does not reset them.

## Persistent MongoDB mode

Start your own local MongoDB service. Create `server/.env` from `server/.env.example`, keeping the dedicated `travel_portfolio_demo` database. Never point the seed at an operational database.

```sh
npm run seed
npm run dev
```

The seed refuses another database name and refuses nonempty collections. It does not delete records. Its insertion sequence is not transactional; if interrupted, use a new empty demo database after reviewing what happened. MongoDB mode persists changes across restarts.

`npm run build` creates the client bundle, but does not configure a production web server. A deployed server would need static hosting, SPA fallback, and an API reverse proxy, alongside authentication and the other controls in the architecture guide.

## PDF generation

Puppeteer normally uses its downloaded browser. The server also supports `PUPPETEER_EXECUTABLE_PATH`. On macOS it can locate installed Chrome or Brave. Do not assume Firefox-based executables are compatible. Both backends close the browser in a `finally` block.

Offline PDF generation deliberately blocks remote resources. Use the included image-free fixture or uploaded data images. Remote image resolution and remote images in the MongoDB mode require network access.

## Troubleshooting

- **Port in use:** stop the other demo/API process. If you change `PORT`, also change the Vite proxy in `client/vite.config.ts`.
- **Connection refused:** check the API terminal and `/api/health` in offline mode. In MongoDB mode, the server starts only after database connection.
- **Data disappeared:** offline memory resets on process restart. Use MongoDB mode for persistence.
- **Browser executable missing:** reinstall server dependencies without skipping Puppeteer's browser download, or set a compatible executable path.
- **PDF lacks remote images:** intentional in offline mode. Its renderer does not fetch remote resources.
- **Template blocks don't appear in the PDF:** template storage exists, but block-driven rendering is not implemented in the fixed-layout PDF generator.

## Verification commands

```sh
npm run build
npm test
```

The automated suite creates an isolated demo server on a free port. It never connects to MongoDB or your original project's data.
