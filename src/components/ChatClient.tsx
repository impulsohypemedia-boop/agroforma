"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Trash2, Upload, Plus, FileDown, FileSpreadsheet, MessageSquare } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useAppContext } from "@/context/AppContext";
import { AnalysisResult } from "@/types/analysis";
import { generateChatMessagePDF } from "@/lib/pdf/report-pdf";

// ─── Types ────────────────────────────────────────────────────────────────────
type Message = { role: "user" | "assistant"; content: string };

type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
};

function makeTitle(msg: string): string {
  const clean = msg.trim().replace(/\n/g, " ");
  return clean.length > 42 ? clean.slice(0, 42) + "…" : clean;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Ahora";
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `Hace ${hrs}h`;
  return `Hace ${Math.floor(hrs / 24)}d`;
}

// ─── Markdown renderer ────────────────────────────────────────────────────────
function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0; let m: RegExpExecArray | null; let key = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[2] !== undefined) parts.push(<strong key={key++}>{m[2]}</strong>);
    else if (m[3] !== undefined) parts.push(<em key={key++}>{m[3]}</em>);
    else if (m[4] !== undefined) parts.push(
      <code key={key++} style={{ backgroundColor: "#F0EDE6", borderRadius: 4, padding: "1px 5px", fontSize: "0.9em", fontFamily: "monospace" }}>{m[4]}</code>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function renderTable(lines: string[]): React.ReactNode {
  const rows = lines.filter((l) => l.trim().startsWith("|")).map((l) =>
    l.trim().slice(1, l.trim().endsWith("|") ? -1 : undefined).split("|").map((c) => c.trim())
  );
  const isSep = (row: string[]) => row.every((c) => /^[-:]+$/.test(c));
  const headerRows: string[][] = []; const bodyRows: string[][] = []; let seenSep = false;
  for (const row of rows) {
    if (isSep(row)) { seenSep = true; continue; }
    if (!seenSep) headerRows.push(row); else bodyRows.push(row);
  }
  return (
    <div style={{ overflowX: "auto", marginTop: 6, marginBottom: 6 }}>
      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
        {headerRows.length > 0 && (
          <thead>{headerRows.map((row, i) => (
            <tr key={i}>{row.map((cell, j) => (
              <th key={j} style={{ backgroundColor: "#1A3311", color: "#fff", fontWeight: 700, padding: "7px 12px", textAlign: "left", whiteSpace: "nowrap" }}>{cell}</th>
            ))}</tr>
          ))}</thead>
        )}
        <tbody>{bodyRows.map((row, i) => (
          <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#FAFAF8" : "#FFFFFF" }}>
            {row.map((cell, j) => (
              <td key={j} style={{ padding: "6px 12px", borderBottom: "1px solid #E8E5DE", color: "#1A1A1A" }}>{renderInline(cell)}</td>
            ))}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function MarkdownContent({ text }: { text: string }) {
  const nodes: React.ReactNode[] = []; let key = 0;
  const lines = text.split("\n"); let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith("|")) {
      const tl: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith("|") || lines[i].trim().match(/^[-|: ]+$/))) { tl.push(lines[i]); i++; }
      nodes.push(<div key={key++}>{renderTable(tl)}</div>); continue;
    }
    const h3 = line.match(/^###\s+(.+)/); const h2 = line.match(/^##\s+(.+)/); const h1 = line.match(/^#\s+(.+)/);
    if (h1) { nodes.push(<p key={key++} style={{ fontWeight: 700, fontSize: 15, margin: "10px 0 4px" }}>{renderInline(h1[1])}</p>); i++; continue; }
    if (h2) { nodes.push(<p key={key++} style={{ fontWeight: 700, fontSize: 13, margin: "8px 0 3px" }}>{renderInline(h2[1])}</p>); i++; continue; }
    if (h3) { nodes.push(<p key={key++} style={{ fontWeight: 700, fontSize: 12, margin: "6px 0 2px" }}>{renderInline(h3[1])}</p>); i++; continue; }
    if (line.match(/^[-*]\s+/)) {
      const bullets: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*]\s+/)) { bullets.push(lines[i].replace(/^[-*]\s+/, "")); i++; }
      nodes.push(<ul key={key++} style={{ paddingLeft: 18, margin: "4px 0" }}>{bullets.map((b, bi) => <li key={bi} style={{ marginBottom: 2, fontSize: 13 }}>{renderInline(b)}</li>)}</ul>); continue;
    }
    if (line.match(/^\d+\.\s+/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s+/)) { items.push(lines[i].replace(/^\d+\.\s+/, "")); i++; }
      nodes.push(<ol key={key++} style={{ paddingLeft: 18, margin: "4px 0" }}>{items.map((b, bi) => <li key={bi} style={{ marginBottom: 2, fontSize: 13 }}>{renderInline(b)}</li>)}</ol>); continue;
    }
    if (line.trim() === "") { nodes.push(<div key={key++} style={{ height: 6 }} />); i++; continue; }
    nodes.push(<p key={key++} style={{ margin: "2px 0", fontSize: 13, lineHeight: 1.65 }}>{renderInline(line)}</p>); i++;
  }
  return <div>{nodes}</div>;
}

