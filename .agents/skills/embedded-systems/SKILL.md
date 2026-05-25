---
name: embedded-systems
description: >-
  Resource-constrained development, real-time patterns, interrupt handling,
  memory management, RTOS patterns, and hardware abstraction layers.
---

# Embedded Systems Principles

Guidelines for resource-constrained and real-time system development.

## When to Invoke
- Developing for microcontrollers or constrained devices
- Real-time requirements (hard or soft)
- Hardware abstraction layer design
- Memory-constrained environments

## Resource Constraints

### Memory
1. **Static allocation preferred** — avoid `malloc`/`free` in real-time paths.
2. **Stack size budgets** — calculate max stack depth per task.
3. **Memory pools** for fixed-size allocations.
4. **No heap fragmentation** — use fixed-block allocators.

### Power
1. **Sleep modes** — enter lowest power state when idle.
2. **Peripheral clock gating** — disable unused peripherals.
3. **Batch operations** — reduce wake cycles.

## Real-Time Patterns

### Priority-Based Scheduling
1. **Priority inversion protection** — use priority inheritance mutexes.
2. **Deadline monotonic** — shortest deadline = highest priority.
3. **Avoid priority ties** — every task has unique priority.

### Interrupt Handling
1. **ISRs must be short** — set flags, defer processing to task context.
2. **No blocking calls in ISRs** — no `malloc`, no mutex locks.
3. **Volatile for shared variables** between ISR and task.

## Hardware Abstraction Layer (HAL)

```
Application Layer
├── Middleware (protocols, file systems)
├── HAL (hardware-agnostic interfaces)
└── Board Support Package (BSP — hardware-specific)
```

1. **Interface per peripheral type** — GPIO, UART, SPI, I2C, Timer.
2. **BSP implements HAL** — swap BSP to port to new hardware.
3. **No hardware registers in application code.**

## RTOS Patterns

1. **Tasks for concurrent activities** — each with dedicated stack.
2. **Queues for inter-task communication** — type-safe message passing.
3. **Semaphores for synchronization** — binary for signaling, counting for resources.
4. **Mutexes for shared data** — always with timeout to prevent deadlock.

## Testing

> For universal testing principles, see `.agents/rules/testing-strategy.md`. Below: language-specific patterns only.

1. **Unit test on host** — test logic without hardware.
2. **Hardware-in-the-loop (HIL)** — automated tests with real hardware.
3. **Mock HAL interfaces** — inject test implementations.
4. **Static analysis required** — MISRA C/C++ compliance if safety-critical.

## Safety-Critical Considerations
- MISRA C/C++ compliance for automotive, medical, aerospace
- Watchdog timers for fault recovery
- CRC/checksums for data integrity
- Redundancy for critical paths

## Related
- C++ Idioms @.agents/skills/cpp-idioms/SKILL.md
- Resources and Memory Management @.agents/rules/resources-and-memory-management-principles.md
- Concurrency and Threading Principles @.agents/rules/concurrency-and-threading-principles.md
