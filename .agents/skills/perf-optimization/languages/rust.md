# Rust Performance Profiling

> **Stub:** This module will be populated when Rust profiling is needed in a project.
> Follow the pattern established in [go.md](go.md).

## Expected Content

- Toolchain: `perf`, `flamegraph`, `criterion`, `cargo-flamegraph`, `dhat`
- Patterns: Arena allocation, `#[inline]`, zero-copy parsing, `Box` vs stack
- Benchmarking: `criterion` setup, statistical comparison
- Irreducible floors: syscall overhead, TLS handshake, memory-mapped I/O
- Script: `scripts/rust-flamegraph.sh`
