#!/usr/bin/env bun
/**
 * RAN Event Sender (Bun/TypeScript)
 *
 * Ported from disler's Python send_event.py
 * CLI tool for sending observability events from hooks
 *
 * Usage:
 *   bunx tsx src/observability/send-event.ts --event-type PreToolUse --source-app ran-optimizer
 *   bun run src/observability/send-event.ts --event-type RANOptimization --payload '{"cell": "001"}'
 */

import { parseArgs } from 'util';

// ============================================================================
// TYPES
// ============================================================================

interface RANEvent {
  timestamp: string;
  source_app: string;
  event_type: string;
  session_id: string;
  emoji: string;
  payload: Record<string, unknown>;
  summarize?: boolean;
}

// Event type emojis
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

// RAN Safety Guardrails
const RAN_GUARDRAILS = {
  p0: { min: -126, max: -60, param: 'p0NominalPusch' },
  alpha: { min: 0.4, max: 1.0, param: 'alpha' },
  maxPower: { min: 0, max: 46, param: 'maxPower' },
  tilt: { min: 0, max: 15, param: 'electricalTilt' },
};

// ============================================================================
// FUNCTIONS
// ============================================================================

async function sendEvent(event: RANEvent): Promise<boolean> {
  const serverUrl = process.env.RAN_OBSERVABILITY_SERVER || 'http://localhost:4000';

  try {
    const response = await fetch(`${serverUrl}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });

    return response.ok;
  } catch (error) {
    console.error(`[RAN Observability] Failed to send event: ${error}`);
    return false;
  }
}

function validatePreToolUse(toolName: string, toolInput: Record<string, unknown>): boolean {
  // Block dangerous bash commands
  if (toolName === 'Bash') {
    const command = (toolInput.command as string) || '';
    const dangerousPatterns = ['rm -rf /', 'dd if=', '--force-restart-all', 'DELETE FROM cells'];

    for (const pattern of dangerousPatterns) {
      if (command.includes(pattern)) {
        sendEvent({
          timestamp: new Date().toISOString(),
          source_app: 'ran-optimizer',
          event_type: 'GuardrailBlocked',
          session_id: process.env.CLAUDE_SESSION_ID || 'unknown',
          emoji: '🛡️',
          payload: {
            tool: toolName,
            reason: `Blocked dangerous pattern: ${pattern}`,
            command: command.slice(0, 100),
          },
        });
        console.error(`🛡️ BLOCKED: Dangerous command pattern detected: ${pattern}`);
        return false;
      }
    }
  }

  // Validate RAN parameter ranges
  if (toolName === 'Write' || toolName === 'Edit') {
    const content = (toolInput.content as string) || (toolInput.new_string as string) || '';

    for (const [, limits] of Object.entries(RAN_GUARDRAILS)) {
      const regex = new RegExp(`${limits.param}[\"\\s:]+([-]?\\d+\\.?\\d*)`, 'i');
      const match = content.match(regex);

      if (match) {
        const value = parseFloat(match[1]);
        if (value < limits.min || value > limits.max) {
          sendEvent({
            timestamp: new Date().toISOString(),
            source_app: 'ran-optimizer',
            event_type: 'GuardrailBlocked',
            session_id: process.env.CLAUDE_SESSION_ID || 'unknown',
            emoji: '🛡️',
            payload: {
              param: limits.param,
              attemptedValue: value,
              allowedRange: [limits.min, limits.max],
            },
          });
          console.error(
            `🛡️ BLOCKED: ${limits.param}=${value} outside range [${limits.min}, ${limits.max}]`
          );
          return false;
        }
      }
    }
  }

  return true;
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      'source-app': { type: 'string', default: 'ran-optimizer' },
      'event-type': { type: 'string' },
      'session-id': { type: 'string' },
      payload: { type: 'string' },
      summarize: { type: 'boolean', default: false },
      'tool-name': { type: 'string' },
      'tool-input': { type: 'string' },
      success: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h' },
    },
    allowPositionals: true,
  });

  if (values.help) {
    console.log(`
RAN Event Sender - Send observability events to the RAN monitoring server

Usage:
  bun run send-event.ts --event-type <type> [options]

Options:
  --source-app <name>   Source application name (default: ran-optimizer)
  --event-type <type>   Event type (PreToolUse, PostToolUse, RANOptimization, etc.)
  --session-id <id>     Session identifier
  --payload <json>      JSON payload
  --summarize           Request AI summary
  --tool-name <name>    Tool name for pre/post hooks
  --tool-input <json>   Tool input for validation
  --success             Mark tool execution as successful
  -h, --help            Show this help

Event Types:
  PreToolUse, PostToolUse, UserPromptSubmit, Stop, SessionStart, SessionEnd,
  RANOptimization, KPIAnomaly, FaultDetected, ActionExecuted, GuardrailBlocked,
  FederatedUpdate, GraphUpdate
    `);
    process.exit(0);
  }

  if (!values['event-type']) {
    console.error('Error: --event-type is required');
    process.exit(1);
  }

  // Handle PreToolUse validation
  if (values['event-type'] === 'PreToolUse' && values['tool-name']) {
    let toolInput: Record<string, unknown> = {};
    if (values['tool-input']) {
      try {
        toolInput = JSON.parse(values['tool-input']);
      } catch {
        toolInput = { raw: values['tool-input'] };
      }
    }

    const valid = validatePreToolUse(values['tool-name'], toolInput);
    if (!valid) {
      process.exit(1);
    }
  }

  // Parse payload
  let payload: Record<string, unknown> = {};
  if (values.payload) {
    try {
      payload = JSON.parse(values.payload);
    } catch {
      payload = { raw: values.payload };
    }
  }

  // Add tool info to payload
  if (values['tool-name']) {
    payload.tool = values['tool-name'];
    payload.success = values.success;
  }

  // Build event
  const event: RANEvent = {
    timestamp: new Date().toISOString(),
    source_app: values['source-app'] || 'ran-optimizer',
    event_type: values['event-type'],
    session_id: values['session-id'] || process.env.CLAUDE_SESSION_ID || 'unknown',
    emoji: EVENT_EMOJIS[values['event-type']] || '📌',
    payload,
    summarize: values.summarize,
  };

  // Send event
  const success = await sendEvent(event);
  process.exit(success ? 0 : 1);
}

main().catch(console.error);
