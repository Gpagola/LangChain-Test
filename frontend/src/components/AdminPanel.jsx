import { useState, useEffect } from "react"
import "./AdminPanel.css"

const API = "http://localhost:5001/api"

const LABELS = {
  "system-prompt":             "System Prompt",
  "ontologia-reglas":          "Reglas de Retención",
  "ontologia-diferenciadores": "Diferenciadores",
}

export default function AdminPanel({ onSaved, width }) {
  const [ontologias, setOntologias] = useState([])
  const [selected, setSelected] = useState(null)
  const [contenido, setContenido] = useState("")
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    fetch(`${API}/ontologias`)
      .then(r => r.json())
      .then(data => {
        setOntologias(data)
        if (data.length) {
          setSelected(data[0].nombre)
          setContenido(data[0].contenido)
        }
      })
  }, [])

  function handleSelect(nombre) {
    const item = ontologias.find(o => o.nombre === nombre)
    setSelected(nombre)
    setContenido(item?.contenido || "")
    setDirty(false)
  }

  function handleChange(e) {
    setContenido(e.target.value)
    setDirty(true)
  }

  async function handleSave() {
    const confirmReset = window.confirm(
      "¿Aplicar cambios ahora?\n\nLa sesión de chat actual se cerrará y comenzará una nueva con el contenido actualizado.\n\nPulsa Cancelar para guardar sin reiniciar el chat."
    )

    setSaving(true)
    await fetch(`${API}/ontologias/${selected}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contenido }),
    })
    setSaving(false)
    setDirty(false)
    setOntologias(prev => prev.map(o => o.nombre === selected ? { ...o, contenido } : o))

    if (confirmReset) onSaved()
  }

  return (
    <aside className="admin-panel" style={width ? { width, minWidth: width, maxWidth: width } : {}}>
      <div className="admin-tabs">
        {ontologias.map(o => (
          <button
            key={o.nombre}
            className={`admin-tab ${selected === o.nombre ? "active" : ""}`}
            onClick={() => handleSelect(o.nombre)}
          >
            {LABELS[o.nombre] || o.nombre}
          </button>
        ))}
      </div>

      <div className="admin-editor">
        <textarea
          className="admin-textarea"
          value={contenido}
          onChange={handleChange}
          spellCheck={false}
        />
      </div>

      <div className="admin-footer">
        <button
          className="save-btn"
          onClick={handleSave}
          disabled={saving || !dirty}
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
        {dirty && <span className="unsaved">Sin guardar</span>}
      </div>
    </aside>
  )
}
