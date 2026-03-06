const esc = (s)=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const qs = (k)=>new URLSearchParams(location.search).get(k);
async function getJSON(url){const r=await fetch(url); if(!r.ok) throw new Error('Request failed'); return r.json();}
async function loadCore(){
  const [site,popular,leagues,teams,news]=await Promise.all([
    getJSON('./data/site.json'),getJSON('./data/popular.json'),getJSON('./data/leagues.json'),getJSON('./data/teams.json'),getJSON('./data/news.json')
  ]);
  return {site,popular:popular.items||[],leagues:leagues.items||[],teams:teams.items||[],news:news.items||[]};
}
function topBars(active, site){
  const time = new Date().toLocaleTimeString('ar',{hour:'2-digit',minute:'2-digit'});
  const nav = (href,label,key)=>`<a class="${active===key?'active':''}" href="${href}">${esc(label)}</a>`;
  return `
  <div class="langbar"><div class="row"><div class="flags"><span>AR</span><span class="flag"></span><span class="flag"></span><span class="flag"></span></div><div>${time}</div></div></div>
  <div class="header"><div class="row"><div class="logo"><div class="mark"></div><div class="name">${esc(site.siteTitle||'KOOORA')} <span>Classic</span></div></div><div class="meta"><span class="pill">تسجيل الدخول</span><span class="pill">إعلانات</span><span class="pill">بحث</span></div></div></div>
  <div class="nav"><div class="row">${nav('./index.html','الرئيسية','home')}${nav('./news.html','أخبار','news')}${nav('./index.html#matches','مباريات','matches')}${nav('./league.html?id=epl','الدوريات','leagues')}${nav('./admin/','لوحة التحكم','admin')}</div></div>`;
}
function panel(title, right, body){return `<div class="panel"><div class="ph"><div>${esc(title)}</div><div>${right||''}</div></div><div class="pb">${body}</div></div>`}
function leagueName(leagues,id){return (leagues.find(x=>x.id===id)||{}).name || id}
function teamIdFromName(teams,name){
  const low=String(name||'').toLowerCase();
  const hit=teams.find(t=>String(t.name||'').toLowerCase()===low);
  return hit?hit.id:'';
}
function leaguesBlock(leagues){
  const world=leagues.filter(l=>l.region==='world').sort((a,b)=>b.priority-a.priority);
  const arab=leagues.filter(l=>l.region==='arab').sort((a,b)=>b.priority-a.priority);
  return `<div class="links"><div class="small muted" style="margin-bottom:6px"><b>الدوريات العالمية</b></div>${world.map(l=>`<a href="./league.html?id=${encodeURIComponent(l.id)}">${esc(l.name)}</a>`).join('')}<div class="small muted" style="margin:10px 0 6px"><b>الدوريات العربية</b></div>${arab.map(l=>`<a href="./league.html?id=${encodeURIComponent(l.id)}">${esc(l.name)}</a>`).join('')}</div>`;
}
export async function renderHome(root){
  const core=await loadCore();
  root.innerHTML = `${topBars('home',core.site)}<div class="container"><div class="ticker"><b>عاجل:</b> ${esc(core.site.tickerText||'')}</div><div class="grid"><div>${panel('مباريات اليوم','<span class="badge" id="match-date">...</span>','<div class="muted">جارٍ التحميل...</div>')}${panel('أهم الدوريات','',leaguesBlock(core.leagues))}</div><div>${panel('الأبرز','',`<div class="hero"><div class="bg"></div><div class="cap">${esc(core.site.heroTitle||'')}<span class="sub">${esc(core.site.heroSubtitle||'')}</span></div></div><div class="cards">${(core.site.cards||[]).map(c=>`<div class="card"><div class="thumb"></div><div class="ct"><a href="${c.url||'./news.html'}">${esc(c.title)}</a></div></div>`).join('')}</div>`)}${panel('آخر الأخبار','',core.news.slice(0,8).map(n=>`<div class="newsitem"><div class="nthumb"></div><div><div class="ntitle"><a href="./news.html">${esc(n.title)}</a></div><div class="small muted">${esc(n.tag||'خبر')} — ${esc(n.date||'')}</div><div class="small muted" style="margin-top:4px">${esc(n.body||'')}</div></div></div>`).join(''))}</div><div>${panel('الأخبار الأكثر قراءة','',`<ul class="clean">${core.popular.map(p=>`<li><a href="${p.url||'./news.html'}">${esc(p.title)}</a></li>`).join('')}</ul>`)}${panel('مختارات','',core.news.slice(0,4).map(n=>`<div class="mini"><div class="mthumb"></div><div><a href="./news.html">${esc(n.title)}</a></div></div>`).join(''))}</div></div><div class="footer">واجهة احترافية مبدئية قابلة للتوسعة. لا تعتمد على مصدر واحد للمحتوى.</div></div>`;
  try {
    const data=await getJSON('/.netlify/functions/matches?leagues=epl,laliga,seriea,bundesliga,ligue1,ucl,ksa,egy');
    document.getElementById('match-date').textContent = data.date || '';
    const html = `<table class="table"><thead><tr><th>الوقت</th><th>الدوري</th><th>المباراة</th><th>الحالة</th><th>النتيجة</th></tr></thead><tbody>${(data.matches||[]).map(m=>`<tr><td>${esc(m.time||'--:--')}</td><td><a href="./league.html?id=${encodeURIComponent(m.league_id)}">${esc(m.league_name)}</a></td><td class="match"><a href="./match.html?id=${encodeURIComponent(m.id)}&league=${encodeURIComponent(m.league_id)}&home=${encodeURIComponent(m.home)}&away=${encodeURIComponent(m.away)}">${esc(m.home)} × ${esc(m.away)}</a><div class="small muted">${esc(m.source||'')}</div></td><td>${esc(m.status||'-')}</td><td>${m.hs ?? '-'} : ${m.as ?? '-'}</td></tr>`).join('') || '<tr><td colspan="5">لا توجد مباريات متاحة اليوم.</td></tr>'}</tbody></table>`;
    root.querySelector('.grid > div:first-child .panel .pb').innerHTML = html;
  } catch(e) {}
}
export async function renderLeague(root){
  const core=await loadCore(); const id=qs('id')||'epl'; const league=leagueName(core.leagues,id);
  root.innerHTML = `${topBars('leagues',core.site)}<div class="container">${panel(league,'','<div class="muted">جارٍ تحميل الترتيب...</div>')}</div>`;
  try {
    const data=await getJSON(`/.netlify/functions/standings?league=${encodeURIComponent(id)}`);
    const body = `<table class="table"><thead><tr><th>#</th><th>الفريق</th><th>لعب</th><th>ف</th><th>ت</th><th>خ</th><th>له</th><th>عليه</th><th>نقاط</th></tr></thead><tbody>${(data.standings||[]).map(s=>{const tid=teamIdFromName(core.teams,s.team); const teamCell=tid?`<a href="./team.html?id=${encodeURIComponent(tid)}">${esc(s.team)}</a>`:esc(s.team); return `<tr><td>${s.position}</td><td>${teamCell}</td><td>${s.played}</td><td>${s.won}</td><td>${s.draw}</td><td>${s.lost}</td><td>${s.gf}</td><td>${s.ga}</td><td><b>${s.pts}</b></td></tr>`}).join('') || '<tr><td colspan="9">لا توجد بيانات ترتيب الآن.</td></tr>'}</tbody></table>`;
    root.querySelector('.panel .pb').innerHTML = body;
  } catch(e){ root.querySelector('.panel .pb').innerHTML='<div>تعذر تحميل الترتيب.</div>'; }
}
export async function renderTeam(root){
  const core=await loadCore(); const id=qs('id')||''; const team=core.teams.find(t=>t.id===id);
  root.innerHTML = `${topBars('',core.site)}<div class="container">${panel('الفريق','',team?`<div class="team-grid"><div>${panel(team.name,'',`<div class="team-head"><div class="team-logo">${esc(team.name).slice(0,2)}</div><div><div><b>الملعب:</b> ${esc(team.stadium||'')}</div><div><b>المدرب:</b> ${esc(team.coach||'')}</div><div style="margin-top:8px">${esc(team.description||'')}</div></div></div>`)}${panel('أخبار الفريق','',`<ul class="clean">${(team.news||[]).map(n=>`<li>${esc(n)}</li>`).join('') || '<li>لا توجد أخبار مضافة بعد.</li>'}</ul>`)}${panel('المباريات القادمة','',`<div class="muted">ستظهر هنا مباريات الفريق القادمة عندما يدعمها المصدر المجاني بشكل مستقر.</div>`)} </div><div>${panel('روابط سريعة','',`<ul class="clean"><li><a href="./league.html?id=${encodeURIComponent(team.leagueId)}">الذهاب إلى الدوري</a></li><li><a href="./news.html">كل الأخبار</a></li></ul>`)}${panel('الأكثر قراءة','',`<ul class="clean">${core.popular.map(p=>`<li><a href="${p.url||'./news.html'}">${esc(p.title)}</a></li>`).join('')}</ul>`)}</div></div>`:'<div>الفريق غير موجود.</div>')}</div>`;
}
export async function renderMatch(root){
  const core=await loadCore(); const home=qs('home')||''; const away=qs('away')||''; const league=qs('league')||'';
  root.innerHTML = `${topBars('matches',core.site)}<div class="container">${panel('تفاصيل المباراة','',`<table class="table"><tbody><tr><th style="width:160px">الدوري</th><td><a href="./league.html?id=${encodeURIComponent(league)}">${esc(leagueName(core.leagues,league))}</a></td></tr><tr><th>المباراة</th><td><b>${esc(home)} × ${esc(away)}</b></td></tr></tbody></table><div class="small muted" style="margin-top:8px">هذه صفحة أساسية ويمكن توسيعها لاحقًا بالتشكيلات والأحداث.</div>`)}</div>`;
}
export async function renderNews(root){
  const core=await loadCore();
  root.innerHTML = `${topBars('news',core.site)}<div class="container"><div class="grid"><div>${panel('الأخبار الأكثر قراءة','',`<ul class="clean">${core.popular.map(p=>`<li><a href="${p.url||'./news.html'}">${esc(p.title)}</a></li>`).join('')}</ul>`)}${panel('أهم الدوريات','',leaguesBlock(core.leagues))}</div><div>${panel('الأخبار','',core.news.map(n=>`<div class="newsitem"><div class="nthumb"></div><div><div class="ntitle">${esc(n.title)}</div><div class="small muted">${esc(n.tag||'خبر')} — ${esc(n.date||'')}</div><div class="small muted" style="margin-top:4px">${esc(n.body||'')}</div></div></div>`).join(''))}</div><div>${panel('مختارات','',core.news.slice(0,4).map(n=>`<div class="mini"><div class="mthumb"></div><div><a href="./news.html">${esc(n.title)}</a></div></div>`).join(''))}</div></div></div>`;
}
