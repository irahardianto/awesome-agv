#!/usr/bin/env bash
# go-pprof.sh — Extract Go pprof profiles into agent-readable markdown.
#
# Usage:
#   go-pprof.sh cpu <profile-path-or-url> [top-n]
#   go-pprof.sh heap <profile-path-or-url> [top-n]
#   go-pprof.sh bench <package-path> <bench-regex> [top-n]
#
# Examples:
#   go-pprof.sh cpu cpu.prof
#   go-pprof.sh heap http://localhost:6060/debug/pprof/heap
#   go-pprof.sh bench ./internal/platform/server/... BenchmarkRequireAuth 40
#
# Output: Structured markdown suitable for LLM consumption.

set -euo pipefail

PROFILE_TYPE="${1:-}"
SOURCE="${2:-}"
TOP_N="${3:-30}"

usage() {
    echo "Usage:"
    echo "  $0 cpu <profile-path-or-url> [top-n]"
    echo "  $0 heap <profile-path-or-url> [top-n]"
    echo "  $0 bench <package-path> <bench-regex> [top-n]"
    exit 1
}

if [[ -z "$PROFILE_TYPE" || -z "$SOURCE" ]]; then
    usage
fi

extract_pprof() {
    local profile_file="$1"
    local label="$2"
    local top="$3"

    echo ""
    echo "--- PPROF ${label} PROFILE (Top ${top} by Cumulative) ---"
    echo ""
    echo '```'
    go tool pprof -text -cum -nodecount="$top" "$profile_file" 2>/dev/null \
        | grep -v "^Showing nodes" \
        | sed '/^$/d'
    echo '```'
    echo ""
}

case "$PROFILE_TYPE" in
    cpu|heap|block|mutex)
        extract_pprof "$SOURCE" "$(echo "$PROFILE_TYPE" | tr '[:lower:]' '[:upper:]')" "$TOP_N"
        ;;
    bench)
        BENCH_REGEX="${3:-}"
        TOP_N="${4:-30}"

        if [[ -z "$BENCH_REGEX" ]]; then
            echo "Error: bench mode requires <package-path> and <bench-regex>"
            usage
        fi

        TMPDIR=$(mktemp -d)
        trap 'rm -rf "$TMPDIR"' EXIT

        echo "# Benchmark Profile: ${BENCH_REGEX}"
        echo ""

        # Run benchmark and capture results + profiles
        echo "## Benchmark Results"
        echo ""
        echo '```'
        go test "$SOURCE" \
            -bench="$BENCH_REGEX" \
            -benchtime=2s \
            -benchmem \
            -count=1 \
            -run='^$' \
            -cpuprofile="$TMPDIR/cpu.prof" \
            -memprofile="$TMPDIR/mem.prof" \
            -timeout=120s 2>&1
        echo '```'

        # Extract CPU profile
        if [[ -f "$TMPDIR/cpu.prof" ]]; then
            # Find the test binary (go test leaves it next to the profile)
            TEST_BIN=$(find "$TMPDIR" -name '*.test' 2>/dev/null | head -1 || true)
            if [[ -n "$TEST_BIN" ]]; then
                extract_pprof "$TMPDIR/cpu.prof" "CPU" "$TOP_N"
            else
                extract_pprof "$TMPDIR/cpu.prof" "CPU" "$TOP_N"
            fi
        fi

        # Extract heap profile
        if [[ -f "$TMPDIR/mem.prof" ]]; then
            echo ""
            echo "--- PPROF HEAP PROFILE (Top ${TOP_N} by Cumulative, alloc_space) ---"
            echo ""
            echo '```'
            go tool pprof -text -cum -nodecount="$TOP_N" -alloc_space "$TMPDIR/mem.prof" 2>/dev/null \
                | grep -v "^Showing nodes" \
                | sed '/^$/d'
            echo '```'
            echo ""
        fi
        ;;
    *)
        echo "Error: unknown profile type '$PROFILE_TYPE'"
        usage
        ;;
esac
