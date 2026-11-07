// ============================================================
//  Millî Mücadele Ekspresi — uygulama
// ============================================================
const KEY = 'mm-ekspres-v1';
const DEF = { name: '', done: {}, points: 0, treaties: {}, games: {}, exam: {}, teacher: false, mute: false };
let S = Object.assign({}, DEF, JSON.parse(localStorage.getItem(KEY) || '{}'));
const save = () => { localStorage.setItem(KEY, JSON.stringify(S)); renderStats(); };

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a, n) => shuffle(a).slice(0, n);
const idx = id => STATIONS.findIndex(s => s.id === id);

// ------------------------------------------------------------ ses
let AC;
function ac() { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); return AC; }
function tone(f, d, type = 'sine', v = .15, w = 0) {
  if (S.mute) return; try {
    const a = ac(), o = a.createOscillator(), g = a.createGain(), t = a.currentTime + w;
    o.type = type; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g).connect(a.destination); o.start(t); o.stop(t + d);
  } catch (e) {}
}
function noise(d = .5, v = .4) {
  if (S.mute) return; try {
    const a = ac(), b = a.createBuffer(1, a.sampleRate * d, a.sampleRate), ch = b.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / ch.length, 3);
    const s = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 700; g.gain.value = v; s.buffer = b; s.connect(f).connect(g).connect(a.destination); s.start();
  } catch (e) {}
}
const SFX = {
  ok() { tone(660, .15); tone(880, .25, 'sine', .15, .12); },
  no() { tone(220, .3, 'sawtooth', .07); },
  whistle() { tone(740, .7, 'triangle', .12); tone(932, .7, 'triangle', .08, .02); tone(740, .5, 'triangle', .1, .8); },
  boom() { noise(.6, .5); tone(80, .4, 'sine', .3); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, .3, 'triangle', .12, i * .14)); },
};

// ------------------------------------------------------------ yardımcılar
function toast(msg, ms = 2200) {
  const t = $('#toast'); t.innerHTML = msg; t.classList.remove('hidden');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.add('hidden'), ms);
}
function confetti(n = 80) {
  const c = $('#confetti');
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i');
    p.style.left = Math.random() * 100 + 'vw';
    p.style.background = Math.random() < .5 ? '#E30A17' : (Math.random() < .5 ? '#fff' : '#c9a24a');
    p.style.animationDelay = Math.random() * .8 + 's';
    p.style.animationDuration = 2 + Math.random() * 1.5 + 's';
    c.appendChild(p); setTimeout(() => p.remove(), 4000);
  }
}
function addPoints(n) { S.points += n; save(); }
const unlocked = i => S.teacher || i === 0 || !!S.done[STATIONS[i - 1].id];
const curIndex = () => { const i = STATIONS.findIndex(s => !S.done[s.id]); return i < 0 ? STATIONS.length - 1 : i; };
const doneCount = () => STATIONS.filter(s => S.done[s.id]).length;
const starCount = () => STATIONS.reduce((a, s) => a + (S.done[s.id] || 0), 0);

function optLabel(o) {
  if (typeof o === 'string' && o.startsWith('flag:')) {
    const cs = o.slice(5).split('+');
    return `<span class="flags">${cs.map(c => flag(c)).join('')}</span><span>${cs.map(c => FLAGS[c].name).join(' ve ')}</span>`;
  }
  return o;
}
function flagSvgAt(code, x, y, w, h) {
  return FLAGS[code].svg().replace('<svg ', `<svg x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none" `);
}

function renderStats() {
  $('#st-name').textContent = S.name ? '👤 ' + S.name : '👤 Yolcu';
  $('#st-done').textContent = doneCount();
  $('#st-total').textContent = STATIONS.length;
  $('#st-stars').textContent = starCount();
  $('#st-points').textContent = S.points;
  $('#mute').textContent = S.mute ? '🔇' : '🔊';
}

// ------------------------------------------------------------ yönlendirme
let VIEW = 'yolculuk';
const VIEWS = {};
function go(v) {
  if (v !== 'harita') MAPS.hunt = null;
  VIEW = v; $$('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.go === v));
  (VIEWS[v] || VIEWS.yolculuk)($('#view')); window.scrollTo({ top: 0 });
}
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]'); if (g) go(g.dataset.go);
});
$('#mute').onclick = () => { S.mute = !S.mute; save(); };

// ============================================================ YOLCULUK
function wagonHTML(st, i) {
  const lock = !unlocked(i), stars = S.done[st.id], cur = i === curIndex() && !stars;
  let pic;
  if (st.img) pic = `<img src="${st.img}" alt="${st.title}">`;
  else if (st.battle) pic = `<div class="fl">${flag('tr')}<span class="vs">VS</span>${st.battle.enemy.map(c => flag(c)).join('')}</div>`;
  else if (st.treaty) pic = `<div class="fl"><span class="ico" style="font-size:9cqw">${st.icon}</span>${TREATIES[st.treaty].taraflar.slice(0, 2).map(c => flag(c)).join('')}</div>`;
  else pic = `<span class="ico">${st.icon}</span>`;
  return `<div class="wagon ${lock ? 'lock' : ''} ${cur ? 'cur' : ''}" data-st="${i}" title="${st.title}">
    <img class="body" src="img/vagon.webp" alt="">
    ${cur ? '<span class="tp">📍 Buradasın!</span>' : ''}
    ${stars ? `<div class="w-stars">${'⭐'.repeat(stars)}</div>` : ''}
    <div class="w-title">${st.title}</div>
    <div class="w-pic">${pic}</div>
    <div class="w-tag">${st.tag}</div>
    <div class="w-date">${st.date}</div>
    <div class="w-text"><b>NE OLDU?</b>${st.ne}</div>
    <div class="w-no">${i + 1}</div>
    <div class="w-state">${lock ? '🔒' : stars ? '✅' : ''}</div>
  </div>`;
}

VIEWS.yolculuk = v => {
  const ci = curIndex(), st = STATIONS[ci], all = doneCount() === STATIONS.length;
  v.innerHTML = `
  <div class="hero-band">
    <div><h1 class="section-title">🚂 Bağımsızlığa ${STATIONS.length} Durak</h1>
    <p class="lead">Her vagon bir durak. Hikâyeyi dinle, Atatürk'ün sözünü tamamla, savaş meydanında soruları bil, antlaşmaları çantana topla!</p></div>
    <div class="progressbar" title="İlerleme"><i style="width:${doneCount() / STATIONS.length * 100}%"></i></div>
  </div>
  <div class="timeline">${STATIONS.map((s, i) => `<span class="tl ${S.done[s.id] ? 'done' : ''} ${i === ci && !S.done[s.id] ? 'cur' : ''} ${unlocked(i) ? '' : 'lock'}" data-st="${i}">${i + 1}. ${s.date.split('•')[0].replace(/.*(\d{4}).*/, '$1')} ${s.icon}</span>`).join('')}</div>
  <div class="train-wrap" id="tw">
    <div class="train">
      <div class="loco" id="loco"><div class="smoke"><i></i><i></i><i></i></div><img src="img/lokomotif.webp" alt="Millî Mücadele Ekspresi lokomotifi"><div class="loco-plate"><b>MİLLÎ<br>MÜCADELE</b><i>EKSPRESİ</i><small>Bağımsızlığa ${STATIONS.length} Durak</small></div></div>
      ${STATIONS.map(wagonHTML).join('')}
    </div>
    <div class="rails"></div>
  </div>
  <div class="below-train">
    <div class="card next-card">
      ${all ? `<h3>🎉 Cumhuriyet durağına ulaştın!</h3><p>Bütün durakları tamamladın. Karnene bakıp belgeni yazdırabilirsin. Yıldızı eksik durakları tekrar oynayabilirsin.</p>
        <button class="btn gold" data-go="karne">🏅 Karnem ve Belgem</button>`
      : `<div class="badge ${st.type}">${{ savas: '⚔️ SAVAŞ', antlasma: '📜 ANTLAŞMA', olay: '⭐ OLAY' }[st.type]}</div>
        <h3>Sıradaki durak: ${ci + 1}. ${st.title}</h3>
        <p style="margin:4px 0 12px"><b>${st.date}</b> • ${st.place}<br>${st.ne}</p>
        <button class="btn" id="enter">🚂 Durağa gir</button>`}
    </div>
    <div class="card mini-help">
      <b>Nasıl oynanır?</b>
      <ul><li>Vagona tıkla, durağa gir.</li><li>🔒 kilitli vagonlar, önceki durağı bitirince açılır.</li>
      <li>⭐⭐⭐ hatasız bitirirsen 3 yıldız!</li><li>🗺️ Haritada bütün savaşları gör, 📜 antlaşmaları topla.</li></ul>
    </div>
  </div>`;
  $$('[data-st]', v).forEach(el => el.onclick = () => openStation(+el.dataset.st));
  const en = $('#enter'); if (en) en.onclick = () => openStation(ci);
  // vagonu ortala
  const w = $(`.wagon[data-st="${ci}"]`, v), tw = $('#tw');
  if (w) setTimeout(() => { tw.scrollLeft = w.offsetLeft - tw.clientWidth / 2 + w.clientWidth / 2; }, 50);
};

