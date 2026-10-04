import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BookOpen, Bot, Bug, ChevronRight, Code2, FileCode2, FileText,
  GraduationCap, Image, LayoutDashboard, Menu, MessageSquare,
  Moon, Paperclip, Play, Plus, Search, Send, Settings, Sparkles,
  Sun, Trophy, Upload, User, X, Zap, CheckCircle2, Clock3,
  BarChart3, Brain, Lightbulb, Target, PanelLeftClose, PanelLeftOpen, Trash2
} from "lucide-react";
import "./styles.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) {
    const detail = typeof data === "object" ? data.detail || JSON.stringify(data) : data;
    throw new Error(detail || `Request failed with status ${response.status}`);
  }
  return data;
}

async function sendChat(message, topK = 5, documentId = null) {
  return apiRequest("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      top_k: topK,
      document_id: documentId
    })
  });
}

async function uploadMaterial(file) {
  const form = new FormData();
  form.append("file", file);
  return apiRequest("/documents/upload", { method: "POST", body: form });
}

async function analyzeImage(file, question) {
  const form = new FormData();
  form.append("image", file);
  form.append("question", question || "Explain the programming content in this image and help me understand any errors.");
  return apiRequest("/multimodal/analyze-image", { method: "POST", body: form });
}

async function analyzeCode(code, language = "python") {
  return apiRequest("/code/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, language })
  });
}

const demoMessages = [
  {
    role: "assistant",
    text: "Hi! I'm your AI Programming Tutor. Ask me about a programming concept, upload your study material, or send a code screenshot for debugging.",
    sources: []
  },
  {
    role: "user",
    text: "Explain recursion in Python in a simple way.",
    sources: []
  },
  {
    role: "assistant",
    text: "Recursion is when a function calls itself to solve a smaller version of the same problem. Every recursive function needs a **base case** to stop the calls.\n\nThink of it like opening nested boxes: you keep opening a smaller box until you reach the smallest one, then return outward.",
    code: "def factorial(n):\n    if n == 0:          # base case\n        return 1\n    return n * factorial(n - 1)",
    sources: [{ title: "Python Programming Notes", page: 42 }]
  }
];

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "tutor", label: "AI Tutor", icon: MessageSquare },
  { id: "materials", label: "Materials", icon: BookOpen },
  { id: "debugger", label: "Code Debugger", icon: Bug },
  { id: "practice", label: "Practice", icon: Trophy },
  { id: "progress", label: "Progress", icon: BarChart3 }
];

const CHAT_HISTORY_KEY = "codeTutorChatHistory";

function createChatId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getChatTitle(messages) {
  const firstUser = messages.find(m => m.role === "user");
  if (!firstUser?.text) return "New conversation";
  return firstUser.text.replace(/\s+/g, " ").trim().slice(0, 42) || "New conversation";
}

function App() {
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dark, setDark] = useState(false);
  const [chatHistory, setChatHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) || "[]");
    } catch {
      return [];
    }
  });
  const [currentChatId, setCurrentChatId] = useState(null);

  useEffect(() => {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatHistory));
  }, [chatHistory]);

  function saveChat(messages, chatId = currentChatId) {
    if (!messages.some(m => m.role === "user")) return null;
    const id = chatId || createChatId();
    const existing = chatHistory.find(chat => chat.id === id);
    const chat = {
      id,
      title: getChatTitle(messages),
      messages,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setChatHistory(prev => [chat, ...prev.filter(item => item.id !== id)]);
    setCurrentChatId(id);
    return id;
  }

  function deleteChat(id) {
    setChatHistory(prev => prev.filter(chat => chat.id !== id));
    if (currentChatId === id) setCurrentChatId(null);
  }

  function openChat(id) {
    setCurrentChatId(id);
    setPage("tutor");
  }

  return (
    <div className={dark ? "app dark" : "app"}>
      <Sidebar
        page={page}
        setPage={setPage}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        chatHistory={chatHistory}
        currentChatId={currentChatId}
        onOpenChat={openChat}
        onDeleteChat={deleteChat}
      />
      <main className="main">
        <Topbar page={page} onMenu={() => setSidebarOpen(v => !v)} dark={dark} setDark={setDark} />
        <div className="page">
          {page === "dashboard" && <Dashboard setPage={setPage} />}
          {page === "tutor" && (
            <Tutor
              chatHistory={chatHistory}
              currentChatId={currentChatId}
              setCurrentChatId={setCurrentChatId}
              saveChat={saveChat}
            />
          )}
          {page === "materials" && <Materials />}
          {page === "debugger" && <Debugger />}
          {page === "practice" && <Practice />}
          {page === "progress" && <Progress />}
        </div>
      </main>
    </div>
  );
}

