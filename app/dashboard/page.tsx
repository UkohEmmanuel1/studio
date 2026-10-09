import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardActions from "./DashboardActions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  if (!supabase) return <main className="dashboard-page"><header className="dashboard-nav"><Link href="/" className="create-brand"><span className="create-mark">P</span> PosterStudio</Link></header><section className="dashboard-content"><p className="create-eyebrow">CLOUD WORKSPACE</p><h1>Your designs, all in one place.</h1><p>Configure Supabase to enable account-based project saving and syncing.</p><Link className="btn btn-primary" href="/login">Set up your account</Link><Link className="btn btn-secondary" href="/editor">Open the editor</Link></section></main>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: projects } = await supabase.from("projects").select("id,title,width,height,thumbnail,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false });
  return <main className="dashboard-page">
    <header className="dashboard-nav"><Link href="/" className="create-brand"><span className="create-mark">P</span> PosterStudio</Link><div><span className="dashboard-email">{user.email}</span><DashboardActions /></div></header>
    <section className="dashboard-content"><div className="dashboard-heading"><div><p className="create-eyebrow">YOUR CREATIVE WORKSPACE</p><h1>Your projects.</h1><p>Pick up where you left off, or start with a fresh canvas.</p></div><Link href="/create" className="btn btn-primary">＋ Create a design</Link></div>
      <div className="dashboard-project-grid">
        <Link href="/create" className="dashboard-new-project"><span>＋</span><strong>Create a new design</strong><small>Choose a size or template</small></Link>
        {(projects||[]).map(project=><article className="dashboard-project" key={project.id}><Link href={"/editor?project="+project.id} className="dashboard-project-art">{project.thumbnail ? <img src={project.thumbnail} alt="" /> : <span>✳</span>}</Link><div><Link href={"/editor?project="+project.id}><strong>{project.title}</strong></Link><small>{project.width} × {project.height} px</small></div><DashboardActions projectId={project.id} /></article>)}
      </div>
    </section>
  </main>;
}
