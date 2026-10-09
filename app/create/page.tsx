"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Search, Instagram, Presentation, Image as ImageIcon, Monitor, Plus, Sparkles } from "lucide-react";

const presets = [
  { name: "Instagram post", width: 1080, height: 1080, group: "Social", icon: Instagram },
  { name: "Instagram story", width: 1080, height: 1920, group: "Social", icon: Instagram },
  { name: "Portrait post", width: 1080, height: 1350, group: "Social", icon: ImageIcon },
  { name: "Facebook cover", width: 1640, height: 924, group: "Social", icon: Monitor },
  { name: "Presentation", width: 1920, height: 1080, group: "Business", icon: Presentation },
  { name: "A4 document", width: 2480, height: 3508, group: "Print", icon: ImageIcon },
  { name: "Poster", width: 1800, height: 2400, group: "Print", icon: ImageIcon },
  { name: "YouTube thumbnail", width: 1280, height: 720, group: "Video", icon: Monitor }
];
const templates = [
  { title: "Make it a moment", category: "Event flyer", bg: "linear-gradient(145deg,#f7a36b,#ed694d)", tag: "SAVE THE DATE", headline: "MAKE IT\nA MOMENT" },
  { title: "A little more you", category: "Personal brand", bg: "linear-gradient(145deg,#c8b5ff,#6c4de6)", tag: "YOUR NEXT CHAPTER", headline: "A LITTLE\nMORE YOU." },
  { title: "Good things grow", category: "Wellness", bg: "linear-gradient(145deg,#d5e8be,#83ad8a)", tag: "A NOTE TO SELF", headline: "GOOD THINGS\nGROW SLOWLY." },
  { title: "The weekend edit", category: "Promotion", bg: "linear-gradient(145deg,#24263b,#555873)", tag: "THE WEEKEND EDIT", headline: "YOUR NEXT\nFAVOURITE THING." },
  { title: "Made to move", category: "Fitness", bg: "linear-gradient(145deg,#ffdc73,#f08b43)", tag: "SHOW UP FOR YOU", headline: "MOVE WITH\nPURPOSE." },
  { title: "Big ideas", category: "Business", bg: "linear-gradient(145deg,#c7e7ee,#6684c8)", tag: "THINK DIFFERENT", headline: "BIG IDEAS\nSTART HERE." }
];

export default function CreatePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [customWidth, setCustomWidth] = useState("1080");
  const [customHeight, setCustomHeight] = useState("1080");
  const [showCustom, setShowCustom] = useState(false);
  const filtered = useMemo(() => templates.filter(t => (category === "All" || t.category === category) && (t.title + " " + t.category).toLowerCase().includes(query.toLowerCase())), [query, category]);
  const editorHref = (width: number, height: number, title = "My design") => `/editor?width=${width}&height=${height}&title=${encodeURIComponent(title)}`;
  return <main className="create-page">
    <header className="create-nav"><Link className="create-brand" href="/"><span className="create-mark">P</span> posterstudio</Link><div className="create-nav-right"><span>Creative workspace</span><Link href="/editor" className="create-open-editor">Open editor <ArrowRight size={15}/></Link></div></header>
    <div className="create-content">
      <Link href="/" className="create-back"><ArrowLeft size={15}/> Back to home</Link>
      <section className="create-hero"><div><span className="create-eyebrow"><Sparkles size={14}/> YOUR NEXT IDEA STARTS HERE</span><h1>What would you like<br/>to <span>create today?</span></h1><p>Start with a size, explore a template, or open a blank canvas and make it yours.</p></div><div className="create-hero-art"><div className="create-art-card create-art-back">YOUR STORY<br/>YOUR STYLE</div><div className="create-art-card create-art-front"><small>POSTERSTUDIO PRESENTS</small><strong>MAKE<br/>SOMETHING<br/>MATTERS.</strong><i>✳</i></div></div></section>
      <section className="create-section"><div className="create-section-head"><div><h2>Start with a size</h2><p>Choose a canvas made for where your design will live.</p></div><button className="create-custom-toggle" onClick={()=>setShowCustom(v=>!v)}><Plus size={16}/> Custom dimensions</button></div>
        {showCustom && <form className="create-custom-form" onSubmit={e=>{e.preventDefault();const w=Number(customWidth),h=Number(customHeight);if(w>=50&&h>=50&&w<=10000&&h<=10000)window.location.href=editorHref(w,h,"Custom design");}}><label>Width (px)<input type="number" min="50" max="10000" value={customWidth} onChange={e=>setCustomWidth(e.target.value)} required/></label><span>×</span><label>Height (px)<input type="number" min="50" max="10000" value={customHeight} onChange={e=>setCustomHeight(e.target.value)} required/></label><button type="submit">Create canvas <ArrowRight size={15}/></button></form>}
        <div className="create-preset-grid">{presets.map(p=>{const Icon=p.icon;return <Link key={p.name} href={editorHref(p.width,p.height,p.name)} className="create-preset-card"><span className="create-preset-icon"><Icon size={19}/></span><strong>{p.name}</strong><small>{p.width} × {p.height} px</small><ArrowRight className="create-preset-arrow" size={15}/></Link>})}<Link href="/editor?blank=1" className="create-preset-card create-blank-card"><span className="create-preset-icon"><Plus size={19}/></span><strong>Blank canvas</strong><small>Start from scratch</small><ArrowRight className="create-preset-arrow" size={15}/></Link></div>
      </section>
      <section className="create-section" id="templates"><div className="create-section-head"><div><h2>Explore templates</h2><p>A little inspiration goes a long way. Pick a starting point.</p></div><label className="create-search"><Search size={16}/><input placeholder="Search templates" value={query} onChange={e=>setQuery(e.target.value)}/></label></div>
        <div className="create-categories">{["All","Event flyer","Personal brand","Wellness","Promotion","Fitness","Business"].map(c=><button key={c} onClick={()=>setCategory(c)} className={category===c?"active":""}>{c}</button>)}</div>
        <div className="create-template-grid">{filtered.map((t,i)=><Link href={editorHref(1080,1350,t.title)} key={t.title} className="create-template-card"><div className="create-template-art" style={{background:t.bg}}><small>{t.tag}</small><strong>{t.headline.split("\n").map((line,j)=><span key={j}>{line}</span>)}</strong><i>{i%2===0?"✳":"◒"}</i><span className="create-template-sticker">MAKE IT YOURS</span></div><div className="create-template-meta"><span><strong>{t.title}</strong><small>{t.category}</small></span><ArrowRight size={16}/></div></Link>)}</div>
        {filtered.length===0&&<div className="create-no-results">No templates match that search. Try another keyword.</div>}
      </section>
      <section className="create-bottom-cta"><div><span className="create-eyebrow">READY WHEN YOU ARE</span><h2>Your canvas. Your rules.</h2><p>Every great design starts with one small step.</p></div><Link href="/editor" className="create-cta-button">Open a blank design <ArrowRight size={16}/></Link></section>
    </div>
    <footer className="create-footer"><Link href="/" className="create-brand"><span className="create-mark">P</span> posterstudio</Link><span>Make something worth stopping for.</span><span>© {new Date().getFullYear()} PosterStudio</span></footer>
  </main>;
}
