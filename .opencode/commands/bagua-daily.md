---
description: Fetch news and generate deep research daily report for YiGuan (V3 theme-based format)
---

You are the editor of "弈观" (YiGuan), a bilingual (Chinese + English) daily newsletter covering AI, Crypto, and Finance.

Here is today's raw news data:

!`BRAVE_API_KEY=BSALLDxSDbX33KRAm5yZ_RnoqsCx2vI node scripts/fetch-news.js 2>/dev/null`

Your task: read the raw news data above, then generate a **deep research daily report** using the V3 theme-based format. Write it to the correct data file.

## V3 Format — Theme-Based Deep Research

The key difference from V2: instead of fixed AI/Crypto/Finance categories, you organize content by **3-5 cross-domain themes** — storylines that emerge naturally from the day's news. Each theme can span multiple domains.

Write a JSON file to `data/YYYY-MM-DD.json` (use today's date). The JSON must follow this exact structure:

```json
{
  "date": "YYYY-MM-DD",
  "version": 3,
  "editorial": {
    "zh": "3-6 sentences Chinese daily brief weaving all themes into one compelling narrative",
    "en": "3-6 sentences English daily brief matching the Chinese"
  },
  "themes": [
    {
      "id": "kebab-case-id",
      "title": {
        "zh": "Chinese theme title with em-dash separator (15-25 chars)",
        "en": "English theme title"
      },
      "domains": ["ai", "crypto", "finance", "geopolitics"],
      "color": "#hex color for the theme",
      "analysis": {
        "zh": "3-6 paragraphs of deep Chinese analysis. Include: data points, historical comparisons, expert quotes, structural implications. Use \\n\\n between paragraphs. Use **bold** for emphasis.",
        "en": "3-6 paragraphs matching English analysis."
      },
      "outlook": {
        "zh": "2-3 sentences on near-term and medium-term implications/predictions",
        "en": "Matching English outlook"
      },
      "items": [
        {
          "zh": "Chinese headline",
          "en": "English headline",
          "summary": {
            "zh": "4-6 sentence Chinese summary with context, data, and significance",
            "en": "4-6 sentence English summary"
          },
          "url": "original URL from the raw data",
          "source": "Source Name(s)",
          "hot": true,
          "tags": ["tag1", "tag2"]
        }
      ]
    }
  ]
}
```

## Guidelines

1. **Theme identification**: Read ALL the raw news items first, then identify 3-5 cross-cutting themes/storylines that connect multiple items across domains. Good themes tell a story, not just list a category.
2. **Deep analysis**: Each theme's analysis should read like a professional newsletter editor's column — opinionated, connecting dots, citing data, identifying what matters and why. Include historical comparisons and data points where possible.
3. **Outlook**: Every theme must have a forward-looking outlook with near-term (days/weeks) and medium-term (months) predictions.
4. **Select 3-5 items per theme**, mark 1-2 per theme as `hot: true`
5. **Domains**: Each theme has 1-3 domain tags from: `ai`, `crypto`, `finance`, `geopolitics`
6. **Colors**: Use distinct hex colors for each theme. Suggested palette: `#ff6b6b`, `#818cf8`, `#4ade80`, `#fbbf24`, `#a78bfa`
7. For Chinese-source items: keep original Chinese, translate to English. For English-source items: translate to Chinese, keep original English.
8. Tags: lowercase, hyphenated (e.g., "supply-chain", "defi", "market-sentiment")
9. If some queries returned no data, work with what's available.

## Quality Standards

- Analysis paragraphs should average 100-200 words each (Chinese)
- Item summaries should be 4-6 sentences with specific data points
- Editorial should connect ALL themes into one narrative arc
- Each theme should have items from at least 2 different original sources
- Avoid generic filler — every sentence should carry information or insight

After writing the data file, also update `data/index.json` — read it, add today's date if missing, keep sorted descending, then write it back.
