---
description: Integrate phase - test adapters with real infrastructure
---

# Phase 3: Integrate

## Purpose
Test adapter implementations (database, external APIs) with real infrastructure using Testcontainers.

## Prerequisites
- Phase 2 (Implement) completed
- Unit tests passing

## Applicability (Default: REQUIRED)
This phase is REQUIRED by default. You may ONLY skip it if ALL of the following are true:
- [ ] No storage/repository files were modified or created
- [ ] No external API client files were modified or created  
- [ ] No database queries or schemas were changed
- [ ] No message queue, cache, or I/O adapter code was touched

If ANY adapter was modified, you MUST write integration tests.

## If This Phase Fails
If integration tests fail:
1. Check container logs for errors
2. Verify schema matches expectations
3. Fix adapter implementation
4. Re-run tests before proceeding

## Steps

### 1. Setup Testcontainers

**Go Example:**
```go
func TestPostgresStorage_Integration(t *testing.T) {
    if testing.Short() {
        t.Skip("skipping integration test")
    }
    
    ctx := context.Background()
    
    // Start PostgreSQL container
    postgres, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
        ContainerRequest: testcontainers.ContainerRequest{
            Image:        "postgres:16-alpine",
            ExposedPorts: []string{"5432/tcp"},
            Env: map[string]string{
                "POSTGRES_USER":     "test",
                "POSTGRES_PASSWORD": "test",
                "POSTGRES_DB":       "test",
            },
            WaitingFor: wait.ForListeningPort("5432/tcp"),
        },
        Started: true,
    })
    require.NoError(t, err)
    defer postgres.Terminate(ctx)
    
    // Get connection string and run tests
}
```

### 2. Write Integration Tests
Test file naming: `*_integration_test.go` or `*.integration.spec.ts`

```go
func TestPostgresStorage_CreateTask(t *testing.T) {
    // Uses real PostgreSQL from Testcontainers
    storage := NewPostgresStorage(pool)
    
    task, err := storage.Create(ctx, userID, req)
    
    require.NoError(t, err)
    assert.NotEqual(t, uuid.Nil, task.ID)
}
```

### 3. Run Integration Tests
```bash
# Go - run all tests including integration
go test -v ./...
```

### 4. Manual Check (Optional)
- If UI involved, launch a browser to verify the basic flow.
- If API involved, use `curl` or `client` to hit the endpoint.

## Completion Criteria
- [ ] Integration tests written for all adapters
- [ ] Tests pass with real infrastructure (Testcontainers)
- [ ] Database queries verified against real PostgreSQL

## Next Phase
Proceed to **Phase 4: Verify** (`/4-verify`)