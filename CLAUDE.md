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
- **The project has no tests, linters, or build scripts** — it's a native WeChat Mini Program with no extra toolchain

## Project Architecture

### Project Structure

```
.
├── cloudfunctions/               # WeChat Cloud Functions (serverless backend)
│   ├── common/                   # Shared module (not a standalone function)
│   │   ├── constants.js          # Collection name whitelist
│   │   ├── index.js              # Re-exports
│   │   ├── response.js           # Unified success/error response helpers
│   │   └── package.json
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
│   │   ├── post-card/            # Card component for listing items
│   │   ├── empty-state/          # Empty state placeholder
│   │   ├── send-button/          # Floating publish button
│   │   ├── login-check/          # Login status verification
│   │   └── image-uploader/       # Image selection and preview
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
│   │   ├── lost/                 # Lost & found (dual-tab: lost/found swiper)
│   │   ├── jobs/                 # Part-time jobs
│   │   ├── food/                 # Food recommendations — inline modal posting
│   │   ├── travel/               # Travel guides — inline modal posting
│   │   └── rent/                 # Housing rental — inline modal posting
│   ├── packageFun/               # Subpackage — Fun & Interest
│   │   ├── search/               # Full-text search across collections
│   │   ├── entertainment/        # Entertainment/events — inline modal posting
│   │   └── story/                # Local stories — inline modal posting
│   ├── packageService/           # Subpackage — Services
│   │   ├── publish/              # Post submission form (images → upload → publish cloud function)
│   │   └── services/             # Convenience service directory
│   └── packageSocial/            # Subpackage — Social
│       └── dating/               # Dating/confessions — inline modal posting
└── project.config.json           # WeChat DevTools project config
```

### Subpackage Configuration

Defined in `app.json` - 4 subpackages for code splitting:

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

### Database Collections (10 + 1)

| Collection | Purpose | Posts via |
|---|---|---|
| `items` | Used/second-hand items (was `xianzhi`) | `publish` cloud function |
| `lost` | Lost items | `publish` cloud function |
| `found` | Found items | `publish` cloud function |
| `confessions` | Dating/confessions (was `biaobai`) | `confession` cloud function |
| `jobs` | Part-time jobs (was `jianzhi`) | Direct DB insert |
| `food` | Food recommendations | Direct DB insert |
| `travel` | Travel guides | Direct DB insert |
| `rentals` | Housing rental (was `zufang`) | Direct DB insert |
| `story` | Local stories | Direct DB insert |
| `entertainment` | Entertainment/events | Direct DB insert |
| `comments` | Post comments | Direct DB insert |

Each collection needs a descending index on `createTime` for paginated list queries. The VALID_COLLECTIONS whitelist is in `cloudfunctions/common/constants.js`.

### Key Patterns

- **Database queries**: Use `pages/utils/db.js` wrappers (`getList`, `getDetail`, `removeItem`, `countWhere`) instead of raw `wx.cloud.database()` calls (exceptions: mine.js counts, food/travel/rent/story/entertainment direct inserts)
- **Login check**: `auth.checkLogin()` from `pages/utils/auth.js` — returns Promise<boolean>, shows toast if not logged in
- **Login flow**: `pages/mine/mine.js` triggers `login` cloud function → stores `openid` in `wx.setStorage({key: 'openid'})`
- **User info storage**: `wx.setStorage({key: 'userInfo', data: {nickName, avatarUrl}})` and `wx.setStorage({key: 'login', data: true})`
- **Owner check**: Compare `openid === item._openid` to conditionally show delete buttons
- **Cross-page data passing**: Uses `wx.setStorage`/`wx.getStorage` (keys: `'info'`, `'openid'`, `'userInfo'`, `'login'`) and URL query params for navigation
- **Image upload flow**: Select images → `wx.cloud.uploadFile` directly (the old `img`/`upload` cloud function exists but current `publish.js` uses direct SDK upload) → collect fileIDs → submit with data
- **Detail page**: `pages/detail/detail?name=<type>&id=<docId>` — unified view with info, images, contact copy buttons, comments
- **Comment system**: Posts to `comments` collection with `postCollection` and `postId` fields
- **Search**: `packageFun/search/search` — multi-collection regex search with 300ms debounce
- **FAB pattern**: Most list pages have a floating action button for quick posting
- **Modal posting**: food, travel, rent, story, entertainment, dating use inline modal forms (not separate pages)
- **Design system**: CSS custom properties in `app.wxss` define gold/osmanthus theme; each page has isolated styles
- **Pagination**: All list pages use `page`/`pageSize`/`hasMore` pattern with `onReachBottom` infinite scroll
- **Error handling**: `app.js` has global `onError` handler with user-friendly toast
- **Localization**: UI copy uses Xianning (咸宁) local dialect expressions like "删哒", "冇得", "桂花信使迷路了"
