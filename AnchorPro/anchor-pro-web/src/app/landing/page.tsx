'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, RefObject } from 'react';

const NAV = ['Product', 'Solutions', 'Enterprise'];
const LOGOS = ['Nexora Group', 'Stratum Mining', 'Velaris FM', 'Kova Logistics', 'Meridian Works', 'Onyx Properties'];

const FEATURES = [
  { icon: '⚙️', title: 'Job & Work Orders', body: 'Create, assign, and close jobs end-to-end. Full audit trail, priority flags, cost tracking — from field request to invoice.', color: '#4B8FFF', demo: ['JOB-2025-001 · Compressor service · In Progress', 'JOB-2025-002 · Generator overhaul · Scheduled', 'JOB-2025-003 · HVAC filter replace · Completed ✓'] },
  { icon: '🏗️', title: 'Asset Management', body: 'Register any equipment, vehicle, or facility. Track service history, failure patterns, and predictive maintenance schedules.', color: '#22C55E', demo: ['CAT 500kVA Generator · Operational', 'Atlas Copco Compressor · Under Maintenance', 'Toyota Forklift FLT-001 · Operational'] },
  { icon: '📋', title: 'Planning Board', body: 'Kanban-style workflow for your ops team. Drag jobs through stages, spot bottlenecks, and hit daily targets.', color: '#A78BFA', demo: ['Queue: 8 jobs waiting', 'In Progress: 3 active jobs', 'Review: 2 pending sign-off'] },
  { icon: '🛡️', title: 'Safety & Compliance', body: 'Digital Permit to Work, LOTO checklists, PPE verification. Non-compliant jobs auto-suspend. Zero paper.', color: '#F59E0B', demo: ['PTW-041 · Electrical work · Approved', 'LOTO checklist 100% complete', 'PPE verified: J. Phiri ✓'] },
  { icon: '📦', title: 'Inventory & Procurement', body: 'Real-time stock levels, low-stock alerts, and purchase orders — all linked back to the jobs consuming the parts.', color: '#EC4899', demo: ['Engine Oil 20L · 4 drums (⚠ Low)', 'Air Filters · 18 units in stock', 'V-Belt B56 · 12 units in stock'] },
  { icon: '📊', title: 'Intelligence Center', body: 'MTBF, MTTR, technician utilisation, cost per asset. AI failure risk scores before breakdowns happen.', color: '#06B6D4', demo: ['Avg MTBF: 847 hours ↑ 12%', 'Avg MTTR: 2.4 hours ↓ 18%', 'Tech utilisation: 84% this week'] },
];


const METRICS = [
  { val: 40, suffix: '%', label: 'Reduction in downtime' },
  { val: 3, suffix: '×', label: 'Faster job assignment' },
  { val: 99, suffix: '%', label: 'Permit compliance' },
  { val: 12, suffix: '+', label: 'Modules included' },
];

const WORDS = ['Maintenance', 'Operations', 'Field Teams', 'Facilities'];

function useInView(ref: RefObject<Element | null>, threshold = 0.1) {
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect(); } }, { threshold });
    obs.observe(el); return () => obs.disconnect();
  }, [ref]);
  return v;
}

function useCounter(target: number, active: boolean, duration = 1800) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0; const step = target / (duration / 16);
    const t = setInterval(() => {
      start = Math.min(start + step, target);
      setCount(Math.round(start));
      if (start >= target) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [active, target, duration]);
  return count;
}

