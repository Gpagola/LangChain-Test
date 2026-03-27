import { useState, useEffect, useRef } from "react"
import ReactMarkdown from "react-markdown"
import "./ChatPanel.css"

const API = "http://localhost:5001/api"

// Extrae datos de póliza — el número lo toma del mensaje del usuario
function extractPoliza(responseText, userText) {
  const clean = responseText.replace(/\*\*/g, "").replace(/\*/g, "")
  const ramo         = clean.match(/Ramo[:\s]+([^\n\-–]+)/i)?.[1]?.trim()
  const rentabilidad = clean.match(/Rentabilidad[:\s]+([^\n\-–]+)/i)?.[1]?.trim()
  if (!ramo || !rentabilidad) return null

  // Número de póliza viene del mensaje del usuario
  const numero = userText?.match(/([A-Z]{2,}-\d+)/i)?.[1]?.toUpperCase()
              || userText?.trim().toUpperCase()

  const antiguedad = clean.match(/Antig[uü]edad[:\s]+([^\n\-–]+)/i)?.[1]?.trim()
  return { numero, ramo, antiguedad, rentabilidad }
}

export default function ChatPanel() {
  const [sessionId, setSessionId]   = useState(null)
  const [messages, setMessages]     = useState([])
  const [input, setInput]           = useState("")
  const [loading, setLoading]       = useState(false)
  const [poliza, setPoliza]         = useState(null)
  const bottomRef  = useRef(null)
  const textareaRef = useRef(null)
  const abortRef   = useRef(null)

  useEffect(() => {
    async function init() {
      const r = await fetch(`${API}/session/new`, { method: "POST" })
      const { session_id } = await r.json()
      setSessionId(session_id)

      setLoading(true)
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const res = await fetch(`${API}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "Hola", session_id }),
          signal: controller.signal,
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        setMessages([{ role: "assistant", content: data.response }])
      } catch (e) {
        if (e.name !== "AbortError")
          setMessages([{ role: "assistant", content: `⚠️ Error al iniciar: ${e.message}` }])
      } finally {
        setLoading(false)
        abortRef.current = null
      }
    }
    init()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  useEffect(() => {
    if (!loading) textareaRef.current?.focus()
  }, [loading])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading || !sessionId) return

    setInput("")
    setMessages(prev => [...prev, { role: "user", content: text }])
    setLoading(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, session_id: sessionId }),
        signal: controller.signal,
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMessages(prev => [...prev, { role: "assistant", content: data.response }])

      // Detectar si la respuesta contiene datos de póliza
      if (!poliza) {
        const found = extractPoliza(data.response, text)
        if (found) setPoliza(found)
      }
    } catch (e) {
      if (e.name !== "AbortError")
        setMessages(prev => [...prev, { role: "assistant", content: `⚠️ Error: ${e.message}` }])
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }

  function handleStop() {
    abortRef.current?.abort()
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function handleInput(e) {
    setInput(e.target.value)
    const el = textareaRef.current
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 200) + "px"
  }

  return (
    <div className="chat-panel">

      {/* Barra de contexto — aparece solo cuando hay póliza cargada */}
      {poliza && (
        <div className="session-bar">
          <span className="session-item">
            <span className="session-label">Póliza</span>
            <span className="session-value">{poliza.numero}</span>
          </span>
          <span className="session-sep">·</span>
          <span className="session-item">
            <span className="session-label">Ramo</span>
            <span className="session-value">{poliza.ramo}</span>
          </span>
          <span className="session-sep">·</span>
          <span className="session-item">
            <span className="session-label">Antigüedad</span>
            <span className="session-value">{poliza.antiguedad}</span>
          </span>
          <span className="session-sep">·</span>
          <span className="session-item">
            <span className="session-label">Rentabilidad</span>
            <span className={`session-badge rentabilidad-${poliza.rentabilidad?.toLowerCase()}`}>
              {poliza.rentabilidad}
            </span>
          </span>
        </div>
      )}

      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message-row ${msg.role}`}>
            {msg.role === "assistant" && <div className="avatar">SR</div>}
            <div className="bubble">
              {msg.role === "assistant"
                ? <ReactMarkdown>{msg.content}</ReactMarkdown>
                : <span>{msg.content}</span>
              }
            </div>
          </div>
        ))}
        {loading && (
          <div className="message-row assistant">
            <div className="avatar">SR</div>
            <div className="bubble typing">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="input-area">
        <div className="input-box">
          <textarea
            ref={textareaRef}
            className="chat-input"
            placeholder="Escribe un mensaje..."
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading || !sessionId}
          />
          {loading ? (
            <button className="stop-btn" onClick={handleStop} title="Detener respuesta">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
              </svg>
            </button>
          ) : (
            <button
              className="send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || !sessionId}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          )}
        </div>
        <p className="disclaimer">Desarrollado por Braintrust CS firma miembro de Andersen Consulting</p>
      </div>
    </div>
  )
}
