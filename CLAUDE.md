# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**桂乡生活 (Guixiang Life)** — a WeChat Mini Program serving as a Xianning (咸宁) town-life service platform, themed around osmanthus/gold (桂花金). It provides classified information and community features including food, travel, entertainment, lost & found, housing rental, part-time jobs, local dating/confessions, local stories, and a classified plaza.

Tech stack: WeChat Mini Program (native) + WeChat Cloud Functions + WeChat Cloud Database + WeChat Cloud Storage.

## Development Setup

- **IDE**: WeChat DevTools (微信开发者工具) — required to preview and debug
- **Cloud environment**: `cloud1-d4g6o6y529c3db4b2` (configured in `miniprogram/app.js`)
- **AppID**: `wxb69e7943c7c13395` (configured in `project.config.json`)
- **Miniprogram root**: `miniprogram/`
- **Cloud function root**: `cloudfunctions/`
- **SDK version**: 3.16.1

### Common Tasks

- **Build/Preview**: Open the project root in WeChat DevTools, which auto-compiles on save
- **Cloud function deployment**: Right-click a cloud function folder in WeChat DevTools → "Upload and deploy" (上传并部署)
- **Cloud function dependencies**: `cd cloudfunctions/<name> && npm install` (each cloud function has its own package.json)
- **Deploy order**: **common must be deployed first** — the other functions (`publish`, `confession`, `login`, `upload`) depend on its shared modules at runtime
- **The project has no tests, linters, or build scripts** — it's a native WeChat Mini Program with no extra toolchain

## Project Architecture

### Project Structure

```
.
├── cloudfunctions/               # WeChat Cloud Functions (serverless backend)
│   ├── common/                   # Shared module — deployed separately; others require `./response` and `./constants` from it
│   ├── login/                    # Get user openid/appid from WeChat
│   ├── publish/                  # Create posts (items/lost/found collections)
│   ├── confession/               # Create confession posts (confessions collection)
│   └── upload/                   # Upload images to cloud storage
├── miniprogram/                  # Mini Program frontend
│   ├── app.js                    # App entry — cloud init, global error handler, 404 redirect
│   ├── app.json                  # App config — pages, subPackages, tabBar, window (gold theme)
│   ├── app.wxss                  # Global styles — CSS custom properties design system
│   ├── images/                   # Static image assets (PNGs)
│   ├── styles/
│   │   └── shared.wxss           # Shared component styles (cards, buttons, states)
│   ├── components/               # Reusable components
│   │   ├── post-card/            # Card component — props: data, showDelete, showImages, type; events: tap, delete
│   │   ├── empty-state/          # Empty state — props: hint, showAction, actionText; events: action
│   │   ├── send-button/          # Floating publish button
│   │   ├── login-check/          # Login status verification
│   │   └── image-uploader/       # Image selection — props: maxCount, fileIDs; methods: chooseImage, removeImage
│   ├── pages/                    # Main package pages
│   │   ├── index/                # Home — greeting, search entry, carousel, 9-grid nav, feed
│   │   ├── plaza/                # Plaza/square — categorized multi-collection browse with covers
│   │   ├── mine/                 # User profile — avatar/nickname, post count stats, my posts
│   │   ├── detail/               # Unified detail view — info display, images, comments, contact
│   │   └── utils/
│   │       ├── db.js             # Database CRUD wrapper (getList, getDetail, removeItem, countWhere)
│   │       ├── auth.js           # Login check utility
│   │       ├── fetch.js          # Promise wrapper around wx.request (legacy, not widely used)
│   │       └── util.js           # Date formatting utility
│   ├── packageLife/              # Subpackage — Lifestyle
│   ├── packageFun/               # Subpackage — Fun & Interest
│   ├── packageService/           # Subpackage — Services
│   └── packageSocial/            # Subpackage — Social
└── project.config.json           # WeChat DevTools project config
```

### Subpackage Configuration

Defined in `app.json` — 4 subpackages for code splitting:

| Subpackage | Root | Pages | Purpose |
|---|---|---|---|
| packageLife | `packageLife/` | lost, jobs, food, travel, rent | Lifestyle services |
| packageFun | `packageFun/` | search, entertainment, story | Fun & culture |
| packageService | `packageService/` | services, publish | Utilities & posting |
| packageSocial | `packageSocial/` | dating | Social features |

### Navigation & Tab Bar

Three bottom tabs:
- **首页** (Home) → `pages/index/index`
- **广场** (Plaza) → `pages/plaza/plaza`
- **我的** (Mine) → `pages/mine/mine`

### Cloud Function API — Response Format & Conventions

All cloud functions return `{ code: 0, data: ... }` on success or `{ code: -1, error: "..." }` on failure, produced by the `wrap(handler)` helper in `cloudfunctions/common/response.js`. The wrap function automatically catches errors and provides `wxContext` (OPENID, APPID, etc.) to the handler.

```
exports.main = async (event, context) => {
  return await wrap(async (wxContext) => {
    // wxContext.OPENID, wxContext.APPID, wxContext.ENV available here
    return await db.collection(event.room).add({ data: { ... } })
  })
}
```

### Cross-Cutting: Collection Name Mapping

The most error-prone pattern in the codebase is the multi-layered name mapping between URL params, database collections, and display labels. **When adding a new feature type, all of these must be updated in sync:**

