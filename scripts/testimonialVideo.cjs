/**
 * Témoignage vidéo au format du site (8 nov.) : même traitement que Didier Bourdon et Nico.
 *  - logo « Marchés Direct » en haut à gauche pendant toute la vidéo ;
 *  - cartouche « TÉMOIGNAGE CLIENT / prénom / fonction » de 0,5 s à 5,5 s ;
 *  - sous-titres sur fond sombre, mots entre *astérisques* en orange ;
 *  - portrait 478×850, H.264 ~350 kb/s + AAC 96 kb/s, démarrage rapide (même poids que les deux actuelles).
 * Usage : node scripts/testimonialVideo.cjs <source> <sortie.mp4> <reglages.json>
 *   reglages.json = { "name": "Adeline", "role": "Gérante · Nettoyage", "start": 0, "end": null,
 *                     "subtitles": [[0.4, 2.8, "Bonjour, moi c'est *Adeline*."], ...] }
 */
const { execFileSync } = require('child_process');
const fs = require('fs'); const os = require('os'); const path = require('path');
const { chromium } = require('playwright');
const [src, out, cfgPath] = process.argv.slice(2);
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'temoignage-'));
const W = 478, H = 850;
const font = (w) => `url(file:///usr/share/fonts/opentype/inter/Inter-${w}.otf)`; // incrustations d'origine en Inter
const esc = (s) => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const css = `@font-face{font-family:P;font-weight:400;src:${font('Regular')}}@font-face{font-family:P;font-weight:500;src:${font('Medium')}}@font-face{font-family:P;font-weight:600;src:${font('SemiBold')}}@font-face{font-family:P;font-weight:700;src:${font('Bold')}}
*{margin:0;box-sizing:border-box}html,body{width:${W}px;height:${H}px;background:transparent;font-family:P;overflow:hidden}`;

async function png(browser, file, body) {
  const p = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const page = file.replace(/\.png$/, '.html');
  fs.writeFileSync(page, `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${body}</body></html>`);
  await p.goto('file://' + page); await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: file, omitBackground: true }); await p.close();
}

(async () => {
  const browser = await chromium.launch();
  const logo = path.join(tmp, 'logo.png'), third = path.join(tmp, 'third.png');
  await png(browser, logo, `<div style="position:absolute;left:29px;top:47px;width:188px;height:44px;border-radius:6px;background:rgba(18,30,48,.92);color:#fff;font-weight:600;font-size:18.5px;display:flex;align-items:center;padding-left:11px">Marchés&nbsp;<span style="color:#FF7A1A">Direct</span></div>`);
  await png(browser, third, `<div style="position:absolute;left:30px;top:558px;width:318px;padding:14px 14px 16px 22px;border-radius:6px;background:rgba(14,26,44,.92)">
    <div style="position:absolute;left:10px;top:12px;bottom:12px;width:3px;background:#FF7A1A;border-radius:2px"></div>
    <div style="color:#FF7A1A;font-size:10px;font-weight:500;letter-spacing:.3px">TÉMOIGNAGE CLIENT</div>
    <div style="color:#fff;font-size:21px;font-weight:600;margin-top:4px">${esc(cfg.name)}</div>
    <div style="color:#D6DDE7;font-size:13.5px;margin-top:6px">${esc(cfg.role)}</div></div>`);
  // Sous-titres : une image par réplique (fond arrondi, mots *orange*), affichée sur son intervalle.
  const subs = [];
  for (const [i, [a, b, text]] of (cfg.subtitles || []).entries()) {
    const f = path.join(tmp, `s${i}.png`);
    const html = esc(text).replace(/\*([^*]+)\*/g, '<span style="color:#FF7A1A">$1</span>');
    await png(browser, f, `<div style="position:absolute;left:0;right:0;bottom:${cfg.subBottom || 115}px;display:flex;justify-content:center">
      <div style="max-width:350px;padding:5px 16px 6px;border-radius:5px;background:rgba(14,26,44,.9);color:#fff;font-size:19.5px;font-weight:500;line-height:1.55;text-align:center">${html}</div></div>`);
    subs.push({ f, a, b });
  }
  await browser.close();

  const inputs = ['-i', src, '-i', logo, '-i', third, ...subs.flatMap(s => ['-i', s.f])];
  const trim = [cfg.start ? `-ss` : null, cfg.start ? String(cfg.start) : null].filter(Boolean);
  let chain = `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1[v0];[v0][1:v]overlay=0:0[v1];[v1][2:v]overlay=0:0:enable='between(t,0.5,5.5)'[v2]`;
  subs.forEach((s, i) => { chain += `;[v${i + 2}][${i + 3}:v]overlay=0:0:enable='between(t,${s.a},${s.b})'[v${i + 3}]`; });
  const last = `[v${subs.length + 2}]`;
  execFileSync('ffmpeg', ['-y', '-v', 'error', ...trim, ...inputs, ...(cfg.end ? ['-t', String(cfg.end - (cfg.start || 0))] : []),
    '-filter_complex', chain, '-map', last, '-map', '0:a?', '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-maxrate', '450k', '-bufsize', '900k',
    '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '96k', '-ac', '2', '-movflags', '+faststart', out], { stdio: 'inherit' });
  const size = fs.statSync(out).size;
  console.log(`vidéo : ${out} (${(size / 1048576).toFixed(1)} Mo)`);
})();
