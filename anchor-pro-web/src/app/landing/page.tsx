'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';

const NAV = ['Product', 'Solutions', 'Pricing', 'Enterprise'];
const LOGOS = ['Nexora Group', 'Stratum Mining', 'Velaris FM', 'Kova Logistics', 'Meridian Works', 'Onyx Properties'];

const FEATURES = [
  { icon: '⚙️', title: 'Job & Work Orders', body: 'Create, assign, and close jobs end-to-end. Full audit trail, priority flags, cost tracking — from field request to invoice.', color: '#4B8FFF', demo: ['JOB-2025-001 · Compressor service · In Progress', 'JOB-2025-002 · Generator overhaul · Scheduled', 'JOB-2025-003 · HVAC filter replace · Completed ✓'] },
  { icon: '🏗️', title: 'Asset Management', body: 'Register any equipment, vehicle, or facility. Track service history, failure patterns, and predictive maintenance schedules.', color: '#22C55E', demo: ['CAT 500kVA Generator · Operational', 'Atlas Copco Compressor · Under Maintenance', 'Toyota Forklift FLT-001 · Operational'] },
  { icon: '📋', title: 'Planning Board', body: 'Kanban-style workflow for your ops team. Drag jobs through stages, spot bottlenecks, and hit daily targets.', color: '#A78BFA', demo: ['Queue: 8 jobs waiting', 'In Progress: 3 active jobs', 'Review: 2 pending sign-off'] },
  { icon: '🛡️', title: 'Safety & Compliance', body: 'Digital Permit to Work, LOTO checklists, PPE verification. Non-compliant jobs auto-suspend. Zero paper.', color: '#F59E0B', demo: ['PTW-041 · Electrical work · Approved', 'LOTO checklist 100% complete', 'PPE verified: J. Phiri ✓'] },
  { icon: '📦', title: 'Inventory & Procurement', body: 'Real-time stock levels, low-stock alerts, and purchase orders — all linked back to the jobs consuming the parts.', color: '#EC4899', demo: ['Engine Oil 20L · 4 drums (⚠ Low)', 'Air Filters · 18 units in stock', 'V-Belt B56 · 12 units in stock'] },
  { icon: '📊', title: 'Intelligence Center', body: 'MTBF, MTTR, technician utilisation, cost per asset. AI failure risk scores before breakdowns happen.', color: '#06B6D4', demo: ['Avg MTBF: 847 hours ↑ 12%', 'Avg MTTR: 2.4 hours ↓ 18%', 'Tech utilisation: 84% this week'] },
];

const PLANS = [
  { name: 'Starter', price: { monthly: 'K 1,500', yearly: 'K 1,200' }, period: '/mo', desc: 'For small teams getting started', features: ['5 users', '50 job cards/month', 'Asset registry', 'Basic reporting', 'Email support'], cta: 'Start free trial', highlight: false },
  { name: 'Professional', price: { monthly: 'K 2,500', yearly: 'K 2,000' }, period: '/mo', desc: 'For growing operations teams', features: ['Unlimited users', 'Unlimited job cards', 'Full planning board', 'Safety & PTW', 'Intelligence center', 'Priority support'], cta: 'Get started', highlight: true },
  { name: 'Enterprise', price: { monthly: 'Custom', yearly: 'Custom' }, period: '', desc: 'Dedicated instance + SLA', features: ['Everything in Pro', 'Dedicated environment', 'Custom integrations', 'On-site training', 'Account manager'], cta: 'Contact sales', highlight: false },
];

const METRICS = [
  { val: 40, suffix: '%', label: 'Reduction in downtime' },
  { val: 3, suffix: '×', label: 'Faster job assignment' },
  { val: 99, suffix: '%', label: 'Permit compliance' },
  { val: 12, suffix: '+', label: 'Modules included' },
];

const WORDS = ['Maintenance', 'Operations', 'Field Teams', 'Facilities'];