// ============================================================ DURAK
const STEP_NAMES = { kanca: '🤔 Merak', hikaye: '📖 Hikâye', soz: '💬 Atatürk ne dedi?', savas: '⚔️ Savaş Meydanı', antlasma: '📜 Antlaşma', bilet: '🎫 Durak Bileti' };
let RUN = null;

function openStation(i) {
  if (!unlocked(i)) { SFX.no(); toast('🔒 Bu vagon kilitli. Önce önceki durağı tamamla!'); return; }
  const st = STATIONS[i];
  const steps = ['kanca', 'hikaye'];
  if (st.quote) steps.push('soz');
  if (st.battle) steps.push('savas');
  if (st.treaty) steps.push('antlasma');
  if (!st.battle) steps.push('bilet');
  RUN = { i, st, steps, step: 0, ok: {}, mistakes: 0, para: 0, first: !S.done[st.id] };
  $('#overlay').classList.remove('hidden'); document.body.style.overflow = 'hidden';
  SFX.whistle(); renderStep();
}
function closeStation() {
  $('#overlay').classList.add('hidden'); document.body.style.overflow = ''; RUN = null; go(VIEW);
}
$('#overlay').addEventListener('click', e => { if (e.target.id === 'overlay' && RUN) closeStation(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && RUN) closeStation(); });

function renderStep() {
  const { st, steps, step } = RUN, kind = steps[step];
  const sh = $('#sheet');
  sh.innerHTML = `
    <div class="st-head">
      <h2>${RUN.i + 1}. ${st.title}</h2>
      <div class="meta"><span class="badge ${st.type}">${{ savas: '⚔️ SAVAŞ', antlasma: '📜 ANTLAŞMA', olay: '⭐ OLAY' }[st.type]}</span>
      <span>📅 ${st.date}</span><span>📍 ${st.place}</span></div>
    </div>
    <button class="close" title="Kapat">✕</button>
    <div class="steps">${steps.map((k, j) => `<span class="${j === step ? 'on' : RUN.ok[k] ? 'ok' : ''}">${STEP_NAMES[k]}</span>`).join('')}</div>
    <div class="st-body" id="sb"></div>
    <div class="st-foot">
      <button class="btn light" id="back" ${step === 0 ? 'disabled' : ''}>◀ Geri</button>
      <button class="btn" id="next">${step === steps.length - 1 ? '🚂 Durağı tamamla' : 'İleri ▶'}</button>
    </div>`;
  $('.close', sh).onclick = closeStation;
  $('#back').onclick = () => { RUN.step--; renderStep(); };
  $('#next').onclick = () => {
    if (!RUN.ok[kind]) return;
    if (step === steps.length - 1) finishStation(); else { RUN.step++; renderStep(); }
  };
  STEPS[kind]($('#sb'), st);
  updateNext();
  $('#overlay').scrollTop = 0;
}
function updateNext() {
  const kind = RUN.steps[RUN.step], b = $('#next');
  if (b) b.disabled = !RUN.ok[kind];
}
function okStep(kind) { RUN.ok[kind] = true; updateNext(); }

const STEPS = {
  kanca(b, st) {
    b.innerHTML = `<div class="hook">
      ${st.img ? `<img src="${st.img}" alt="">` : `<div class="bigico">${st.icon}</div>`}
      <div class="bubble">${st.hook}</div></div>
      <div class="guess"><textarea placeholder="Sence ne olmuştur? Tahminini buraya yazabilirsin (isteğe bağlı)..."></textarea></div>`;
    okStep('kanca');
  },
  hikaye(b, st) {
    const draw = () => {
      const shown = st.story.slice(0, RUN.para + 1);
      const all = RUN.para >= st.story.length - 1;
      b.innerHTML = `<div class="story">
        ${st.img ? `<img class="pic" src="${st.img}" alt="">` : ''}
        ${shown.map((p, k) => `<p class="${k === shown.length - 1 ? 'new' : ''}">${p}</p>`).join('')}
        ${all ? `<div class="remember">🧠 <b>Aklında kalsın:</b> ${st.remember}</div>
          <div class="today">🎉 <b>Bugün nasıl anıyoruz?</b> ${st.today}</div>
          <details class="fact"><summary>🔍 Gerçek mi? (Öğretmen notu)</summary>${st.fact}</details>
          ${st.heroes ? `<p style="font-size:15px">🦸 Bu durakta tanıştığın kahramanlar: <b>${st.heroes.map(h => HEROES[h].ad).join(', ')}</b></p>` : ''}`
          : `<button class="btn green" id="more">Sonra ne oldu? ▼</button>`}
      </div>`;
      const m = $('#more', b); if (m) m.onclick = () => { RUN.para++; tone(520, .08); draw(); };
      if (all) okStep('hikaye');
    };
    if (RUN.ok.hikaye) RUN.para = st.story.length - 1;
    draw();
  },
  soz(b, st) {
    const q = st.quote, done = RUN.ok.soz;
    const full = q.text.replace(q.blank, `<b style="color:var(--gold2)">${q.blank}</b>`);
    const blanked = q.text.replace(q.blank, '<span class="blank">&nbsp;?&nbsp;</span>');
    b.innerHTML = `<p class="lead">💬 ${st.battle ? 'Bu savaşla ilgili' : 'Bu durakta'} söylenen sözü tamamla! <i>(${q.when})</i></p>
      <div class="quote-box"><div class="q" id="qq">“${done ? full : blanked}”</div>
      <div class="who">— ${q.when.includes('Mehmet Âkif') ? 'Mehmet Âkif Ersoy' : 'Mustafa Kemal Atatürk'}</div></div>
      <div class="opts" id="qo">${shuffle(q.opts).map(o => `<button class="opt" data-o="${o}">${o}</button>`).join('')}</div>
      <div id="qf"></div>`;
    if (done) return;
    $$('.opt', b).forEach(btn => btn.onclick = () => {
      if (RUN.ok.soz) return;
      if (btn.dataset.o === q.blank) {
        btn.classList.add('right'); SFX.ok(); $('#qq').innerHTML = `“${full}”`;
        $('#qf').innerHTML = '<div class="feedback ok">👏 Harika! Sözü doğru tamamladın. +15 puan</div>';
        if (RUN.first) addPoints(15); okStep('soz');
      } else { btn.classList.add('wrong'); SFX.no(); RUN.mistakes++; }
    });
  },
  savas(b, st) { battle(b, st); },
  antlasma(b, st) {
    const code = st.treaty;
    b.innerHTML = `<p class="lead">📜 Bu durakla ilgili bir antlaşma var. Oku ve çantana koy!</p>
      ${treatyCard(code, true)}
      <div style="text-align:center;margin-top:16px"><button class="btn gold" id="bag">🎒 Antlaşmayı çantama koy</button></div>`;
    const bb = $('#bag', b);
    if (RUN.ok.antlasma) { bb.disabled = true; bb.textContent = '✅ Çantanda'; return; }
    bb.onclick = () => {
      if (!S.treaties[code]) addPoints(10);
      S.treaties[code] = true; save(); SFX.ok(); bb.disabled = true; bb.textContent = '✅ Çantanda';
      toast('📜 ' + TREATIES[code].ad + ' çantana eklendi!'); okStep('antlasma');
    };
  },
  bilet(b, st) {
    if (RUN.ok.bilet) { b.innerHTML = '<div class="result-banner zafer">🎫 Biletin hazır!</div><p style="text-align:center">Durağı tamamlamak için aşağıdaki düğmeye bas.</p>'; return; }
    b.innerHTML = `<p class="lead">🎫 Bir sonraki vagona geçmek için durak biletini kazan: soruları doğru cevapla! Yanlış cevaplanan soru sona eklenir.</p><div id="qz"></div>`;
    quiz($('#qz', b), st.quiz, {
      retry: true, shuffleOpts: true,
      onRight: () => { if (RUN.first) addPoints(10); },
      onWrong: () => RUN.mistakes++,
      onDone: () => { okStep('bilet'); $('#qz', b).insertAdjacentHTML('beforeend', '<div class="result-banner zafer">🎫 Biletini kazandın!</div>'); },
    });
  },
};