function hasTable(text: string): boolean {
  return text.split("\n").some((l) => l.trim().startsWith("|") && l.trim().endsWith("|"));
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "4px 0" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#9B9488", animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
      ))}
      <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0.8);opacity:0.5}40%{transform:scale(1.2);opacity:1}}`}</style>
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({
  msg,
  isStreaming,
  empresa,
}: {
  msg: Message;
  isStreaming?: boolean;
  empresa?: string | null;
}) {
  const [downloading, setDownloading] = useState<"pdf" | "xlsx" | null>(null);
  const isUser = msg.role === "user";
  const isDone = !isStreaming && msg.role === "assistant" && msg.content.trim().length > 0;

  const handlePDF = () => {
    generateChatMessagePDF(msg.content, empresa);
  };

  const handleExcel = async () => {
    setDownloading("xlsx");
    try {
      const res = await fetch("/api/chat/excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: msg.content, empresa }),
      });
      if (!res.ok) throw new Error("Error al generar Excel");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `agroforma-chat-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { /* silent */ }
    finally { setDownloading(null); }
  };

  if (isUser) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <div style={{ maxWidth: "70%", borderRadius: "18px 18px 4px 18px", backgroundColor: "#1A3311", color: "#fff", padding: "10px 16px", fontSize: 13, lineHeight: 1.6, boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }}>
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "flex-start" }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "#1A3311", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#D4AD3C", flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}>
        AF
      </div>
      <div style={{ maxWidth: "75%" }}>
        <div style={{ borderRadius: "18px 18px 18px 4px", backgroundColor: "#FFFFFF", border: "1px solid #E8E5DE", padding: "10px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          {isStreaming && msg.content === "" ? <TypingDots /> : <MarkdownContent text={msg.content} />}
          {isStreaming && msg.content !== "" && (
            <span style={{ display: "inline-block", width: 2, height: 14, backgroundColor: "#3D7A1C", marginLeft: 2, verticalAlign: "middle", animation: "blink 0.8s step-end infinite" }} />
          )}
          <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
        </div>

        {/* Download buttons — only for completed assistant messages */}
        {isDone && (
          <div style={{ display: "flex", gap: 6, marginTop: 5, paddingLeft: 4 }}>
            <button
              onClick={handlePDF}
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, border: "1px solid #E8E5DE", background: "#FAFAF8", cursor: "pointer", fontSize: 11, color: "#9B9488", transition: "all 0.15s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#3D7A1C"; (e.currentTarget as HTMLButtonElement).style.color = "#3D7A1C"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#E8E5DE"; (e.currentTarget as HTMLButtonElement).style.color = "#9B9488"; }}
              title="Descargar como PDF"
            >
              <FileDown size={12} /> PDF
            </button>
            {hasTable(msg.content) && (
              <button
                onClick={handleExcel}
                disabled={downloading === "xlsx"}
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, border: "1px solid #E8E5DE", background: "#FAFAF8", cursor: downloading ? "wait" : "pointer", fontSize: 11, color: "#9B9488", transition: "all 0.15s" }}
                onMouseEnter={(e) => { if (!downloading) { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1E7E34"; (e.currentTarget as HTMLButtonElement).style.color = "#1E7E34"; }}}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#E8E5DE"; (e.currentTarget as HTMLButtonElement).style.color = "#9B9488"; }}
                title="Descargar tablas como Excel"
              >
                <FileSpreadsheet size={12} /> {downloading === "xlsx" ? "…" : "Excel"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Conversation panel ───────────────────────────────────────────────────────
function ConversationPanel({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className="flex flex-col h-full shrink-0 border-r"
      style={{ width: 220, backgroundColor: "#1A3311", borderColor: "#0D2508" }}
    >
      {/* New conversation button */}
      <div className="px-3 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors"
          style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#FFFFFF" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.18)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)")}
        >
          <Plus size={15} />
          Nueva conversación
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2">
        {conversations.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <MessageSquare size={20} style={{ color: "rgba(255,255,255,0.2)", margin: "0 auto 8px" }} />
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Sin conversaciones</p>
          </div>
        ) : (
          [...conversations].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map((conv) => {
            const isActive = conv.id === activeId;
            return (
              <div
                key={conv.id}
                className="group relative mx-2 mb-0.5 rounded-lg cursor-pointer transition-colors"
                style={{ backgroundColor: isActive ? "rgba(255,255,255,0.15)" : "transparent" }}
                onClick={() => onSelect(conv.id)}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLDivElement).style.backgroundColor = "rgba(255,255,255,0.07)"; }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent"; }}
              >
                <div className="px-3 py-2.5 pr-8">
                  <p className="text-xs font-medium truncate leading-snug" style={{ color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.65)" }}>
                    {conv.title}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {timeAgo(conv.updatedAt)}
                  </p>
                </div>
                {/* Delete button */}
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded cursor-pointer"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,100,100,0.9)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
                  title="Eliminar"
                >
                  ×
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
          {conversations.length} conversación{conversations.length !== 1 ? "es" : ""}
        </p>
      </div>
    </div>
  );
}

// ─── Suggestions ──────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  "¿Cuál es la situación financiera de la empresa?",
  "Comparame los resultados de este ejercicio con el anterior",
  "¿Qué cultivo generó más ingresos?",
  "¿Cuáles son los principales gastos de producción?",
  "Calculá el ROE y ROA de la empresa",
  "¿Cuál es el nivel de endeudamiento?",
];

// ─── Main component ───────────────────────────────────────────────────────────
export default function ChatClient() {
  const { fileStore } = useAppContext();
  const [conversations,    setConversations]    = useState<Conversation[]>([]);
  const [activeId,         setActiveId]         = useState<string | null>(null);
  const [input,            setInput]            = useState("");
  const [streaming,        setStreaming]        = useState(false);
  const [analysisResult,   setAnalysisResult]   = useState<AnalysisResult | null>(null);
  const [hydrated,         setHydrated]         = useState(false);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef    = useRef<AbortController | null>(null);

  // ── Active conversation messages ──────────────────────────────────────────
  const activeConv = conversations.find((c) => c.id === activeId) ?? null;
  const messages   = activeConv?.messages ?? [];

  const setMessages = useCallback((updater: (prev: Message[]) => Message[]) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? { ...c, messages: updater(c.messages), updatedAt: new Date().toISOString() }
          : c
      )
    );
  }, [activeId]);

  // ── Load from localStorage ─────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem("agroforma_conversations");
      if (saved) {
        const convs: Conversation[] = JSON.parse(saved);
        setConversations(convs);
        if (convs.length > 0) {
          const lastId = localStorage.getItem("agroforma_active_conv");
          const found = convs.find((c) => c.id === lastId);
          setActiveId(found ? found.id : convs[convs.length - 1].id);
        }
      }
      const savedAnalysis = localStorage.getItem("agroforma_analysis");
      if (savedAnalysis) setAnalysisResult(JSON.parse(savedAnalysis));
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  // ── Persist ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("agroforma_conversations", JSON.stringify(conversations));
  }, [conversations, hydrated]);

  useEffect(() => {
    if (!hydrated || !activeId) return;
    localStorage.setItem("agroforma_active_conv", activeId);
  }, [activeId, hydrated]);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── New conversation ───────────────────────────────────────────────────────
  const newConversation = useCallback(() => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    setConversations((prev) => [...prev, { id, title: "Nueva conversación", messages: [], createdAt: now, updatedAt: now }]);
    setActiveId(id);
    setInput("");
  }, []);

  // ── Delete conversation ────────────────────────────────────────────────────
  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (id === activeId) {
        setActiveId(next.length > 0 ? next[next.length - 1].id : null);
      }
      return next;
    });
  }, [activeId]);

  // ── Send message ───────────────────────────────────────────────────────────
  const empresa = analysisResult?.empresa ?? null;

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    // If no active conversation, create one
    let convId = activeId;
    if (!convId) {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const title = makeTitle(trimmed);
      setConversations((prev) => [...prev, { id, title, messages: [], createdAt: now, updatedAt: now }]);
      setActiveId(id);
      convId = id;
    }

    const userMsg: Message = { role: "user", content: trimmed };

    // Update title if first message
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c;
        const isFirst = c.messages.length === 0 && c.title === "Nueva conversación";
        return {
          ...c,
          title:    isFirst ? makeTitle(trimmed) : c.title,
          messages: [...c.messages, userMsg, { role: "assistant", content: "" }],
          updatedAt: new Date().toISOString(),
        };
      })
    );

    setInput("");
    setStreaming(true);

    const historyForSend = [...messages, userMsg];

    try {
      const fd = new FormData();
      fd.append("messages", JSON.stringify(historyForSend));
      if (analysisResult) fd.append("analysis", JSON.stringify(analysisResult));
      fileStore.forEach((f) => fd.append("files", f));

      abortRef.current = new AbortController();
      const res = await fetch("/api/chat", { method: "POST", body: fd, signal: abortRef.current.signal });
      if (!res.ok || !res.body) throw new Error("Error al conectar con el asistente");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const acc = accumulated;
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== convId) return c;
            const msgs = [...c.messages];
            msgs[msgs.length - 1] = { role: "assistant", content: acc };
            return { ...c, messages: msgs, updatedAt: new Date().toISOString() };
          })
        );
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      const errMsg = "Hubo un error al conectar con el asistente. Intentá de nuevo.";
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c;
          const msgs = [...c.messages];
          msgs[msgs.length - 1] = { role: "assistant", content: errMsg };
          return { ...c, messages: msgs };
        })
      );
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [messages, streaming, fileStore, analysisResult, activeId]);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); sendMessage(input); };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const clearCurrent = () => {
    if (!activeConv) return;
    if (confirm("¿Borrar esta conversación?")) deleteConversation(activeConv.id);
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#F9F8F4" }}>
      <Sidebar />

      {/* ── Conversation panel ── */}
      <ConversationPanel
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={newConversation}
        onDelete={deleteConversation}
      />

      {/* ── Chat area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header
          className="shrink-0 flex items-center justify-between px-8 py-5 border-b bg-white/80 backdrop-blur-sm"
          style={{ borderColor: "#E8E5DE" }}
        >
          <div>
            <h1 className="text-xl font-semibold" style={{ color: "#1A1A1A" }}>
              {activeConv?.title ?? "Asistente AgroForma"}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "#9B9488" }}>
              {empresa
                ? `${empresa}${analysisResult?.cuit ? ` · CUIT ${analysisResult.cuit}` : ""}`
                : "Subí documentos para que el asistente tenga contexto de tu empresa"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {fileStore.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full" style={{ backgroundColor: "#EBF3E8", color: "#3D7A1C" }}>
                <Upload size={12} />
                {fileStore.length} archivo{fileStore.length !== 1 ? "s" : ""} en memoria
              </span>
            )}
            {activeConv && activeConv.messages.length > 0 && (
              <button
                onClick={clearCurrent}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                style={{ color: "#9B9488", border: "1px solid #E8E5DE" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#C0392B")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#9B9488")}
              >
                <Trash2 size={13} />
                Eliminar
              </button>
            )}
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div style={{ maxWidth: 780, margin: "0 auto" }}>

            {isEmpty && (
              <div className="flex flex-col items-center gap-6 py-12">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: "#1A3311" }}>
                  <span style={{ color: "#D4AD3C", fontWeight: 700, fontSize: 18 }}>AF</span>
                </div>
                <div className="text-center">
                  <h2 className="font-semibold text-base mb-2" style={{ color: "#1A1A1A" }}>¿En qué puedo ayudarte hoy?</h2>
                  <p className="text-sm max-w-md" style={{ color: "#9B9488" }}>
                    {fileStore.length > 0
                      ? `Tengo acceso a ${fileStore.length} documento${fileStore.length !== 1 ? "s" : ""}. Podés preguntarme lo que necesites.`
                      : "Podés hacerme preguntas generales sobre el agro o subir documentos para análisis específicos."}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full max-w-xl">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-left px-4 py-3 rounded-xl text-xs border transition-colors cursor-pointer"
                      style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E5DE", color: "#1A1A1A" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#3D7A1C"; (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F0F7EC"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#E8E5DE"; (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#FFFFFF"; }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <MessageBubble
                key={i}
                msg={msg}
                isStreaming={streaming && i === messages.length - 1 && msg.role === "assistant"}
                empresa={empresa}
              />
            ))}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input */}
        <div className="shrink-0 px-8 py-4 border-t" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E5DE" }}>
          <form onSubmit={handleSubmit} style={{ maxWidth: 780, margin: "0 auto" }}>
            <div
              className="flex items-end gap-3 rounded-2xl border px-4 py-3 transition-colors"
              style={{ borderColor: "#D6D1C8", backgroundColor: "#FAFAF8" }}
              onFocusCapture={(e) => (e.currentTarget.style.borderColor = "#3D7A1C")}
              onBlurCapture={(e) => (e.currentTarget.style.borderColor = "#D6D1C8")}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px"; }}
                onKeyDown={handleKeyDown}
                placeholder="Preguntá lo que necesites… (Enter para enviar, Shift+Enter para nueva línea)"
                disabled={streaming}
                rows={1}
                style={{ flex: 1, resize: "none", background: "transparent", border: "none", outline: "none", fontSize: 13, lineHeight: 1.6, color: "#1A1A1A", fontFamily: "var(--font-plus-jakarta)", overflowY: "hidden", minHeight: 24, maxHeight: 160 }}
              />
              <button
                type="submit"
                disabled={!input.trim() || streaming}
                className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                style={{ backgroundColor: input.trim() && !streaming ? "#3D7A1C" : "#D6D1C8", color: "#fff" }}
              >
                <Send size={15} />
              </button>
            </div>
            <p className="text-center text-xs mt-2" style={{ color: "#B0A99F" }}>
              AgroForma puede cometer errores. Verificá la información importante.
            </p>
          </form>
        </div>

      </div>
    </div>
  );
}
