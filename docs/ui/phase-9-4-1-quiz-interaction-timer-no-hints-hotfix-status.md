# Phase 9.4.1 — Quiz Interaction Timer No-Hints Hotfix Status

Status: ready for local validation.

## Acceptance criteria

- Mouse click on A/B/C/D answer buttons submits the answer.
- Keyboard A/B/C/D submits the answer.
- Focused answer buttons support Enter and Space.
- Each question has a 10-second countdown.
- Timer resets after each submitted answer.
- Timer expiry blocks answering and requires restart.
- No result hints are shown while the quiz is incomplete.
- Question map hides answer letters until completion.
- Full report remains available only after all questions are complete.
- No raw answers are exposed outside the existing final-result flow.
- No persistence changes.
- No database binding changes.
- No network smoke changes.
