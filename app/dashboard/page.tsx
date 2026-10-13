import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardActions from "./DashboardActions";
import { ArrowUpRight, Plus, FolderOpen, Layers3, Clock3, LayoutTemplate, PenTool, Image as ImageIcon, BookOpen, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

type Project = {id:string;title:string;width:number;height:number;thumbnail:string|null;updated_at:string};
function WorkspaceShell({children,email,cloudReady}:{children:React.ReactNode;email?:string;cloudReady:boolean}){
 return <main className="nova-dashboard"><aside className="nova-dash-sidebar">
   <Link href="/" className="nova-brand"><span className="nova-symbol">✳</span><span>posterstudio</span></Link>
   <div className="nova-dash-navlabel">WORKSPACE</div>
   <nav aria-label="Workspace navigation"><Link className="active" href="/dashboard"><Layers3 size={17}/> Overview</Link><Link href="/create"><LayoutTemplate size={17}/> Create new</Link><Link href="/editor"><PenTool size={17}/> Open editor</Link></nav>
   <div className="nova-dash-sidebar-bottom"><div className="nova-dash-sync"><span className={cloudReady?"nova-live-dot":"nova-offline-dot"}/>{cloudReady?"Cloud workspace":"Local editor available"}</div><Link href="/" className="nova-dash-back">← Back to website</Link></div>
  </aside>
  <div className="nova-dash-main"><header className="nova-dash-top"><div><span className="nova-dash-breadcrumb">Workspace</span><span className="nova-dash-separator">/</span><strong>Overview</strong></div><div className="nova-dash-user">{email&&<span>{email}</span>}{email?<DashboardActions/>:<Link href="/login">Sign in <ArrowUpRight size={14}/></Link>}</div></header>{children}</div>
 </main>
}
function QuickStarts(){return <div className="nova-dash-quick-grid">
 <Link href="/editor" className="nova-dash-quick nova-dash-quick-photo"><div className="nova-dash-quick-icon"><ImageIcon size={24}/></div><span>Photo composition</span><ArrowUpRight size={18}/></Link>
 <Link href="/editor" className="nova-dash-quick nova-dash-quick-designer"><div className="nova-dash-quick-icon"><PenTool size={24}/></div><span>Vector & design</span><ArrowUpRight size={18}/></Link>
 <Link href="/create" className="nova-dash-quick nova-dash-quick-publisher"><div className="nova-dash-quick-icon"><BookOpen size={24}/></div><span>Custom canvas</span><ArrowUpRight size={18}/></Link>
 </div>}
export default async function DashboardPage(){
 const supabase=await createClient();
 if(!supabase)return <WorkspaceShell cloudReady={false}><div className="nova-dash-content">
  <div className="nova-dash-welcome"><span className="nova-overline">YOUR CREATIVE HOME</span><h1>Make room for<br/><em>your next idea.</em></h1><p>Start designing right away. Connect Supabase when you are ready for account-based cloud projects.</p><div className="nova-dash-actions"><Link href="/create" className="nova-button nova-button-accent">Create a design <Plus size={17}/></Link><Link href="/editor" className="nova-button nova-button-outline">Open editor <ArrowUpRight size={17}/></Link></div></div>
  <div className="nova-dash-section-head"><div><span className="nova-overline">QUICK START</span><h2>What will you create?</h2></div></div><QuickStarts/>
  <div className="nova-dash-empty"><FolderOpen size={30}/><h3>Your creative space is ready.</h3><p>Cloud projects are not configured yet. You can still create and save drafts locally in your browser.</p><Link href="/editor">Open local editor <ArrowRight size={15}/></Link></div>
 </div></WorkspaceShell>;
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const {data:projects}=await supabase.from("projects").select("id,title,width,height,thumbnail,updated_at").eq("user_id",user.id).order("updated_at",{ascending:false});
 const items=(projects||[]) as Project[];
 return <WorkspaceShell cloudReady email={user.email}><div className="nova-dash-content">
  <div className="nova-dash-welcome"><span className="nova-overline">YOUR CREATIVE HOME</span><h1>Welcome back.<br/><em>Let&apos;s make something.</em></h1><p>Pick up where you left off, or give your next idea a fresh canvas.</p><div className="nova-dash-actions"><Link href="/create" className="nova-button nova-button-accent">Create a design <Plus size={17}/></Link><Link href="/editor" className="nova-button nova-button-outline">Open editor <ArrowUpRight size={17}/></Link></div></div>
  <div className="nova-dash-section-head"><div><span className="nova-overline">QUICK START</span><h2>Choose your direction</h2></div></div><QuickStarts/>
  <div className="nova-dash-section-head nova-dash-recent"><div><span className="nova-overline">YOUR LIBRARY</span><h2>Recent projects <span className="nova-project-count">{items.length}</span></h2></div><Link href="/create" className="nova-text-link">New project <Plus size={16}/></Link></div>
  <div className="nova-dash-project-grid"><Link href="/create" className="nova-dash-new-project"><Plus size={27}/><strong>Start from scratch</strong><small>Blank canvas or a preset</small></Link>
  {items.map(p=><article className="nova-dash-project" key={p.id}><Link href={"/editor?project="+encodeURIComponent(p.id)} className="nova-dash-project-art">{p.thumbnail?<img src={p.thumbnail} alt="Project preview"/>:<div className="nova-dash-project-placeholder"><span>✳</span></div>}</Link><div className="nova-dash-project-info"><Link href={"/editor?project="+encodeURIComponent(p.id)}><strong>{p.title}</strong></Link><small>{p.width} × {p.height} px</small><span><Clock3 size={12}/> {new Date(p.updated_at).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</span></div><DashboardActions projectId={p.id}/></article>)}</div>
  {items.length===0&&<p className="nova-dash-footnote">Your cloud library is empty. Create your first design to see it here.</p>}
 </div></WorkspaceShell>;
}