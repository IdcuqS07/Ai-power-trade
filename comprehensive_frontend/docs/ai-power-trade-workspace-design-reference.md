# AI Power Trade Workspace Design Reference

`/ai-power-trade-workspace-v2.html` is a static design snapshot.

Use it for:
- visual hierarchy
- density and spacing
- terminal-style color and card treatment
- parity checks while polishing the live workspace

Do not use it for:
- runtime wiring
- data flow
- wallet or execution behavior
- reintroducing deep analysis blocks into the execution surface

The active implementation lives in:
- `comprehensive_frontend/components/AiPowerTradeFinalWorkspace.js`
- `comprehensive_frontend/styles/ai-power-trade-workspace.module.css`

Product boundary:
- The workspace stays focused on signal summary, sizing, readiness, and execution.
- Deep analysis such as catalyst context and playbook detail lives in the AI Explainer.
