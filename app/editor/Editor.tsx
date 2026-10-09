"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, ImagePlus, Redo2, Save, Square, Circle as CircleIcon, Type, Undo2, Trash2, Copy, Plus, Check } from "lucide-react";
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
  const [background, setBackground] = useState("#f5c45a");
  const [objectColor, setObjectColor] = useState("#24212b");
  const [fontSize, setFontSize] = useState(62);
  const [zoom, setZoom] = useState(0.62);
  const [preset, setPreset] = useState("Instagram post");
  const [canvasSize, setCanvasSize] = useState({ width: 1080, height: 1080 });
  const [ready, setReady] = useState(false);

  const pushHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const snapshot = JSON.stringify(canvas.toJSON());
    const entries = historyRef.current.slice(0, historyIndexRef.current + 1);
    if (entries[entries.length - 1] === snapshot) return;
    entries.push(snapshot);
    if (entries.length > 40) entries.shift();
    historyRef.current = entries;
    historyIndexRef.current = entries.length - 1;
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

  useEffect(() => {
    if (!elementRef.current || canvasRef.current) return;
    const canvas = new Canvas(elementRef.current, {
      width: 1080,
      height: 1080,
      backgroundColor: "#f5c45a",
      preserveObjectStacking: true,
      selection: true
    });
    canvasRef.current = canvas;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
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
      if (mod && event.key.toLowerCase() === "z") { event.preventDefault(); event.shiftKey ? redo() : undo(); }
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
    const url = URL.createObjectURL(file);
    void FabricImage.fromURL(url).then((img) => {
      const maxWidth = canvas.getWidth() * 0.65;
      const maxHeight = canvas.getHeight() * 0.65;
      const scale = Math.min(maxWidth / (img.width || 1), maxHeight / (img.height || 1), 1);
      img.set({ left: 100, top: 100, scaleX: scale, scaleY: scale, cornerColor: "#6941f4", transparentCorners: false });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.requestRenderAll();
      setSelected(img);
      pushHistory();
      scheduleSave();
      URL.revokeObjectURL(url);
      setStatus("Image added");
    }).catch(() => { URL.revokeObjectURL(url); setStatus("Could not load that image"); });
    event.target.value = "";
  };

  const applyProperty = (property: string, value: string | number) => {
    if (!selected || !canvasRef.current) return;
    selected.set({ [property]: value });
    canvasRef.current.requestRenderAll();
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
  const exportDesign = (format: "png" | "jpeg") => {
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

  return <main className="editor-page">
    <header className="editor-top">
      <div style={{display:"flex",alignItems:"center",gap:12,minWidth:0}}><Link href="/" aria-label="Back to home" style={{display:"flex",alignItems:"center",gap:6,color:"#716d7c"}}><ArrowLeft size={18}/></Link><span className="logo"><span className="logo-mark">P</span></span><input aria-label="Design name" value={projectName} onChange={(e)=>{setProjectName(e.target.value);scheduleSave();}} style={{width:"min(220px,28vw)",border:0,outline:"none",fontSize:13,fontWeight:700}}/><span className="editor-status">{status}</span></div>
      <div style={{display:"flex",gap:7,alignItems:"center"}}><button className="btn btn-secondary" title="Undo (Ctrl+Z)" onClick={undo}><Undo2 size={16}/></button><button className="btn btn-secondary" title="Redo (Ctrl+Shift+Z)" onClick={redo}><Redo2 size={16}/></button><button className="btn btn-secondary" onClick={saveLocal}><Save size={16}/><span className="hide-mobile">Save</span></button><button className="btn btn-primary" onClick={()=>exportDesign("png")}><Download size={16}/> Export</button></div>
    </header>
    <div className="editor-layout">
      <aside className="editor-sidebar"><p className="panel-title">Add to your design</p>
        <button className="editor-tool active" onClick={addText}><Type size={16} style={{display:"inline",verticalAlign:"middle",marginRight:8}}/>Add text</button>
        <button className="editor-tool" onClick={()=>addShape("rect")}><Square size={16} style={{display:"inline",verticalAlign:"middle",marginRight:8}}/>Rectangle</button>
        <button className="editor-tool" onClick={()=>addShape("circle")}><CircleIcon size={16} style={{display:"inline",verticalAlign:"middle",marginRight:8}}/>Circle</button>
        <button className="editor-tool" onClick={()=>addShape("line")}><span style={{display:"inline-block",width:16,borderTop:"2px solid currentColor",verticalAlign:"middle",marginRight:8}}/>Line</button>
        <label className="editor-tool" style={{display:"block",cursor:"pointer"}}><ImagePlus size={16} style={{display:"inline",verticalAlign:"middle",marginRight:8}}/>Upload image<input aria-label="Upload image" type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadImage} style={{display:"none"}}/></label>
        <div style={{height:1,background:"#eeecf2",margin:"18px 0"}}/><p className="panel-title">Canvas size</p>
        <label className="field"><span>Preset</span><select value={preset} onChange={(e)=>changePreset(e.target.value)}>{PRESETS.map((item)=><option key={item.label}>{item.label}</option>)}</select></label>
        <p style={{fontSize:11,color:"#858190"}}>{canvasSize.width} × {canvasSize.height} px</p>
        <p className="panel-title" style={{marginTop:22}}>Background</p><label className="field"><span>Canvas colour</span><input aria-label="Canvas background colour" type="color" value={background} onChange={(e)=>changeBackground(e.target.value)} style={{height:38,padding:3}}/></label>
        <p className="editor-message">Tip: double-click text on the canvas to edit it. Drag objects to position them.</p>
      </aside>
      <section className="editor-canvas-area" aria-label="Design workspace">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,width:"100%",maxWidth:720}}><span style={{fontSize:12,color:"#777482"}}>{canvasSize.width} × {canvasSize.height} px</span><label style={{display:"flex",alignItems:"center",gap:9,fontSize:12,color:"#777482"}}>Zoom <input aria-label="Canvas zoom" type="range" min="0.25" max="0.75" step="0.05" value={zoom} onChange={(e)=>setZoom(Number(e.target.value))}/>{Math.round(zoom*100)}%</label></div>
        <div className="canvas-wrap"><canvas ref={elementRef} /></div>
        {!ready && <p className="editor-message">Loading your design…</p>}
        <p className="editor-message">Your draft is saved to this browser. Cloud sync and user accounts are not enabled in this starter.</p>
      </section>
      <aside className="editor-inspector"><p className="panel-title">Properties</p>
        {!selected ? <div style={{padding:"22px 12px",background:"#f8f7fa",borderRadius:10,color:"#777482",fontSize:13,lineHeight:1.6}}>Select an object on the canvas to edit its properties, or add something from the left panel.</div> : <>
          <p style={{fontSize:12,color:"#777482"}}>{selected instanceof IText ? "Text object" : selected instanceof FabricImage ? "Image object" : "Shape object"}</p>
          {selected instanceof IText && <><label className="field"><span>Font size</span><input type="number" min="8" max="220" value={fontSize} onChange={(e)=>{const n=Number(e.target.value);setFontSize(n);applyProperty("fontSize",n);}}/></label><label className="field"><span>Font family</span><select value={selected.fontFamily || "Arial"} onChange={(e)=>applyProperty("fontFamily",e.target.value)}><option>Arial</option><option>Georgia</option><option>Verdana</option><option>Times New Roman</option><option>Courier New</option></select></label><label className="field"><span>Weight</span><select value={String(selected.fontWeight || "normal")} onChange={(e)=>applyProperty("fontWeight",e.target.value)}><option value="normal">Regular</option><option value="bold">Bold</option></select></label><label className="field"><span>Alignment</span><select value={selected.textAlign || "left"} onChange={(e)=>applyProperty("textAlign",e.target.value)}><option value="left">Left</option><option value="center">Centre</option><option value="right">Right</option></select></label></>}
          <label className="field"><span>Fill / colour</span><input type="color" value={/^#[0-9a-f]{6}$/i.test(objectColor)?objectColor:"#24212b"} onChange={(e)=>{setObjectColor(e.target.value);applyProperty(selected instanceof Line ? "stroke" : "fill",e.target.value);}} style={{height:38,padding:3}}/></label>
          <label className="field"><span>Opacity</span><input type="range" min="0.1" max="1" step="0.05" value={selected.opacity ?? 1} onChange={(e)=>applyProperty("opacity",Number(e.target.value))}/></label>
          <label className="field"><span>Rotation</span><input type="number" min="-360" max="360" value={Math.round(selected.angle || 0)} onChange={(e)=>applyProperty("angle",Number(e.target.value))}/></label>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginTop:18}}><button className="btn btn-secondary" onClick={duplicateObject}><Copy size={15}/> Duplicate</button><button className="btn btn-secondary" onClick={deleteObject}><Trash2 size={15}/> Delete</button></div>
        </>}
        <div style={{height:1,background:"#eeecf2",margin:"24px 0"}}/><p className="panel-title">Export artwork</p><button className="btn btn-primary" style={{width:"100%",marginBottom:8}} onClick={()=>exportDesign("png")}><Download size={16}/> Download PNG</button><button className="btn btn-secondary" style={{width:"100%"}} onClick={()=>exportDesign("jpeg")}><Download size={16}/> Download JPEG</button>
      </aside>
    </div>
  </main>;
}