function finishStation() {
  const { st, mistakes, first, i } = RUN;
  const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
  S.done[st.id] = Math.max(S.done[st.id] || 0, stars);
  if (first) addPoints(20); else save();
  SFX.whistle(); setTimeout(SFX.win, 700); confetti();
  const next = STATIONS[i + 1];
  $('#sheet').innerHTML = `
    <div class="st-head"><h2>✅ ${st.title} tamamlandı!</h2></div>
    <button class="close" title="Kapat">✕</button>
    <div class="st-body" style="text-align:center">
      <div style="font-size:64px">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
      <p style="font-size:20px">${stars === 3 ? 'Hatasız! Muhteşemsin!' : 'Güzel iş! Durağı tekrar oynayıp 3 yıldız alabilirsin.'}</p>
      <div class="remember" style="text-align:left">🧠 <b>Aklında kalsın:</b> ${st.remember}</div>
      ${st.heroes ? `<p>🦸 Kahraman kartları açıldı: <b>${st.heroes.map(h => HEROES[h].ad).join(', ')}</b></p>` : ''}
      ${st.lat && !st.off && !st.nomap ? '<p>🗺️ Haritada bu yer işaretlendi!</p>' : ''}
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px">
        <button class="btn light" id="tohome">🚂 Trene dön</button>
        ${next ? `<button class="btn" id="tonext">Sonraki durak: ${next.title} ▶</button>` : `<button class="btn gold" id="tocert">🏅 Belgemi al</button>`}
      </div>
    </div>`;
  $('.close').onclick = closeStation;
  $('#tohome').onclick = closeStation;
  const tn = $('#tonext'); if (tn) tn.onclick = () => openStation(i + 1);
  const tc = $('#tocert'); if (tc) tc.onclick = () => { closeStation(); go('karne'); };
  checkBadges();
}

// ------------------------------------------------------------ genel soru motoru
function quiz(box, questions, o = {}) {
  let queue = questions.map((q, k) => ({ ...q, k })), n = 0, total = questions.length, right = 0;
  const draw = () => {
    if (!queue.length) { o.onDone && o.onDone(right, total); return; }
    const q = queue[0];
    let opts = q.a.map((t, j) => ({ t, j }));
    if (o.shuffleOpts) opts = shuffle(opts);
    box.innerHTML = `<div class="qhead"><b>Soru ${Math.min(n + 1, o.retry ? total : total)} ${o.retry ? '' : '/ ' + total}</b>
      ${o.retry ? `<span>✅ ${right} / ${total}</span>` : ''}</div>
      <div class="qtext">${q.q}</div>
      <div class="opts">${opts.map((x, m) => `<button class="opt" data-j="${x.j}"><span class="k">${'ABCD'[m]}</span>${optLabel(x.t)}</button>`).join('')}</div>
      <div id="fb"></div>`;
    let answered = false;
    $$('.opt', box).forEach(btn => btn.onclick = () => {
      if (answered) return;
      const j = +btn.dataset.j;
      if (j === q.c) {
        answered = true; btn.classList.add('right'); SFX.ok(); right++;
        $('#fb', box).innerHTML = `<div class="feedback ok">✅ Doğru! ${q.why || ''}</div>`;
        o.onRight && o.onRight(q);
        queue.shift(); n++;
        setTimeout(draw, q.why ? 1600 : 900);
      } else {
        btn.classList.add('wrong'); SFX.no(); o.onWrong && o.onWrong(q);
        if (o.retry) {
          answered = true;
          const good = $(`.opt[data-j="${q.c}"]`, box); good && good.classList.add('right');
          $('#fb', box).innerHTML = `<div class="feedback no">❌ Doğru cevap: <b>${optLabel(q.a[q.c])}</b>. ${q.why || ''} Bu soru tekrar sorulacak.</div>
            <button class="btn light" id="cont" style="margin-top:8px">Devam ▶</button>`;
          queue.push(queue.shift());
          $('#cont', box).onclick = draw;
        } else {
          answered = true;
          const good = $(`.opt[data-j="${q.c}"]`, box); good && good.classList.add('right');
          $('#fb', box).innerHTML = `<div class="feedback no">❌ Doğru cevap: <b>${optLabel(q.a[q.c])}</b>. ${q.why || ''}</div>
            <button class="btn light" id="cont" style="margin-top:8px">Devam ▶</button>`;
          queue.shift(); n++;
          $('#cont', box).onclick = draw;
        }
      }
    });
  };
  draw();
}

