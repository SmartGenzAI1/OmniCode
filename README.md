# OmniCode // Sovereign Public Codebase Meta-Forge

> The autonomous meta-forge indexing all public open-source software with sub-millisecond AST symbol search, polyglot algorithm comparator, and free cloud database synchronization.

---

## 🚀 1-Click Deploy on Vercel

OmniCode is configured for instant Vercel Serverless deployment with `@vercel/node` and dynamic edge routing.

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Deploy OmniCode to Vercel"
git remote add origin https://github.com/your-username/omnicode.git
git push -u origin main
```

### Step 2: Import on Vercel
1. Go to **[https://vercel.com/new](https://vercel.com/new)** and import your `omnicode` GitHub repo.
2. Under **Environment Variables**, add:
   ```env
   DATABASE_URL="postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```
   *(Get your free PostgreSQL database URL in 10 seconds at [neon.tech](https://neon.tech) with temp mail)*
3. Click **Deploy**!
4. OmniCode will deploy automatically on your free Vercel `.vercel.app` domain with SSL and auto-sync to Neon PostgreSQL on boot.

---

## ⚡ Key Capabilities

- **🔍 Global AST Symbol Search**: Search across thousands of codebases for functions, classes, structs, traits, and interfaces with instant line jumping in Code Studio.
- **🛡️ Static Security & Code Health Scan**: Instant maintainability index, cyclomatic complexity density, and SPDX license audit.
- **💾 Dual Storage Architecture**:
  - **Local Sovereign Engine**: Zero-setup Write-Ahead Log (WAL) + LSM partition chunks in `omni_data/`.
  - **Free Cloud Database Integration**: 1-click connect to Neon PostgreSQL, Supabase, or Render.
- **🌐 Automated Search Engine Indexing (Google / Bing / DuckDuckGo)**:
  - Dynamic **`/sitemap.xml`** with 2,300+ indexed codebases.
  - Pre-configured **`/robots.txt`** for maximum organic search traffic.
  - Embedded **Schema.org JSON-LD** for Google rich search snippets.
- **🎨 High-Density Developer UI/UX**: Carbon Slate HSL palette, dark theme, Grid & Dense List view modes, `⌘K` command palette, 100% clean SVG developer icons.

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start server
npm start
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 📄 License
MIT License - Open Source and Free for All Developers.
