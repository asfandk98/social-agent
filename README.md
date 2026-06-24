# ✈️ Travel Ad Studio

AI-powered social media post generator for travel agencies.
Staff enters deal details → AI writes captions + generates image → Staff approves → Posts to Facebook, Instagram, Twitter, TikTok.

## 100% Free Stack
| Tool | Purpose | Cost |
|------|---------|------|
| Google Gemini 1.5 Flash | AI copywriting | FREE (1500 req/day) |
| Pollinations.ai | Image generation | FREE (no signup) |
| Buffer | Multi-platform posting | FREE (3 channels) |
| Vercel | Hosting | FREE tier |

---

## Setup (15 minutes)

### Step 1 — Install dependencies
```bash
npm install
```

### Step 2 — Get your free API keys

**Gemini API Key (5 min)**
1. Go to https://aistudio.google.com/app/apikey
2. Sign in with Google
3. Click "Create API key"
4. Copy the key

**Buffer Access Token (10 min)**
1. Go to https://buffer.com and create a free account
2. Connect your social media accounts (Facebook, Instagram, Twitter)
3. Go to Settings → Apps & API
4. Click "Access Token" and copy it

### Step 3 — Set up environment variables
```bash
cp .env.example .env.local
# Edit .env.local and paste your keys
```

### Step 4 — Run the app
```bash
npm run dev
# Open http://localhost:3000
```

---

## How to use

1. Open the app and select a service type (Flight, Visa, Holiday, Insurance)
2. Fill in deal details (destination, price, dates, highlights)
3. Choose urgency level and language (English / Arabic / Both)
4. Select which platforms to post to
5. Click "Generate post"
6. Review the AI-generated captions and image
7. Edit any caption if needed
8. Optionally set a schedule time
9. Click "Approve & post" — done!

---

## Upgrade path (when you outgrow free tiers)

| Need | Solution | Cost |
|------|---------|------|
| More than 3 social channels | Buffer Essentials | $6/month |
| Better images | DALL-E 3 via OpenAI | ~$0.04/image |
| Claude for Arabic content | Anthropic API | Pay per use |
| Posting to TikTok | Ayrshare | $29/month |

---

## File structure
```
app/
  page.jsx              ← Staff input form
  preview/page.jsx      ← Approve & edit before posting
  api/
    generate/route.js   ← Calls Gemini to write captions
    post/route.js       ← Calls Buffer to publish posts
.env.example            ← Copy to .env.local
```
