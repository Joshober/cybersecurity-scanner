# Cloudflare account handoff — what to get from the account owner

When someone else owns the Cloudflare account (e.g. “the person’s” account) and **you** need to run the Wrangler CLI from your machine (deploy Pages, push env, create R2), they must give you two things.

**Only updating Pages?** You can keep your existing R2 bucket and credentials. Use the new account's token only for `cloudflare:pages-deploy` and `cloudflare:pages-env`; do not run `cloudflare:r2-create` or change any `R2_*` or backend Cloudflare env vars.

---

## 1. What you need from them

| What | Where they get it | You set it as |
|------|-------------------|----------------|
| **Account ID** | [Cloudflare Dashboard](https://dash.cloudflare.com) → any product (e.g. **Workers & Pages**) → the URL is `dash.cloudflare.com/<ACCOUNT_ID>/...`; or **Overview** shows “Account ID” | `CLOUDFLARE_ACCOUNT_ID` |
| **API token** | [API Tokens](https://dash.cloudflare.com/profile/api-tokens) → **Create Token** (see permissions below) → copy the token **once** (it’s shown only at creation) | `CLOUDFLARE_API_TOKEN` |

They should **not** log in on your machine. They create the token in **their** account and send you the **Account ID** and **API token** (e.g. in a secure channel).

---

## 2. API token permissions (they use when creating the token)

For this repo you use Wrangler to:

- Deploy **Pages** (`npm run cloudflare:pages-deploy`)
- Push **Pages env** (`npm run cloudflare:pages-env`)
- Create **R2** bucket (`npm run cloudflare:r2-create`)

So the token needs at least:

- **Account** → **Cloudflare Workers** → **Edit** (covers Workers and Pages)
- **Account** → **Cloudflare R2** → **Edit**

Optional (for R2 storage cap / analytics):

- **Account** → **Account Analytics** → **Read** (only if you use `CLOUDFLARE_API_TOKEN` in the backend for R2 usage checks)

**Template:** They can start from “Edit Cloudflare Workers” and add “Edit Cloudflare R2”, or use a custom token with the above.

---

## 3. How you use it (your machine)

**Option A — Environment variables (recommended)**

In your shell (or in a `.env` you load only when running Cloudflare commands):

```bash
export CLOUDFLARE_ACCOUNT_ID=their_account_id_here
export CLOUDFLARE_API_TOKEN=the_token_they_gave_you
```

Then from repo root:

```bash
npm run cloudflare:pages-deploy
# or
npm run cloudflare:pages-env
# or
npm run cloudflare:r2-create
```

**Option B — .env file**

Add to `backend/.env` (or a separate file you don’t commit):

```
CLOUDFLARE_ACCOUNT_ID=their_account_id_here
CLOUDFLARE_API_TOKEN=the_token_they_gave_you
```

If your scripts read `.env` from the backend (e.g. `cloudflare-pages-env.js`), they may pick these up. For deploy scripts that run from repo root, **export** them in the shell so Wrangler sees them.

---

## 4. Verify

```bash
npx wrangler whoami
```

Should show the **account ID** and email of the account that owns the token. If it shows their account, you’re using their key correctly.

---

## 5. Security

- They should create a token with **minimum permissions** (Workers + R2 Edit only).
- They can **revoke** the token anytime from [API Tokens](https://dash.cloudflare.com/profile/api-tokens).
- Don’t commit the token to git; use env vars or a secure secret store.
