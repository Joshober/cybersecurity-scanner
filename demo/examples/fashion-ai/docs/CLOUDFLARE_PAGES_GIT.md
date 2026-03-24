# Cloudflare Pages: connect repo so pushes auto-deploy

Cloudflare **does not** support connecting a Git repository to Pages via the Wrangler CLI. You do it **once in the dashboard**; after that, every push to your production branch triggers a build and deploy.

## One-time setup in the dashboard

1. Open **[Workers & Pages → Connect to Git](https://dash.cloudflare.com/?to=/:account/workers-and-pages)** in the Cloudflare dashboard.

2. **Create application** → **Pages** → **Connect to Git**.

3. Sign in with **GitHub** (or GitLab) and authorize. Select the repository:
   - **Alvaromp3/fashion_ai**

4. **Set up builds and deployments**
   - **Project name**: `fashion-ai` (your site will be `https://fashion-ai.pages.dev`)
   - **Production branch**: `main` (or whatever you use)

5. **Build configuration** (this repo is a monorepo; the frontend lives in `frontend/`):
   - **Root directory (Advanced)** → Path: `frontend`
   - **Framework preset**: None (or Vite if available)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`

6. **Environment variables** (optional but recommended):  
   Add any `VITE_*` variables your frontend needs for production (e.g. `VITE_API_BASE_URL`, `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID`, `VITE_AUTH0_AUDIENCE`, `VITE_AUTH0_CALLBACK_URL`).  
   You can add them in the “Environment variables” section during setup, or later under **Settings → Environment variables** for the project.

7. Click **Save and Deploy**. The first build will run; later, every push to the production branch will trigger a new deploy.

## Existing Direct Upload project

You currently have a Pages project **fashion-ai** created via the CLI (Direct Upload, “Git Provider: No”). You have two options:

- **Option A – New Git project with same name**  
  When you “Connect to Git” and use project name `fashion-ai`, Cloudflare may create a new project. If the name is taken, create the Git project with the same name in an account where the old one can be removed, or temporarily use another name (e.g. `fashion-ai-git`), then delete the old Direct Upload project and, if you want, rename or recreate so the canonical URL is again `https://fashion-ai.pages.dev`.

- **Option B – Keep both**  
  Keep the Direct Upload project and create a second, Git-connected project with a different name. You’ll have two URLs; you can later delete the Direct Upload one and use only the Git-connected project.

## Verify from the CLI

After connecting in the dashboard, you can confirm the project is Git-connected:

```bash
npx wrangler pages project list
```

The **fashion-ai** project should show **Git Provider: GitHub** (or GitLab) instead of “No”.

## Useful links

- [Cloudflare Pages – Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/)
- [Build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/)