// ------------------------------------------------------------ savaş meydanı
const CANNON = `<svg class="cannon" viewBox="0 0 70 40"><rect x="18" y="8" width="48" height="12" rx="5" fill="#333" transform="rotate(-12 40 14)"/><circle cx="24" cy="28" r="10" fill="#6b4b2a" stroke="#3a2a17" stroke-width="3"/><circle cx="24" cy="28" r="3" fill="#3a2a17"/></svg>`;
function battle(b, st) {
  const bt = st.battle, lose = bt.result === 'yenilgi';
  const enemyName = bt.enemy.map(c => FLAGS[c].name).join(' ve ');
  if (RUN.ok.savas) { b.innerHTML = `<div class="result-banner ${bt.result}">${lose ? '🏳️ Geri çekilme' : '🏆 ZAFER!'}</div><p style="text-align:center;font-size:19px">${bt.sonuc}</p>`; return; }
  b.innerHTML = `
    <div class="vsrow">${flag('tr', 'big wave')}<span class="vs">⚔️ VS ⚔️</span><span class="flags">${bt.enemy.map(c => flag(c, 'big wave')).join('')}</span></div>
    <p style="text-align:center;margin:0 0 10px">📍 <b>${st.place}</b> • 📅 <b>${st.date}</b><br>
      🇹🇷 Komutan: <b>${bt.commander}</b> &nbsp;|&nbsp; Karşı taraf: <b>${enemyName}</b></p>
    ${st.quote ? `<div class="quote-box" style="padding:14px;margin-bottom:12px"><div class="q" style="font-size:20px">“${st.quote.text}”</div><div class="who">${st.quote.when}</div></div>` : ''}
    <div style="text-align:center"><button class="btn" id="fight">💥 Savaşa başla! (Her doğru cevap bir top atışı)</button></div>`;
  $('#fight', b).onclick = () => startBattle(b, st);
}
function startBattle(b, st) {
  const bt = st.battle, lose = bt.result === 'yenilgi', n = st.quiz.length;
  let us = 100, them = 100;
  b.innerHTML = `
    <div class="arena ${bt.field}" id="ar">
      <div class="side us" id="sus">${flag('tr', 'big wave')}<div class="army">${bt.field === 'deniz' ? '🏰🏰' : '🪖🪖🪖'}</div>${CANNON}
        <span class="name">Türk Ordusu</span><div class="hp"><i id="hus" style="width:100%"></i></div></div>
      <div class="side them" id="sth"><span class="flags">${bt.enemy.map(c => flag(c, 'big wave')).join('')}</span>
        <div class="army">${bt.field === 'deniz' ? '🚢🚢🚢' : '🪖🪖🪖🪖'}</div>${bt.field === 'deniz' ? '' : CANNON}
        <span class="name">${bt.enemy.map(c => FLAGS[c].name).join(' + ')}</span><div class="hp"><i id="hth" style="width:100%"></i></div></div>
    </div>
    <div id="bq"></div>`;
  const ar = $('#ar', b);
  const shot = (dir) => {
    const ball = document.createElement('div'); ball.className = 'ball ' + (dir === 'r' ? 'go-r' : 'go-l'); ar.appendChild(ball);
    setTimeout(() => {
      ball.remove(); SFX.boom();
      const bm = document.createElement('div'); bm.className = 'boom'; bm.textContent = '💥';
      bm.style[dir === 'r' ? 'right' : 'left'] = '18%'; ar.appendChild(bm); setTimeout(() => bm.remove(), 700);
      const tgt = $(dir === 'r' ? '#sth' : '#sus', b); tgt.classList.add('hit'); setTimeout(() => tgt.classList.remove('hit'), 800);
      $('#hus', b).style.width = Math.max(us, 5) + '%'; $('#hth', b).style.width = Math.max(them, 5) + '%';
    }, 700);
  };
  quiz($('#bq', b), st.quiz, {
    retry: true, shuffleOpts: true,
    onRight: () => {
      if (RUN.first) addPoints(10);
      if (lose) { them -= 100 / n * .35; us -= 100 / n * .55; shot('r'); setTimeout(() => shot('l'), 500); }
      else { them -= 100 / n; shot('r'); }
    },
    onWrong: () => { RUN.mistakes++; us = Math.max(us - 12, 20); shot('l'); },
    onDone: () => {
      okStep('savas');
      setTimeout(() => {
        if (lose) {
          $('#sus', b).classList.add('retreat');
          $('#bq', b).innerHTML = `<div class="result-banner yenilgi">🏳️ Ordu geri çekildi… ama mücadele bitmedi!</div>
            <p style="text-align:center;font-size:19px">${bt.sonuc}</p>
            <p style="text-align:center">➡️ Ordu <b>Sakarya Nehri'nin doğusuna</b> çekildi. Sıradaki durakta büyük bir hazırlık var!</p>`;
        } else {
          them = 0; $('#hth', b).style.width = '0%'; $('#sth', b).classList.add('retreat'); SFX.win(); confetti(60);
          if (RUN.first) addPoints(20);
          $('#bq', b).innerHTML = `<div class="result-banner zafer">🏆 ZAFER!</div><p style="text-align:center;font-size:19px">${bt.sonuc}</p>`;
        }
      }, 900);
    },
  });
}

// ------------------------------------------------------------ antlaşma kartı
function treatyCard(code, open) {
  const t = TREATIES[code];
  const stamp = { iyi: 'BAŞARI', kotu: 'AĞIR ŞARTLAR', gecersiz: 'GEÇERSİZ' }[t.durum];
  if (!open) return `<div class="treaty locked"><h3>🔒 ${t.ad}</h3><p>Bu antlaşmayı açmak için ilgili durağı tamamla.</p></div>`;
  return `<div class="treaty"><span class="stamp ${t.durum}">${stamp}</span>
    <h3>📜 ${t.ad}</h3>
    <div>📅 <b>${t.tarih}</b> • 📍 ${t.yer}</div>
    <div style="margin:8px 0" class="flags">${t.taraflar.map(c => flag(c)).join('')}</div>
    <div><b>Taraflar:</b> ${t.tarafAd}</div>
    <div><b>Hangi savaş / olaydan sonra?</b> ${t.sonra}</div>
    <ul>${t.maddeler.map(m => `<li>${m}</li>`).join('')}</ul>
    <p style="margin:8px 0 0"><i>${t.not}</i></p></div>`;
}

// ============================================================ HARİTA
const MAP_LABEL = { canakkale: 'Çanakkale', mondros: 'İstanbul', 'izmir-isgal': 'İzmir', samsun: 'Samsun', amasya: 'Amasya', erzurum: 'Erzurum', sivas: 'Sivas', tbmm: 'Ankara', guney: 'Antep', dogu: 'Kars', inonu1: 'İnönü', kutahya: 'Kütahya', sakarya: 'Sakarya', 'buyuk-taarruz': 'Kocatepe', mudanya: 'Mudanya' };
const ROUTE = [[41.29, 36.33], [40.97, 35.66], [40.65, 35.83], [39.9, 41.27], [39.75, 37.02], [39.93, 32.86]];
let MAPS = { sel: null, cephe: {}, occ: false, hunt: null };

function mapMarkers() {
  const out = [];
  STATIONS.forEach((s, i) => {
    if (!s.lat || s.nomap || s.off) return;
    out.push({ id: s.id, i, lat: s.lat, lon: s.lon, label: MAP_LABEL[s.id] || s.title, st: s, main: true });
    (s.extra || []).forEach(x => out.push({ id: s.id + ':' + x.ad, i, lat: x.lat, lon: x.lon, label: x.ad, st: s, ex: x }));
  });
  return out;
}
function markerColor(m) { return m.st.cephe ? CEPHELER[m.st.cephe].renk : m.st.type === 'antlasma' ? '#2b6cb0' : '#555'; }

