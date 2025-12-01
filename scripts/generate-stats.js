const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const USERNAME = process.env.USERNAME || 'NandakrishnanR';

// Color map for common languages (inspired by github-readme-stats radical theme)
const LANG_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#ffac45',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Jupyter: '#DA5B0B',
  'Jupyter Notebook': '#DA5B0B',
  MATLAB: '#e16737',
  R: '#198CE7',
  Lua: '#000080',
  Perl: '#0298c3',
  Haskell: '#5e5086',
  Scala: '#c22d40',
  Elixir: '#6e4a7e',
  Clojure: '#db5855',
  Dockerfile: '#384d54',
  Makefile: '#427819',
  TeX: '#3D6117',
  Vim: '#019833',
  PowerShell: '#012456',
  Batchfile: '#C1F12E',
  Other: '#8b949e',
};

async function main() {
  if (!GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN environment variable is required');
  }
  const octokit = new Octokit({ auth: GITHUB_TOKEN });

  // Fetch all repos for user
  const repos = await octokit.paginate(octokit.repos.listForUser, {
    username: USERNAME,
    per_page: 100,
    type: 'owner',
  });

  // Aggregate language sizes
  const langSizes = {};
  for (const repo of repos) {
    if (repo.fork) continue; // skip forks
    const lang = repo.language;
    if (lang) {
      langSizes[lang] = (langSizes[lang] || 0) + (repo.size || 0);
    }
  }

  // Sort and keep top 6
  const sorted = Object.entries(langSizes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const total = sorted.reduce((sum, [, size]) => sum + size, 0) || 1;

  // Build SVG
  const WIDTH = 350;
  const HEIGHT = 195;
  const BAR_HEIGHT = 8;
  const BAR_Y = 65;
  const BAR_WIDTH = 300;
  const LEGEND_START_Y = 95;

  let barX = 25;
  const barParts = sorted.map(([lang, size]) => {
    const pct = size / total;
    const w = Math.max(pct * BAR_WIDTH, 2);
    const color = LANG_COLORS[lang] || LANG_COLORS.Other;
    const part = `<rect x="${barX}" y="${BAR_Y}" width="${w}" height="${BAR_HEIGHT}" fill="${color}" rx="2"/>`;
    barX += w;
    return part;
  });

  // Legend (2 columns, 3 rows)
  const legendItems = sorted.map(([lang, size], i) => {
    const pct = ((size / total) * 100).toFixed(1);
    const color = LANG_COLORS[lang] || LANG_COLORS.Other;
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 25 + col * 160;
    const y = LEGEND_START_Y + row * 28;
    return `
      <circle cx="${x}" cy="${y}" r="5" fill="${color}"/>
      <text x="${x + 12}" y="${y + 4}" fill="#c9d1d9" font-size="12" font-family="Segoe UI, Roboto, sans-serif">${lang} ${pct}%</text>
    `;
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" rx="6" fill="#0d1117"/>
  <text x="25" y="35" fill="#58a6ff" font-size="16" font-weight="600" font-family="Segoe UI, Roboto, sans-serif">Most Used Languages</text>
  ${barParts.join('\n  ')}
  ${legendItems.join('')}
</svg>`;

  // Write to assets/github-langs.svg
  const outDir = path.join(__dirname, '..', 'assets');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'github-langs.svg'), svg);
  console.log('Generated assets/github-langs.svg');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
