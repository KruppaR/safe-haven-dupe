import { cp, rm, mkdir, writeFile } from "fs/promises";
import { execSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const OUT = `${root}/.vercel/output`;

// Clean previous output
await rm(OUT, { recursive: true, force: true });
await mkdir(`${OUT}/static`, { recursive: true });
await mkdir(`${OUT}/functions/ssr.func`, { recursive: true });

// Static assets → .vercel/output/static/
await cp(`${root}/dist/client`, `${OUT}/static`, { recursive: true });

// Bundle server into a single self-contained ESM file
execSync(
  [
    `node_modules/.bin/esbuild`,
    `dist/server/server.js`,
    `--bundle`,
    `--platform=node`,
    `--target=node20`,
    `--format=esm`,
    `--outfile=${OUT}/functions/ssr.func/handler.js`,
    `--conditions=node,import,default`,
    `--external:"node:*"`,
    `--log-level=warning`,
  ].join(" "),
  { stdio: "inherit", cwd: root },
);

// Vercel Node.js function wrapper — converts Node req/res to WinterCG fetch
await writeFile(
  `${OUT}/functions/ssr.func/index.js`,
  `
import handler from './handler.js';

export default async function(req, res) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const url = new URL(req.url, proto + '://' + host);

  let body;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await new Promise((resolve) => {
      const chunks = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  const webRequest = new Request(url.toString(), {
    method: req.method,
    headers: Object.entries(req.headers).filter(([, v]) => v != null),
    body: body && body.length > 0 ? body : undefined,
    duplex: 'half',
  });

  let webResponse;
  try {
    webResponse = await handler.fetch(webRequest);
  } catch (err) {
    console.error('SSR handler error:', err);
    res.statusCode = 500;
    res.setHeader('content-type', 'text/plain');
    res.end('Internal Server Error');
    return;
  }

  res.statusCode = webResponse.status;
  webResponse.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  const buf = await webResponse.arrayBuffer();
  res.end(Buffer.from(buf));
}
`.trimStart(),
);

// Function runtime config
await writeFile(
  `${OUT}/functions/ssr.func/.vc-config.json`,
  JSON.stringify(
    {
      runtime: "nodejs20.x",
      handler: "index.js",
      maxDuration: 30,
    },
    null,
    2,
  ),
);

// Vercel routing: static assets first, then SSR for everything else
await writeFile(
  `${OUT}/config.json`,
  JSON.stringify(
    {
      version: 3,
      routes: [
        // Cache static assets forever (content-hashed filenames)
        {
          src: "/assets/(.+)",
          headers: { "cache-control": "public, max-age=31536000, immutable" },
          continue: true,
        },
        // Serve static files that exist in .vercel/output/static/
        { handle: "filesystem" },
        // Everything else → SSR function
        { src: "/(.*)", dest: "/ssr" },
      ],
    },
    null,
    2,
  ),
);

console.log("✓ .vercel/output/ generated");
