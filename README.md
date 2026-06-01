# 🏵️ 桂乡生活 — 咸宁本地生活服务平台

**桂乡生活** 是一款微信小程序，以 **桂花金** 为主色调，融合 **咸宁文化** 元素，专为咸宁（湖北）居民提供一站式本地生活服务。

涵盖闲置二手、失物招领、兼职招聘、房屋租售、美食推荐、旅游攻略、同城交友表白、家乡故事、休闲娱乐等便民功能。

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | 微信小程序原生框架（WXML + WXSS + JS/ES6） |
| 后端 | 微信云函数（Node.js，`wx-server-sdk`） |
| 数据库 | 微信云数据库（MongoDB-like） |
| 存储 | 微信云存储（图片资源） |
| 分包 | 微信小程序分包机制（4个子包） |
| SDK版本 | 3.16.1 |

## 设计系统

| 令牌 | 值 | 用途 |
| --- | --- | --- |
| `--primary` | `#E8A33D` | 品牌主色（桂花金） |
| `--primary-dark` | `#D4872B` | 主色加深 |
| `--primary-light` | `#FFF8E1` | 浅金背景 |
| `--gold` | `#F5A623` | 桂乡特色色 |
| `--shadow` | `0 4rpx 16rpx rgba(0,0,0,0.06)` | 卡片阴影（轻透） |

全局 CSS 变量定义在 `app.wxss` 中，各页面独立样式文件引用或扩展。

## 功能模块

| 模块 | 所在页面 | 状态 |
| --- | --- | --- |
| 🏠 首页（轮播 + 九宫格 + 动态流） | `pages/index/index` | ✅ 已完成 |
| 🛍️ 信息广场（多分类筛选 + 封面卡片） | `pages/plaza/plaza` | ✅ 已完成 |
| 👤 个人中心（头像/昵称 + 发布统计 + 帖子管理） | `pages/mine/mine` | ✅ 已完成 |
| 📝 发布信息（图片上传 + 表单） | `packageService/publish/publish` | ✅ 已完成 |
| 🔍 信息详情（信息 + 图片 + 联系方式 + 评论） | `pages/detail/detail` | ✅ 已完成 |
| 🔎 全文搜索（多集合搜索） | `packageFun/search/search` | ✅ 已完成 |
| 🏷️ 失物招领（失物/拾物双标签） | `packageLife/lost/lost` | ✅ 已完成 |
| 💼 兼职招聘 | `packageLife/jobs/jobs` | ✅ 已完成 |
| 💌 同城交友 / 表白墙（内联弹窗发布） | `packageSocial/dating/dating` | ✅ 已完成 |
| 📞 便民服务 | `packageService/services/services` | ✅ 已完成 |
| 🍜 佳肴美馔（内联弹窗发布） | `packageLife/food/food` | ✅ 已完成 |
| 🏔️ 锦绣河山 / 旅游攻略（内联弹窗发布） | `packageLife/travel/travel` | ✅ 已完成 |
| 🏡 房屋租售（内联弹窗发布） | `packageLife/rent/rent` | ✅ 已完成 |
| 📖 桂乡故事（内联弹窗发布） | `packageFun/story/story` | ✅ 已完成 |
| 🎬 观影吊嗓 / 娱乐活动（内联弹窗发布） | `packageFun/entertainment/entertainment` | ✅ 已完成 |

> 所有功能模块已开发完成，均为带完整发布/浏览/删除的实装页面，无占位页。

## 项目结构

```
├── cloudfunctions/                 # 微信云函数
│   ├── common/                     # 公共模块（常量白名单 + 响应工具）
│   ├── login/                      # 获取用户 openid
│   ├── publish/                    # 发布帖子（items/lost/found）
│   ├── confession/                 # 发布表白（confessions）
│   └── upload/                     # 上传图片到云存储
├── miniprogram/                    # 小程序前端
│   ├── app.js / app.json / app.wxss
│   ├── styles/shared.wxss          # 共享组件样式
│   ├── components/                 # 可复用组件
│   │   ├── post-card/              # 帖子卡片组件
│   │   ├── empty-state/            # 空状态组件
│   │   ├── send-button/            # 浮动发布按钮组件
│   │   ├── login-check/            # 登录验证组件
│   │   └── image-uploader/         # 图片选择上传组件
│   ├── pages/                      # 主包
│   │   ├── index/                  # 首页
│   │   ├── plaza/                  # 广场
│   │   ├── mine/                   # 我的
│   │   ├── detail/                 # 详情页（含评论区）
│   │   └── utils/                  # 工具库
│   ├── packageLife/                # 生活 · 分包
│   ├── packageFun/                 # 兴趣 · 分包
│   ├── packageService/             # 服务 · 分包
│   └── packageSocial/              # 社交 · 分包
└── project.config.json
```

