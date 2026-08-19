/**
 * One-off seeding of representative demo artifacts for UX scenario testing.
 * Run: pnpm tsx scripts/seed-demo-artifacts.mts
 */
import { runWithRequestContext } from "@agent-native/core/server";
import { resourcePut, WORKSPACE_OWNER } from "@agent-native/core/resources/store";

const dashboard = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Q3 Sales Dashboard</title><style>
:root{--bg:#0f172a;--card:#1e293b;--ink:#f1f5f9;--muted:#94a3b8;--accent:#38bdf8;--good:#34d399;--bad:#f87171}
*{box-sizing:border-box;margin:0}body{font-family:system-ui,sans-serif;background:var(--bg);color:var(--ink);padding:24px}
h1{font-size:22px;margin-bottom:4px}.sub{color:var(--muted);font-size:13px;margin-bottom:20px}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:24px}
.tile{background:var(--card);border-radius:12px;padding:16px}.tile b{font-size:26px;display:block}.tile span{color:var(--muted);font-size:12px}
.delta{font-size:12px;margin-left:6px}.up{color:var(--good)}.down{color:var(--bad)}
.chart{background:var(--card);border-radius:12px;padding:20px}.chart h2{font-size:14px;margin-bottom:14px;color:var(--muted)}
.bars{display:flex;align-items:flex-end;gap:14px;height:160px}.bar{flex:1;background:linear-gradient(180deg,var(--accent),#0ea5e9);border-radius:6px 6px 0 0;position:relative;transition:height .4s}
.bar i{position:absolute;top:-20px;left:0;right:0;text-align:center;font-style:normal;font-size:11px;color:var(--muted)}
.bar u{position:absolute;bottom:-20px;left:0;right:0;text-align:center;text-decoration:none;font-size:11px;color:var(--muted)}
select{margin-bottom:16px;background:var(--card);color:var(--ink);border:1px solid #334155;border-radius:8px;padding:6px 10px}
</style></head><body>
<h1>Q3 Sales Dashboard</h1><p class="sub">Fictional demo data · EMEA region</p>
<div class="tiles">
<div class="tile"><b>€4.2M</b><span>Revenue</span><span class="delta up">▲ 12%</span></div>
<div class="tile"><b>318</b><span>New accounts</span><span class="delta up">▲ 8%</span></div>
<div class="tile"><b>92%</b><span>Retention</span><span class="delta up">▲ 1.5%</span></div>
<div class="tile"><b>41d</b><span>Sales cycle</span><span class="delta down">▼ 3d</span></div>
</div>
<div class="chart"><h2>Monthly revenue (€K)</h2>
<select id="filter"><option value="1">All segments</option><option value="0.6">Enterprise</option><option value="0.4">SMB</option></select>
<div class="bars" id="bars"></div>
</div>
<script>
const data=[["Jan",980],["Feb",1120],["Mar",1310],["Apr",1180],["May",1420],["Jun",1550]];
const bars=document.getElementById("bars");
function render(f){bars.innerHTML="";const max=Math.max(...data.map(d=>d[1]));for(const [m,v] of data){const b=document.createElement("div");b.className="bar";b.style.height=(v*f/max*100)+"%";b.innerHTML="<i>"+Math.round(v*f)+"</i><u>"+m+"</u>";bars.appendChild(b);}}
document.getElementById("filter").addEventListener("change",e=>render(parseFloat(e.target.value)));
render(1);
</script></body></html>`;

const report = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Q3 Marketing Review</title><style>
body{font-family:Georgia,serif;background:#fafaf7;color:#1c1917;max-width:720px;margin:0 auto;padding:48px 32px;line-height:1.7}
h1{font-size:28px;line-height:1.2}.meta{color:#78716c;font-size:13px;margin-bottom:32px}
h2{font-size:19px;margin:32px 0 8px;border-bottom:1px solid #e7e5e4;padding-bottom:6px}
table{width:100%;border-collapse:collapse;font-size:14px;margin:16px 0}
th,td{text-align:left;padding:8px 10px;border-bottom:1px solid #e7e5e4}th{color:#78716c;font-weight:600}
blockquote{border-left:3px solid #d6d3d1;margin:16px 0;padding:4px 16px;color:#57534e;font-style:italic}
</style></head><body>
<h1>Q3 Marketing Review</h1><p class="meta">Fictional demo document · Prepared for the leadership sync</p>
<h2>Summary</h2><p>Campaign performance improved across all three funnels this quarter. Paid acquisition efficiency rose 14% while organic reach held steady despite seasonal dips. The launch narrative for the fall release is on track.</p>
<h2>Key results</h2>
<table><tr><th>Channel</th><th>Spend</th><th>CAC</th><th>Trend</th></tr>
<tr><td>Paid search</td><td>€220K</td><td>€310</td><td>Improving</td></tr>
<tr><td>Social</td><td>€140K</td><td>€385</td><td>Flat</td></tr>
<tr><td>Events</td><td>€90K</td><td>€510</td><td>Improving</td></tr></table>
<blockquote>“The webinar series continues to be our most efficient mid-funnel asset.”</blockquote>
<h2>Next quarter</h2><p>Double down on the webinar format, consolidate social spend behind two flagship campaigns, and pilot the partner co-marketing motion agreed with the sales organization.</p>
</body></html>`;

const game = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Focus Catch</title><style>
body{font-family:system-ui,sans-serif;background:#111827;color:#f9fafb;display:flex;flex-direction:column;align-items:center;padding:24px;margin:0}
h1{font-size:20px}.hud{margin:8px 0 16px;color:#9ca3af}#score{color:#fbbf24;font-weight:700}
#field{position:relative;width:min(480px,92vw);height:340px;background:#1f2937;border-radius:16px;overflow:hidden;cursor:crosshair}
#dot{position:absolute;width:34px;height:34px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#fde68a,#f59e0b);box-shadow:0 0 18px #f59e0b88;cursor:pointer;transition:left .15s,top .15s}
button{margin-top:16px;background:#f59e0b;border:0;color:#111827;font-weight:700;padding:10px 18px;border-radius:10px;cursor:pointer}
</style></head><body>
<h1>Focus Catch</h1><p class="hud">Catch the dot! Score: <span id="score">0</span> · Time: <span id="time">20</span>s</p>
<div id="field"><div id="dot"></div></div>
<button id="restart">Restart</button>
<script>
let score=0,time=20,timer=null;
const dot=document.getElementById("dot"),f=document.getElementById("field");
function move(){dot.style.left=Math.random()*(f.clientWidth-40)+"px";dot.style.top=Math.random()*(f.clientHeight-40)+"px"}
dot.addEventListener("click",()=>{if(time<=0)return;score++;document.getElementById("score").textContent=score;move()});
function start(){score=0;time=20;document.getElementById("score").textContent=0;clearInterval(timer);timer=setInterval(()=>{time--;document.getElementById("time").textContent=Math.max(0,time);if(time<=0)clearInterval(timer)},1000);move()}
document.getElementById("restart").addEventListener("click",start);
start();
</script></body></html>`;

await runWithRequestContext({ userEmail: "dev@local.test" }, async () => {
  for (const [path, content] of [
    ["artifacts/kpi-dashboard.html", dashboard],
    ["artifacts/q3-report.html", report],
    ["artifacts/focus-game.html", game],
  ] as const) {
    const r = await resourcePut(WORKSPACE_OWNER, path, content, "text/html");
    console.log("seeded", r.path, r.id, r.size + "B");
  }
});
