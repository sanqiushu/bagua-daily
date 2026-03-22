const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// RSS feeds for each category
const FEEDS = {
  AI: [
    { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
    { name: 'The Verge AI', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml' },
    { name: 'VentureBeat AI', url: 'https://venturebeat.com/category/ai/feed/' },
    { name: '36氪 AI', url: 'https://36kr.com/feed', lang: 'zh' },
    { name: '机器之心', url: 'https://www.jiqizhixin.com/rss', lang: 'zh' },
    { name: '量子位', url: 'https://www.qbitai.com/feed', lang: 'zh' },
  ],
  Crypto: [
    { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/' },
    { name: 'CoinTelegraph', url: 'https://cointelegraph.com/rss' },
    { name: '金色财经', url: 'https://www.jinse.cn/rss', lang: 'zh' },
    { name: 'PANews', url: 'https://www.panewslab.com/rss/zh/index.xml', lang: 'zh' },
    { name: '律动 BlockBeats', url: 'https://www.theblockbeats.info/rss', lang: 'zh' },
  ],
  Finance: [
    { name: 'Reuters Business', url: 'https://www.reutersagency.com/feed/?taxonomy=best-sectors&post_type=best' },
    { name: 'CNBC', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147' },
    { name: '华尔街见闻', url: 'https://wallstreetcn.com/rss', lang: 'zh' },
    { name: '财新网', url: 'https://rsshub.app/caixin/latest', lang: 'zh' },
    { name: '第一财经', url: 'https://rsshub.app/yicai/brief', lang: 'zh' },
  ]
};

function fetch(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'BaguaDaily/1.0' }, timeout: 15000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function parseItems(xml) {
  const items = [];
  // Match <item> or <entry> blocks
  const itemRegex = /<item[\s>][\s\S]*?<\/item>|<entry[\s>][\s\S]*?<\/entry>/gi;
  const matches = xml.match(itemRegex) || [];
  
  for (const block of matches.slice(0, 10)) {
    const title = (block.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s) || [])[1]?.trim();
    const link = (block.match(/<link[^>]*href="([^"]+)"/) || block.match(/<link[^>]*>(.*?)<\/link>/) || [])[1]?.trim();
    const pubDate = (block.match(/<pubDate>(.*?)<\/pubDate>/) || block.match(/<published>(.*?)<\/published>/) || block.match(/<updated>(.*?)<\/updated>/) || [])[1];
    
    if (title && link) {
      items.push({ title: title.replace(/<[^>]+>/g, ''), url: link, date: pubDate ? new Date(pubDate) : new Date() });
    }
  }
  return items;
}

function isToday(date) {
  const now = new Date();
  const today = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
  const d = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
  return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
}

function isRecent(date, hoursAgo = 36) {
  return (Date.now() - date.getTime()) < hoursAgo * 3600 * 1000;
}

async function fetchCategory(category, feeds) {
  const allItems = [];
  for (const feed of feeds) {
    try {
      console.log(`  Fetching ${feed.name}...`);
      const xml = await fetch(feed.url);
      const items = parseItems(xml);
      for (const item of items) {
        if (isRecent(item.date)) {
          allItems.push({ ...item, source: feed.name, lang: feed.lang || 'en' });
        }
      }
    } catch (e) {
      console.log(`  ⚠ ${feed.name} failed: ${e.message}`);
    }
  }
  
  // Sort by date desc, pick up to 6 with mix of zh/en
  allItems.sort((a, b) => b.date - a.date);
  const zhItems = allItems.filter(i => i.lang === 'zh').slice(0, 3);
  const enItems = allItems.filter(i => i.lang === 'en').slice(0, 3);
  const selected = [...zhItems, ...enItems].sort((a, b) => b.date - a.date).slice(0, 6);
  
  return selected.map(item => ({
    zh: item.title,
    en: item.lang === 'zh' ? '' : item.title,
    url: item.url,
    source: item.source,
    hot: false
  }));
}

async function main() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' }); // YYYY-MM-DD
  console.log(`Fetching news for ${dateStr}...`);
  
  const sections = [];
  for (const [category, feeds] of Object.entries(FEEDS)) {
    console.log(`[${category}]`);
    const items = await fetchCategory(category, feeds);
    if (items.length > 0) {
      // Mark first item as hot
      items[0].hot = true;
      sections.push({ category, items });
    }
  }
  
  if (sections.length === 0) {
    console.log('No news found, skipping.');
    process.exit(0);
  }
  
  const data = { date: dateStr, sections };
  const dataDir = path.join(__dirname, '..', 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  
  // Write daily data
  fs.writeFileSync(path.join(dataDir, `${dateStr}.json`), JSON.stringify(data, null, 2));
  console.log(`Wrote data/${dateStr}.json`);
  
  // Update index
  const indexPath = path.join(dataDir, 'index.json');
  let index = [];
  try { index = JSON.parse(fs.readFileSync(indexPath, 'utf8')); } catch(e) {}
  if (!index.includes(dateStr)) {
    index.push(dateStr);
    index.sort((a, b) => b.localeCompare(a));
  }
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  console.log('Updated index.json');
}

main().catch(e => { console.error(e); process.exit(1); });