function useInView(ref: React.RefObject<Element | null>, threshold = 0.1) {
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

function AnimatedMetric({ val, suffix, label, active }: { val: number; suffix: string; label: string; active: boolean }) {
  const count = useCounter(val, active);
  return (
    <div className="lp-metric">
      <div className="lp-metric-val">{count}{suffix}</div>
      <div className="lp-metric-lbl">{label}</div>
    </div>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [yearly, setYearly] = useState(false);
  const [wordIdx, setWordIdx] = useState(0);
  const [wordVisible, setWordVisible] = useState(true);

  const featRef    = useRef<HTMLDivElement>(null);
  const metricsRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const ctaRef     = useRef<HTMLDivElement>(null);
  const featVis    = useInView(featRef);
  const metricsVis = useInView(metricsRef, 0.3);
  const pricingVis = useInView(pricingRef);
  const ctaVis     = useInView(ctaRef);

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

  return (
    <div className="lp">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Lora:ital,wght@0,400;0,600;1,400;1,600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{
          --bg:#0A0A0B;--bg1:#111113;--bg2:#18181B;
          --line:rgba(255,255,255,0.08);--line2:rgba(255,255,255,0.14);
          --text:#EFEDE8;--sub:rgba(239,237,232,0.52);--sub2:rgba(239,237,232,0.28);
          --blue:#4B8FFF;--blue2:#6AA3FF;--green:#22C55E;
        }
        .lp{font-family:'Geist','Helvetica Neue',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;overflow-x:hidden;-webkit-font-smoothing:antialiased}
        ::selection{background:rgba(75,143,255,.25)}

        /* NAV */
        .lp-nav{position:fixed;top:0;left:0;right:0;z-index:200;height:60px;display:flex;align-items:center;padding:0 36px;gap:40px;transition:background .3s,border-color .3s;border-bottom:1px solid transparent}
        .lp-nav.on{background:rgba(10,10,11,.9);border-color:var(--line);backdrop-filter:blur(18px)}
        .lp-logo{display:flex;align-items:center;gap:9px;text-decoration:none;flex-shrink:0}
        .lp-lmark{width:30px;height:30px;border-radius:7px;background:var(--blue);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:#fff;flex-shrink:0;transition:transform .2s}
        .lp-logo:hover .lp-lmark{transform:rotate(-8deg) scale(1.1)}
        .lp-lname{font-size:14px;font-weight:700;color:var(--text);letter-spacing:-.3px}
        .lp-navlinks{display:flex;align-items:center;gap:28px;list-style:none;flex:1}
        .lp-navlinks a{font-size:13px;font-weight:400;color:var(--sub);text-decoration:none;transition:color .15s}
        .lp-navlinks a:hover{color:var(--text)}
        .lp-navright{display:flex;align-items:center;gap:8px;margin-left:auto}
        .btn-ghost{padding:7px 16px;border-radius:7px;border:1px solid var(--line2);background:transparent;color:var(--sub);font-size:13px;font-weight:500;cursor:pointer;text-decoration:none;transition:all .15s;font-family:'Geist',sans-serif}
        .btn-ghost:hover{border-color:rgba(255,255,255,.26);color:var(--text);background:rgba(255,255,255,.04)}
        .btn-blue{padding:7px 18px;border-radius:7px;background:var(--blue);color:#fff;font-size:13px;font-weight:600;border:none;cursor:pointer;text-decoration:none;transition:all .15s;font-family:'Geist',sans-serif}
        .btn-blue:hover{background:#3a7ef0;transform:translateY(-1px);box-shadow:0 6px 20px rgba(75,143,255,.3)}
        .btn-hamburger{display:none;background:transparent;border:none;color:var(--sub);cursor:pointer;font-size:20px;padding:4px}

        /* HERO */
        .lp-hero{position:relative;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:110px 24px 80px;overflow:hidden}
        .hero-bg{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 100% 60% at 50% -5%,rgba(75,143,255,.11) 0%,transparent 65%),radial-gradient(ellipse 50% 40% at 85% 90%,rgba(34,197,94,.05) 0%,transparent 60%)}
        .hero-grid{position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);background-size:56px 56px;mask-image:radial-gradient(ellipse 90% 90% at 50% 50%,black 30%,transparent 80%)}
        .lp-eyebrow{display:inline-flex;align-items:center;gap:7px;padding:5px 14px;border-radius:100px;border:1px solid rgba(75,143,255,.3);background:rgba(75,143,255,.08);font-size:11.5px;font-weight:500;color:var(--blue2);margin-bottom:28px;letter-spacing:.2px;animation:riseUp .6s ease both}
        .lp-eyebrow-dot{width:6px;height:6px;border-radius:50%;background:var(--blue);animation:blink 2s infinite;flex-shrink:0}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes riseUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .lp-h1{font-family:'Lora','Georgia',serif;font-size:clamp(42px,7vw,84px);font-weight:600;line-height:.98;letter-spacing:-1.5px;color:var(--text);max-width:820px;margin-bottom:24px;animation:riseUp .65s .1s ease both}
        .lp-h1-word{display:inline-block;color:var(--blue2);font-style:italic;font-weight:400;transition:opacity .35s,transform .35s;min-width:260px}
        .lp-h1-word.out{opacity:0;transform:translateY(-10px)}
        .lp-h1-word.in{opacity:1;transform:translateY(0)}
        .lp-sub{font-size:clamp(15px,1.8vw,18px);font-weight:300;line-height:1.7;color:var(--sub);max-width:500px;margin-bottom:40px;animation:riseUp .65s .2s ease both}
        .lp-actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:center;animation:riseUp .65s .3s ease both}
        .btn-hero{display:inline-flex;align-items:center;gap:8px;padding:14px 30px;border-radius:9px;background:var(--blue);color:#fff;font-size:15px;font-weight:600;border:none;cursor:pointer;text-decoration:none;transition:all .18s;font-family:'Geist',sans-serif;letter-spacing:-.2px;box-shadow:0 1px 0 #2a5ebf,0 4px 20px rgba(75,143,255,.2)}
        .btn-hero:hover{background:#3a7ef0;transform:translateY(-2px);box-shadow:0 3px 0 #2a5ebf,0 10px 32px rgba(75,143,255,.35)}
        .btn-hero-ghost{display:inline-flex;align-items:center;gap:8px;padding:14px 26px;border-radius:9px;background:transparent;border:1px solid var(--line2);color:var(--sub);font-size:15px;font-weight:400;cursor:pointer;text-decoration:none;transition:all .18s;font-family:'Geist',sans-serif}
        .btn-hero-ghost:hover{border-color:rgba(255,255,255,.24);color:var(--text);background:rgba(255,255,255,.03)}

        /* LOGOS */
        .lp-logos{margin-top:72px;width:100%;max-width:880px;animation:riseUp .65s .4s ease both}
        .lp-logos-lbl{font-size:10.5px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--sub2);text-align:center;margin-bottom:20px}
        .lp-logos-row{display:flex;align-items:center;justify-content:center;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
        .lp-logo-item{padding:18px 24px;font-size:12.5px;font-weight:600;color:var(--sub2);border-right:1px solid var(--line);white-space:nowrap;letter-spacing:.3px;cursor:default;transition:color .2s,background .2s}
        .lp-logo-item:last-child{border-right:none}
        .lp-logo-item:hover{color:var(--text);background:rgba(255,255,255,.03)}

        /* METRICS */
        .lp-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border:1px solid var(--line);border-radius:14px;overflow:hidden;max-width:860px;width:100%;margin:64px auto 0;animation:riseUp .65s .5s ease both}
        .lp-metric{background:var(--bg);padding:32px 24px;text-align:center;border-right:1px solid var(--line);cursor:default;transition:background .2s}
        .lp-metric:last-child{border-right:none}
        .lp-metric:hover{background:var(--bg1)}
        .lp-metric-val{font-family:'Lora',serif;font-size:46px;font-weight:600;line-height:1;letter-spacing:-1.5px;color:var(--text);margin-bottom:6px}
        .lp-metric-lbl{font-size:12px;font-weight:400;color:var(--sub2)}

        /* SECTIONS */
        .lp-section{max-width:1100px;margin:0 auto;padding:110px 40px}
        .lp-stag{font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--blue);margin-bottom:14px}
        .lp-sh2{font-family:'Lora',serif;font-size:clamp(32px,4vw,52px);font-weight:600;line-height:1.06;letter-spacing:-1px;color:var(--text);max-width:560px}
        .lp-ssub{font-size:15px;font-weight:300;line-height:1.7;color:var(--sub);max-width:440px;margin-top:16px}

        .rv{opacity:0;transform:translateY(28px);transition:opacity .7s ease,transform .7s ease}
        .rv.in{opacity:1;transform:translateY(0)}
        .rv.d1{transition-delay:.08s}.rv.d2{transition-delay:.16s}.rv.d3{transition-delay:.24s}
        .rv.d4{transition-delay:.32s}.rv.d5{transition-delay:.40s}.rv.d6{transition-delay:.48s}

        /* FEATURE TABS */
        .lp-feat-layout{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:52px;align-items:start}
        .lp-feat-tabs{display:flex;flex-direction:column;gap:4px}
        .lp-feat-tab{display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:12px;cursor:pointer;border:1px solid transparent;transition:all .2s;text-align:left;background:transparent;width:100%;font-family:'Geist',sans-serif}
        .lp-feat-tab:hover{background:var(--bg1);border-color:var(--line)}
        .lp-feat-tab.active{background:var(--bg1);border-color:var(--line2)}
        .lp-feat-tab-icon{font-size:20px;flex-shrink:0;width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;transition:background .2s}
        .lp-feat-tab.active .lp-feat-tab-icon{background:rgba(75,143,255,.12)}
        .lp-feat-tab-text{flex:1;min-width:0}
        .lp-feat-tab-title{font-size:13.5px;font-weight:600;color:var(--text);letter-spacing:-.2px}
        .lp-feat-tab.active .lp-feat-tab-title{color:var(--blue2)}
        .lp-feat-tab-body{font-size:11.5px;font-weight:300;color:var(--sub2);line-height:1.5;margin-top:2px;display:none}
        .lp-feat-tab.active .lp-feat-tab-body{display:block}
        .lp-feat-tab-progress{height:2px;background:var(--line);border-radius:2px;margin-top:8px;overflow:hidden;display:none}
        .lp-feat-tab.active .lp-feat-tab-progress{display:block}
        .lp-feat-tab-bar{height:100%;background:var(--blue);border-radius:2px;width:0%;animation:progress 4s linear forwards}
        @keyframes progress{from{width:0%}to{width:100%}}

        /* Feature preview panel */
        .lp-feat-preview{background:var(--bg1);border:1px solid var(--line);border-radius:16px;padding:28px;position:sticky;top:84px;min-height:360px;transition:all .3s;overflow:hidden}
        .lp-feat-preview-header{display:flex;align-items:center;gap:10px;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid var(--line)}
        .lp-feat-preview-icon{width:42px;height:42px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0}
        .lp-feat-preview-title{font-size:16px;font-weight:700;color:var(--text);letter-spacing:-.3px}
        .lp-feat-preview-sub{font-size:12px;color:var(--sub2);margin-top:2px}
        .lp-feat-preview-items{display:flex;flex-direction:column;gap:10px}
        .lp-feat-preview-item{background:var(--bg);border:1px solid var(--line);border-radius:9px;padding:12px 14px;font-size:12.5px;color:var(--sub);font-weight:300;transition:all .2s;cursor:default;animation:fadeSlide .4s ease both}
        .lp-feat-preview-item:hover{border-color:var(--line2);color:var(--text);background:rgba(255,255,255,.03)}
        .lp-feat-preview-item:nth-child(1){animation-delay:0s}
        .lp-feat-preview-item:nth-child(2){animation-delay:.08s}
        .lp-feat-preview-item:nth-child(3){animation-delay:.16s}

        /* PRICING */
        .lp-pricing-toggle{display:flex;align-items:center;gap:12px;margin-top:28px}
        .lp-toggle-wrap{position:relative;width:44px;height:24px;cursor:pointer}
        .lp-toggle-track{width:100%;height:100%;border-radius:12px;background:var(--line2);transition:background .2s}
        .lp-toggle-track.on{background:var(--blue)}
        .lp-toggle-knob{position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:9px;background:#fff;transition:transform .2s}
        .lp-toggle-knob.on{transform:translateX(20px)}
        .lp-toggle-lbl{font-size:13px;color:var(--sub);font-weight:400}
        .lp-save-badge{background:rgba(34,197,94,.15);border:1px solid rgba(34,197,94,.3);color:var(--green);font-size:11px;font-weight:600;padding:2px 9px;border-radius:100px;letter-spacing:.2px}
        .lp-pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:36px;align-items:start}
        .lp-plan{background:var(--bg1);border:1px solid var(--line);border-radius:16px;padding:28px;position:relative;transition:border-color .2s,transform .2s}
        .lp-plan:hover{transform:translateY(-3px);border-color:var(--line2)}
        .lp-plan.hi{border-color:var(--blue);background:rgba(75,143,255,.06)}
        .lp-plan.hi:hover{border-color:var(--blue2)}
        .lp-plan-badge{position:absolute;top:-1px;left:50%;transform:translateX(-50%);background:var(--blue);color:#fff;font-size:10px;font-weight:700;padding:3px 14px;border-radius:0 0 8px 8px;letter-spacing:.5px;text-transform:uppercase;white-space:nowrap}
        .lp-plan-name{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--sub);margin-bottom:10px}
        .lp-plan-price{font-family:'Lora',serif;font-size:38px;font-weight:600;color:var(--text);letter-spacing:-1.5px;line-height:1;transition:all .2s}
        .lp-plan-period{font-size:13px;font-weight:300;color:var(--sub);margin-left:2px}
        .lp-plan-desc{font-size:13px;font-weight:300;color:var(--sub2);margin-top:6px;margin-bottom:22px}
        .lp-plan-features{list-style:none;display:flex;flex-direction:column;gap:9px;margin-bottom:24px}
        .lp-plan-features li{display:flex;align-items:center;gap:9px;font-size:13px;color:var(--sub);font-weight:300}
        .lp-plan-features li::before{content:'✓';color:var(--green);font-size:12px;font-weight:700;flex-shrink:0}
        .lp-plan-cta{display:block;text-align:center;padding:11px 20px;border-radius:8px;font-size:13.5px;font-weight:600;cursor:pointer;text-decoration:none;transition:all .15s;font-family:'Geist',sans-serif}
        .lp-plan-cta.pri{background:var(--blue);color:#fff;border:none}
        .lp-plan-cta.pri:hover{background:#3a7ef0;transform:translateY(-1px);box-shadow:0 6px 20px rgba(75,143,255,.3)}
        .lp-plan-cta.sec{background:transparent;color:var(--sub);border:1px solid var(--line2)}
        .lp-plan-cta.sec:hover{border-color:rgba(255,255,255,.24);color:var(--text)}

        /* CTA */
        .lp-cta-section{padding:60px 40px 120px;max-width:1100px;margin:0 auto}
        .lp-cta-inner{border-radius:20px;border:1px solid rgba(75,143,255,.2);background:linear-gradient(135deg,rgba(75,143,255,.07) 0%,rgba(75,143,255,.02) 100%);padding:80px 48px;text-align:center;position:relative;overflow:hidden}
        .lp-cta-inner::before{content:'';position:absolute;top:-60px;left:50%;transform:translateX(-50%);width:480px;height:220px;border-radius:50%;background:radial-gradient(ellipse,rgba(75,143,255,.12) 0%,transparent 70%);pointer-events:none}
        .lp-cta-h2{font-family:'Lora',serif;font-size:clamp(32px,5vw,58px);font-weight:600;letter-spacing:-1px;line-height:1.05;color:var(--text);margin-bottom:14px;position:relative;z-index:1}
        .lp-cta-h2 em{font-style:italic;font-weight:400;color:var(--blue2)}
        .lp-cta-sub{font-size:16px;font-weight:300;line-height:1.65;color:var(--sub);max-width:400px;margin:0 auto 36px;position:relative;z-index:1}
        .lp-cta-btns{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;position:relative;z-index:1}

        /* FOOTER */
        .lp-footer{border-top:1px solid var(--line);padding:28px 36px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px}
        .lp-footer-copy{font-size:12px;color:var(--sub2)}
        .lp-footer-links{display:flex;gap:20px;list-style:none}
        .lp-footer-links a{font-size:12px;color:var(--sub2);text-decoration:none;transition:color .15s}
        .lp-footer-links a:hover{color:var(--sub)}

        .lp-mobile-menu{position:fixed;top:60px;left:0;right:0;z-index:199;background:rgba(10,10,11,.97);backdrop-filter:blur(18px);border-bottom:1px solid var(--line);padding:16px 20px 24px;display:flex;flex-direction:column;gap:14px}
        .lp-mobile-menu a{font-size:15px;color:var(--sub);text-decoration:none;padding:8px 0;border-bottom:1px solid var(--line);display:block}

        @media(max-width:768px){
          .lp-nav{padding:0 18px;gap:0}
          .lp-navlinks,.lp-navright .btn-ghost{display:none}
          .btn-hamburger{display:block}
          .lp-navright{gap:8px}
          .lp-hero{padding:90px 18px 60px}
          .lp-logos-row{display:none}
          .lp-metrics{grid-template-columns:repeat(2,1fr)}
          .lp-metric{border-right:none;border-bottom:1px solid var(--line)}
          .lp-metric:nth-child(odd){border-right:1px solid var(--line)}
          .lp-metric:nth-last-child(-n+2){border-bottom:none}
          .lp-section{padding:72px 18px}
          .lp-feat-layout{grid-template-columns:1fr}
          .lp-feat-preview{position:static;margin-top:24px}
          .lp-pricing-grid{grid-template-columns:1fr}
          .lp-cta-section{padding:40px 18px 80px}
          .lp-cta-inner{padding:48px 20px}
          .lp-footer{padding:22px 18px;flex-direction:column;align-items:flex-start}
          .lp-h1-word{min-width:160px}
        }
      `}</style>

      {/* NAV */}
      <nav className={`lp-nav${scrolled?' on':''}`}>
        <a href="#" className="lp-logo">
          <div className="lp-lmark">A</div>
          <span className="lp-lname">Anchor Pro</span>
        </a>
        <ul className="lp-navlinks">
          {NAV.map(l=><li key={l}><a href={`#${l.toLowerCase()}`}>{l}</a></li>)}
        </ul>
        <div className="lp-navright">
          <Link href="/login" className="btn-ghost">Sign in</Link>
          <Link href="/register" className="btn-blue">Start free trial</Link>
          <button className="btn-hamburger" onClick={()=>setMenu(v=>!v)}>{menu?'✕':'☰'}</button>
        </div>
      </nav>

      {menu&&(
        <div className="lp-mobile-menu">
          {NAV.map(l=><a key={l} href={`#${l.toLowerCase()}`} onClick={()=>setMenu(false)}>{l}</a>)}
          <Link href="/register" className="btn-blue" style={{textAlign:'center',marginTop:6}} onClick={()=>setMenu(false)}>Start free trial</Link>
        </div>
      )}

      {/* HERO */}
      <section className="lp-hero">
        <div className="hero-bg"/>
        <div className="hero-grid"/>

        <div className="lp-eyebrow">
          <span className="lp-eyebrow-dot"/>
          Purpose-built for operations teams
        </div>

        <h1 className="lp-h1">
          Built for<br/>
          <span className={`lp-h1-word ${wordVisible?'in':'out'}`}>{WORDS[wordIdx]}</span><br/>
          in One Platform.
        </h1>

        <p className="lp-sub">
          From job card to invoice. Asset to audit log. Permit to performance report. Anchor Pro is the single source of truth your team has been missing.
        </p>

        <div className="lp-actions">
          <Link href="/register" className="btn-hero">Start free trial →</Link>
          <a href="#product" className="btn-hero-ghost">See how it works</a>
        </div>

        <div className="lp-logos">
          <p className="lp-logos-lbl">Trusted by operations teams worldwide</p>
          <div className="lp-logos-row">
            {LOGOS.map(l=><div key={l} className="lp-logo-item">{l}</div>)}
          </div>
        </div>

        <div className="lp-metrics" ref={metricsRef}>
          {METRICS.map(m=>(
            <AnimatedMetric key={m.label} val={m.val} suffix={m.suffix} label={m.label} active={metricsVis} />
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="lp-section" id="product" ref={featRef}>
        <div className={`rv${featVis?' in':''}`}>
          <div className="lp-stag">Platform</div>
          <h2 className="lp-sh2">Everything your operation runs on.</h2>
          <p className="lp-ssub">Built for maintenance teams, field operations, facilities management, and anyone who needs to close jobs on time.</p>
        </div>

        <div className={`lp-feat-layout rv${featVis?' in':''} d2`}>
          {/* Tabs */}
          <div className="lp-feat-tabs">
            {FEATURES.map((feat, i) => (
              <button
                key={feat.title}
                className={`lp-feat-tab${activeFeature===i?' active':''}`}
                onClick={() => setActiveFeature(i)}
              >
                <div className="lp-feat-tab-icon">{feat.icon}</div>
                <div className="lp-feat-tab-text">
                  <div className="lp-feat-tab-title">{feat.title}</div>
                  <div className="lp-feat-tab-body">{feat.body}</div>
                  <div className="lp-feat-tab-progress">
                    {activeFeature === i && <div key={`${i}-bar`} className="lp-feat-tab-bar"/>}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Preview panel */}
          <div className="lp-feat-preview">
            <div className="lp-feat-preview-header">
              <div className="lp-feat-preview-icon" style={{background:`${f.color}18`}}>
                {f.icon}
              </div>
              <div>
                <div className="lp-feat-preview-title">{f.title}</div>
                <div className="lp-feat-preview-sub">Live preview</div>
              </div>
            </div>
            <div className="lp-feat-preview-items" key={activeFeature}>
              {f.demo.map((item, i) => (
                <div key={i} className="lp-feat-preview-item" style={{animationDelay:`${i*0.08}s`}}>
                  {item}
                </div>
              ))}
              <div style={{marginTop:16,padding:'14px 16px',borderRadius:10,background:`${f.color}0D`,border:`1px solid ${f.color}22`,fontSize:12,color:'var(--sub)',fontWeight:300,lineHeight:1.6}}>
                {f.body}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="lp-section" id="pricing" ref={pricingRef} style={{paddingTop:0}}>
        <div className={`rv${pricingVis?' in':''}`}>
          <div className="lp-stag">Pricing</div>
          <h2 className="lp-sh2">Simple, transparent pricing.</h2>
          <p className="lp-ssub">No hidden fees. Cancel any time. Start with a 14-day free trial on any plan.</p>
          <div className="lp-pricing-toggle" onClick={()=>setYearly(v=>!v)} style={{cursor:'pointer'}}>
            <span className="lp-toggle-lbl">Monthly</span>
            <div className="lp-toggle-wrap">
              <div className={`lp-toggle-track${yearly?' on':''}`}/>
              <div className={`lp-toggle-knob${yearly?' on':''}`}/>
            </div>
            <span className="lp-toggle-lbl">Yearly</span>
            {yearly && <span className="lp-save-badge">Save 20%</span>}
          </div>
        </div>
        <div className="lp-pricing-grid">
          {PLANS.map((p,i)=>(
            <div key={p.name} className={`lp-plan${p.highlight?' hi':''} rv${pricingVis?' in':''} d${i+2}`}>
              {p.highlight&&<div className="lp-plan-badge">Most popular</div>}
              <div className="lp-plan-name">{p.name}</div>
              <div>
                <span className="lp-plan-price">{yearly ? p.price.yearly : p.price.monthly}</span>
                {p.period&&<span className="lp-plan-period">{p.period}</span>}
              </div>
              <div className="lp-plan-desc">{p.desc}</div>
              <ul className="lp-plan-features">
                {p.features.map(f=><li key={f}>{f}</li>)}
              </ul>
              <Link href="/register" className={`lp-plan-cta${p.highlight?' pri':' sec'}`}>{p.cta}</Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="lp-cta-section" ref={ctaRef}>
        <div className={`lp-cta-inner rv${ctaVis?' in':''}`}>
          <h2 className="lp-cta-h2">Your operation.<br/><em>Finally, in control.</em></h2>
          <p className="lp-cta-sub">Join operations teams already using Anchor Pro to cut downtime, tighten costs, and close every job on time.</p>
          <div className="lp-cta-btns">
            <Link href="/register" className="btn-hero">Start free trial →</Link>
            <Link href="/login" className="btn-ghost" style={{padding:'13px 24px',fontSize:15}}>Sign in</Link>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div style={{display:'flex',alignItems:'center',gap:18}}>
          <a href="#" className="lp-logo">
            <div className="lp-lmark" style={{width:24,height:24,fontSize:11,borderRadius:6}}>A</div>
            <span style={{fontSize:13,fontWeight:600,color:'var(--sub2)',letterSpacing:'-.3px'}}>Anchor Pro</span>
          </a>
          <span className="lp-footer-copy">© 2026 Anchor Pro. All rights reserved.</span>
        </div>
        <ul className="lp-footer-links">
          <li><a href="#">Privacy</a></li>
          <li><a href="#">Terms</a></li>
          <li><a href="#">Docs</a></li>
          <li><a href="/login">Sign in</a></li>
        </ul>
      </footer>
    </div>
  );
}
