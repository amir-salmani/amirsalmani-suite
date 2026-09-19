#!/usr/bin/env node
// Compare what was imported against what upstream serves now. Exits non-zero
// on drift, so it can gate a release.
//
//   node tools/reconcile-upstream.mjs
//
// This exists because ObsidianUI has no tags and no versions — the GitLab
// repository was two days old when the component tier was adopted, and gained
// an item during the afternoon the importer was written. Without a recorded
// sha per item, "is our copy stale" has no answer that is not a guess.
//
// Drift is not a failure to fix by re-importing. A changed item upstream may
// have been changed under a patch of ours; re-import, re-apply, look at what
// no longer applies. That is the whole point of keeping the two apart.

import { IMPORTED_ITEMS } from '../src/imported/manifest.generated.mjs';
import { createHash } from 'node:crypto';

const sha = s => createHash('sha256').update(s).digest('hex').slice(0, 12);
const REGISTRY = process.env.OBSIDIAN_REGISTRY ?? 'https://www.obsidianui.dev/r/registry.json';

const res = await fetch(REGISTRY);
if (!res.ok) { console.error(`registry fetch failed: ${res.status}`); process.exit(1); }
const now = Object.fromEntries((await res.json()).items.map(i => [i.name, i]));
const mine = Object.fromEntries(IMPORTED_ITEMS.map(i => [i.name, i]));

const changed = [], gone = [], added = [];
for (const [name, item] of Object.entries(mine)) {
  if (!now[name]) { gone.push(name); continue; }
  if (sha(JSON.stringify(now[name])) !== item.upstream.sha) changed.push(name);
}
for (const name of Object.keys(now)) if (!mine[name]) added.push(name);

const dates = [...new Set(IMPORTED_ITEMS.map(i => i.upstream.imported))].sort();
console.log(`${IMPORTED_ITEMS.length} imported ${dates.length === 1 ? `on ${dates[0]}` : `across ${dates[0]}–${dates.at(-1)}`} · upstream serves ${Object.keys(now).length}`);

for (const [label, list] of [['changed upstream', changed], ['withdrawn upstream', gone], ['new upstream', added]]) {
  if (list.length) console.log(`\n  ${label} (${list.length})\n    ${list.join('\n    ')}`);
}

const drift = changed.length + gone.length + added.length;
console.log(`\n${drift === 0 ? 'no drift' : `${drift} item(s) drifted`}`);
process.exit(drift ? 1 : 0);
