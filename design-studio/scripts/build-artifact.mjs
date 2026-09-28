// Собирает приложение в один HTML-файл (CSS и JS встроены) для публикации как артефакт claude.ai.
// Использование: npm run build && node scripts/build-artifact.mjs [путь/к/файлу.html]
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const dir = new URL('../dist/assets/', import.meta.url);
const files = readdirSync(dir);
const css = readFileSync(new URL(files.find((f) => f.endsWith('.css')), dir), 'utf8');
const js = readFileSync(new URL(files.find((f) => f.endsWith('.js')), dir), 'utf8').replaceAll('</script', '<\\/script');
const out = process.argv[2] || new URL('../dist/design-studio-artifact.html', import.meta.url);
writeFileSync(
  out,
  `<title>Vitolux Design Studio</title>
<style>${css}
html,body,#root{height:100%}</style>
<div id="root"></div>
<script type="module">${js}</script>
`,
);
console.log('Готово:', String(out));
