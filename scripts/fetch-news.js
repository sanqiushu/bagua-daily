const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// ======== Configuration ========
const BRAVE_API_KEY = process.env.BRAVE_API_KEY || '';
const BRAVE_NEWS_URL = 'https://api.search.brave.com/res/v1/news/search';

// Search queries organized by domain
const SEARCH_QUERIES = [
  // AI
  { query: 'AI artificial intelligence LLM model 2026', domain: 'ai', label: 'ai_general' },
  { query: 'DeepSeek OpenAI Anthropic Claude GPT Gemini', domain: 'ai', label: 'ai_companies' },
  { query: 'AI chip semiconductor NVIDIA Huawei', domain: 'ai', label: 'ai_chips' },
  { query: 'ChatGPT AI agent app integration', domain: 'ai', label: 'ai_products' },
  // Crypto
  { query: 'cryptocurrency bitcoin ethereum crypto market', domain: 'crypto', label: 'crypto_market' },
  { query: 'DeFi blockchain Web3 stablecoin', domain: 'crypto', label: 'crypto_defi' },
  // Finance
  { query: 'stock market economy tariff trade war', domain: 'finance', label: 'finance_macro' },
  { query: 'Wall Street Federal Reserve JPMorgan Goldman', domain: 'finance', label: 'finance_wall_st' },
  { query: 'Trump tariff geopolitics Iran oil', domain: 'geopolitics', label: 'geopolitics' },
  // Chinese sources
  { query: '人工智能 AI 大模型 科技', domain: 'ai', label: 'zh_ai' },
  { query: '加密货币 比特币 区块链 Web3', domain: 'crypto', label: 'zh_crypto' },
  { query: '关税 贸易战 经济 金融 A股', domain: 'finance', label: 'zh_finance' },
];

// Legacy RSS feeds (fallback when Brave API is unavailable)
const RSS_FEEDS = {
  AI: [
    { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
    { name: 'The Verge AI', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml' },
    { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/technology-lab' },
    { name: '36氪', url: 'https://36kr.com/feed', lang: 'zh' },
    { name: '机器之心', url: 'https://www.jiqizhixin.com/rss', lang: 'zh' },
    { name: '量子位', url: 'https://www.qbitai.com/feed', lang: 'zh' },
  ],
  Crypto: [
    { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/' },
    { name: 'CoinTelegraph', url: 'https://cointelegraph.com/rss' },
    { name: 'The Block', url: 'https://www.theblock.co/rss.xml' },
    { name: 'Decrypt', url: 'https://decrypt.co/feed' },
    { name: 'Odaily星球日报', url: 'https://www.odaily.news/rss', lang: 'zh' },
    { name: '深潮 TechFlow', url: 'https://www.techflowpost.com/rss', lang: 'zh' },
  ],
  Finance: [
    { name: 'CNBC', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147' },
    { name: 'Reuters', url: 'https://www.reutersagency.com/feed/?taxonomy=best-sectors&post_type=best' },
    { name: '华尔街见闻', url: 'https://wallstreetcn.com/rss', lang: 'zh' },
    { name: '新浪财经', url: 'https://finance.sina.com.cn/rss/cjxw.xml', lang: 'zh' },
  ]
};

// ======== Brave Search API ========
function braveSearch(query, count = 15) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      q: query,
      count: String(count),
      freshness: 'pd', // past day
      text_decorations: 'false',
    });
    const reqUrl = `${BRAVE_NEWS_URL}?${params}`;
    const parsed = new URL(reqUrl);

    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': BRAVE_API_KEY,
      },
      timeout: 15000,
    };

    // Use python urllib as fallback since direct https may have issues
    const { execSync } = require('child_process');
    try {
      const pyCode = `
import urllib.request, json, sys
req = urllib.request.Request(
    '${reqUrl}',
    headers={'Accept': 'application/json', 'X-Subscription-Token': '${BRAVE_API_KEY}'}
)
with urllib.request.urlopen(req, timeout=15) as resp:
    print(resp.read().decode())
`;
      const result = execSync(`python3 -c ${JSON.stringify(pyCode)}`, { timeout: 20000, encoding: 'utf8' });
      resolve(JSON.parse(result));
    } catch (e) {
      // Fallback to native https
      const req = https.get(options, (res) => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
          } catch(e) { reject(e); }
        });
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    }
  });
}

async function fetchViaBrave() {
  const allResults = {};

  for (const { query, domain, label } of SEARCH_QUERIES) {
    try {
      console.error(`  Searching: [${label}] ${query}...`);
      const data = await braveSearch(query);
      const results = (data.results || []).map(r => ({
        title: r.title || '',
        url: r.url || '',
        description: r.description || '',
        source: (r.meta_url && r.meta_url.hostname) || '',
        age: r.age || '',
        date: r.page_age || '',
        domain,
        query_group: label,
      }));
      allResults[label] = results;
      console.error(`    → ${results.length} results`);
    } catch (e) {
      console.error(`  ⚠ [${label}] failed: ${e.message}`);
      allResults[label] = [];
    }
  }

  // Deduplicate by URL
  const seen = new Set();
  const unique = [];
  for (const [label, results] of Object.entries(allResults)) {
    for (const r of results) {
      if (r.url && !seen.has(r.url)) {
        seen.add(r.url);
        unique.push(r);
      }
    }
  }

  return unique;
}

