---
name: debugging-protocol
description: Comprehensive protocol for validating root causes of software issues. Use when you need to systematically debug a complex bug, flaky test, or unknown system behavior by forming hypotheses and validating them with specific tasks.
---

# Debugging Protocol

## Overview

This skill provides a rigorous framework for debugging complex software issues. It moves beyond ad-hoc troubleshooting to a structured process of hypothesis generation and validation.

Use this skill to:
1.  Formalize a debugging session.
2.  Systematically eliminate potential root causes.
3.  Document findings for future reference or team communication.

## Protocol Workflow

To run a structured debugging session, follow these steps:

### 1. Initialize the Session
Create a new debugging document using the provided template. This serves as the "source of truth" for the investigation.

**Template location:** `assets/debugging-session-template.md`

**Save to:** `docs/debugging/{issue-name}-{YYYY-MM-DD}-{HHmm}.md`

1. Create `docs/debugging/` if it doesn't exist
2. Copy the template and fill in the issue details
3. This makes the session accessible from other conversations and agents (e.g., when handing off to a `/quick-fix` or `/orchestrator` workflow)

### 2. Define the Problem
Clearly articulate the **System Context** and **Problem Statement**.
*   **Symptom**: What is the observable behavior? How does it differ from expected behavior?
*   **Scope**: Which components are involved?

### 3. Formulate Hypotheses
List distinct, testable hypotheses.
*   Avoid vague guesses.
*   Differentiate between layers (e.g., "Frontend Hypothesis" vs "Backend Hypothesis").
*   Example: "Race condition in UI state update" vs "Database schema misconfiguration".

### 4. Design Validation Tasks
For each hypothesis, design a specific validation task.
*   **Objective**: What are you trying to prove or disprove?
*   **Steps**: Precise, reproducible actions.
*   **Code Pattern**: Provide the exact code or command to run (e.g., a specific SQL query, a Python script using the client library, a `curl` command).
*   **Success Criteria**: Explicitly state what output confirms the hypothesis.

### 5. Execute and Document
Run the tasks in order. For each task, record:
*   **Status**: ✅ VALIDATED, ❌ FAILED, or ⚠️ INCONCLUSIVE.
*   **Findings**: Key observations and raw evidence (logs, screenshots).
*   **Conclusion**: Does this support or refute the hypothesis?

### 6. Determine Root Cause
Synthesize the findings into a **Root Cause Analysis**.
*   Identify the Primary Root Cause.
*   Assign a Confidence Level.
*   Propose specific fixes.

## Best Practices

*   **Be Specific**: Don't just say "check the logs." Say "grep for 'Error 500' in `/var/log/nginx/access.log`".
*   **Isolate Variables**: Change one thing at a time.
*   **Validate Assumptions**: Verify configuration and versions first (e.g., "Task 1: Validate Current Schema").
*   **Preserve Evidence**: Keep the specific trace IDs, log timestamps, or reproduction scripts.

## Rule Compliance
When debugging, verify against:
- Error Handling Principles @error-handling-principles.md (proper error propagation)
- Logging and Observability Principles @logging-and-observability-principles.md (structured logging for diagnostics)
- Testing Strategy @testing-strategy.md (regression test for the fix)