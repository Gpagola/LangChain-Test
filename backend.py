"""
Backend Flask — Asistente de Retención Santalucía
Expone el agente LangGraph como API REST para el frontend React.
"""

import os
import uuid
import psycopg
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from langchain_core.messages import HumanMessage
from langgraph.checkpoint.postgres import PostgresSaver

from chatbot import build_agent, DATABASE_URL

load_dotenv()

app = Flask(__name__)
CORS(app)  # permite peticiones desde React (localhost:5173)

# ── Estado global del agente ──────────────────────────────────────────────────
# El checkpointer y el agente se inicializan una vez al arrancar el servidor.
# Cada sesión se identifica por su thread_id (session_id).

_checkpointer = None
_agent = None

def get_agent():
    global _checkpointer, _agent
    if _agent is None:
        # Conexión persistente para el ciclo de vida del servidor Flask
        conn = psycopg.connect(DATABASE_URL)
        _checkpointer = PostgresSaver(conn)
        _checkpointer.setup()
        _agent = build_agent(_checkpointer)
    return _agent


# ── Endpoints de chat ─────────────────────────────────────────────────────────

@app.route("/api/session/new", methods=["POST"])
def new_session():
    """Genera un nuevo session_id único."""
    session_id = str(uuid.uuid4())
    return jsonify({"session_id": session_id})


@app.route("/api/chat", methods=["POST"])
def chat():
    """
    Envía un mensaje al agente y devuelve la respuesta.
    Body: { "message": "...", "session_id": "..." }
    """
    data = request.get_json()
    message = data.get("message", "").strip()
    session_id = data.get("session_id", "")

    if not message or not session_id:
        return jsonify({"error": "message y session_id son requeridos"}), 400

    agent = get_agent()
    config = {"configurable": {"thread_id": session_id}}

    try:
        result = agent.invoke(
            {"messages": [HumanMessage(content=message)]},
            config=config
        )
        response_text = result["messages"][-1].content
        return jsonify({"response": response_text})
    except Exception as e:
        print(f"ERROR en /api/chat: {e}")
        return jsonify({"error": str(e)}), 500


# ── Endpoints de administración ───────────────────────────────────────────────

@app.route("/api/ontologias", methods=["GET"])
def listar_ontologias():
    """Lista todos los registros activos de la tabla ontologias."""
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT nombre, version, contenido
                FROM ontologias
                WHERE activo = TRUE
                ORDER BY id
            """)
            rows = cur.fetchall()

    return jsonify([
        {"nombre": r[0], "version": r[1], "contenido": r[2]}
        for r in rows
    ])


@app.route("/api/ontologias/<nombre>", methods=["PUT"])
def actualizar_ontologia(nombre):
    """
    Actualiza el contenido de una ontología por nombre.
    Body: { "contenido": "..." }
    """
    data = request.get_json()
    contenido = data.get("contenido", "").strip()

    if not contenido:
        return jsonify({"error": "contenido es requerido"}), 400

    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE ontologias
                SET contenido = %s
                WHERE nombre = %s AND activo = TRUE
            """, (contenido, nombre))
        conn.commit()

    return jsonify({"ok": True})


# ── Arranque ──────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    app.run(debug=True, use_reloader=False, port=5001)