VIEWS.harita = v => {
  v.innerHTML = `<h1 class="section-title">🗺️ Millî Mücadele Haritası</h1>
    <p class="lead">Nerede ne oldu? İşaretlere tıkla. ⚔️ savaş, 📜 antlaşma, ⭐ önemli olay. Kırmızı kesikli çizgi Atatürk'ün Samsun'dan Ankara'ya yolculuğu.</p>
    <div class="map-tools" id="mt"></div>
    <div class="map-layout"><div class="map-box" id="mb"></div><div class="card info" id="mi"></div></div>`;
  drawMapTools(); drawMap(); drawInfo();
};
function drawMapTools() {
  const t = $('#mt');
  t.innerHTML = Object.entries(CEPHELER).map(([k, c]) => `<button class="chip ${MAPS.cephe[k] === false ? '' : 'on'}" data-c="${k}"><i style="background:${c.renk}"></i>${c.ad}</button>`).join('') +
    `<button class="chip ${MAPS.occ ? 'on' : ''}" id="occ">🚩 Mondros sonrası işgaller</button>
     <button class="btn gold" id="hunt" style="padding:6px 14px;font-size:15px">🎯 Harita Avı oyunu</button>`;
  $$('[data-c]', t).forEach(b => b.onclick = () => { MAPS.cephe[b.dataset.c] = MAPS.cephe[b.dataset.c] === false; drawMapTools(); drawMap(); });
  $('#occ').onclick = () => { MAPS.occ = !MAPS.occ; drawMapTools(); drawMap(); drawInfo(); };
  $('#hunt').onclick = startHunt;
}
function drawMap() {
  if (!$('#mb')) return;
  const P = MAP.paths, W = MAP.W, H = MAP.H;
  const neigh = ['gr', 'bg', 'sy', 'iq', 'ir', 'am', 'ge', 'az', 'cy', 'cy2'];
  const route = ROUTE.map(([la, lo], k) => { const [x, y] = proj(la, lo); return (k ? 'L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1); }).join('');
  let svg = `<svg viewBox="0 0 ${W} ${H}" id="msvg">
    <rect width="${W}" height="${H}" fill="#a9d4ee"/>
    ${neigh.map(k => P[k] ? `<path d="${P[k]}" fill="#e9e4d6" stroke="#b9ae94" stroke-width="1"/>` : '').join('')}
    <path d="${P.tr}" fill="#fff6dc" stroke="#7a1420" stroke-width="2"/>
    <text x="${W * .47}" y="${H * .5}" font-size="30" fill="#7a142022" font-family="Georgia" font-weight="700" text-anchor="middle">ANADOLU</text>
    <text x="${W * .4}" y="${H * .1}" font-size="16" fill="#2b6cb0aa" font-style="italic" text-anchor="middle">Karadeniz</text>
    <text x="${W * .35}" y="${H * .96}" font-size="16" fill="#2b6cb0aa" font-style="italic" text-anchor="middle">Akdeniz</text>
    <text x="${W * .03}" y="${H * .62}" font-size="14" fill="#2b6cb0aa" font-style="italic">Ege Denizi</text>`;
  if (MAPS.cephe.yol !== false) {
    svg += `<path class="route" d="${route}"/>`;
    const [hx, hy] = proj(40.97, 35.66);
    svg += `<circle cx="${hx}" cy="${hy}" r="4" fill="#7a1420"/><text x="${hx - 6}" y="${hy - 6}" font-size="11" text-anchor="end" font-weight="700" fill="#7a1420">Havza</text>`;
    svg += `<text font-size="22"><animateMotion dur="14s" repeatCount="indefinite" path="${route}"/>🚂</text>`;
  }
  if (MAPS.occ) OCCUPATIONS.forEach(o => {
    const [x, y] = proj(o.lat, o.lon);
    svg += `<g><circle cx="${x}" cy="${y}" r="22" fill="#e53e3e33" stroke="#c53030" stroke-dasharray="4 3"/>${flagSvgAt(o.f, x - 15, y - 34, 30, 20)}</g>`;
  });
  mapMarkers().forEach(m => {
    if (m.st.cephe && MAPS.cephe[m.st.cephe] === false) return;
    const [x, y] = proj(m.lat, m.lon), done = !!S.done[m.st.id], col = markerColor(m);
    const ico = m.st.type === 'savas' ? '⚔' : m.st.type === 'antlasma' ? '✒' : '★';
    const left = m.lon > 41.2 || (m.ex && m.ex.left);
    const hunting = !!MAPS.hunt;
    svg += `<g class="mk ${MAPS.sel === m.id ? 'sel' : ''}" data-m="${m.id}">
      ${!hunting && m.main && m.i === curIndex() && !done ? `<circle class="pulse" cx="${x}" cy="${y}" r="10" fill="${col}"/>` : ''}
      <circle class="dot" cx="${x}" cy="${y}" r="${m.main ? 10 : 7}" fill="${hunting ? '#7a1420' : col}" opacity="${hunting ? .55 : 1}"/>
      ${hunting ? '' : `<text x="${x}" y="${y + 4}" text-anchor="middle" style="stroke:none;fill:#fff;font-size:${m.main ? 11 : 9}px">${ico}</text>
      <text x="${left ? x - 13 : x + 13}" y="${y + 4}" text-anchor="${left ? 'end' : 'start'}">${m.label}${done && m.main ? ' ✅' : ''}</text>`}
      ${!hunting && m.main && m.st.battle ? bt(m, x, y, left) : ''}
    </g>`;
  });
  svg += `</svg>`;
  if (MAPS.hunt) svg += `<div class="hunt-q">🎯 ${MAPS.hunt.round + 1}/${MAPS.hunt.list.length}: <u>${MAPS.hunt.list[MAPS.hunt.round].st.title}</u> nerede? Haritaya tıkla!</div>`;
  $('#mb').innerHTML = svg;
  function bt(m, x, y, left) {
    return m.st.battle.enemy.map((c, k) => flagSvgAt(c, left ? x - 34 - k * 24 : x + 12 + k * 24, y + 9, 21, 14)).join('');
  }
  const s = $('#msvg');
  $$('.mk', s).forEach(g => g.onclick = e => { if (MAPS.hunt) return; e.stopPropagation(); MAPS.sel = g.dataset.m; SFX.ok(); drawMap(); drawInfo(); });
  s.onclick = e => { if (MAPS.hunt) huntClick(e, s); };
}
function drawInfo() {
  const box = $('#mi'); if (!box) return;
  if (MAPS.hunt) {
    const h = MAPS.hunt;
    box.innerHTML = `<h3>🎯 Harita Avı</h3><p>Sorulan yeri haritada bul ve tıkla.</p><p>Doğru: <b>${h.score}</b> / ${h.round}</p><div id="hf">${h.msg || ''}</div>
      <button class="btn light" id="hstop">Oyunu bitir</button>`;
    $('#hstop').onclick = () => { MAPS.hunt = null; drawMap(); drawInfo(); };
    return;
  }
  const m = mapMarkers().find(x => x.id === MAPS.sel);
  if (!m) {
    box.innerHTML = `<h3>Haritayı keşfet</h3>
      <p>Bir işarete tıklayınca burada bilgisi çıkar.</p>
      ${MAPS.occ ? `<div class="remember"><b>Mondros sonrası işgaller</b><br>${OCCUPATIONS.map(o => `${flag(o.f, 'sm')} ${FLAGS[o.f].name} → ${o.ad}`).join('<br>')}</div>` : ''}
      <p style="font-size:14px">🌍 <b>Harita dışındaki yerler:</b><br>Selanik (Atatürk'ün doğduğu şehir), Sevr (Fransa), Lozan (İsviçre).</p>
      <p style="font-size:14px">⚔️ <b>Cepheler:</b><br>Doğu → Ermeniler ${flag('am', 'sm')}<br>Güney → Fransızlar ${flag('fr', 'sm')}<br>Batı → Yunanlar ${flag('gr', 'sm')}</p>`;
    return;
  }
  const s = m.st, i = m.i, bt = s.battle;
  box.innerHTML = `<span class="badge ${s.type}">${{ savas: '⚔️ SAVAŞ', antlasma: '📜 ANTLAŞMA', olay: '⭐ OLAY' }[s.type]}</span>
    <h3>${m.ex ? m.ex.ad + ' — ' : ''}${s.title}</h3>
    <div>📅 <b>${s.date}</b><br>📍 ${s.place}</div>
    ${s.cephe ? `<div>🧭 ${CEPHELER[s.cephe].ad}</div>` : ''}
    ${m.ex ? `<div class="remember">${m.ex.not}</div>` : ''}
    ${bt ? `<div style="margin:8px 0">${flag('tr')} <b>VS</b> ${bt.enemy.map(c => flag(c)).join(' ')}<br>
      Komutan: <b>${bt.commander}</b><br>Sonuç: <b style="color:${bt.result === 'zafer' ? 'var(--ok)' : 'var(--bad)'}">${bt.result === 'zafer' ? '🏆 Zafer' : '🏳️ Kaybedildi, geri çekilindi'}</b></div>` : ''}
    <p>${s.ne}</p>
    ${s.quote ? `<p><i>“${s.quote.text}”</i></p>` : ''}
    ${s.treaty ? `<p>📜 Antlaşma: <b>${TREATIES[s.treaty].ad}</b> (${TREATIES[s.treaty].tarih})</p>` : ''}
    ${unlocked(i) ? `<button class="btn" id="goSt">🚂 Durağa git</button>` : '<p>🔒 Önce önceki durakları tamamla.</p>'}`;
  const g = $('#goSt'); if (g) g.onclick = () => openStation(i);
}
function startHunt() {
  const list = pick(mapMarkers().filter(m => m.main), 8);
  MAPS.hunt = { list, round: 0, score: 0, msg: '' }; MAPS.sel = null; drawMap(); drawInfo(); SFX.whistle();
}
function huntClick(e, s) {
  const h = MAPS.hunt, pt = s.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
  const p = pt.matrixTransform(s.getScreenCTM().inverse());
  const target = h.list[h.round], [tx, ty] = proj(target.lat, target.lon);
  const d = Math.hypot(p.x - tx, p.y - ty);
  const ok = d < 40;
  if (ok) { h.score++; SFX.ok(); h.msg = `<div class="feedback ok">✅ Doğru! ${target.st.title}: ${target.label} (${target.st.date})</div>`; }
  else { SFX.no(); h.msg = `<div class="feedback no">❌ ${target.st.title} burada: <b>${target.label}</b> (yeşil daire)</div>`; }
  const mark = `<circle cx="${tx}" cy="${ty}" r="18" fill="none" stroke="${ok ? '#2f855a' : '#2f855a'}" stroke-width="4"/><text x="${tx + 22}" y="${ty + 5}" font-weight="700" font-size="14" style="paint-order:stroke;stroke:#fff;stroke-width:3px">${target.label}</text>
    ${ok ? '' : `<line x1="${p.x}" y1="${p.y}" x2="${tx}" y2="${ty}" stroke="#c53030" stroke-width="2" stroke-dasharray="5 4"/><circle cx="${p.x}" cy="${p.y}" r="6" fill="#c53030"/>`}`;
  s.insertAdjacentHTML('beforeend', mark);
  h.round++; s.onclick = null;
  drawInfo();
  setTimeout(() => {
    if (!$('#mi') || MAPS.hunt !== h) return;
    if (h.round >= h.list.length) {
      S.games.hunt = Math.max(S.games.hunt || 0, h.score); if (h.score >= 6) confetti(); addPoints(h.score * 2);
      MAPS.hunt = null; drawMap();
      $('#mi').innerHTML = `<h3>🎯 Harita Avı bitti!</h3><p style="font-size:22px">Skor: <b>${h.score} / ${h.list.length}</b></p>
        <p>${h.score >= 6 ? '🗺️ Harika bir harita kâşifisin!' : 'Bir daha dene, yerleri öğreneceksin!'}</p><button class="btn gold" id="again">Tekrar oyna</button>`;
      $('#again').onclick = startHunt; checkBadges();
    } else drawMap();
  }, 1500);
}

// ============================================================ ANTLAŞMALAR
const TREATY_ORDER = ['mondros', 'sevr', 'gumru', 'ankara', 'mudanya', 'lozan'];
VIEWS.antlasmalar = v => {
  const have = TREATY_ORDER.filter(c => S.treaties[c] || S.teacher).length;
  v.innerHTML = `<h1 class="section-title">📜 Antlaşma Çantam (${have}/${TREATY_ORDER.length})</h1>
    <p class="lead">Savaşların sonunda masaya oturulur. Hangi savaştan sonra hangi antlaşma imzalandı? Durakları tamamladıkça antlaşmalar çantana gelir.</p>
    <div class="card" style="margin-bottom:16px"><h3 style="margin-top:0;color:var(--bord)">⚔️ Savaş → 📜 Antlaşma zinciri</h3>
      <div class="chain">
        ${[['I. Dünya Savaşı (Çanakkale dahil) kaybedildi', 'mondros'], ['İşgaller sürerken İstanbul hükümeti imzaladı', 'sevr'], ['Doğu Cephesi: Kars alındı', 'gumru'], ['Güney Cephesi + Sakarya Zaferi', 'ankara'], ['Büyük Taarruz zaferi', 'mudanya'], ['Kurtuluş Savaşı kazanıldı', 'lozan']]
          .map(([a, c]) => `<div class="a">${a}</div><div class="arr">➜</div><div class="a"><span class="flags">${TREATIES[c].taraflar.map(f => flag(f, 'sm')).join('')}</span> <b>${S.treaties[c] || S.teacher ? TREATIES[c].ad : '🔒 ???'}</b> ${S.treaties[c] || S.teacher ? '<small>(' + TREATIES[c].tarih + ')</small>' : ''}</div>`).join('')}
      </div></div>
    <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(320px,1fr))">${TREATY_ORDER.map(c => treatyCard(c, S.treaties[c] || S.teacher)).join('')}</div>`;
};

// ============================================================ KAHRAMANLAR
VIEWS.kahramanlar = v => {
  const open = h => S.teacher || STATIONS.some(s => (s.heroes || []).includes(h) && S.done[s.id]);
  const keys = Object.keys(HEROES);
  v.innerHTML = `<h1 class="section-title">🦸 Kahramanlar ve Hikâye Notları (${keys.filter(open).length}/${keys.length})</h1>
    <p class="lead">Durakları tamamladıkça kahraman kartları açılır. Karta tıkla, arkasını çevir!</p>
    <div class="grid">${keys.map(k => {
      const h = HEROES[k], o = open(k);
      return `<div class="hcard ${o ? '' : 'locked'}" data-h="${k}"><div class="in">
        <div class="f"><div class="e">${h.emoji}</div><h3>${o ? h.ad : '???'}</h3><small>${o ? h.yer : '🔒 Durakları tamamla'}</small></div>
        <div class="b"><b style="color:var(--bord)">${h.emoji} ${h.ad}</b><small>${h.yer}</small><p>${h.not}</p></div></div></div>`;
    }).join('')}</div>`;
  $$('.hcard', v).forEach(c => c.onclick = () => {
    if (c.classList.contains('locked')) { SFX.no(); toast('🔒 Bu kahramanı tanımak için ilgili durağı tamamla.'); return; }
    c.classList.toggle('flip'); tone(600, .08);
  });
};

// ============================================================ OYUNLAR
VIEWS.oyunlar = v => {
  const g = S.games;
  v.innerHTML = `<h1 class="section-title">🎮 Oyun Alanı</h1><p class="lead">Öğrendiklerini oyunlarla pekiştir. En iyi skorların karnene yazılır.</p>
    <div class="grid game-cards">
      <div class="card"><div class="e">💬</div><h3>Söz Avcısı</h3><p>Atatürk bu sözü hangi durakta / savaşta söyledi?</p><p>En iyi: <b>${g.soz ?? '-'}</b></p><button class="btn" data-g="soz">Oyna</button></div>
      <div class="card"><div class="e">📜</div><h3>Antlaşma Masası</h3><p>Hangi antlaşma kimlerle ve hangi savaştan sonra imzalandı?</p><p>En iyi: <b>${g.ant ?? '-'}</b></p><button class="btn" data-g="ant">Oyna</button></div>
      <div class="card"><div class="e">🚂</div><h3>Zaman Treni</h3><p>Vagonları doğru tarih sırasına diz!</p><p>Kazanılan: <b>${g.sira || 0}</b></p><button class="btn" data-g="sira">Oyna</button></div>
      <div class="card"><div class="e">🎯</div><h3>Harita Avı</h3><p>Savaşların ve olayların yerini haritada bul!</p><p>En iyi: <b>${g.hunt ?? '-'}</b> / 8</p><button class="btn" data-g="hunt">Oyna</button></div>
    </div><div id="game" style="margin-top:18px"></div>`;
  $$('[data-g]', v).forEach(b => b.onclick = () => {
    const k = b.dataset.g;
    if (k === 'hunt') { go('harita'); startHunt(); return; }
    GAMES[k]($('#game')); $('#game').scrollIntoView({ behavior: 'smooth' });
  });
};
const GAMES = {
  soz(box) {
    const qs = STATIONS.filter(s => s.quote).map(s => {
      const wrong = pick(STATIONS.filter(x => x.id !== s.id && x.quote).map(x => x.title), 3);
      const a = shuffle([s.title, ...wrong]);
      return { q: `“${s.quote.text}”<br><small style="font-weight:400">Bu söz hangi durakla ilgili?</small>`, a, c: a.indexOf(s.title), why: `${s.title}: ${s.quote.when}.` };
    });
    box.innerHTML = '<div class="card"><h3>💬 Söz Avcısı</h3><div id="gq"></div></div>';
    quiz($('#gq', box), shuffle(qs), {
      onDone: (r, t) => { S.games.soz = Math.max(S.games.soz || 0, r); addPoints(r); endGame(box, r, t, 'soz'); },
    });
  },
  ant(box) {
    const qs = [];
    TREATY_ORDER.forEach(c => {
      const t = TREATIES[c];
      const others = t.taraflar.filter(f => f !== 'tr' && f !== 'ot');
      const correct = 'flag:' + others.slice(0, 2).join('+');
      const pool = ['flag:am', 'flag:fr', 'flag:gr', 'flag:gb', 'flag:it', 'flag:gb+fr', 'flag:gr+it'].filter(x => x !== correct && !(others.length === 1 && x === 'flag:' + others[0]));
      const a1 = shuffle([correct, ...pick(pool, 3)]);
      qs.push({ q: `${t.ad} (${t.tarih}) ile ilgili: Karşı tarafta hangi ${others.length > 1 ? 'devletler' : 'devlet'} vardı?${others.length > 2 ? ' <small>(ilk ikisi)</small>' : ''}`, a: a1, c: a1.indexOf(correct), why: t.tarafAd });
      const a2 = shuffle([t.sonra, ...pick(TREATY_ORDER.filter(x => x !== c).map(x => TREATIES[x].sonra), 3)]);
      qs.push({ q: `${t.ad} hangi savaş / olaydan sonra imzalandı?`, a: a2, c: a2.indexOf(t.sonra) });
    });
    box.innerHTML = '<div class="card"><h3>📜 Antlaşma Masası</h3><div id="gq"></div></div>';
    quiz($('#gq', box), shuffle(qs), {
      onDone: (r, t) => { S.games.ant = Math.max(S.games.ant || 0, r); addPoints(r); endGame(box, r, t, 'ant'); },
    });
  },
  sira(box) {
    const set = pick(STATIONS.map((s, i) => ({ s, i })), 5).sort((a, b) => a.i - b.i);
    let chosen = [];
    const draw = () => {
      const pool = shuffle(set).filter(x => !chosen.includes(x));
      box.innerHTML = `<div class="card"><h3>🚂 Zaman Treni</h3><p>Olaylara tıklayarak <b>en eskiden en yeniye</b> doğru sırala.</p>
        <div><b>Trenin:</b></div><div class="order-done">🚂 ${chosen.map(x => `<span class="ochip done">${x.s.icon} ${x.s.title}</span>`).join('')}</div>
        <div><b>Olaylar:</b></div><div class="order-pool">${pool.map(x => `<button class="ochip" data-i="${x.i}">${x.s.icon} ${x.s.title}</button>`).join('')}</div>
        <div id="sf"></div><button class="btn light" id="sreset">↺ Baştan</button></div>`;
      $$('.ochip[data-i]', box).forEach(b => b.onclick = () => {
        chosen.push(set.find(x => x.i === +b.dataset.i)); tone(500 + chosen.length * 80, .1);
        if (chosen.length === set.length) check(); else draw();
      });
      $('#sreset', box).onclick = () => { chosen = []; draw(); };
    };
    const check = () => {
      draw();
      const ok = chosen.every((x, k) => x.i === set[k].i);
      $('#sf', box).innerHTML = ok
        ? `<div class="feedback ok">✅ Tebrikler, tren doğru sırada! 🚂💨</div>`
        : `<div class="feedback no">❌ Sıra karıştı. Doğrusu:<br>${set.map(x => `${x.s.title} <small>(${x.s.date})</small>`).join(' → ')}</div>`;
      $('.order-pool', box).innerHTML = `<button class="btn" id="snew">Yeni tren</button>`;
      $('#snew', box).onclick = () => GAMES.sira(box);
      if (ok) { SFX.whistle(); confetti(50); S.games.sira = (S.games.sira || 0) + 1; addPoints(5); checkBadges(); } else SFX.no();
    };
    draw();
  },
};
function endGame(box, r, t, k) {
  box.innerHTML = `<div class="card" style="text-align:center"><h3>Oyun bitti!</h3><p style="font-size:26px">Skor: <b>${r} / ${t}</b></p>
    <button class="btn" id="re">Tekrar oyna</button></div>`;
  if (r / t >= .8) { confetti(); SFX.win(); }
  $('#re', box).onclick = () => GAMES[k](box);
  checkBadges();
}

// ============================================================ BÜYÜK SINAV
VIEWS.sinav = v => {
  const e = S.exam;
  v.innerHTML = `<h1 class="section-title">📝 Büyük Sınav</h1>
    <p class="lead">"Millî Mücadele Dönemi Genel Değerlendirme" testleri. Her soru bir kez sorulur, sonunda puanın çıkar.</p>
    <div class="grid game-cards">
      <div class="card"><div class="e">1️⃣</div><h3>Test 1</h3><p>16 soru</p><p>En iyi: <b>${e.t1 ?? '-'}</b>/16</p><button class="btn" data-t="t1">Başla</button></div>
      <div class="card"><div class="e">2️⃣</div><h3>Test 2</h3><p>16 soru</p><p>En iyi: <b>${e.t2 ?? '-'}</b>/16</p><button class="btn" data-t="t2">Başla</button></div>
      <div class="card"><div class="e">🏆</div><h3>Hepsi</h3><p>32 soru</p><p>En iyi: <b>${e.all ?? '-'}</b>/32</p><button class="btn gold" data-t="all">Başla</button></div>
    </div><div id="ex" style="margin-top:18px"></div>`;
  $$('[data-t]', v).forEach(b => b.onclick = () => {
    const t = b.dataset.t, qs = t === 't1' ? EXAM.slice(0, 16) : t === 't2' ? EXAM.slice(16) : EXAM;
    const box = $('#ex'); box.innerHTML = '<div class="card"><div id="eq"></div></div>'; box.scrollIntoView({ behavior: 'smooth' });
    quiz($('#eq', box), qs, {
      onDone: (r, n) => {
        S.exam[t] = Math.max(S.exam[t] || 0, r); addPoints(r);
        box.innerHTML = `<div class="card" style="text-align:center"><h3>Sınav bitti!</h3><p style="font-size:30px"><b>${r} / ${n}</b> doğru</p>
          <p style="font-size:20px">${r / n >= .9 ? '🏆 Mükemmel!' : r / n >= .7 ? '👏 Çok iyi!' : '💪 Durakları tekrar gezip yeniden dene!'}</p>
          <button class="btn" onclick="go('sinav')">Sınav menüsü</button></div>`;
        if (r / n >= .8) { confetti(); SFX.win(); }
        checkBadges();
      },
    });
  });
};

// ============================================================ KARNE + ROZETLER
const BADGES = [
  { k: 'ilk', e: '🚩', ad: 'İlk Adım', d: 'Samsun durağını tamamla', t: () => S.done.samsun },
  { k: 'kongre', e: '🤝', ad: 'Kongre Uzmanı', d: 'Amasya, Erzurum ve Sivas', t: () => S.done.amasya && S.done.erzurum && S.done.sivas },
  { k: 'meclis', e: '🏛️', ad: 'Meclis Muhafızı', d: 'TBMM durağı', t: () => S.done.tbmm },
  { k: 'cephe', e: '⚔️', ad: 'Cephe Komutanı', d: 'Bütün savaşları kazan', t: () => STATIONS.filter(s => s.battle).every(s => S.done[s.id]) },
  { k: 'ant', e: '📜', ad: 'Antlaşma Uzmanı', d: '6 antlaşmayı topla', t: () => TREATY_ORDER.every(c => S.treaties[c]) },
  { k: 'harita', e: '🗺️', ad: 'Harita Kâşifi', d: 'Harita Avı\'nda en az 6/8', t: () => (S.games.hunt || 0) >= 6 },
  { k: 'soz', e: '💬', ad: 'Söz Ustası', d: 'Söz Avcısı\'nda en az 8 doğru', t: () => (S.games.soz || 0) >= 8 },
  { k: 'sira', e: '🚂', ad: 'Zaman Makinisti', d: 'Zaman Treni\'ni doğru diz', t: () => (S.games.sira || 0) >= 1 },
  { k: 'sinav', e: '📝', ad: 'Sınav Şampiyonu', d: 'Büyük Sınav\'da en az 28/32', t: () => (S.exam.all || 0) >= 28 },
  { k: 'yildiz', e: '🌟', ad: 'Altın Yıldız', d: 'Bütün duraklarda 3 yıldız', t: () => STATIONS.every(s => S.done[s.id] === 3) },
  { k: 'cumhuriyet', e: '🇹🇷', ad: 'Cumhuriyet Yolcusu', d: 'Bütün durakları bitir', t: () => STATIONS.every(s => S.done[s.id]) },
];
function checkBadges() {
  S.badges = S.badges || {};
  BADGES.forEach(b => { if (b.t() && !S.badges[b.k]) { S.badges[b.k] = true; setTimeout(() => toast(`🏅 Yeni rozet: ${b.e} ${b.ad}!`, 3000), 600); } });
  save();
}
VIEWS.karne = v => {
  const all = STATIONS.every(s => S.done[s.id]);
  const today = new Date().toLocaleDateString('tr-TR');
  v.innerHTML = `<h1 class="section-title">🏅 Karnem</h1>
    <div class="grid no-print" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr));margin-bottom:16px">
      <div class="card"><b>👤 Yolcu</b><br><span style="font-size:22px">${S.name || '-'}</span><br><button class="btn light" id="rename" style="margin-top:6px;font-size:14px;padding:4px 10px">Adımı değiştir</button></div>
      <div class="card"><b>🎫 Duraklar</b><br><span style="font-size:28px">${doneCount()} / ${STATIONS.length}</span></div>
      <div class="card"><b>⭐ Yıldız</b><br><span style="font-size:28px">${starCount()} / ${STATIONS.length * 3}</span></div>
      <div class="card"><b>🏆 Puan</b><br><span style="font-size:28px">${S.points}</span></div>
    </div>
    <h2 class="serif no-print" style="color:var(--bord)">Rozetler</h2>
    <div class="badges no-print">${BADGES.map(b => `<div class="bdg ${b.t() ? '' : 'off'}"><div class="e">${b.e}</div><b>${b.ad}</b><small>${b.d}</small></div>`).join('')}</div>
    <h2 class="serif no-print" style="color:var(--bord)">Durak durak ilerleme</h2>
    <div class="card no-print" style="columns:2 260px">${STATIONS.map((s, i) => `<div>${S.done[s.id] ? '✅' : unlocked(i) ? '▶️' : '🔒'} ${i + 1}. ${s.title} ${S.done[s.id] ? '⭐'.repeat(S.done[s.id]) : ''}</div>`).join('')}</div>
    <h2 class="serif" style="color:var(--bord)">Belge</h2>
    ${all ? `<div class="cert"><div style="font-size:50px">🇹🇷</div><h2>Millî Mücadele Ekspresi<br>Yolculuk Belgesi</h2>
        <p>Samsun'dan Cumhuriyet'e uzanan ${STATIONS.length} durağın hepsini başarıyla tamamlayan</p>
        <div class="nm">${S.name || 'Yolcu'}</div>
        <p>bu belgeyi almaya hak kazanmıştır. ⭐ ${starCount()} yıldız • 🏆 ${S.points} puan</p>
        <p><i>“Egemenlik kayıtsız şartsız milletindir.”</i></p><small>${today}</small></div>
        <p class="no-print" style="text-align:center"><button class="btn gold" onclick="print()">🖨️ Belgeyi yazdır</button></p>`
      : `<div class="card">🔒 Belge, bütün durakları tamamlayınca açılır. (${doneCount()}/${STATIONS.length})</div>`}
    <div class="card no-print" style="margin-top:20px"><h3 style="margin-top:0">👩‍🏫 Öğretmen / Veli ayarları</h3>
      <label><input type="checkbox" id="teach" ${S.teacher ? 'checked' : ''}> Öğretmen modu: bütün vagonları, kahramanları ve antlaşmaları aç (sınıfta anlatım için)</label>
      <p><button class="btn light" id="reset">🗑️ İlerlemeyi sıfırla</button></p></div>`;
  $('#teach').onchange = e => { S.teacher = e.target.checked; save(); toast(S.teacher ? 'Öğretmen modu açık' : 'Öğretmen modu kapalı'); };
  $('#reset').onclick = () => { if (confirm('Bütün ilerleme silinsin mi?')) { const m = S.mute; S = Object.assign({}, DEF, { done: {}, treaties: {}, games: {}, exam: {}, mute: m }); save(); askName(); go('yolculuk'); } };
  $('#rename').onclick = askName;
};

// ------------------------------------------------------------ hoş geldin
function askName() {
  $('#overlay').classList.remove('hidden');
  $('#sheet').innerHTML = `<div class="st-head"><h2>🚂 Millî Mücadele Ekspresi'ne hoş geldin!</h2></div>
    <div class="st-body" style="text-align:center">
      <img src="img/lokomotif.webp" alt="" style="width:min(420px,90%)">
      <p style="font-size:19px">Samsun'dan başlayıp Cumhuriyet'e uzanan bir yolculuğa çıkıyoruz.<br>Her durakta bir hikâye, bir söz, bazen bir savaş ve bir antlaşma seni bekliyor!</p>
      <p><b>Yolcunun adı nedir?</b></p>
      <input class="name" id="nm" maxlength="30" placeholder="Adını yaz" value="${S.name || ''}">
      <p><button class="btn" id="startbtn">Yolculuğa başla 🚂</button></p>
    </div>`;
  const f = () => { S.name = $('#nm').value.trim() || 'Yolcu'; save(); $('#overlay').classList.add('hidden'); SFX.whistle(); go(VIEW); };
  $('#startbtn').onclick = f; $('#nm').onkeydown = e => { if (e.key === 'Enter') f(); }; setTimeout(() => $('#nm').focus(), 50);
}

// ------------------------------------------------------------ başlat
renderStats();
go('yolculuk');
if (!S.name) askName();
