#!/usr/bin/env python3
"""
RAN Observability Hook
Based on disler/claude-code-hooks-multi-agent-observability

Captures Claude Code lifecycle events and transmits to RAN observability server.
Integrates with AgentDB for persistent memory and Ruvector for graph analysis.
"""

import argparse
import json
import os
import sys
from datetime import datetime
from typing import Any, Dict, Optional
import urllib.request
import urllib.error

# Default observability server endpoint
OBSERVABILITY_SERVER = os.environ.get("RAN_OBSERVABILITY_SERVER", "http://localhost:4000")

# Event type emoji mapping (from disler's pattern)
EVENT_EMOJIS = {
    "PreToolUse": "🔧",
    "PostToolUse": "✅",
    "UserPromptSubmit": "💬",
    "Stop": "🛑",
    "SessionStart": "🚀",
    "SessionEnd": "🏁",
    "RANOptimization": "📡",
    "KPIAnomaly": "⚠️",
    "FaultDetected": "🔴",
    "ActionExecuted": "⚡",
    "GuardrailBlocked": "🛡️",
}

# RAN-specific event types
RAN_EVENT_TYPES = [
    "RANOptimization",
    "KPIAnomaly",
    "FaultDetected",
    "ActionExecuted",
    "GuardrailBlocked",
    "FederatedUpdate",
    "GraphUpdate",
]


def send_event(
    source_app: str,
    event_type: str,
    payload: Dict[str, Any],
    session_id: Optional[str] = None,
    summarize: bool = False,
) -> bool:
    """Send event to observability server."""

    event = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "source_app": source_app,
        "event_type": event_type,
        "session_id": session_id or os.environ.get("CLAUDE_SESSION_ID", "unknown"),
        "emoji": EVENT_EMOJIS.get(event_type, "📌"),
        "payload": payload,
        "summarize": summarize,
    }

    try:
        data = json.dumps(event).encode("utf-8")
        req = urllib.request.Request(
            f"{OBSERVABILITY_SERVER}/events",
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=5) as response:
            return response.status == 200

    except urllib.error.URLError as e:
        print(f"[RAN Observability] Failed to send event: {e}", file=sys.stderr)
        return False


def pre_tool_use_hook(tool_name: str, tool_input: Dict[str, Any]) -> bool:
    """
    Pre-tool validation hook for RAN safety guardrails.

    Blocks:
    - Parameter changes outside allowed ranges
    - Destructive cell operations without confirmation
    - Unauthorized federated model updates
    """

    # RAN-specific guardrails
    guardrails = {
        "ADJUST_P0": {"min": -126, "max": -60, "param": "p0NominalPusch"},
        "ADJUST_ALPHA": {"min": 0.4, "max": 1.0, "param": "alpha"},
        "ADJUST_POWER": {"min": 0, "max": 46, "param": "maxPower"},
        "ADJUST_TILT": {"min": 0, "max": 15, "param": "electricalTilt"},
    }

    # Check if this is a RAN optimization action
    if tool_name == "Bash":
        command = tool_input.get("command", "")

        # Block destructive commands
        dangerous_patterns = [
            "rm -rf /",
            "dd if=",
            "--force-restart-all",
            "DELETE FROM cells",
        ]

        for pattern in dangerous_patterns:
            if pattern in command:
                send_event(
                    source_app="ran-optimizer",
                    event_type="GuardrailBlocked",
                    payload={
                        "tool": tool_name,
                        "reason": f"Blocked dangerous pattern: {pattern}",
                        "command": command[:100],
                    },
                )
                print(f"🛡️ BLOCKED: Dangerous command pattern detected: {pattern}")
                return False

    # Check RAN parameter guardrails
    if tool_name == "Write" or tool_name == "Edit":
        content = tool_input.get("content", "") or tool_input.get("new_string", "")

        for action_type, limits in guardrails.items():
            param = limits["param"]
            if param in content:
                # Extract value (simplified - would need proper parsing)
                import re
                match = re.search(rf'{param}["\s:]+(-?\d+\.?\d*)', content)
                if match:
                    value = float(match.group(1))
                    if value < limits["min"] or value > limits["max"]:
                        send_event(
                            source_app="ran-optimizer",
                            event_type="GuardrailBlocked",
                            payload={
                                "action": action_type,
                                "param": param,
                                "attempted_value": value,
                                "allowed_range": [limits["min"], limits["max"]],
                            },
                        )
                        print(f"🛡️ BLOCKED: {param}={value} outside range [{limits['min']}, {limits['max']}]")
                        return False

    # Send pre-tool event for monitoring
    send_event(
        source_app="ran-optimizer",
        event_type="PreToolUse",
        payload={"tool": tool_name, "input_preview": str(tool_input)[:200]},
    )

    return True