// ======== RSS Fallback ========
function fetchUrl(targetUrl) {
  return new Promise((resolve, reject) => {
    const client = targetUrl.startsWith('https') ? https : http;
    const req = client.get(targetUrl, { headers: { 'User-Agent': 'BaguaDaily/3.0' }, timeout: 15000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redir = res.headers.location.startsWith('http') ? res.headers.location : new URL(res.headers.location, targetUrl).href;
        return fetchUrl(redir).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function stripCDATA(str) {
  if (!str) return str;
  return str.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
}

function parseDescription(block) {
  let desc = (block.match(/<description[^>]*>([\s\S]*?)<\/description>/) || [])[1];
  if (!desc) desc = (block.match(/<summary[^>]*>([\s\S]*?)<\/summary>/) || [])[1];
  if (!desc) desc = (block.match(/<content[^>]*>([\s\S]*?)<\/content>/) || [])[1];
  if (!desc) return '';
  desc = stripCDATA(desc);
  desc = desc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return desc.slice(0, 500);
}

function parseItems(xml) {
  const items = [];
  const itemRegex = /<item[\s>][\s\S]*?<\/item>|<entry[\s>][\s\S]*?<\/entry>/gi;
  const matches = xml.match(itemRegex) || [];

  for (const block of matches.slice(0, 15)) {
    const title = stripCDATA((block.match(/<title[^>]*>([\s\S]*?)<\/title>/) || [])[1]?.trim());
    let link = (block.match(/<link[^>]*href="([^"]+)"/) || block.match(/<link[^>]*>([\s\S]*?)<\/link>/) || [])[1]?.trim();
    link = stripCDATA(link);
    const pubDate = stripCDATA((block.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || block.match(/<published>([\s\S]*?)<\/published>/) || block.match(/<updated>([\s\S]*?)<\/updated>/) || [])[1]);
    const description = parseDescription(block);

    if (title && link) {
      items.push({
        title: title.replace(/<[^>]+>/g, ''),
        url: link,
        date: pubDate ? new Date(pubDate) : new Date(),
        description,
      });
    }
  }
  return items;
}

function isRecent(date, hoursAgo = 36) {
  return (Date.now() - date.getTime()) < hoursAgo * 3600 * 1000;
}

async function fetchViaRSS() {
  const results = [];

  for (const [category, feeds] of Object.entries(RSS_FEEDS)) {
    console.error(`[RSS: ${category}]`);
    for (const feed of feeds) {
      try {
        console.error(`  Fetching ${feed.name}...`);
        const xml = await fetchUrl(feed.url);
        const items = parseItems(xml);
        let added = 0;
        for (const item of items) {
          if (isRecent(item.date)) {
            results.push({
              title: item.title,
              url: item.url,
              description: item.description,
              source: feed.name,
              domain: category.toLowerCase(),
              query_group: `rss_${category.toLowerCase()}`,
              lang: feed.lang || 'en',
              date: item.date.toISOString(),
            });
            added++;
          }
        }
        console.error(`    → ${items.length} parsed, ${added} recent`);
      } catch (e) {
        console.error(`  ⚠ ${feed.name} failed: ${e.message}`);
      }
    }
  }

  return results;
}

// ======== Main ========
async function main() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
  console.error(`Fetching news for ${dateStr}...\n`);

  let results = [];

  // Try Brave Search first, fall back to RSS
  if (BRAVE_API_KEY) {
    console.error('=== Using Brave Search API ===\n');
    try {
      results = await fetchViaBrave();
      console.error(`\nBrave Search: ${results.length} unique results\n`);
    } catch (e) {
      console.error(`Brave Search failed: ${e.message}, falling back to RSS...\n`);
    }
  }

  // If Brave returned insufficient results, supplement with RSS
  if (results.length < 10) {
    console.error('=== Supplementing with RSS feeds ===\n');
    const rssResults = await fetchViaRSS();
    const seenUrls = new Set(results.map(r => r.url));
    for (const r of rssResults) {
      if (!seenUrls.has(r.url)) {
        seenUrls.add(r.url);
        results.push(r);
      }
    }
    console.error(`\nTotal after RSS supplement: ${results.length} results\n`);
  }

  if (results.length === 0) {
    console.error('No news found.');
    process.exit(1);
  }

  const output = {
    date: dateStr,
    total: results.length,
    results,
  };

  // Save raw data
  const dataDir = path.join(__dirname, '..', 'data', 'raw');
  fs.mkdirSync(dataDir, { recursive: true });
  const rawPath = path.join(dataDir, `${dateStr}.json`);
  fs.writeFileSync(rawPath, JSON.stringify(output, null, 2));
  console.error(`Saved raw data to data/raw/${dateStr}.json`);

  // Print to stdout for piping to LLM
  console.log(JSON.stringify(output, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
