/**
 * Vignette de témoignage au design du site (8 nov.) : même gabarit que Didier Bourdon et Nico.
 * Usage : node scripts/testimonialThumb.cjs <video.mp4> <sortie.jpeg> '<json>'
 *   json = { "at": 4.0, "trade": "NETTOYAGE", "line1": "Mon premier", "line2": "marché privé", "name": "Adeline", "role": "Gérante · Nettoyage", "duration": "1:12" }
 * Le texte de la vignette vient du témoignage lui-même : aucun chiffre n'est inventé.
 */
const { execFileSync } = require('child_process');
const fs = require('fs'); const os = require('os'); const path = require('path');
const { chromium } = require('playwright');
const [video, out, json] = process.argv.slice(2);
const o = JSON.parse(json);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'thumb-'));
const frame = path.join(tmp, 'frame.jpg');
execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', String(o.at ?? 3), '-i', video, '-frames:v', '1', '-q:v', '2', frame]);
const font = (w) => `url(file:///usr/share/fonts/truetype/google-fonts/Poppins-${w}.ttf)`;
const esc = (s) => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:P;font-weight:400;src:${font('Regular')}}@font-face{font-family:P;font-weight:500;src:${font('Medium')}}
@font-face{font-family:P;font-weight:700;src:${font('Bold')}}@font-face{font-family:P;font-weight:800;src:${font('Bold')}}
*{margin:0;box-sizing:border-box}body{width:840px;height:1050px;overflow:hidden;font-family:P;background:#071A2E}
.bg{position:absolute;inset:0;background:url(file://${frame}) center ${o.pos || "30%"}/cover}
.fade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(7,26,46,0) 48%,rgba(7,26,46,.72) 66%,#071A2E 82%)}
.logo{position:absolute;left:38px;top:38px;background:#2A3346;border-radius:14px;padding:13px 24px;font-weight:800;font-size:37px;color:#fff;letter-spacing:-.5px}
.logo b{color:#FF6B12;font-weight:800}
.trade{position:absolute;right:36px;top:46px;background:#071A2E;border:2.5px solid #fff;border-radius:40px;padding:11px 24px;color:#fff;font-weight:500;font-size:22px;letter-spacing:3.5px}
.play{position:absolute;right:42px;top:600px;width:118px;height:118px;border-radius:50%;background:#FF6B12;box-shadow:0 0 34px rgba(255,107,18,.55)}
.play:after{content:"";position:absolute;left:44px;top:33px;border-left:42px solid #fff;border-top:26px solid transparent;border-bottom:26px solid transparent}
.k{position:absolute;left:42px;top:${o.kTop || 690}px;color:#C9D1DD;font-weight:500;font-size:21px;letter-spacing:6px}
.h{position:absolute;left:40px;right:40px;top:${(o.kTop || 690) + 40}px;font-weight:800;line-height:1.06;letter-spacing:-1px}
.h .a{color:#FF6B12;font-size:${o.size1 || 66}px;display:block}.h .b{color:#fff;font-size:${o.size2 || 66}px;display:block}
.n{position:absolute;left:42px;bottom:76px;color:#fff;font-weight:700;font-size:37px}
.r{position:absolute;left:42px;bottom:34px;color:#C9D1DD;font-weight:400;font-size:27px}
.d{position:absolute;right:42px;bottom:40px;border:2.5px solid #fff;border-radius:30px;padding:6px 30px;color:#fff;font-weight:500;font-size:26px}
</style></head><body><div class="bg"></div><div class="fade"></div>
<div class="logo">Marchés <b>Direct</b></div><div class="trade">${esc(o.trade)}</div><div class="play"></div>
<div class="k">TÉMOIGNAGE CLIENT</div><div class="h"><span class="a">${esc(o.line1)}</span><span class="b">${esc(o.line2)}</span></div>
<div class="n">${esc(o.name)}</div><div class="r">${esc(o.role)}</div><div class="d">${esc(o.duration)}</div></body></html>`;
const page = path.join(tmp, 'p.html'); fs.writeFileSync(page, html);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 840, height: 1050 }, deviceScaleFactor: 1 });
  await p.goto('file://' + page); await p.waitForTimeout(300);
  await p.screenshot({ path: out, type: 'jpeg', quality: 86 }); await b.close();
  console.log('vignette :', out);
})();
