"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, ImagePlus, Redo2, Save, Square, Circle as CircleIcon, Type, Undo2, Trash2, Copy, Plus, Check, LayoutTemplate, Shapes, Palette, Upload, Search, ChevronDown, Sparkles, Layers, ZoomIn, ZoomOut, PanelLeft, AlignLeft, MoveUpRight, Grid2X2, Eye, EyeOff, Lock, Unlock, ArrowUp, ArrowDown, AlignHorizontalJustifyCenter, AlignVerticalJustifyCenter, MousePointer2, RotateCcw, Command, Maximize2, Moon, Sun, History, Camera, PenTool, BookOpen, X } from "lucide-react";
import { Canvas, FabricImage, IText, Rect, Circle, Line, FabricObject } from "fabric";

type SavedDocument = { version: 1; width: number; height: number; background: string; objects: object[] };
const STORAGE_KEY = "posterstudio:draft:v1";
const PRESETS = [
  { label: "Instagram post", width: 1080, height: 1080 },
  { label: "Portrait post", width: 1080, height: 1350 },
  { label: "Story / Reel", width: 1080, height: 1920 },
  { label: "Landscape", width: 1200, height: 630 }
];

export default function Editor() {
  const elementRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<Canvas | null>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selected, setSelected] = useState<FabricObject | null>(null);
  const [projectName, setProjectName] = useState("My first poster");
  const [status, setStatus] = useState("All changes saved");
  const [background, setBackground] = useState("#ffffff");
  const [objectColor, setObjectColor] = useState("#24212b");
  const [fontSize, setFontSize] = useState(62);
  const [zoom, setZoom] = useState(0.62);
  const [preset, setPreset] = useState("Instagram post");
  const [canvasSize, setCanvasSize] = useState({ width: 1080, height: 1080 });
  const [ready, setReady] = useState(false);
  const [activePanel, setActivePanel] = useState("Design");
  const [cloudProjectId, setCloudProjectId] = useState<string | null>(null);
  const [layerRevision, setLayerRevision] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [showRulers, setShowRulers] = useState(false);
  const [persona, setPersona] = useState<"Photo"|"Designer"|"Publisher">("Designer");
  const [theme, setTheme] = useState<"dark"|"light">("dark");
  const [focusMode, setFocusMode] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [historyRevision, setHistoryRevision] = useState(0);
  const [exportFormat, setExportFormat] = useState<"png"|"jpeg"|"webp">("png");

  const pushHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const snapshot = JSON.stringify(canvas.toObject(["assetPath"]));
    setLayerRevision(v => v + 1);
    const entries = historyRef.current.slice(0, historyIndexRef.current + 1);
    if (entries[entries.length - 1] === snapshot) return;
    entries.push(snapshot);
    if (entries.length > 40) entries.shift();
    historyRef.current = entries;
    historyIndexRef.current = entries.length - 1;
    setHistoryRevision(v=>v+1);
  }, []);

  const saveLocal = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setStatus("Saving…");
    try {
      const doc: SavedDocument = {
        version: 1,
        width: canvas.getWidth(),
        height: canvas.getHeight(),
        background: String(canvas.backgroundColor || "#ffffff"),
        objects: canvas.toJSON().objects as object[]
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...doc, projectName }));
      setStatus("Saved in this browser");
    } catch {
      setStatus("Could not save — check browser storage");
    }
  }, [projectName]);

  const scheduleSave = useCallback(() => {
    setStatus("Unsaved changes");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveLocal(), 650);
  }, [saveLocal]);

  const saveCloud = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    saveLocal();
    const document = {
      version: 1,
      pages: [{
        width: canvas.getWidth(),
        height: canvas.getHeight(),
        background: String(canvas.backgroundColor || "#ffffff"),
        objects: canvas.toObject(["assetPath"]).objects
      }]
    };
    try {
      const response = await fetch(cloudProjectId ? "/api/projects/" + cloudProjectId : "/api/projects", {
        method: cloudProjectId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: projectName.trim().slice(0, 120) || "Untitled design",
          width: canvas.getWidth(),
          height: canvas.getHeight(),
          document
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus(response.status === 401 ? "Saved locally · sign in to sync to cloud" : result.error || "Cloud save unavailable");
        return;
      }
      if (result.project?.id && !cloudProjectId) {
        setCloudProjectId(result.project.id);
        window.history.replaceState({}, "", "/editor?project=" + encodeURIComponent(result.project.id));
      }
      setStatus("Saved to your cloud workspace");
    } catch {
      setStatus("Saved locally · cloud connection unavailable");
    }
  };

  useEffect(() => {
    if (!elementRef.current || canvasRef.current) return;
    const canvas = new Canvas(elementRef.current, {
      width: 1080,
      height: 1080,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
      selection: true
    });
    canvasRef.current = canvas;
    const params = new URLSearchParams(window.location.search);
    const requestedProject = params.get("project");
    const requestedWidth = Number(params.get("width"));
    const requestedHeight = Number(params.get("height"));
    const requestedTitle = params.get("title");
    if (requestedWidth >= 50 && requestedWidth <= 10000 && requestedHeight >= 50 && requestedHeight <= 10000) {
      canvas.setDimensions({ width: requestedWidth, height: requestedHeight });
      setCanvasSize({ width: requestedWidth, height: requestedHeight });
      setZoom(Math.min(0.62, 420 / requestedWidth));
    }
    if (requestedTitle) setProjectName(requestedTitle.slice(0, 120));
    const stored = localStorage.getItem(STORAGE_KEY);
    if (requestedProject) {
      void fetch("/api/projects/" + encodeURIComponent(requestedProject))
        .then(async (response) => {
          if (!response.ok) throw new Error("Could not load cloud project");
          return response.json();
        })
        .then(async ({ project }) => {
          const document = project.document as { width?: number; height?: number; background?: string; objects?: object[]; pages?: Array<{width:number;height:number;background:string;objects:object[]}> };
          const page = document.pages?.[0];
          const width = page?.width || document.width || project.width || 1080;
          const height = page?.height || document.height || project.height || 1080;
          const background = page?.background || document.background || "#ffffff";
          const objects = page?.objects || document.objects || [];
          const hydratedObjects = await Promise.all(objects.map(async (value) => {
            const object = value as { assetPath?: string; src?: string };
            if (!object.assetPath) return value;
            const assetResponse = await fetch("/api/assets?path=" + encodeURIComponent(object.assetPath));
            if (!assetResponse.ok) throw new Error("Could not restore a stored image");
            const assetResult = await assetResponse.json();
            return { ...object, src: assetResult.url };
          }));
          canvas.setDimensions({ width, height });
          canvas.backgroundColor = background;
          await canvas.loadFromJSON({ version: "6.7.1", objects: hydratedObjects, background });
          canvas.requestRenderAll();
          setCanvasSize({ width, height });
          setBackground(background);
          setProjectName(project.title || "My design");
          setCloudProjectId(project.id);
          setZoom(Math.min(0.62, 420 / width));
          pushHistory();
          setReady(true);
          setStatus("Cloud project loaded");
        })
        .catch(() => { setReady(true); setStatus("Could not load cloud project — sign in and try again"); });
    } else if (stored) {
      try {
        const parsed = JSON.parse(stored) as SavedDocument & { projectName?: string };
        if (parsed.version === 1 && Array.isArray(parsed.objects)) {
          canvas.setDimensions({ width: parsed.width || 1080, height: parsed.height || 1080 });
          canvas.backgroundColor = parsed.background || "#ffffff";
          void canvas.loadFromJSON({ version: "6.7.1", objects: parsed.objects, background: parsed.background }).then(() => {
            canvas.requestRenderAll();
            setCanvasSize({ width: canvas.getWidth(), height: canvas.getHeight() });
            setBackground(String(canvas.backgroundColor || "#ffffff"));
            if (parsed.projectName) setProjectName(parsed.projectName);
            setZoom(Math.min(0.62, 420 / canvas.getWidth()));
            pushHistory();
            setReady(true);
          });
        } else {
          setReady(true);
          pushHistory();
        }
      } catch {
        setReady(true);
        pushHistory();
      }
    } else {
      setReady(true);
      pushHistory();
    }
    const updateSelection = () => {
      const active = canvas.getActiveObject() || null;
      setSelected(active);
      if (active && "fill" in active && typeof active.fill === "string") setObjectColor(active.fill);
      if (active instanceof IText) setFontSize(active.fontSize || 62);
    };
    const onChanged = () => { updateSelection(); scheduleSave(); };
    canvas.on("selection:created", updateSelection);
    canvas.on("selection:updated", updateSelection);
    canvas.on("selection:cleared", () => setSelected(null));
    canvas.on("object:modified", () => { pushHistory(); onChanged(); });
    canvas.on("object:added", () => { pushHistory(); scheduleSave(); });
    canvas.on("object:removed", () => { pushHistory(); scheduleSave(); });
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      canvas.dispose();
      canvasRef.current = null;
    };
  // The canvas is intentionally initialised once; handlers use stable callbacks.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scaledWidth = Math.max(180, Math.min(640, canvas.getWidth() * zoom));
    const scaledHeight = canvas.getHeight() * (scaledWidth / canvas.getWidth());
    canvas.setDimensions({ width: scaledWidth, height: scaledHeight }, { cssOnly: true });
    canvas.setZoom(scaledWidth / canvas.getWidth());
    canvas.requestRenderAll();
  }, [zoom, ready]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || (target instanceof HTMLElement && target.isContentEditable)) return;
      const mod = event.ctrlKey || event.metaKey;
      if (event.key === "Delete" || event.key === "Backspace") { const active = canvas.getActiveObject(); if (active) { canvas.remove(active); canvas.discardActiveObject(); canvas.requestRenderAll(); pushHistory(); scheduleSave(); } }
      if (mod && event.key.toLowerCase() === "z") { event.preventDefault(); if (event.shiftKey) redo(); else undo(); }
      if (mod && event.key.toLowerCase() === "d") { event.preventDefault(); duplicateObject(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, selected]);

  const addText = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const text = new IText("Your headline", { left: 100, top: 120, fontSize: 62, fontFamily: "Arial", fontWeight: "bold", fill: "#24212b", editable: true, cornerColor: "#6941f4", transparentCorners: false });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.requestRenderAll();
    setSelected(text);
    pushHistory();
    scheduleSave();
  };

  const addShape = (shape: "rect" | "circle" | "line") => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let object: FabricObject;
    if (shape === "rect") object = new Rect({ left: 140, top: 180, width: 260, height: 150, fill: objectColor, rx: 10, ry: 10, cornerColor: "#6941f4", transparentCorners: false });
    else if (shape === "circle") object = new Circle({ left: 180, top: 180, radius: 90, fill: objectColor, cornerColor: "#6941f4", transparentCorners: false });
    else object = new Line([100, 100, 360, 100], { left: 100, top: 100, stroke: objectColor, strokeWidth: 8 });
    canvas.add(object);
    canvas.setActiveObject(object);
    canvas.requestRenderAll();
    setSelected(object);
    pushHistory();
    scheduleSave();
  };

  const uploadImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const canvas = canvasRef.current;
    if (!file || !canvas) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { setStatus("Choose a PNG, JPEG or WebP image"); event.target.value = ""; return; }
    if (file.size > 8 * 1024 * 1024) { setStatus("Image must be smaller than 8 MB"); event.target.value = ""; return; }
    const localUrl = URL.createObjectURL(file);
    void (async () => {
      let sourceUrl = localUrl;
      let assetPath: string | undefined;
      try {
        const form = new FormData();
        form.append("file", file);
        const response = await fetch("/api/assets", { method: "POST", body: form });
        if (response.ok) {
          const result = await response.json();
          sourceUrl = result.url;
          assetPath = result.path;
        }
      } catch {
        // Cloud upload is optional; keep the existing local-image workflow available.
      }
      try {
        const img = await FabricImage.fromURL(sourceUrl);
        const maxWidth = canvas.getWidth() * 0.65;
        const maxHeight = canvas.getHeight() * 0.65;
        const scale = Math.min(maxWidth / (img.width || 1), maxHeight / (img.height || 1), 1);
        img.set({ left: 100, top: 100, scaleX: scale, scaleY: scale, cornerColor: "#6941f4", transparentCorners: false, ...(assetPath ? { assetPath } : {}) });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.requestRenderAll();
        setSelected(img);
        pushHistory();
        scheduleSave();
        setStatus(assetPath ? "Image uploaded to private cloud storage" : "Image added to this browser draft");
      } catch {
        setStatus("Could not load that image");
      } finally {
        URL.revokeObjectURL(localUrl);
      }
    })();
    event.target.value = "";
  };

  const applyProperty = (property: string, value: string | number) => {
    if (!selected || !canvasRef.current) return;
    selected.set({ [property]: value });
    canvasRef.current.requestRenderAll();
    pushHistory();
    scheduleSave();
  };

  const undo = () => {
    const canvas = canvasRef.current;
    if (!canvas || historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    const snapshot = historyRef.current[historyIndexRef.current];
    if (snapshot) void canvas.loadFromJSON(snapshot).then(() => { canvas.requestRenderAll(); setSelected(null); scheduleSave(); });
  };
  const redo = () => {
    const canvas = canvasRef.current;
    if (!canvas || historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    const snapshot = historyRef.current[historyIndexRef.current];
    if (snapshot) void canvas.loadFromJSON(snapshot).then(() => { canvas.requestRenderAll(); setSelected(null); scheduleSave(); });
  };
  const duplicateObject = () => {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObject();
    if (!canvas || !active) return;
    void active.clone().then((clone) => {
      clone.set({ left: (active.left || 0) + 24, top: (active.top || 0) + 24 });
      canvas.add(clone);
      canvas.setActiveObject(clone);
      canvas.requestRenderAll();
      setSelected(clone);
      pushHistory();
      scheduleSave();
    });
  };
  const deleteObject = () => {
    const canvas = canvasRef.current;
    if (!canvas || !selected) return;
    canvas.remove(selected);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    setSelected(null);
    pushHistory();
    scheduleSave();
  };
  const updateLayer = (obj: FabricObject, action: "up" | "down" | "visibility" | "lock") => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (action === "up") canvas.bringObjectForward(obj);
    if (action === "down") canvas.sendObjectBackwards(obj);
    if (action === "visibility") {
      obj.set("visible", !obj.visible);
      if (!obj.visible) { canvas.discardActiveObject(); setSelected(null); }
    }
    if (action === "lock") {
      const locked = obj.selectable === false;
      obj.set({ selectable: locked, evented: locked, lockMovementX: !locked, lockMovementY: !locked, lockScalingX: !locked, lockScalingY: !locked, lockRotation: !locked });
      if (!locked) { canvas.discardActiveObject(); setSelected(null); }
    }
    canvas.requestRenderAll();
    setLayerRevision(v => v + 1);
    pushHistory();
    scheduleSave();
  };
  const alignSelected = (axis: "horizontal" | "vertical") => {
    const canvas = canvasRef.current;
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    const bounds = obj.getBoundingRect();
    if (axis === "horizontal") obj.set("left", obj.left + (canvas.getWidth() - bounds.width) / 2 - bounds.left);
    else obj.set("top", obj.top + (canvas.getHeight() - bounds.height) / 2 - bounds.top);
    obj.setCoords();
    canvas.requestRenderAll();
    pushHistory();
    scheduleSave();
  };
  const resetView = () => {
    const canvas = canvasRef.current;
    if (canvas) setZoom(Math.max(0.25, Math.min(0.75, 520 / canvas.getWidth(), 520 / canvas.getHeight())));
  };
  const changePreset = (value: string) => {
    const chosen = PRESETS.find((item) => item.label === value);
    const canvas = canvasRef.current;
    if (!chosen || !canvas) return;
    canvas.setDimensions({ width: chosen.width, height: chosen.height });
    setCanvasSize({ width: chosen.width, height: chosen.height });
    setPreset(value);
    setZoom(Math.min(0.62, 420 / chosen.width));
    pushHistory();
    scheduleSave();
  };
  const changeBackground = (value: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.backgroundColor = value;
    canvas.requestRenderAll();
    setBackground(value);
    pushHistory();
    scheduleSave();
  };
  const exportDesign = (format: "png" | "jpeg" | "webp") => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const data = canvas.toDataURL({ format, multiplier: 1, quality: 0.92 });
      const anchor = document.createElement("a");
      anchor.href = data;
      anchor.download = (projectName.trim().replace(/[^a-z0-9-_]+/gi, "-") || "poster") + "." + format;
      anchor.click();
      setStatus("Exported " + format.toUpperCase());
    } catch {
      setStatus("Export failed. Try removing unusually large images.");
    }
  };

  const restoreHistory = (index: number) => {
    const canvas = canvasRef.current;
    const snapshot = historyRef.current[index];
    if (!canvas || !snapshot) return;
    historyIndexRef.current = index;
    void canvas.loadFromJSON(snapshot).then(() => {
      canvas.requestRenderAll();
      setSelected(null);
      setHistoryRevision(v=>v+1);
      setLayerRevision(v=>v+1);
      scheduleSave();
    });
  };
  const commands = [
    {label:"Add text layer",action:()=>addText()},
    {label:"Add rectangle",action:()=>addShape("rect")},
    {label:"Add circle",action:()=>addShape("circle")},
    {label:"Open layers panel",action:()=>setActivePanel("Layers")},
    {label:"Open history panel",action:()=>setActivePanel("History")},
    {label:"Open color panel",action:()=>setActivePanel("Color")},
    {label:"Switch to Photo",action:()=>setPersona("Photo")},
    {label:"Switch to Designer",action:()=>setPersona("Designer")},
    {label:"Switch to Publisher",action:()=>setPersona("Publisher")},
    {label:"Toggle focus mode",action:()=>setFocusMode(v=>!v)},
    {label:"Fit canvas",action:resetView},
    {label:"Export PNG",action:()=>exportDesign("png")}
  ];
  return <main className={"studio-shell studio-pro studio-theme-"+theme+(focusMode?" studio-focus":"")}>
    <header className="studio-topbar">
      <div className="studio-brand-group">
        <Link href="/" className="studio-back" aria-label="Back to home"><ArrowLeft size={18}/></Link>
        <Link href="/" className="studio-logo"><span className="studio-logo-mark">P</span><span>PosterStudio</span></Link>
        <span className="studio-top-divider"/>
        <div className="studio-document-name"><input aria-label="Design name" value={projectName} onChange={(e)=>{setProjectName(e.target.value);scheduleSave();}}/><ChevronDown size={14}/></div>
      </div>
      <div className="studio-top-center"><span className="studio-save-dot"/><span>{status}</span></div>
      <div className="studio-top-actions">
        <div className="studio-persona-switcher" role="group" aria-label="Creative workspace">{(["Photo","Designer","Publisher"] as const).map(name=><button key={name} className={persona===name?"active":""} onClick={()=>{setPersona(name);setActivePanel(name==="Photo"?"Photo tools":name==="Publisher"?"Pages":"Elements");}} aria-pressed={persona===name}>{name==="Photo"?<Camera size={14}/>:name==="Designer"?<PenTool size={14}/>:<BookOpen size={14}/>}<span>{name}</span></button>)}</div>
        <button className="studio-icon-btn" title="Command palette" aria-label="Open command palette" onClick={()=>setCommandOpen(true)}><Command size={17}/></button>
        <button className="studio-icon-btn" title="Toggle theme" aria-label="Toggle theme" onClick={()=>setTheme(v=>v==="dark"?"light":"dark")}>{theme==="dark"?<Sun size={17}/>:<Moon size={17}/>}</button>
        <button className="studio-icon-btn" title="Focus mode" aria-label="Focus mode" onClick={()=>setFocusMode(v=>!v)}><Maximize2 size={17}/></button>
        <button className="studio-icon-btn" title="Undo (Ctrl+Z)" onClick={undo}><Undo2 size={17}/></button>
        <button className="studio-icon-btn" title="Redo (Ctrl+Shift+Z)" onClick={redo}><Redo2 size={17}/></button>
        <button className="studio-share-btn" onClick={()=>void saveCloud()}><Save size={16}/> <span>Save</span></button>
        <button className="studio-export-btn" onClick={()=>exportDesign("png")}><Download size={16}/> Export</button>
      </div>
    </header>
    <div className="studio-body">
      <nav className="studio-rail" aria-label="Editor tools">
        {[
          {name:"Design",icon:<LayoutTemplate size={20}/>},
          {name:"Elements",icon:<Shapes size={20}/>},
          {name:"Text",icon:<Type size={20}/>},
          {name:"Uploads",icon:<Upload size={20}/>},
          {name:"Brand",icon:<Palette size={20}/>},
          {name:"Layers",icon:<Layers size={20}/>},
          {name:"Color",icon:<Palette size={20}/>},
          {name:"History",icon:<History size={20}/>},
          {name:"Pages",icon:<BookOpen size={20}/>}
        ].map((tool)=><button key={tool.name} className={activePanel===tool.name?"studio-rail-item active":"studio-rail-item"} onClick={()=>setActivePanel(tool.name)}>{tool.icon}<span>{tool.name}</span></button>)}
        <div className="studio-rail-spacer"/>
        <button className="studio-rail-item" onClick={()=>setActivePanel("Design")} title="Select tool"><MousePointer2 size={20}/><span>Select</span></button>
      </nav>
      <aside className="studio-panel">
        <div className="studio-panel-heading"><div><h2>{activePanel==="Brand"?"Brand kit":activePanel==="Layers"?"Layers":activePanel}</h2><p>{activePanel==="Design"?"Set up your canvas":activePanel==="Elements"?"Build with simple shapes":activePanel==="Text"?"Add a message":activePanel==="Uploads"?"Bring your own images":activePanel==="Brand"?"Choose your visual style":"Manage design objects"}</p></div><button className="studio-subtle-icon" title="Panel options"><PanelLeft size={16}/></button></div>
        {activePanel==="Design" && <>
          <label className="studio-search"><Search size={16}/><input placeholder="Search templates" aria-label="Search templates" onChange={(e)=>setStatus(e.target.value?"Template search is a preview feature":"All changes saved")}/></label>
          <div className="studio-panel-label">Canvas format</div>
          <div className="studio-preset-grid">{PRESETS.map((item,i)=><button key={item.label} className={preset===item.label?"studio-preset selected":"studio-preset"} onClick={()=>changePreset(item.label)}><span className={"preset-shape preset-"+i}/><span>{item.label}</span><small>{item.width} × {item.height}</small></button>)}</div>
          <div className="studio-panel-label">Background colour</div>
          <div className="studio-color-row"><input type="color" aria-label="Canvas background colour" value={background} onChange={(e)=>changeBackground(e.target.value)}/><input value={background.toUpperCase()} aria-label="Background hex colour" onChange={(e)=>{if(/^#[0-9a-f]{6}$/i.test(e.target.value))changeBackground(e.target.value);}}/><button className="studio-subtle-icon" title="More colours"><Palette size={16}/></button></div>
          <div className="studio-tip"><Sparkles size={17}/><span><strong>Make it yours</strong><br/>Start with a clean canvas, then add your own type, colour and imagery.</span></div>
        </>}
        {activePanel==="Elements" && <><div className="studio-panel-label">Shapes and lines</div><div className="studio-element-grid"><button onClick={()=>addShape("rect")}><Square size={26}/><span>Rectangle</span></button><button onClick={()=>addShape("circle")}><CircleIcon size={26}/><span>Circle</span></button><button onClick={()=>addShape("line")}><MoveUpRight size={26}/><span>Line</span></button><button onClick={()=>addShape("rect")}><Grid2X2 size={26}/><span>Block</span></button></div><div className="studio-tip"><Shapes size={17}/><span>Click an element to add it to the canvas. Drag to move and use the handles to resize.</span></div></>}
        {activePanel==="Text" && <><button className="studio-add-text" onClick={addText}><Plus size={18}/> Add a text box</button><button className="studio-text-style" onClick={()=>{addText();setStatus("Headline added — double-click it to edit");}}><strong>Add a heading</strong><span>Big, bold statement</span></button><button className="studio-text-style" onClick={()=>{const c=canvasRef.current;if(!c)return;const t=new IText("Add your body text here",{left:100,top:260,fontSize:30,fontFamily:"Arial",fill:"#24212b"});c.add(t);c.setActiveObject(t);c.requestRenderAll();setSelected(t);pushHistory();scheduleSave();}}> <span style={{fontSize:17,fontWeight:700}}>Add a subheading</span><span>Support your main message</span></button><p className="studio-help">Tip: double-click any text on your canvas to edit its content.</p></>}
        {activePanel==="Uploads" && <><label className="studio-upload-zone"><Upload size={24}/><strong>Upload an image</strong><span>PNG, JPG or WebP · up to 8 MB</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadImage}/></label><p className="studio-help">Your image is placed on the canvas and stays in this browser draft.</p></>}
        {activePanel==="Brand" && <><div className="studio-panel-label">Quick palette</div><div className="studio-swatches">{["#315efb","#d8ff64","#17191f","#f2f3f5","#e88a6a","#ffffff","#64748b"].map(color=><button key={color} aria-label={"Use "+color} style={{background:color}} onClick={()=>{setObjectColor(color);if(selected)applyProperty(selected instanceof Line?"stroke":"fill",color);else changeBackground(color);}}/>)}</div><div className="studio-panel-label">Brand colours</div><p className="studio-help">Pick a colour to apply it to the selected object, or to the canvas when nothing is selected.</p></>}
        {activePanel==="Color" && <><div className="studio-panel-label">Document palette</div><div className="studio-swatches">{["#315efb","#82aaff","#d8ff64","#17191f","#e88a6a","#ffffff","#64748b"].map(color=><button key={color} aria-label={"Apply "+color} style={{background:color}} onClick={()=>{setObjectColor(color);if(selected)applyProperty(selected instanceof Line?"stroke":"fill",color);else changeBackground(color);}}/>)}</div><div className="studio-panel-label">Custom color</div><input type="color" aria-label="Choose color" value={/^#[0-9a-f]{6}$/i.test(objectColor)?objectColor:"#315efb"} onChange={e=>{setObjectColor(e.target.value);if(selected)applyProperty(selected instanceof Line?"stroke":"fill",e.target.value);else changeBackground(e.target.value);}}/></>}
        {activePanel==="History" && <><div className="studio-panel-label">Undo history · {historyRef.current.length} states</div><div className="studio-history-list" data-revision={historyRevision}>{historyRef.current.map((_,i)=><button key={i} className={i===historyIndexRef.current?"active":""} onClick={()=>restoreHistory(i)}><History size={14}/><span>{i===0?"Document opened":"Edit "+i}</span>{i===historyIndexRef.current&&<Check size={13}/>}</button>)}</div></>}
        {activePanel==="Photo tools" && <><p className="studio-help">Photo mode currently supports imported images, transforms and opacity. Non-destructive filters and retouch brushes need a dedicated raster engine.</p><button className="studio-secondary-full" onClick={()=>setActivePanel("Uploads")}>Import a photo</button></>}
        {activePanel==="Pages" && <><div className="studio-panel-label">Current artboard</div><div className="studio-page-preview">01 · {canvasSize.width} × {canvasSize.height}</div><p className="studio-help">Multi-page documents and master pages are not yet implemented.</p></>}
        {activePanel==="Layers" && <><div className="studio-panel-label">Object stack · {canvasRef.current?.getObjects().length || 0} layers</div><div className="studio-layer-stack" data-revision={layerRevision}>{[...(canvasRef.current?.getObjects() || [])].reverse().map((obj,i)=><div key={i} className={"studio-layer-entry"+(selected===obj?" is-selected":"")}><button className="studio-layer-select" disabled={!obj.visible || !obj.selectable} onClick={()=>{const c=canvasRef.current;if(c){c.setActiveObject(obj);c.requestRenderAll();setSelected(obj);}}}><Layers size={15}/><span>{obj instanceof IText?String(obj.text||"Text layer").slice(0,22):obj instanceof FabricImage?"Image layer":obj instanceof Circle?"Circle":obj instanceof Rect?"Rectangle":"Shape"}</span></button><button aria-label="Toggle visibility" title="Toggle visibility" onClick={()=>updateLayer(obj,"visibility")}>{obj.visible?<Eye size={14}/>:<EyeOff size={14}/>}</button><button aria-label="Toggle lock" title="Toggle lock" onClick={()=>updateLayer(obj,"lock")}>{obj.selectable?<Unlock size={14}/>:<Lock size={14}/>}</button><button aria-label="Bring forward" title="Bring forward" onClick={()=>updateLayer(obj,"up")}><ArrowUp size={14}/></button><button aria-label="Send backward" title="Send backward" onClick={()=>updateLayer(obj,"down")}><ArrowDown size={14}/></button></div>)}</div>{!canvasRef.current?.getObjects().length&&<p className="studio-help">Add an element to see it in the layer stack.</p>}</>}
        <div className="studio-panel-bottom"><span className="studio-save-dot"/><span>Draft stored on this device</span></div>
      </aside>
      <section className="studio-workspace">
        <div className="studio-workspace-toolbar"><div className="studio-breadcrumb"><span>My projects</span><span>/</span><strong>{projectName||"Untitled design"}</strong></div><div className="studio-workspace-tools"><button className={"studio-view-toggle"+(showGrid?" is-on":"")} onClick={()=>setShowGrid(v=>!v)} title="Toggle canvas grid"><Grid2X2 size={14}/> Grid</button><button className={"studio-view-toggle"+(showRulers?" is-on":"")} onClick={()=>setShowRulers(v=>!v)} title="Toggle rulers"><AlignLeft size={14}/> Rulers</button><button className="studio-view-toggle" onClick={resetView} title="Fit artboard to view"><RotateCcw size={14}/> Fit</button><span className="studio-canvas-dimensions">{canvasSize.width} × {canvasSize.height} px</span><button className="studio-icon-btn" onClick={()=>setZoom(Math.max(.25,Number((zoom-.05).toFixed(2))))} title="Zoom out"><ZoomOut size={16}/></button><span className="studio-zoom-value">{Math.round(zoom*100)}%</span><input aria-label="Canvas zoom" type="range" min="0.25" max="0.75" step="0.05" value={zoom} onChange={(e)=>setZoom(Number(e.target.value))}/><button className="studio-icon-btn" onClick={()=>setZoom(Math.min(.75,Number((zoom+.05).toFixed(2))))} title="Zoom in"><ZoomIn size={16}/></button></div></div>
        <div className={"studio-canvas-stage"+(showGrid?" has-grid":"")+(showRulers?" has-rulers":"")}><div className="studio-canvas-wrap"><canvas ref={elementRef}/></div>{!ready&&<div className="studio-loading">Preparing your canvas…</div>}</div>
        <div className="studio-workspace-footer"><span><Check size={14}/> {cloudProjectId ? "Cloud project · autosave on this device" : "Local draft · sign in to sync across devices"}</span><span>Tip: select an object to edit its properties</span></div>
      </section>
      <aside className="studio-inspector">
        <div className="studio-inspector-title"><h2>Properties</h2>{selected&&<span className="studio-selected-pill">Selected</span>}</div>
        {!selected ? <div className="studio-empty-selection"><div className="studio-empty-icon"><AlignLeft size={21}/></div><strong>Nothing selected</strong><p>Select an element on the canvas to adjust its style, position and appearance.</p></div> : <>
          <div className="studio-selected-object"><span className="studio-object-icon">{selected instanceof IText?<Type size={17}/>:selected instanceof FabricImage?<ImagePlus size={17}/>:<Shapes size={17}/>}</span><span><strong>{selected instanceof IText?"Text layer":selected instanceof FabricImage?"Image layer":selected instanceof Circle?"Circle shape":selected instanceof Rect?"Rectangle shape":"Design element"}</strong><small>Canvas object</small></span><button className="studio-subtle-icon" title="Delete object" onClick={deleteObject}><Trash2 size={16}/></button></div>
          {selected instanceof IText&&<><label className="studio-field"><span>Text size</span><div className="studio-input-with-unit"><input type="number" min="8" max="220" value={fontSize} onChange={(e)=>{const n=Number(e.target.value);setFontSize(n);applyProperty("fontSize",n);}}/><span>px</span></div></label><label className="studio-field"><span>Font family</span><select value={selected.fontFamily||"Arial"} onChange={(e)=>applyProperty("fontFamily",e.target.value)}><option>Arial</option><option>Georgia</option><option>Verdana</option><option>Times New Roman</option><option>Courier New</option></select></label><label className="studio-field"><span>Style</span><select value={String(selected.fontWeight||"normal")} onChange={(e)=>applyProperty("fontWeight",e.target.value)}><option value="normal">Regular</option><option value="bold">Bold</option></select></label><label className="studio-field"><span>Alignment</span><select value={selected.textAlign||"left"} onChange={(e)=>applyProperty("textAlign",e.target.value)}><option value="left">Left</option><option value="center">Centre</option><option value="right">Right</option></select></label></>}
          <label className="studio-field"><span>Colour</span><div className="studio-color-row"><input type="color" aria-label="Object colour" value={/^#[0-9a-f]{6}$/i.test(objectColor)?objectColor:"#24212b"} onChange={(e)=>{setObjectColor(e.target.value);applyProperty(selected instanceof Line?"stroke":"fill",e.target.value);}}/><input value={objectColor.toUpperCase()} readOnly aria-label="Selected colour hex"/></div></label>
          <label className="studio-field"><span>Opacity <b>{Math.round((selected.opacity??1)*100)}%</b></span><input type="range" min="0.1" max="1" step="0.05" value={selected.opacity??1} onChange={(e)=>applyProperty("opacity",Number(e.target.value))}/></label>
          <label className="studio-field"><span>Rotation <b>{Math.round(selected.angle||0)}°</b></span><input type="range" min="-180" max="180" step="1" value={selected.angle||0} onChange={(e)=>applyProperty("angle",Number(e.target.value))}/></label>
          <div className="studio-panel-label">Align to artboard</div><div className="studio-object-actions"><button onClick={()=>alignSelected("horizontal")}><AlignHorizontalJustifyCenter size={15}/> Centre X</button><button onClick={()=>alignSelected("vertical")}><AlignVerticalJustifyCenter size={15}/> Centre Y</button></div>
          <div className="studio-object-actions"><button onClick={duplicateObject}><Copy size={15}/> Duplicate</button><button onClick={deleteObject}><Trash2 size={15}/> Delete</button></div>
        </>}
        <div className="studio-inspector-divider"/>
        <div className="studio-panel-label">Export design</div><label className="studio-field"><span>Format</span><select aria-label="Export format" value={exportFormat} onChange={e=>setExportFormat(e.target.value as "png"|"jpeg"|"webp")}><option value="png">PNG</option><option value="jpeg">JPEG</option><option value="webp">WebP</option></select></label><p className="studio-export-note">Download a high-resolution image using your canvas dimensions.</p><button className="studio-export-full" onClick={()=>exportDesign(exportFormat)}><Download size={16}/> Export {exportFormat.toUpperCase()}</button><button className="studio-secondary-full" onClick={()=>exportDesign("jpeg")}><Download size={16}/> Download JPEG</button>
      </aside>
    </div>
    {commandOpen&&<div className="studio-command-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setCommandOpen(false);}}><div className="studio-command-dialog" role="dialog" aria-modal="true" aria-label="Command palette"><div className="studio-command-search"><Search size={18}/><input autoFocus placeholder="Search tools, workspaces and actions…" aria-label="Search commands" value={commandQuery} onChange={e=>setCommandQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Escape")setCommandOpen(false);if(e.key==="Enter"){const item=commands.find(c=>c.label.toLowerCase().includes(commandQuery.toLowerCase()));if(item){item.action();setCommandOpen(false);setCommandQuery("");}}}}/><button onClick={()=>setCommandOpen(false)} aria-label="Close commands"><X size={18}/></button></div><div className="studio-command-results">{commands.filter(c=>c.label.toLowerCase().includes(commandQuery.toLowerCase())).map(c=><button key={c.label} onClick={()=>{c.action();setCommandOpen(false);setCommandQuery("");}}><Command size={14}/><span>{c.label}</span></button>)}</div><div className="studio-command-hint">Enter to run first result · Esc to close</div></div></div>}
  </main>;
}
