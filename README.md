# 📰 八卦日报 | Bagua Daily

> AI · Crypto · Finance — 每日新闻速递，全自动更新

🌐 **在线访问：** [https://sanqiushu.github.io/bagua-daily/](https://sanqiushu.github.io/bagua-daily/)

---

## ✨ 特性

- 🤖 **三大板块** — AI 产业动态 / 加密货币 / 金融头条，Tab 切换浏览
- 📅 **按日期归档** — 支持前后翻阅历史新闻
- 🔥 **热门标注** — 重磅新闻一眼识别
- 🌐 **中英双语** — 每条新闻附权威来源链接
- 🌙 **暗黑主题** — 护眼设计，移动端适配
- ⚡ **全自动运行** — GitHub Actions 每日定时抓取 + 部署，零人工干预

## 📡 数据来源

| 分类 | RSS 源 |
|------|--------|
| AI | TechCrunch AI, The Verge AI, VentureBeat |
| Crypto | CoinDesk, CoinTelegraph |
| Finance | Reuters Business, CNBC |

## 🏗 技术栈

- **前端：** 纯 HTML/CSS/JS，无框架依赖
- **数据抓取：** Node.js 脚本解析 RSS
- **CI/CD：** GitHub Actions 定时触发
- **托管：** GitHub Pages，全球 CDN

## 📁 项目结构

```
├── index.html              # 主页面
├── data/
│   ├── index.json          # 日期索引
│   └── YYYY-MM-DD.json     # 每日新闻数据
├── scripts/
│   └── fetch-news.js       # RSS 抓取脚本
└── .github/workflows/
    └── deploy.yml          # 自动抓取 + 部署
```

## 🚀 本地运行

```bash
# 克隆项目
git clone https://github.com/sanqiushu/bagua-daily.git
cd bagua-daily

# 手动抓取一次
node scripts/fetch-news.js

# 本地预览
npx serve .
```

## 📜 License

MIT

---

*Powered by 八卦君 🤖 — 快、准、广，不废话。*
