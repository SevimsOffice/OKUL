// Bayraklar: basit, elle çizilmiş SVG'ler (dönemi temsil eder).
let _flagId = 0;

function star(cx, cy, R, rot) {
  const r = R * 0.382, pts = [];
  for (let i = 0; i < 10; i++) {
    const a = rot + i * Math.PI / 5, rad = i % 2 ? r : R;
    pts.push((cx + rad * Math.cos(a)).toFixed(2) + ',' + (cy + rad * Math.sin(a)).toFixed(2));
  }
  return `<polygon points="${pts.join(' ')}" fill="#fff"/>`;
}

const FLAGS = {
  tr: { name: 'Türkiye (TBMM)', svg: () =>
    `<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#E30A17"/>
     <circle cx="10" cy="10" r="5" fill="#fff"/><circle cx="11.25" cy="10" r="4" fill="#E30A17"/>
     ${star(16.6, 10, 2.5, Math.PI)}</svg>` },
  ot: { name: 'Osmanlı Devleti', svg: () => FLAGS.tr.svg() },
  gb: { name: 'İngiltere', svg: () => {
    const id = 'uj' + (++_flagId);
    return `<svg viewBox="0 0 60 30"><clipPath id="${id}a"><rect width="60" height="30"/></clipPath>
     <clipPath id="${id}b"><path d="M30,15h30v15zv15h-30zh-30v-15zv-15h30z"/></clipPath>
     <g clip-path="url(#${id}a)"><rect width="60" height="30" fill="#012169"/>
     <path d="M0,0L60,30M60,0L0,30" stroke="#fff" stroke-width="6"/>
     <path d="M0,0L60,30M60,0L0,30" clip-path="url(#${id}b)" stroke="#C8102E" stroke-width="4"/>
     <path d="M30,0v30M0,15h60" stroke="#fff" stroke-width="10"/>
     <path d="M30,0v30M0,15h60" stroke="#C8102E" stroke-width="6"/></g></svg>`; } },
  fr: { name: 'Fransa', svg: () =>
    `<svg viewBox="0 0 3 2"><rect width="1" height="2" fill="#0055A4"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#EF4135"/></svg>` },
  it: { name: 'İtalya', svg: () =>
    `<svg viewBox="0 0 30 20"><rect width="10" height="20" fill="#009246"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#CE2B37"/>
     <path d="M12.3,6h5.4v5.2q0,3-2.7,4.3q-2.7-1.3-2.7-4.3z" fill="#1f4fb4"/>
     <path d="M12.9,6.6h4.2v4.6q0,2.4-2.1,3.5q-2.1-1.1-2.1-3.5z" fill="#CE2B37"/>
     <rect x="14.5" y="7" width="1" height="7" fill="#fff"/><rect x="13.1" y="9.4" width="3.8" height="1" fill="#fff"/></svg>` },
  gr: { name: 'Yunanistan', svg: () => {
    let s = '<svg viewBox="0 0 27 18">';
    for (let i = 0; i < 9; i++) s += `<rect y="${i * 2}" width="27" height="2" fill="${i % 2 ? '#fff' : '#0D5EAF'}"/>`;
    return s + '<rect width="10" height="10" fill="#0D5EAF"/><rect x="4" width="2" height="10" fill="#fff"/><rect y="4" width="10" height="2" fill="#fff"/></svg>'; } },
  am: { name: 'Ermenistan', svg: () =>
    `<svg viewBox="0 0 3 2"><rect width="3" height="0.67" fill="#D90012"/><rect y="0.66" width="3" height="0.68" fill="#0033A0"/><rect y="1.33" width="3" height="0.67" fill="#F2A800"/></svg>` },
};

function flag(code, cls = '') {
  const f = FLAGS[code];
  return f ? `<span class="flag ${cls}" title="${f.name}">${f.svg()}</span>` : '';
}