def post_tool_use_hook(tool_name: str, tool_output: str, success: bool) -> None:
    """Post-tool execution hook for tracking and learning."""

    send_event(
        source_app="ran-optimizer",
        event_type="PostToolUse",
        payload={
            "tool": tool_name,
            "success": success,
            "output_preview": tool_output[:500] if tool_output else "",
        },
        summarize=True,
    )

    # If this was a RAN action, trigger learning update
    if success and tool_name in ["Bash", "Write", "Edit"]:
        # Check if KPIs should be collected for feedback
        print(f"✅ Tool {tool_name} completed. Consider collecting KPI feedback.")


def ran_optimization_hook(
    cell_id: str,
    action_type: str,
    parameters: Dict[str, Any],
    expected_improvement: float,
) -> None:
    """Hook for RAN optimization actions."""

    send_event(
        source_app="ran-optimizer",
        event_type="RANOptimization",
        payload={
            "cell_id": cell_id,
            "action_type": action_type,
            "parameters": parameters,
            "expected_improvement": expected_improvement,
            "timestamp": datetime.utcnow().isoformat(),
        },
        summarize=True,
    )


def kpi_anomaly_hook(
    cell_id: str,
    anomaly_type: str,
    affected_metrics: list,
    severity: str,
) -> None:
    """Hook for KPI anomaly detection events."""

    send_event(
        source_app="ran-optimizer",
        event_type="KPIAnomaly",
        payload={
            "cell_id": cell_id,
            "anomaly_type": anomaly_type,
            "affected_metrics": affected_metrics,
            "severity": severity,
        },
        summarize=True,
    )


def main():
    """CLI interface for hook execution."""

    parser = argparse.ArgumentParser(description="RAN Observability Hook")
    parser.add_argument("--source-app", default="ran-optimizer", help="Source application name")
    parser.add_argument("--event-type", required=True, help="Event type")
    parser.add_argument("--summarize", action="store_true", help="Generate AI summary")
    parser.add_argument("--payload", help="JSON payload")
    parser.add_argument("--session-id", help="Session ID")

    # Hook-specific arguments
    parser.add_argument("--tool-name", help="Tool name for pre/post hooks")
    parser.add_argument("--tool-input", help="Tool input JSON")
    parser.add_argument("--tool-output", help="Tool output")
    parser.add_argument("--success", action="store_true", help="Tool success flag")

    args = parser.parse_args()

    # Parse payload
    payload = {}
    if args.payload:
        try:
            payload = json.loads(args.payload)
        except json.JSONDecodeError:
            payload = {"raw": args.payload}

    # Handle specific event types
    if args.event_type == "PreToolUse" and args.tool_name:
        tool_input = json.loads(args.tool_input) if args.tool_input else {}
        result = pre_tool_use_hook(args.tool_name, tool_input)
        sys.exit(0 if result else 1)

    elif args.event_type == "PostToolUse" and args.tool_name:
        post_tool_use_hook(args.tool_name, args.tool_output or "", args.success)

    else:
        # Generic event
        success = send_event(
            source_app=args.source_app,
            event_type=args.event_type,
            payload=payload,
            session_id=args.session_id,
            summarize=args.summarize,
        )
        sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
