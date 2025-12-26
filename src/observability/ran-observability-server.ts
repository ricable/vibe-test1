/**
 * RAN Observability Server (Bun/TypeScript)
 *
 * Ported from disler/claude-code-hooks-multi-agent-observability
 * Original: Python + Bun server
 * This version: Pure Bun/TypeScript with WebSocket streaming
 *
 * @see https://github.com/disler/claude-code-hooks-multi-agent-observability
 */

import { Database } from 'bun:sqlite';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// ============================================================================
// TYPES
// ============================================================================

interface RANEvent {
  id?: number;
  timestamp: string;
  source_app: string;
  event_type: string;
  session_id: string;
  emoji: string;
  payload: Record<string, unknown>;
  summarize?: boolean;
  summary?: string;
}

interface EventFilter {
  source_app?: string;
  session_id?: string;
  event_type?: string;
  limit?: number;
  offset?: number;
}

// Event type emojis (from disler's pattern)
const EVENT_EMOJIS: Record<string, string> = {
  PreToolUse: '🔧',
  PostToolUse: '✅',
  UserPromptSubmit: '💬',
  Stop: '🛑',
  SessionStart: '🚀',
  SessionEnd: '🏁',
  RANOptimization: '📡',
  KPIAnomaly: '⚠️',
  FaultDetected: '🔴',
  ActionExecuted: '⚡',
  GuardrailBlocked: '🛡️',
  FederatedUpdate: '🌐',
  GraphUpdate: '📊',
};

// ============================================================================
// DATABASE
// ============================================================================

class ObservabilityDB {
  private db: Database;

  constructor(dbPath: string = './data/ran-observability.db') {
    // Ensure data directory exists
    const dir = join(process.cwd(), 'data');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath, { create: true });
    this.db.exec('PRAGMA journal_mode = WAL');
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        source_app TEXT NOT NULL,
        event_type TEXT NOT NULL,
        session_id TEXT NOT NULL,
        emoji TEXT DEFAULT '📌',
        payload TEXT DEFAULT '{}',
        summary TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_events_source_app ON events(source_app);
      CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id);
      CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
    `);
  }

  insertEvent(event: RANEvent): number {
    const stmt = this.db.prepare(`
      INSERT INTO events (timestamp, source_app, event_type, session_id, emoji, payload, summary)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      event.timestamp,
      event.source_app,
      event.event_type,
      event.session_id,
      event.emoji || EVENT_EMOJIS[event.event_type] || '📌',
      JSON.stringify(event.payload),
      event.summary || null
    );

    return Number(result.lastInsertRowid);
  }

  getRecentEvents(filter: EventFilter = {}): RANEvent[] {
    let query = 'SELECT * FROM events WHERE 1=1';
    const params: unknown[] = [];

    if (filter.source_app) {
      query += ' AND source_app = ?';
      params.push(filter.source_app);
    }
    if (filter.session_id) {
      query += ' AND session_id = ?';
      params.push(filter.session_id);
    }
    if (filter.event_type) {
      query += ' AND event_type = ?';
      params.push(filter.event_type);
    }

    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(filter.limit || 100, filter.offset || 0);

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as Array<{
      id: number;
      timestamp: string;
      source_app: string;
      event_type: string;
      session_id: string;
      emoji: string;
      payload: string;
      summary: string | null;
    }>;

    return rows.map(row => ({
      ...row,
      payload: JSON.parse(row.payload),
    }));
  }

  getEventStats(): Record<string, number> {
    const stmt = this.db.prepare(`
      SELECT event_type, COUNT(*) as count
      FROM events
      GROUP BY event_type
    `);

    const rows = stmt.all() as Array<{ event_type: string; count: number }>;
    return Object.fromEntries(rows.map(r => [r.event_type, r.count]));
  }

  close(): void {
    this.db.close();
  }
}

// ============================================================================
// WEBSOCKET MANAGER
// ============================================================================

class WebSocketManager {
  private clients: Set<unknown> = new Set();

  addClient(ws: unknown): void {
    this.clients.add(ws);
    console.log(`📡 Client connected. Total: ${this.clients.size}`);
  }

  removeClient(ws: unknown): void {
    this.clients.delete(ws);
    console.log(`📴 Client disconnected. Total: ${this.clients.size}`);
  }

  broadcast(event: RANEvent): void {
    const message = JSON.stringify(event);
    for (const client of this.clients) {
      try {
        (client as { send: (msg: string) => void }).send(message);
      } catch {
        this.clients.delete(client);
      }
    }
  }
}

// ============================================================================
// SERVER
// ============================================================================

const db = new ObservabilityDB();
const wsManager = new WebSocketManager();

const server = Bun.serve({
  port: parseInt(process.env.RAN_OBSERVABILITY_PORT || '4000'),

  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // WebSocket upgrade
    if (path === '/stream') {
      const upgraded = server.upgrade(req);
      if (!upgraded) {
        return new Response('WebSocket upgrade failed', { status: 400 });
      }
      return undefined;
    }

    // REST API endpoints
    try {
      // POST /events - Receive events from hooks
      if (path === '/events' && req.method === 'POST') {
        const event = (await req.json()) as RANEvent;

        // Add emoji if not provided
        if (!event.emoji) {
          event.emoji = EVENT_EMOJIS[event.event_type] || '📌';
        }

        // Store in database
        const id = db.insertEvent(event);

        // Broadcast to connected clients
        wsManager.broadcast({ ...event, id });

        console.log(
          `${event.emoji} [${event.source_app}] ${event.event_type}: ${JSON.stringify(event.payload).slice(0, 100)}`
        );

        return new Response(JSON.stringify({ id, success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // GET /events/recent - Fetch recent events
      if (path === '/events/recent' && req.method === 'GET') {
        const filter: EventFilter = {
          source_app: url.searchParams.get('source_app') || undefined,
          session_id: url.searchParams.get('session_id') || undefined,
          event_type: url.searchParams.get('event_type') || undefined,
          limit: parseInt(url.searchParams.get('limit') || '100'),
          offset: parseInt(url.searchParams.get('offset') || '0'),
        };

        const events = db.getRecentEvents(filter);

        return new Response(JSON.stringify(events), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // GET /events/stats - Get event statistics
      if (path === '/events/stats' && req.method === 'GET') {
        const stats = db.getEventStats();

        return new Response(JSON.stringify(stats), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // GET /health - Health check
      if (path === '/health') {
        return new Response(
          JSON.stringify({
            status: 'healthy',
            clients: wsManager['clients'].size,
            timestamp: new Date().toISOString(),
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // 404 for unknown routes
      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      console.error('Server error:', error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },

  websocket: {
    open(ws) {
      wsManager.addClient(ws);
    },
    close(ws) {
      wsManager.removeClient(ws);
    },
    message(ws, message) {
      // Handle incoming WebSocket messages (ping/pong, subscriptions)
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch {
        // Ignore invalid messages
      }
    },
  },
});

console.log(`
🚀 RAN Observability Server started
   HTTP: http://localhost:${server.port}
   WebSocket: ws://localhost:${server.port}/stream

📡 Endpoints:
   POST /events         - Receive events from hooks
   GET  /events/recent  - Fetch recent events
   GET  /events/stats   - Get event statistics
   GET  /health         - Health check
   WS   /stream         - Real-time event stream
`);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  db.close();
  process.exit(0);
});

export { ObservabilityDB, WebSocketManager, RANEvent, EventFilter };