## 开发环境

1. **IDE**: [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)（需稳定版）
2. **小程序 AppID**: `wxb69e7943c7c13395`
3. **云环境 ID**: `cloud1-d4g6o6y529c3db4b2`
4. **基础库**: 3.16.1

### 快速开始

```bash
# 1. 克隆仓库
git clone <repo-url>

# 2. 在微信开发者工具中打开项目根目录（会自动识别 miniprogram/ 和 cloudfunctions/）

# 3. 云函数部署（在工具中右键每个函数 → 上传并部署）
# 建议部署顺序：common → login → upload → publish → confession
# 注意：cloudfunctions/common/ 是公共模块，需先部署
```

## 数据库集合

### 数据集合（10 个业务 + 1 个评论）

| 集合名 | 用途 | 发布方式 |
| --- | --- | --- |
| `items` | 闲置二手（原 `xianzhi`） | 云函数 `publish` |
| `lost` | 丢失物品 | 云函数 `publish` |
| `found` | 捡到物品 | 云函数 `publish` |
| `confessions` | 表白交友（原 `biaobai`） | 云函数 `confession` |
| `jobs` | 兼职招聘（原 `jianzhi`） | 直接 DB 写入 |
| `food` | 美食推荐 | 直接 DB 写入 |
| `travel` | 旅游攻略 | 直接 DB 写入 |
| `rentals` | 房屋租售 | 直接 DB 写入 |
| `story` | 桂乡故事 | 直接 DB 写入 |
| `entertainment` | 休闲娱乐 | 直接 DB 写入 |
| `comments` | 帖子评论 | 直接 DB 写入 |

> 每个集合需在云数据库中创建 `createTime` 字段的**降序索引**。
> 合法集合名白名单见 `cloudfunctions/common/constants.js`。

## 数据流

### 登录
```
打开小程序 → app.js 云初始化 → mine.js 调用 login 云函数
→ 获取 { openid, appid } → 存入 wx.setStorage('openid')
→ 用户可点击头像按钮换头像（open-type="chooseAvatar"）→ 保存 userInfo
```

### 发帖（带图片 — publish 页）
```
填写表单 → 选择图片 → wx.cloud.uploadFile 直接上传到云存储
→ 收集 fileIDs → 调用 publish 云函数 → 写入数据库集合
```

### 发帖（无图片 — 弹窗式）
```
food/travel/rent/story/entertainment/dating 页面
→ 弹出内联模态表单 → 填写信息 → 直接 db.collection.add 写入
```

### 浏览
```
各列表页 → getList()（分页查询，默认按 createTime 降序）
→ 展示卡片/列表 → 点击跳转 pages/detail/detail?name=<type>&id=<id>
→ detail 页加载详情 + comments 评论
```

### 评论
```
详情页底部输入框 → 填写内容 → 写入 comments 集合
（含 postCollection + postId 关联帖子）
```

### 搜索
```
search 页 → 输入关键词（300ms 防抖）
→ 多集合（items/lost/found/jobs/confessions）模糊匹配
→ 按创建时间排序展示结果
```

## 组件体系

| 组件 | 功能 |
| --- | --- |
| `post-card` | 统一帖子卡片（badge、标题、价格/描述、图片轮播、删除） |
| `empty-state` | 空状态占位（带可选按钮） |
| `send-button` | 浮动发布按钮 |
| `login-check` | 自动检测登录态 |
| `image-uploader` | 图片选择（最多5张）和删除 |

## 模式与规范

- **分页**: 所有列表使用 `page`/`pageSize`/`hasMore` 模式 + `onReachBottom` 触底加载
- **下拉刷新**: 所有列表支持 `onPullDownRefresh`
- **FAB 按钮**: 列表页底部居中浮动发布按钮
- **方言文案**: 使用咸宁方言（"删哒"、"冇得"、"桂花信使迷路了"）
- **错误状态**: 全局 `app.onError` + 各页面本地 `loadError` 状态
- **分享**: 每个页面实现 `onShareAppMessage`，我的页额外支持 `onShareTimeline`

## License

MIT

---

*桂乡生活 · 咸宁人的本地生活圈 — 开发者：LinChen*