function Sidebar({ page, setPage, open, setOpen, chatHistory, currentChatId, onOpenChat, onDeleteChat }) {
  return (
    <aside className={`sidebar ${open ? "" : "collapsed"}`}>
      <div className="brand">
        <div className="brand-mark"><Sparkles size={20} /></div>
        {open && <div><strong>CodeTutor</strong><span>Multimodal AI</span></div>}
      </div>

      <button className="new-chat" onClick={() => { setPage("tutor"); onOpenChat(null); }}>
        <Plus size={18} /> {open && "New conversation"}
      </button>

      {open && chatHistory.length > 0 && (
        <div className="chat-history">
          <div className="history-label">CHAT HISTORY</div>
          <div className="history-list">
            {chatHistory.slice(0, 12).map(chat => (
              <div key={chat.id} className={`history-item ${currentChatId === chat.id ? "active" : ""}`}>
                <button className="history-open" onClick={() => onOpenChat(chat.id)} title={chat.title}>
                  <MessageSquare size={15} />
                  <span>{chat.title}</span>
                </button>
                <button className="history-delete" onClick={() => onDeleteChat(chat.id)} title="Delete chat">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <nav>
        <div className="nav-label">{open && "Workspace"}</div>
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <button key={item.id} className={`nav-item ${page === item.id ? "active" : ""}`} onClick={() => setPage(item.id)} title={item.label}>
              <Icon size={19} />
              {open && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        {open && (
          <div className="profile-mini">
            <div className="avatar">R</div>
            <div><strong>Student</strong><span>Beginner · Python</span></div>
          </div>
        )}
        <button className="nav-item" title="Settings"><Settings size={19} />{open && <span>Settings</span>}</button>
        <button className="collapse-btn" onClick={() => setOpen(v => !v)}>
          {open ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          {open && "Collapse sidebar"}
        </button>
      </div>
    </aside>
  );
}

function Topbar({ page, onMenu, dark, setDark }) {
  const title = navItems.find(x => x.id === page)?.label || "Dashboard";
  return (
    <header className="topbar">
      <div className="top-left">
        <button className="icon-btn mobile-menu" onClick={onMenu}><Menu size={20} /></button>
        <div>
          <h1>{title}</h1>
          <span className="breadcrumb">AI Programming Tutor / {title}</span>
        </div>
      </div>
      <div className="top-actions">
        <button className="icon-btn" onClick={() => setDark(v => !v)} title="Toggle theme">
          {dark ? <Sun size={19} /> : <Moon size={19} />}
        </button>
        <button className="icon-btn"><Search size={19} /></button>
        <div className="top-avatar">R</div>
      </div>
    </header>
  );
}

function Dashboard({ setPage }) {
  return (
    <>
      <section className="hero">
        <div>
          <div className="eyebrow"><Sparkles size={15}/> MULTIMODAL AI TUTOR</div>
          <h2>Learn. Code. <span>Understand.</span></h2>
          <p>Ask questions, debug code, analyze screenshots, and learn from your own programming materials.</p>
          <div className="hero-actions">
            <button className="primary-btn" onClick={() => setPage("tutor")}><MessageSquare size={17}/> Start learning</button>
            <button className="secondary-btn" onClick={() => setPage("materials")}><Upload size={17}/> Upload materials</button>
          </div>
        </div>
        <div className="hero-orb">
          <div className="orb-inner"><Brain size={54}/></div>
          <span className="orb-dot dot1"></span><span className="orb-dot dot2"></span><span className="orb-dot dot3"></span>
        </div>
      </section>

      <div className="section-head"><div><h3>Overview</h3><p>Your learning activity at a glance.</p></div></div>
      <div className="stats-grid">
        <Stat icon={BookOpen} label="Study materials" value="8" meta="+2 this week" />
        <Stat icon={MessageSquare} label="Questions asked" value="42" meta="+12 this week" />
        <Stat icon={Target} label="Topics mastered" value="14" meta="+3 this week" />
        <Stat icon={Zap} label="Learning streak" value="7 days" meta="Keep going!" />
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-head"><div><h3>Continue learning</h3><p>Pick up where you left off.</p></div><button className="text-btn" onClick={() => setPage("progress")}>View progress <ChevronRight size={15}/></button></div>
          <div className="learning-row">
            <div className="course-icon python"><Code2 size={23}/></div>
            <div className="course-info"><strong>Python Recursion</strong><span>Chapter 5 · 68% complete</span><div className="progress"><i style={{width:"68%"}}/></div></div>
            <button className="round-btn" onClick={() => setPage("tutor")}><Play size={15}/></button>
          </div>
          <div className="learning-row">
            <div className="course-icon ds"><Code2 size={23}/></div>
            <div className="course-info"><strong>Data Structures</strong><span>Binary Search Trees · 41% complete</span><div className="progress"><i style={{width:"41%"}}/></div></div>
            <button className="round-btn" onClick={() => setPage("tutor")}><Play size={15}/></button>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div><h3>Recommended for you</h3><p>Based on your recent activity.</p></div></div>
          <div className="recommendation"><div className="rec-icon"><Bug size={18}/></div><div><strong>Practice error handling</strong><span>You've had 5 recent questions about exceptions.</span></div><ChevronRight size={17}/></div>
          <div className="recommendation"><div className="rec-icon"><Lightbulb size={18}/></div><div><strong>Review recursion</strong><span>Strengthen your base-case understanding.</span></div><ChevronRight size={17}/></div>
        </div>
      </div>
    </>
  );
}

function Stat({icon: Icon, label, value, meta}) {
  return <div className="stat-card"><div className="stat-icon"><Icon size={19}/></div><div><span>{label}</span><strong>{value}</strong><small>{meta}</small></div></div>;
}

function Tutor({ chatHistory, currentChatId, setCurrentChatId, saveChat }) {
  const welcomeMessage = {
    role: "assistant",
    text: "Hi! I'm your AI Programming Tutor. Ask me about a programming concept, upload your study material, or send a code screenshot for debugging.",
    sources: []
  };
  const [messages, setMessages] = useState(() => {
    const active = chatHistory.find(chat => chat.id === currentChatId);
    return active?.messages || [welcomeMessage];
  });
  const [input, setInput] = useState("");
  const [attached, setAttached] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const active = chatHistory.find(chat => chat.id === currentChatId);
    setMessages(active?.messages || [welcomeMessage]);
    setInput("");
    setAttached(null);
    setError("");
  }, [currentChatId, chatHistory]);

  function updateMessages(updater) {
    setMessages(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      return next;
    });
  }

  async function send() {
    if ((!input.trim() && !attached) || loading) return;
    const question = input.trim() || `Analyze this file: ${attached.name}`;
    const file = attached;
    const userMessage = {
  role: "user",
  text: question,
  sources: [],
  attachment: file
    ? {
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        url: URL.createObjectURL(file)
      }
    : null
};
    const messagesAfterUser = [...messages, userMessage];

    updateMessages(messagesAfterUser);
    setInput("");
    setAttached(null);
    setLoading(true);
    setError("");

    // Create/save the conversation as soon as the first user message is sent.
    const chatId = saveChat(messagesAfterUser, currentChatId);

    try {
      let result;
      if (file && file.type.startsWith("image/")) {
        result = await analyzeImage(file, question);
        const assistantMessage = { role: "assistant", text: result.answer || result.message || "No answer returned.", sources: [] };
        const finalMessages = [...messagesAfterUser, assistantMessage];
        updateMessages(finalMessages);
        saveChat(finalMessages, chatId);
      } else {
        let documentId = null;
        if (file) {
          const uploadResult = await uploadMaterial(file);
          documentId = uploadResult.document_id;
        }
        result = await sendChat(question, 5, documentId);
        const assistantMessage = {
          role: "assistant",
          text: result.answer || "No answer returned.",
          sources: result.sources || []
        };
        const finalMessages = [...messagesAfterUser, assistantMessage];
        updateMessages(finalMessages);
        saveChat(finalMessages, chatId);
      }
    } catch (err) {
      setError(err.message);
      const assistantMessage = { role: "assistant", text: `I couldn't reach the tutor backend. ${err.message}`, sources: [] };
      const finalMessages = [...messagesAfterUser, assistantMessage];
      updateMessages(finalMessages);
      saveChat(finalMessages, chatId);
    } finally {
      setLoading(false);
    }
  }

  function newChat() {
    setCurrentChatId(null);
    setMessages([welcomeMessage]);
    setInput("");
    setAttached(null);
    setError("");
  }

  return (
    <div className="tutor-layout">
      <div className="chat-panel card">
        <div className="chat-header"><div className="ai-status"><div className="ai-avatar"><Bot size={20}/></div><div><strong>AI Programming Tutor</strong><span><i/> {loading ? "Thinking..." : "Connected to FastAPI"}</span></div></div><button className="secondary-btn small" onClick={newChat}><Plus size={15}/> New chat</button></div>
        <div className="messages">
          {messages.map((m, i) => <Message key={i} message={m}/>)}
          {loading && (
  <div className="message assistant">
    <div className="message-avatar">
      <Bot size={16}/>
    </div>

    <div className="message-body">
      <div className="message-name">CodeTutor AI</div>

      <div className="message-text">
        {attached
          ? "Thinking and reading your uploaded document..."
          : "Thinking..."}
      </div>
    </div>
  </div>
)}
        </div>
        {error && <div style={{padding:"0 18px 8px", color:"#b94242", fontSize:11}}>Backend error: {error}</div>}
        <div className="composer">
          {attached && <div className="attachment-chip"><FileText size={14}/>{attached.name}<button onClick={() => setAttached(null)}><X size={13}/></button></div>}
          <div className="composer-row">
            <label className="attach-btn" title="Attach study material"><Paperclip size={19}/><input type="file" hidden onChange={e => setAttached(e.target.files?.[0] || null)} /></label>
            <label className="attach-btn" title="Upload image"><Image size={19}/><input type="file" accept="image/*" hidden onChange={e => setAttached(e.target.files?.[0] || null)} /></label>
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send()}}} placeholder="Ask about a programming concept, code, or error..." />
            <button className="send-btn" onClick={send} disabled={loading}><Send size={17}/></button>
          </div>
          <small>Responses are generated by your FastAPI RAG backend. AI can make mistakes.</small>
        </div>
      </div>

      <aside className="context-panel">
        <div className="card">
          <div className="card-head"><div><h3>Current context</h3><p>Materials used for this chat.</p></div></div>
          <ContextItem icon={FileText} title="Qdrant knowledge base" meta="Retrieved automatically"/>
          <ContextItem icon={FileCode2} title="Uploaded materials" meta="Indexed by FastAPI"/>
          <button className="outline-wide" onClick={() => document.querySelector('.composer input[type=file]')?.click()}><Plus size={16}/> Add material</button>
        </div>
        <div className="card">
          <div className="card-head"><div><h3>Try asking</h3></div></div>
          {["Explain binary search simply","Why is my loop infinite?","Give me a recursion exercise"].map(q => <button className="suggestion" key={q} onClick={() => setInput(q)}>{q}<ChevronRight size={14}/></button>)}
        </div>
      </aside>
    </div>
  );
}

function Message({ message }) {
  const attachment = message.attachment;

  const isImage = attachment?.type?.startsWith("image/");
  const isPdf = attachment?.type === "application/pdf";

  const fileSize = attachment?.size
    ? attachment.size < 1024 * 1024
      ? `${(attachment.size / 1024).toFixed(1)} KB`
      : `${(attachment.size / (1024 * 1024)).toFixed(1)} MB`
    : "";

  return (
    <div className={`message ${message.role}`}>
      <div className="message-avatar">
        {message.role === "assistant" ? <Bot size={16} /> : "R"}
      </div>

      <div className="message-body">

        <div className="message-name">
          {message.role === "assistant" ? "CodeTutor AI" : "You"}
        </div>

        {/* IMAGE ATTACHMENT */}
        {attachment && isImage && (
          <div className="message-image">
            <img
              src={attachment.url}
              alt={attachment.name}
            />

            <div className="attachment-name">
              {attachment.name}
            </div>
          </div>
        )}

        {/* PDF ATTACHMENT */}
        {attachment && isPdf && (
          <a
            href={attachment.url}
            target="_blank"
            rel="noreferrer"
            className="message-attachment"
          >
            <div className="attachment-icon">
              <FileText size={20} />
            </div>

            <div className="attachment-info">
              <strong>{attachment.name}</strong>
              <span>
                PDF {fileSize && `• ${fileSize}`}
              </span>
            </div>
          </a>
        )}

        {/* OTHER FILE TYPES */}
        {attachment && !isImage && !isPdf && (
          <a
            href={attachment.url}
            target="_blank"
            rel="noreferrer"
            className="message-attachment"
          >
            <div className="attachment-icon">
              <FileText size={20} />
            </div>

            <div className="attachment-info">
              <strong>{attachment.name}</strong>
              <span>
                {attachment.type || "File"}
                {fileSize && ` • ${fileSize}`}
              </span>
            </div>
          </a>
        )}

        {/* MESSAGE TEXT */}
        <div className="message-text">
          {message.text.split("\n").map((line, i) => (
            <React.Fragment key={i}>
              {line.startsWith("**") ? (
                <strong>{line.replace(/\*\*/g, "")}</strong>
              ) : (
                line
              )}
              {i < message.text.split("\n").length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>

        {message.code && (
          <pre className="code-block">
            <code>{message.code}</code>
          </pre>
        )}

        {message.sources?.length > 0 && (
          <div className="sources">
            <span>
              <BookOpen size={14} /> Sources
            </span>

            {message.sources.map((s, i) => (
              <div className="source" key={i}>
                <FileText size={14} />
                <span>{s.title}</span>
                <small>p. {s.page}</small>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ContextItem({icon: Icon,title,meta}) {
  return <div className="context-item"><div className="file-icon"><Icon size={17}/></div><div><strong>{title}</strong><span>{meta}</span></div><CheckCircle2 size={16} className="check"/></div>;
}

function Materials() {
  const [drag, setDrag] = useState(false);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function refresh() {
    try {
      const data = await apiRequest("/documents");
      setFiles(data.files || []);
    } catch (err) {
      setMessage(err.message);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function handleFiles(selected) {
    const list = Array.from(selected || []);
    if (!list.length) return;
    setLoading(true);
    setMessage("");
    try {
      for (const file of list) {
        if (file.type.startsWith("image/")) {
          setMessage("Images are analyzed through the multimodal tutor; document indexing currently supports PDF, DOCX, TXT, Markdown and source-code files.");
          continue;
        }
        await uploadMaterial(file);
      }
      await refresh();
      setMessage("Selected materials were uploaded and indexed.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  return <>
    <div className="page-intro"><div><h2>Study Materials</h2><p>Upload the resources your AI tutor should learn from.</p></div><label className="primary-btn"><Upload size={17}/> Upload files<input type="file" hidden multiple onChange={e => handleFiles(e.target.files)} /></label></div>
    <div className={`upload-zone ${drag ? "drag" : ""}`} onDragOver={e => {e.preventDefault();setDrag(true)}} onDragLeave={() => setDrag(false)} onDrop={e => {e.preventDefault();setDrag(false);handleFiles(e.dataTransfer.files)}}>
      <div className="upload-icon"><Upload size={25}/></div>
      <h3>Drop your materials here</h3>
      <p>PDF, DOCX, TXT, Markdown and source code</p>
      <label className="secondary-btn"><Upload size={16}/> Browse files<input type="file" hidden multiple onChange={e => handleFiles(e.target.files)} /></label>
      <small>Maximum 25 MB per file</small>
      {loading && <small>Uploading and indexing...</small>}
      {message && <small>{message}</small>}
    </div>
    <div className="section-head"><div><h3>Your knowledge base</h3><p>{files.length} material(s) currently available in the backend.</p></div></div>
    <div className="materials-table card">
      <div className="table-row table-head"><span>Material</span><span>Type</span><span>Path</span><span>Size</span><span>Status</span></div>
      {files.length === 0 ? <div style={{padding:24,textAlign:"center",fontSize:11,color:"var(--muted)"}}>No indexed materials yet.</div> : files.map((name,i)=><div className="table-row" key={name}><div className="material-name"><div className="file-icon"><FileText size={17}/></div><strong>{name}</strong></div><span>{name.split('.').pop()?.toUpperCase()}</span><span>Backend uploads</span><span>—</span><span className="status ready"><CheckCircle2 size={14}/> Ready</span></div>)}
    </div>
  </>;
}

function Debugger() {
  const [code, setCode] = useState(`numbers = [10, 20, 30]

for i in range(4):
    print(numbers[i])`);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [image, setImage] = useState(null);

  async function runAnalysis() {
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await analyzeCode(code, "python");
      setResult(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function analyzeScreenshot(file) {
    if (!file) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await analyzeImage(file, "Analyze this programming screenshot. Identify the code, errors, likely cause, and explain how to fix it step by step.");
      setResult({ screenshot: true, answer: data.answer || data.message });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return <>
    <div className="page-intro"><div><h2>Code Debugger</h2><p>Paste code or upload a screenshot and let the tutor analyze it.</p></div><label className="secondary-btn"><Image size={17}/> Analyze screenshot<input type="file" accept="image/*" hidden onChange={e => {setImage(e.target.files?.[0] || null); analyzeScreenshot(e.target.files?.[0])}} /></label></div>
    <div className="debug-grid">
      <div className="card editor-card">
        <div className="editor-toolbar"><div><span className="language-dot"/> Python</div><div><label><Paperclip size={15}/> Upload<input type="file" accept="image/*" hidden onChange={e => analyzeScreenshot(e.target.files?.[0])}/></label><button><Code2 size={15}/> Format</button></div></div>
        <textarea className="code-editor" value={code} onChange={e=>setCode(e.target.value)} spellCheck="false"/>
        <div className="editor-footer"><span>{image ? `Screenshot: ${image.name}` : "Python 3"}</span><button className="primary-btn small" onClick={runAnalysis} disabled={loading}><Sparkles size={15}/> {loading ? "Analyzing..." : "Analyze code"}</button></div>
      </div>
      <div className="card analysis-card">
        <div className="card-head"><div><h3>AI Analysis</h3><p>Results from the real FastAPI code/vision service.</p></div></div>
        {!result && !error ? <div className="empty-state"><Bug size={27}/><strong>Ready to analyze</strong><span>Submit your code or screenshot to find issues and get an explanation.</span></div> :
        error ? <div className="empty-state"><Bug size={27}/><strong>Backend error</strong><span>{error}</span></div> :
        <div className="analysis-result">
          {result.screenshot ? <div className="explanation"><strong>Vision analysis</strong><p style={{whiteSpace:"pre-wrap"}}>{result.answer}</p></div> : <><div className="issue critical"><div className="issue-icon">!</div><div><strong>Analysis complete</strong><span>{result.analysis || result.answer || "The backend returned an analysis."}</span></div></div><div className="explanation"><strong>Backend response</strong><p style={{whiteSpace:"pre-wrap"}}>{result.explanation || result.answer || JSON.stringify(result, null, 2)}</p></div></>}
        </div>}
      </div>
    </div>
  </>;
}

function Practice() {
  const [selected, setSelected] = useState(null);
  const options = ["A function that calls itself", "A loop that never ends", "A function with multiple parameters", "A function that returns a list"];
  return <>
    <div className="page-intro"><div><h2>Practice</h2><p>Strengthen your programming skills with AI-generated exercises.</p></div><button className="secondary-btn"><Zap size={17}/> Generate practice</button></div>
    <div className="practice-grid">
      <div className="card quiz-card">
        <div className="quiz-top"><span className="pill">Python · Recursion</span><span>Question 3 of 10</span></div>
        <div className="quiz-progress"><i style={{width:"30%"}}/></div>
        <h3>What is recursion?</h3>
        <p className="question-help">Choose the option that best describes the concept.</p>
        <div className="options">{options.map((o,i)=><button className={selected===i?"selected":""} onClick={()=>setSelected(i)} key={o}><span>{String.fromCharCode(65+i)}</span>{o}</button>)}</div>
        <div className="quiz-actions"><span><Clock3 size={15}/> 02:34</span><button className="primary-btn">Next question <ChevronRight size={16}/></button></div>
      </div>
      <div className="card">
        <div className="card-head"><div><h3>Today's goal</h3><p>Keep your learning streak alive.</p></div></div>
        <div className="goal-ring"><div><strong>70%</strong><span>complete</span></div></div>
        <div className="goal-list"><div><CheckCircle2 size={16}/> 2 concepts reviewed</div><div><CheckCircle2 size={16}/> 1 debugging exercise</div><div><Clock3 size={16}/> 15 min remaining</div></div>
      </div>
    </div>
  </>;
}

function Progress() {
  const topics = [["Python Basics",92],["Functions",84],["Lists & Dictionaries",78],["Recursion",56],["OOP",43],["Data Structures",39]];
  return <>
    <div className="page-intro"><div><h2>Learning Progress</h2><p>Track what you've learned and where to focus next.</p></div><div className="streak"><Zap size={16}/> 7 day streak</div></div>
    <div className="stats-grid">
      <Stat icon={Target} label="Overall mastery" value="71%" meta="+8% this month" />
      <Stat icon={BookOpen} label="Topics studied" value="18" meta="14 mastered" />
      <Stat icon={Trophy} label="Quiz accuracy" value="84%" meta="+5% this month" />
      <Stat icon={Clock3} label="Learning time" value="12.4h" meta="This month" />
    </div>
    <div className="progress-layout">
      <div className="card">
        <div className="card-head"><div><h3>Topic mastery</h3><p>Your current understanding by topic.</p></div></div>
        <div className="topic-list">{topics.map(([name,value])=><div className="topic" key={name}><div><span>{name}</span><strong>{value}%</strong></div><div className="progress"><i style={{width:`${value}%`}}/></div></div>)}</div>
      </div>
      <div className="card">
        <div className="card-head"><div><h3>Focus next</h3><p>Recommended learning areas.</p></div></div>
        <div className="focus-item"><div className="focus-number">1</div><div><strong>Recursion</strong><span>56% mastery · 3 weak concepts</span></div><ChevronRight size={16}/></div>
        <div className="focus-item"><div className="focus-number">2</div><div><strong>Data Structures</strong><span>39% mastery · 5 weak concepts</span></div><ChevronRight size={16}/></div>
        <div className="focus-item"><div className="focus-number">3</div><div><strong>Object-Oriented Programming</strong><span>43% mastery · 4 weak concepts</span></div><ChevronRight size={16}/></div>
      </div>
    </div>
  </>;
}

createRoot(document.getElementById("root")).render(<App />);