function AnimatedMetric({ val, suffix, label, active, bg, hoverBg, borderColor, textColor, subColor }: { val: number; suffix: string; label: string; active: boolean; bg: string; hoverBg: string; borderColor: string; textColor: string; subColor: string }) {
  const count = useCounter(val, active);
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="lp-metric"
      style={{ background: hovered ? hoverBg : bg, borderRight: `1px solid ${borderColor}`, cursor: 'default', transition: 'background .2s' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="lp-metric-val" style={{ color: textColor }}>{count}{suffix}</div>
      <div className="lp-metric-lbl" style={{ color: subColor }}>{label}</div>
    </div>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);
  const [wordVisible, setWordVisible] = useState(true);
  const [dark, setDark] = useState(true);

  const featRef    = useRef<HTMLDivElement>(null);
  const metricsRef = useRef<HTMLDivElement>(null);
  const ctaRef     = useRef<HTMLDivElement>(null);
  const featVis    = useInView(featRef);
  const metricsVis = useInView(metricsRef, 0.3);
  const ctaVis     = useInView(ctaRef);

  // Load theme from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ap-theme');
      if (saved === 'light') setDark(false);
      else if (saved === 'dark') setDark(true);
      else {
        // respect OS preference if no saved preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setDark(prefersDark);
      }
    } catch {}
  }, []);

  const toggleTheme = () => {
    setDark(d => {
      const next = !d;
      try { localStorage.setItem('ap-theme', next ? 'dark' : 'light'); } catch {}
      return next;
    });
  };

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Typewriter word cycle
  useEffect(() => {
    const cycle = setInterval(() => {
      setWordVisible(false);
      setTimeout(() => {
        setWordIdx(i => (i + 1) % WORDS.length);
        setWordVisible(true);
      }, 350);
    }, 2400);
    return () => clearInterval(cycle);
  }, []);

  // Auto-cycle feature tabs
  useEffect(() => {
    const t = setInterval(() => setActiveFeature(i => (i + 1) % FEATURES.length), 4000);
    return () => clearInterval(t);
  }, []);

  const f = FEATURES[activeFeature];

  const D = {
    bg:    dark ? '#0A0A0B'  : '#FFFFFF',
    bg1:   dark ? '#111113'  : '#F8F8FA',
    bg2:   dark ? '#18181B'  : '#F1F1F5',
    line:  dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    line2: dark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.14)',
    text:  dark ? '#EFEDE8'  : '#0A0A0B',
    sub:   dark ? 'rgba(239,237,232,0.52)' : 'rgba(10,10,11,0.52)',
    sub2:  dark ? 'rgba(239,237,232,0.28)' : 'rgba(10,10,11,0.32)',
    heroBg: dark
      ? 'radial-gradient(ellipse 100% 60% at 50% -5%,rgba(75,143,255,.11) 0%,transparent 65%),radial-gradient(ellipse 50% 40% at 85% 90%,rgba(34,197,94,.05) 0%,transparent 60%)'
      : 'radial-gradient(ellipse 100% 60% at 50% -5%,rgba(75,143,255,.08) 0%,transparent 65%),radial-gradient(ellipse 50% 40% at 85% 90%,rgba(34,197,94,.04) 0%,transparent 60%)',
    navBg: dark ? 'rgba(10,10,11,.9)' : 'rgba(255,255,255,.92)',
    mobileMenuBg: dark ? 'rgba(10,10,11,.97)' : 'rgba(255,255,255,.97)',
    btnGhostBg: dark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)',
    btnGhostHoverBorder: dark ? 'rgba(255,255,255,.26)' : 'rgba(0,0,0,.22)',
    metricHover: dark ? '#111113' : '#F1F1F5',
    previewBg: dark ? '#111113' : '#F8F8FA',
    previewItemBg: dark ? '#0A0A0B' : '#FFFFFF',
    previewItemHoverBg: dark ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.02)',
    ctaBg: dark
      ? 'linear-gradient(135deg,rgba(75,143,255,.07) 0%,rgba(75,143,255,.02) 100%)'
      : 'linear-gradient(135deg,rgba(75,143,255,.06) 0%,rgba(75,143,255,.01) 100%)',
    ctaBorder: dark ? 'rgba(75,143,255,.2)' : 'rgba(75,143,255,.18)',
    toggleHoverBg: dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)',
    toggleIcon: dark ? '☀️' : '🌙',
  };

  return (
    <div className="lp" style={{ background: D.bg, color: D.text }}>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .lp{font-family:'Barlow','Helvetica Neue',sans-serif;min-height:100vh;overflow-x:hidden;-webkit-font-smoothing:antialiased;transition:background .25s,color .25s}
        ::selection{background:rgba(75,143,255,.25)}

        /* NAV */
        .lp-nav{position:fixed;top:0;left:0;right:0;z-index:200;height:60px;display:flex;align-items:center;padding:0 36px;gap:40px;transition:background .3s,border-color .3s,backdrop-filter .3s;border-bottom:1px solid transparent}
        .lp-logo{display:flex;align-items:center;gap:9px;text-decoration:none;flex-shrink:0}
        .lp-lmark{width:30px;height:30px;border-radius:7px;background:#4B8FFF;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:#fff;flex-shrink:0;transition:transform .2s}
        .lp-logo:hover .lp-lmark{transform:rotate(-8deg) scale(1.1)}
        .lp-navlinks{display:flex;align-items:center;gap:28px;list-style:none;flex:1}
        .lp-navright{display:flex;align-items:center;gap:8px;margin-left:auto}
        .lp-theme-btn{width:32px;height:32px;border-radius:8px;border:none;background:transparent;cursor:pointer;font-size:15px;display:flex;align-items:center;justify-content:center;transition:background .15s;flex-shrink:0}
        .btn-hamburger{display:none;background:transparent;border:none;cursor:pointer;font-size:20px;padding:4px}

        /* HERO */
        .lp-hero{position:relative;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:110px 24px 80px;overflow:hidden}
        .hero-bg{position:absolute;inset:0;pointer-events:none}
        .hero-grid{position:absolute;inset:0;pointer-events:none;background-size:56px 56px;mask-image:radial-gradient(ellipse 90% 90% at 50% 50%,black 30%,transparent 80%)}
        .lp-eyebrow{display:inline-flex;align-items:center;gap:7px;padding:5px 14px;border-radius:100px;border:1px solid rgba(75,143,255,.3);background:rgba(75,143,255,.08);font-size:11.5px;font-weight:500;color:#6AA3FF;margin-bottom:28px;letter-spacing:.2px;animation:riseUp .6s ease both}
        .lp-eyebrow-dot{width:6px;height:6px;border-radius:50%;background:#4B8FFF;animation:blink 2s infinite;flex-shrink:0}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes riseUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .lp-h1{font-family:'Barlow Semi Condensed','Helvetica Neue',sans-serif;font-size:clamp(42px,7vw,84px);font-weight:700;line-height:.98;letter-spacing:-1.5px;max-width:820px;margin-bottom:24px;animation:riseUp .65s .1s ease both}
        .lp-h1-word{display:inline-block;color:#6AA3FF;font-style:italic;font-weight:400;transition:opacity .35s,transform .35s;min-width:260px}
        .lp-h1-word.out{opacity:0;transform:translateY(-10px)}
        .lp-h1-word.in{opacity:1;transform:translateY(0)}
        .lp-actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:center;animation:riseUp .65s .3s ease both}
        .btn-hero{display:inline-flex;align-items:center;gap:8px;padding:14px 30px;border-radius:9px;background:#4D9EFF;color:#fff;font-size:15px;font-weight:600;border:none;cursor:pointer;text-decoration:none;transition:all .18s;font-family:'Barlow',sans-serif;letter-spacing:-.2px;box-shadow:0 1px 0 #2a5ebf,0 4px 20px rgba(77,158,255,.2)}
        .btn-hero:hover{background:#3a7ef0;transform:translateY(-2px);box-shadow:0 3px 0 #2a5ebf,0 10px 32px rgba(75,143,255,.35)}
        .btn-blue{padding:7px 18px;border-radius:7px;background:#4D9EFF;color:#fff;font-size:13px;font-weight:600;border:none;cursor:pointer;text-decoration:none;transition:all .15s;font-family:'Barlow',sans-serif}
        .btn-blue:hover{background:#3a7ef0;transform:translateY(-1px);box-shadow:0 6px 20px rgba(75,143,255,.3)}

        /* LOGOS */
        .lp-logos{margin-top:72px;width:100%;max-width:880px;animation:riseUp .65s .4s ease both}
        .lp-logos-lbl{font-size:10.5px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;text-align:center;margin-bottom:20px}

        /* METRICS */
        .lp-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border-radius:14px;overflow:hidden;max-width:860px;width:100%;margin:64px auto 0;animation:riseUp .65s .5s ease both}
        .lp-metric{padding:32px 24px;text-align:center;cursor:default;transition:background .2s}
        .lp-metric-val{font-family:'Barlow Condensed',sans-serif;font-size:46px;font-weight:700;line-height:1;letter-spacing:-1.5px;margin-bottom:6px}
        .lp-metric-lbl{font-size:12px;font-weight:400}

        /* SECTIONS */
        .lp-section{max-width:1100px;margin:0 auto;padding:110px 40px}
        .lp-stag{font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#4B8FFF;margin-bottom:14px}
        .lp-sh2{font-family:'Barlow Semi Condensed',sans-serif;font-size:clamp(32px,4vw,52px);font-weight:700;line-height:1.06;letter-spacing:-1px;max-width:560px}

        .rv{opacity:0;transform:translateY(28px);transition:opacity .7s ease,transform .7s ease}
        .rv.in{opacity:1;transform:translateY(0)}
        .rv.d1{transition-delay:.08s}.rv.d2{transition-delay:.16s}.rv.d3{transition-delay:.24s}
        .rv.d4{transition-delay:.32s}.rv.d5{transition-delay:.40s}.rv.d6{transition-delay:.48s}

        /* FEATURE TABS */
        .lp-feat-layout{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:52px;align-items:start}
        .lp-feat-tabs{display:flex;flex-direction:column;gap:4px}
        .lp-feat-tab{display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:12px;cursor:pointer;border:1px solid transparent;transition:all .2s;text-align:left;background:transparent;width:100%;font-family:'Barlow',sans-serif}
        .lp-feat-tab-icon{font-size:20px;flex-shrink:0;width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;transition:background .2s}
        .lp-feat-tab-text{flex:1;min-width:0}
        .lp-feat-tab-body{font-size:11.5px;font-weight:300;line-height:1.5;margin-top:2px;display:none}
        .lp-feat-tab.active .lp-feat-tab-body{display:block}
        .lp-feat-tab-progress{height:2px;border-radius:2px;margin-top:8px;overflow:hidden;display:none}
        .lp-feat-tab.active .lp-feat-tab-progress{display:block}
        .lp-feat-tab-bar{height:100%;background:#4B8FFF;border-radius:2px;width:0%;animation:progress 4s linear forwards}
        @keyframes progress{from{width:0%}to{width:100%}}

        /* Feature preview panel */
        .lp-feat-preview{border-radius:16px;padding:28px;position:sticky;top:84px;min-height:360px;transition:all .3s;overflow:hidden}
        .lp-feat-preview-header{display:flex;align-items:center;gap:10px;margin-bottom:24px;padding-bottom:16px}
        .lp-feat-preview-icon{width:42px;height:42px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0}
        .lp-feat-preview-title{font-size:16px;font-weight:700;letter-spacing:-.3px}
        .lp-feat-preview-sub{font-size:12px;margin-top:2px}
        .lp-feat-preview-items{display:flex;flex-direction:column;gap:10px}
        .lp-feat-preview-item{border-radius:9px;padding:12px 14px;font-size:12.5px;font-weight:300;transition:all .2s;cursor:default;animation:fadeSlide .4s ease both}
        .lp-feat-preview-item:nth-child(1){animation-delay:0s}
        .lp-feat-preview-item:nth-child(2){animation-delay:.08s}
        .lp-feat-preview-item:nth-child(3){animation-delay:.16s}

        /* CTA */
        .lp-cta-section{padding:60px 40px 120px;max-width:1100px;margin:0 auto}
        .lp-cta-inner{border-radius:20px;padding:80px 48px;text-align:center;position:relative;overflow:hidden;transition:background .25s,border-color .25s}
        .lp-cta-inner::before{content:'';position:absolute;top:-60px;left:50%;transform:translateX(-50%);width:480px;height:220px;border-radius:50%;background:radial-gradient(ellipse,rgba(75,143,255,.12) 0%,transparent 70%);pointer-events:none}
        .lp-cta-h2{font-family:'Barlow Semi Condensed',sans-serif;font-size:clamp(32px,5vw,58px);font-weight:700;letter-spacing:-1px;line-height:1.05;margin-bottom:14px;position:relative;z-index:1}
        .lp-cta-h2 em{font-style:italic;font-weight:400;color:#6AA3FF}
        .lp-cta-btns{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;position:relative;z-index:1}

        /* FOOTER */
        .lp-footer{padding:28px 36px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;transition:border-color .25s}
        .lp-footer-links{display:flex;gap:20px;list-style:none}
        .lp-footer-links a{font-size:12px;text-decoration:none;transition:color .15s}

        @media(max-width:768px){
          .lp-nav{padding:0 18px;gap:0}
          .lp-navlinks,.lp-navright .btn-ghost-nav{display:none}
          .btn-hamburger{display:block}
          .lp-navright{gap:8px}
          .lp-hero{padding:90px 18px 60px}
          .lp-logos-row{display:none}
          .lp-metrics{grid-template-columns:repeat(2,1fr)}
          .lp-section{padding:72px 18px}
          .lp-feat-layout{grid-template-columns:1fr}
          .lp-feat-preview{position:static;margin-top:24px}
          .lp-cta-section{padding:40px 18px 80px}
          .lp-cta-inner{padding:48px 20px}
          .lp-footer{padding:22px 18px;flex-direction:column;align-items:flex-start}
          .lp-h1-word{min-width:160px}
        }
      `}</style>

      {/* NAV */}
      <nav
        className={`lp-nav${scrolled?' on':''}`}
        style={scrolled ? { background: D.navBg, borderColor: D.line, backdropFilter: 'blur(18px)' } : {}}
      >
        <a href="#" className="lp-logo">
          <div className="lp-lmark">A</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: D.text, letterSpacing: '-.3px' }}>Anchor Pro</span>
        </a>
        <ul className="lp-navlinks">
          {NAV.map(l => <li key={l}><a href={`#${l.toLowerCase()}`} style={{ fontSize: 13, fontWeight: 400, color: D.sub, textDecoration: 'none', transition: 'color .15s' }}>{l}</a></li>)}
        </ul>
        <div className="lp-navright">
          <button
            className="lp-theme-btn"
            onClick={toggleTheme}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{ color: D.sub }}
            onMouseEnter={e => (e.currentTarget.style.background = D.toggleHoverBg)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {D.toggleIcon}
          </button>
          <Link href="/login" className="btn-ghost-nav" style={{ padding: '7px 16px', borderRadius: 7, border: `1px solid ${D.line2}`, background: 'transparent', color: D.sub, fontSize: 13, fontWeight: 500, textDecoration: 'none', transition: 'all .15s', display: 'inline-block' }}>Sign in</Link>
          <Link href="/register" className="btn-blue">Start free trial</Link>
          <button className="btn-hamburger" onClick={() => setMenu(v => !v)} style={{ color: D.sub }}>{menu ? '✕' : '☰'}</button>
        </div>
      </nav>

      {menu && (
        <div style={{ position: 'fixed', top: 60, left: 0, right: 0, zIndex: 199, background: D.mobileMenuBg, backdropFilter: 'blur(18px)', borderBottom: `1px solid ${D.line}`, padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {NAV.map(l => <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setMenu(false)} style={{ fontSize: 15, color: D.sub, textDecoration: 'none', padding: '8px 0', borderBottom: `1px solid ${D.line}`, display: 'block' }}>{l}</a>)}
          <Link href="/register" className="btn-blue" style={{ textAlign: 'center', marginTop: 6 }} onClick={() => setMenu(false)}>Start free trial</Link>
        </div>
      )}

      {/* HERO */}
      <section className="lp-hero">
        <div className="hero-bg" style={{ background: D.heroBg }} />
        <div className="hero-grid" style={{ backgroundImage: `linear-gradient(${D.line} 1px,transparent 1px),linear-gradient(90deg,${D.line} 1px,transparent 1px)` }} />

        <div className="lp-eyebrow">
          <span className="lp-eyebrow-dot" />
          Purpose-built for operations teams
        </div>

        <h1 className="lp-h1" style={{ color: D.text }}>
          Built for<br />
          <span className={`lp-h1-word ${wordVisible ? 'in' : 'out'}`}>{WORDS[wordIdx]}</span><br />
          in One Platform.
        </h1>

        <p style={{ fontSize: 'clamp(15px,1.8vw,18px)', fontWeight: 300, lineHeight: 1.7, color: D.sub, maxWidth: 500, marginBottom: 40, animation: 'riseUp .65s .2s ease both' }}>
          From job card to invoice. Asset to audit log. Permit to performance report. Anchor Pro is the single source of truth your team has been missing.
        </p>

        <div className="lp-actions">
          <Link href="/register" className="btn-hero">Start free trial →</Link>
          <a href="#product" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 26px', borderRadius: 9, background: 'transparent', border: `1px solid ${D.line2}`, color: D.sub, fontSize: 15, fontWeight: 400, textDecoration: 'none', transition: 'all .18s' }}>See how it works</a>
        </div>

        <div className="lp-logos">
          <p className="lp-logos-lbl" style={{ color: D.sub2 }}>Trusted by operations teams worldwide</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderTop: `1px solid ${D.line}`, borderBottom: `1px solid ${D.line}` }}>
            {LOGOS.map(l => (
              <div key={l} style={{ padding: '18px 24px', fontSize: 12.5, fontWeight: 600, color: D.sub2, borderRight: `1px solid ${D.line}`, whiteSpace: 'nowrap', letterSpacing: '.3px', cursor: 'default', transition: 'color .2s,background .2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = D.text; (e.currentTarget as HTMLElement).style.background = dark ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.02)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = D.sub2; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >{l}</div>
            ))}
          </div>
        </div>

        <div className="lp-metrics" ref={metricsRef} style={{ border: `1px solid ${D.line}` }}>
          {METRICS.map(m => (
            <AnimatedMetric key={m.label} val={m.val} suffix={m.suffix} label={m.label} active={metricsVis}
              bg={D.bg} hoverBg={D.metricHover} borderColor={D.line} textColor={D.text} subColor={D.sub2}
            />
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="lp-section" id="product" ref={featRef}>
        <div className={`rv${featVis ? ' in' : ''}`}>
          <div className="lp-stag">Platform</div>
          <h2 className="lp-sh2" style={{ color: D.text }}>Everything your operation runs on.</h2>
          <p style={{ fontSize: 15, fontWeight: 300, lineHeight: 1.7, color: D.sub, maxWidth: 440, marginTop: 16 }}>Built for maintenance teams, field operations, facilities management, and anyone who needs to close jobs on time.</p>
        </div>

        <div className={`lp-feat-layout rv${featVis ? ' in' : ''} d2`}>
          <div className="lp-feat-tabs">
            {FEATURES.map((feat, i) => (
              <button
                key={feat.title}
                className={`lp-feat-tab${activeFeature === i ? ' active' : ''}`}
                onClick={() => setActiveFeature(i)}
                style={{
                  background: activeFeature === i ? D.bg1 : 'transparent',
                  borderColor: activeFeature === i ? D.line2 : 'transparent',
                  color: D.text,
                }}
                onMouseEnter={e => { if (activeFeature !== i) (e.currentTarget as HTMLElement).style.background = D.bg1; }}
                onMouseLeave={e => { if (activeFeature !== i) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <div className="lp-feat-tab-icon" style={{ background: activeFeature === i ? 'rgba(75,143,255,.12)' : 'transparent' }}>{feat.icon}</div>
                <div className="lp-feat-tab-text">
                  <div className="lp-feat-tab-title" style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: '-.2px', color: activeFeature === i ? '#6AA3FF' : D.text }}>{feat.title}</div>
                  <div className="lp-feat-tab-body" style={{ color: D.sub2 }}>{feat.body}</div>
                  <div className="lp-feat-tab-progress" style={{ background: D.line }}>
                    {activeFeature === i && <div key={`${i}-bar`} className="lp-feat-tab-bar" />}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="lp-feat-preview" style={{ background: D.previewBg, border: `1px solid ${D.line}` }}>
            <div className="lp-feat-preview-header" style={{ borderBottom: `1px solid ${D.line}` }}>
              <div className="lp-feat-preview-icon" style={{ background: `${f.color}18` }}>{f.icon}</div>
              <div>
                <div className="lp-feat-preview-title" style={{ color: D.text }}>{f.title}</div>
                <div className="lp-feat-preview-sub" style={{ color: D.sub2 }}>Live preview</div>
              </div>
            </div>
            <div className="lp-feat-preview-items" key={activeFeature}>
              {f.demo.map((item, i) => (
                <div key={i} className="lp-feat-preview-item"
                  style={{ background: D.previewItemBg, border: `1px solid ${D.line}`, color: D.sub, animationDelay: `${i * 0.08}s` }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = D.previewItemHoverBg; (e.currentTarget as HTMLElement).style.borderColor = D.line2; (e.currentTarget as HTMLElement).style.color = D.text; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = D.previewItemBg; (e.currentTarget as HTMLElement).style.borderColor = D.line; (e.currentTarget as HTMLElement).style.color = D.sub; }}
                >{item}</div>
              ))}
              <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 10, background: `${f.color}0D`, border: `1px solid ${f.color}22`, fontSize: 12, color: D.sub, fontWeight: 300, lineHeight: 1.6 }}>
                {f.body}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="lp-cta-section" ref={ctaRef}>
        <div className={`lp-cta-inner rv${ctaVis ? ' in' : ''}`}
          style={{ border: `1px solid ${D.ctaBorder}`, background: D.ctaBg }}
        >
          <h2 className="lp-cta-h2" style={{ color: D.text }}>Your operation.<br /><em>Finally, in control.</em></h2>
          <p style={{ fontSize: 16, fontWeight: 300, lineHeight: 1.65, color: D.sub, maxWidth: 400, margin: '0 auto 36px', position: 'relative', zIndex: 1 }}>Join operations teams already using Anchor Pro to cut downtime, tighten costs, and close every job on time.</p>
          <div className="lp-cta-btns">
            <Link href="/register" className="btn-hero">Start free trial →</Link>
            <Link href="/login" style={{ padding: '13px 24px', fontSize: 15, borderRadius: 7, border: `1px solid ${D.line2}`, background: 'transparent', color: D.sub, textDecoration: 'none', transition: 'all .15s' }}>Sign in</Link>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="lp-footer" style={{ borderTop: `1px solid ${D.line}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <a href="#" className="lp-logo">
            <div className="lp-lmark" style={{ width: 24, height: 24, fontSize: 11, borderRadius: 6 }}>A</div>
            <span style={{ fontSize: 13, fontWeight: 600, color: D.sub2, letterSpacing: '-.3px' }}>Anchor Pro</span>
          </a>
          <span style={{ fontSize: 12, color: D.sub2 }}>© 2026 Anchor Pro. All rights reserved.</span>
        </div>
        <ul className="lp-footer-links">
          {['Privacy', 'Terms', 'Docs'].map(l => <li key={l}><a href="#" style={{ color: D.sub2 }}>{l}</a></li>)}
          <li><a href="/login" style={{ color: D.sub2 }}>Sign in</a></li>
        </ul>
      </footer>
    </div>
  );
}