1. **`publish` page** (`packageService/publish/publish.js`): URL param `name` → DB collection:
   - `lostlost` → `lost` collection
   - `lostfound` → `found` collection
   - anything else → `items` collection

2. **`plaza` page** (`pages/plaza/plaza.js`): Three parallel maps:
   - `TYPE_COLLECTION`: UI key (`xianzhi`, `zufang`, `jianzhi`, `biaobai`, `amusement`) → DB collection name
   - `TYPE_DETAIL_NAME`: UI key → detail page `name` URL param
   - `TYPE_LABEL_COLORS`: UI key → hex color

3. **`detail` page** (`pages/detail/detail.js`): `COLLECTION_MAP` — URL `name` param → `{ collection, title }`. Handles aliases: both `xianzhi` and `items` map to `items` collection, both `work` and `jobs` map to `jobs`, etc.

4. **`mine` page** (`pages/mine/mine.js`): `USER_COLLECTIONS` array — each entry has `name` (collection), `label`, and `titleKey` (which field to display as the post title, e.g., `'name'`, `'to'`, `'gangwei'`, `'title'`).

5. **Search page** (`packageFun/search/search.js`): `COLLECTIONS` array — each entry specifies which `fields` to regex-search per collection.

6. **Home feed** (`pages/index/index.js`): Hardcoded `collections` array with `name` and `label` — adds `_col` tag for detail page routing.

### Database Collection Field Conventions

All collections share these common fields:
- `_openid` — owner's WeChat openid (auto-set by cloud functions or manually)
- `createTime` — creation timestamp (used for sorting across all lists)
- `sendTime` — formatted display time string
- `pName`, `pCall`, `pWechat` — contact info (name, phone, WeChat)
- `name` — item/service title (not all collections use this; see titleKey variations below)

Collection-specific display title fields (used by mine.js `titleKey`):
| Collection | Title field | Description |
|---|---|---|
| `items` | `name` | Item name |
| `lost`/`found` | `name` | Item name |
| `confessions` | `to` | Target/recipient of confession |
| `jobs` | `gangwei` | Job position title |
| `food` | `name` | Food name |
| `travel` | `name` | Travel title |
| `entertainment` | `name` | Event/activity name |
| `rentals` | `title` | Rental listing title |
| `story` | `title` | Story title |

### Two Publish Patterns

1. **Image-based** (`packageService/publish/publish.js` → `publish` cloud function): Used for `items`, `lost`, `found`. Flow: pick images → `wx.cloud.uploadFile` to cloud storage (collects `fileIDs`) → call `publish` cloud function with all fields → DB insert. Images are uploaded with timestamp-based cloud paths: `Date.now() + suffix`.

2. **Modal inline** (food, travel, rent, story, entertainment, dating pages): No images. Opens an inline modal form → `db.collection.add()` directly from the frontend (no cloud function). Uses `wx.cloud.database()` directly, not the `db.js` wrapper.

### Key Patterns

- **Database queries**: Use `pages/utils/db.js` wrappers (`getList`, `getDetail`, `removeItem`, `countWhere`) instead of raw `wx.cloud.database()` calls (exceptions: mine.js counts via `.count()`, modal posting pages via `.add()`)
- **Login check**: `auth.checkLogin()` from `pages/utils/auth.js` — reads `wx.getStorage({key: 'login'})`, returns Promise<boolean>, shows toast if not logged in
- **Login flow**: `pages/mine/mine.js` calls `login` cloud function → stores `openid` in `wx.setStorage({key: 'openid'})`. The response follows the cloud function API format: `result.code === 0` indicates success.
- **User info storage**: `wx.setStorage({key: 'userInfo', data: {nickName, avatarUrl}})` and `wx.setStorage({key: 'login', data: true})`
- **Owner check**: Compare `openid === item._openid` to conditionally show delete buttons
- **Cross-page data passing**: Uses `wx.setStorage`/`wx.getStorage` (keys: `'info'`, `'openid'`, `'userInfo'`, `'login'`) and URL query params for navigation
- **Detail page**: `pages/detail/detail?name=<type>&id=<docId>` — unified view with info, images, contact copy buttons, comments. The `name` param maps through `COLLECTION_MAP`.
- **Comment system**: Posts to `comments` collection with `postCollection` and `postId` fields
- **Search**: `packageFun/search/search` — multi-collection regex search with 300ms debounce via `db.RegExp()`. Searches 5 collections (items, lost, found, jobs, confessions) across collection-specific fields.
- **FAB pattern**: Most list pages have a floating action button for quick posting
- **Modal posting**: food, travel, rent, story, entertainment, dating use inline modal forms (not separate pages)
- **`_col` convention**: When rendering posts from multiple collections in a single list (home feed, plaza, mine), each item gets a `_col` tag with the collection name, used for detail page routing
- **Design system**: CSS custom properties in `app.wxss` define gold/osmanthus theme (`--primary: #E8A33D`, `--gold: #F5A623`, etc.); each page has isolated styles
- **Pagination**: All list pages use `page`/`pageSize`/`hasMore` pattern with `onReachBottom` infinite scroll; `page` starts at 0, increments after each successful load
- **Error handling**: `app.js` has global `onError` handler with user-friendly toast; each page has local `loadError` state shown via `empty-state` component
- **Localization**: UI copy uses Xianning (咸宁) local dialect: "删哒" (deleted), "冇得" (none/nope), "桂花信使迷路了" (osmanthus messenger is lost — error message)
