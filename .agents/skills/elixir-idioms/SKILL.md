---
paths:
  - "**/*.ex"
  - "**/*.exs"
  - "**/mix.exs"
---

## Elixir Idioms and Patterns

Elixir rewards immutability, pattern matching, and the OTP supervision model. Idiomatic Elixir = functional, fault-tolerant, process-oriented.

> Scope: Elixir coding idioms. Test naming: .agents/rules/testing-strategy.md.

### Pattern Matching

1. **Pattern match everything — function heads, case, with:**
   ```elixir
   def handle_result({:ok, task}), do: {:reply, task}
   def handle_result({:error, :not_found}), do: {:error, 404}
   def handle_result({:error, reason}), do: {:error, 500, reason}
   ```

2. **`with` for happy-path pipelines:**
   ```elixir
   with {:ok, user} <- fetch_user(user_id),
        {:ok, task} <- create_task(user, params),
        :ok <- notify(user, task) do
     {:ok, task}
   end
   ```

### OTP and Supervision

1. **GenServer for stateful processes:**
   ```elixir
   defmodule TaskCache do
     use GenServer

     def start_link(opts), do: GenServer.start_link(__MODULE__, %{}, opts)
     def get(pid, id), do: GenServer.call(pid, {:get, id})

     @impl true
     def handle_call({:get, id}, _from, state) do
       {:reply, Map.get(state, id), state}
     end
   end
   ```

2. **Supervision trees — "let it crash" philosophy.** Supervisors restart failed children.

3. **Never `try/catch` in normal flow** — let processes crash and restart cleanly.

### Pipe Operator

1. **`|>` for data transformation pipelines:**
   ```elixir
   tasks
   |> Enum.filter(&(&1.active))
   |> Enum.sort_by(& &1.priority, :desc)
   |> Enum.map(&TaskView.render/1)
   ```

2. **First argument must be the piped value.** Design APIs pipe-friendly.

### Naming

1. **snake_case** for functions, variables, atoms, module attributes.
2. **PascalCase** for module names.
3. **`?` suffix** for boolean functions: `active?/1`.
4. **`!` suffix** for functions that raise: `get!/1` (vs `get/1` returning `{:ok, _}`).

### Testing

1. **ExUnit:**
   ```elixir
   defmodule TaskServiceTest do
     use ExUnit.Case, async: true

     test "creates task with valid params" do
       {:ok, task} = TaskService.create(%{title: "Test", priority: :high})
       assert task.title == "Test"
     end
   end
   ```

2. **Mox for mock-based testing** (behaviour contracts).

### Formatting and Static Analysis

| Tool | Purpose | Command |
|---|---|---|
| `mix format` | Formatting | `mix format` |
| Credo | Linting | `mix credo --strict` |
| Dialyzer | Type checking | `mix dialyzer` |
| `mix deps.audit` | CVE scanning | `mix deps.audit` |

### Related
- Code Idioms and Conventions .agents/rules/code-idioms-and-conventions.md
- Error Handling Principles .agents/rules/error-handling-principles.md
- Testing Strategy .agents/rules/testing-strategy.md
- Concurrency and Threading Principles @.agents/rules/concurrency-and-threading-principles.md
