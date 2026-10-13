import Link from "next/link";
import { ArrowUpRight, ArrowRight, Layers3, WandSparkles, Image as ImageIcon, PenTool, BookOpen, Check, MoveUpRight } from "lucide-react";

const showcases=[
 {label:"Brand identity",tag:"DESIGNER",kind:"identity",title:"Objects of\ninterest.",sub:"A new point of view"},
 {label:"Campaign artwork",tag:"PHOTO",kind:"campaign",title:"BEYOND\nTHE FRAME",sub:"Create without limits"},
 {label:"Editorial layout",tag:"PUBLISHER",kind:"editorial",title:"THE ART\nOF FORM",sub:"Issue No. 01 / Studio"}
];
const disciplines=[
 {name:"Photo",description:"Bring imagery into focus. Import, compose, adjust and export.",icon:ImageIcon,tone:"photo"},
 {name:"Designer",description:"Shape your ideas with type, objects and precise layouts.",icon:PenTool,tone:"designer"},
 {name:"Publisher",description:"Build considered compositions with editorial thinking.",icon:BookOpen,tone:"publisher"}
];
export default function HomePage(){
 return <main className="nova-site">
  <header className="nova-header"><div className="nova-container nova-nav">
   <Link href="/" className="nova-brand" aria-label="PosterStudio home"><span className="nova-symbol">✳</span><span>poster<span className="nova-brand-light">studio</span></span><span className="nova-brand-tag">BETA</span></Link>
   <nav className="nova-navlinks" aria-label="Main navigation"><Link href="#workspaces">Workspaces</Link><Link href="#inspiration">Inspiration</Link><Link href="#features">Features</Link></nav>
   <div className="nova-nav-actions"><Link href="/dashboard" className="nova-nav-login">My workspace</Link><Link href="/create" className="nova-button nova-button-dark">Start creating <ArrowUpRight size={16}/></Link></div>
  </div></header>
  <section className="nova-hero nova-container">
   <div className="nova-hero-copy"><span className="nova-kicker"><span className="nova-live-dot"/> YOUR IDEAS. ONE CREATIVE SPACE.</span>
    <h1>Make space<br/>for <em>what&apos;s next.</em></h1>
    <p>A beautifully focused creative workspace for everything you imagine. Compose visuals, explore layouts, and turn your next idea into something remarkable.</p>
    <div className="nova-hero-actions"><Link href="/create" className="nova-button nova-button-accent">Start creating for free <ArrowUpRight size={17}/></Link><Link href="/editor" className="nova-text-link">Explore the editor <ArrowRight size={16}/></Link></div>
    <div className="nova-hero-foot"><span className="nova-avatar-stack"><i>A</i><i>B</i><i>C</i></span><span>Designed for curious minds and creative work.</span></div>
   </div>
   <div className="nova-hero-visual" aria-label="Creative compositions preview">
    <div className="nova-visual-grid"/>
    <div className="nova-visual-card nova-visual-back"><span>STUDIO / EXPERIMENT 02</span><div className="nova-visual-circle"/><strong>FORM<br/>FOLLOWS<br/>FEELING.</strong></div>
    <div className="nova-visual-card nova-visual-front"><div className="nova-front-top"><span>FIELD NOTES — 001</span><span>✳</span></div><div className="nova-front-art"><div className="nova-front-sun"/><div className="nova-front-hill"/></div><div className="nova-front-bottom"><strong>Find your<br/>own perspective.</strong><span>THE CREATIVE EDITION</span></div></div>
    <div className="nova-floating-chip"><span className="nova-chip-icon"><Layers3 size={16}/></span><span><strong>Make it yours</strong><small>Every detail, in your hands</small></span></div>
    <span className="nova-visual-label">CREATE / EXPLORE / EXPRESS</span>
   </div>
  </section>
  <section id="workspaces" className="nova-workspaces"><div className="nova-container">
   <div className="nova-section-intro"><div><span className="nova-overline">ONE STUDIO. MANY POSSIBILITIES.</span><h2>Find your<br/><em>creative flow.</em></h2></div><p>Different disciplines, one intuitive space. Choose your starting point and let the work take shape.</p></div>
   <div className="nova-discipline-grid">{disciplines.map(d=><Link href={"/editor?workspace="+encodeURIComponent(d.name)} key={d.name} className={"nova-discipline nova-"+d.tone}><div className="nova-discipline-art"><d.icon size={36} strokeWidth={1.25}/><span className="nova-discipline-decoration"/></div><div className="nova-discipline-info"><div><span className="nova-overline">WORKSPACE</span><h3>{d.name}</h3><p>{d.description}</p></div><span className="nova-circle-arrow"><ArrowUpRight size={20}/></span></div></Link>)}</div>
   <p className="nova-availability">Workspace modes are in development. Current editing tools are shared across modes.</p>
  </div></section>
  <section id="inspiration" className="nova-inspiration nova-container"><div className="nova-section-intro"><div><span className="nova-overline">MADE TO INSPIRE</span><h2>Every idea<br/>starts <em>somewhere.</em></h2></div><Link href="/create" className="nova-text-link">Explore canvas sizes <ArrowUpRight size={16}/></Link></div>
   <div className="nova-showcase-grid">{showcases.map(x=><Link href="/create" key={x.label} className="nova-showcase"><div className={"nova-showcase-art nova-showcase-"+x.kind}><span className="nova-showcase-tag">{x.tag}</span><strong>{x.title}</strong><small>{x.sub}</small><div className="nova-showcase-decoration"/></div><div className="nova-showcase-meta"><span>{x.label}</span><MoveUpRight size={17}/></div></Link>)}</div>
  </section>
  <section id="features" className="nova-feature-band"><div className="nova-container nova-feature-inner"><div><span className="nova-overline">THE DETAILS MATTER</span><h2>Less friction.<br/><em>More creating.</em></h2></div><div className="nova-feature-list"><div><WandSparkles size={20}/><span><strong>Start in seconds</strong><small>Open a blank canvas or pick a familiar format.</small></span></div><div><Layers3 size={20}/><span><strong>Stay in control</strong><small>Work with layers, text, shapes, colors and images.</small></span></div><div><Check size={20}/><span><strong>Make it real</strong><small>Save local drafts and export your finished design.</small></span></div></div></div></section>
  <section className="nova-end-cta nova-container"><div className="nova-end-orb"/><span className="nova-overline">YOUR NEXT IDEA STARTS HERE</span><h2>Go make<br/><em>something great.</em></h2><p>A simple idea can become something extraordinary.</p><Link href="/create" className="nova-button nova-button-accent">Open your studio <ArrowUpRight size={18}/></Link></section>
  <footer className="nova-footer"><div className="nova-container nova-footer-inner"><Link href="/" className="nova-brand"><span className="nova-symbol">✳</span><span>posterstudio</span></Link><span>Creative space for the ideas ahead.</span><div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><span>© {new Date().getFullYear()}</span></div></div></footer>
 </main>
}