---
name: axum-idioms
description: Axum HTTP framework patterns — routing, extractors, middleware, state management. For Rust see rust-idioms.
paths:
  - "**/Cargo.toml"
---

## Axum Idioms and Patterns

### Core Philosophy

Axum (0.8+) rewards composability via Tower, type-safe extractors, and zero-cost abstractions. Idiomatic Axum = thin handlers, tower middleware, typed errors.

> **Scope:** Axum-specific patterns. For Rust fundamentals: @.agents/skills/rust-idioms/SKILL.md. For project structure: @.agents/skills/rust-idioms/references/project-structure.md.

### Router and Route Organization

1. **Build routers with `Router::new()` and method routing:**
   ```rust
   // ✅ Group by resource, nest for versioning
   fn task_routes() -> Router<AppState> {
       Router::new()
           .route("/tasks", get(list_tasks).post(create_task))
           .route("/tasks/{id}", get(get_task).put(update_task).delete(delete_task))
   }

   fn app(state: Arc<AppState>) -> Router {
       let api = Router::new()
           .merge(task_routes())   // .merge() combines peer routers
           .merge(user_routes());

       Router::new()
           .nest("/api/v1", api)   // .nest() adds prefix to sub-router
           .fallback(handle_404)   // typed error, not Axum's default plain-text 404
           .with_state(state)
   }
   ```

2. **Path parameters use `{name}` syntax** (not `:name`).

### Extractors

1. **Built-in extractors — `Path`, `Query`, `Json`, `State`, `HeaderMap`:**
   ```rust
   // ✅ Typed and validated at compile time
   async fn get_task(
       State(state): State<Arc<AppState>>,
       Path(id): Path<Uuid>,
   ) -> Result<Json<TaskResponse>, AppError> {
       let task = state.task_service.find(id).await?;
       Ok(Json(task.into()))
   }
   ```

2. **Extractor ordering — body-consuming extractors MUST be last:**
   ```rust
   // ✅ Path before Json (Json consumes the body)
   async fn update_task(
       State(state): State<Arc<AppState>>,
       Path(id): Path<Uuid>,
       Json(body): Json<UpdateTaskRequest>,
   ) -> Result<Json<TaskResponse>, AppError> { ... }

   // ❌ Json before Path — won't compile or will fail at runtime
   async fn update_task(Json(body): Json<UpdateTaskRequest>, Path(id): Path<Uuid>) { ... }
   ```

3. **Custom extractors via `FromRequestParts` (non-body) or `FromRequest` (body):**
   ```rust
   // ✅ Custom extractor for authenticated user
   impl<S: Send + Sync> FromRequestParts<S> for AuthUser {
       type Rejection = AppError;
       async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
           let token = parts.headers.get(AUTHORIZATION)
               .and_then(|v| v.to_str().ok())
               .and_then(|v| v.strip_prefix("Bearer "))
               .ok_or(AppError::Unauthorized)?;
           decode_jwt(token).map_err(|_| AppError::Unauthorized)
       }
   }
   ```

4. **Handle rejections with custom types** — never let Axum's default messages leak to clients.

### Application State

1. **Wrap in `Arc`, pass via `State`:**
   ```rust
   pub struct AppState {
       pub db: sqlx::PgPool,
       pub task_service: TaskService,
       pub config: AppConfig,
   }

   let state = Arc::new(AppState { db: pool, task_service, config });
   let app = Router::new().route("/tasks", get(list_tasks)).with_state(state);
   ```

2. **Compose state for feature isolation** — each feature defines its own state struct, combined at app level.
3. **Never clone `AppState` directly** — wrap in `Arc`, clone the `Arc`.

### Middleware (Tower)

1. **`ServiceBuilder` for layer composition:**
   ```rust
   // ✅ Full middleware stack — order matters (outermost runs first)
   let app = Router::new()
       .nest("/api/v1", api_routes())
       .layer(
           ServiceBuilder::new()
               .layer(TraceLayer::new_for_http())
               .layer(CompressionLayer::new())
               .layer(CorsLayer::permissive()) // tighten for production
               .layer(TimeoutLayer::new(Duration::from_secs(30)))
       )
       .with_state(state);
   ```

2. **Custom middleware with `from_fn`:**
   ```rust
   async fn auth_middleware(
       State(state): State<Arc<AppState>>,
       request: Request,
       next: Next,
   ) -> Result<Response, AppError> {
       let token = request.headers().get(AUTHORIZATION)
           .and_then(|v| v.to_str().ok())
           .and_then(|v| v.strip_prefix("Bearer "))
           .ok_or(AppError::Unauthorized)?;
       state.auth_service.validate(token).await?;
       Ok(next.run(request).await)
   }

   // Apply to specific routes with route_layer
   let protected = Router::new()
       .route("/tasks", get(list_tasks))
       .route_layer(middleware::from_fn_with_state(state.clone(), auth_middleware));
   ```

3. **Layer ordering:** `ServiceBuilder` applies bottom-to-top — last `.layer()` wraps closest to handler.

### Error Handling

1. **Unified `AppError` enum with `IntoResponse`:**
   ```rust
   #[derive(Debug, thiserror::Error)]
   pub enum AppError {
       #[error("not found: {0}")]       NotFound(String),
       #[error("validation failed: {0}")] Validation(String),
       #[error("unauthorized")]          Unauthorized,
       #[error("forbidden")]             Forbidden,
       #[error(transparent)]             Internal(#[from] anyhow::Error),
   }

   impl IntoResponse for AppError {
       fn into_response(self) -> Response {
           let (status, msg) = match &self {
               Self::NotFound(m) => (StatusCode::NOT_FOUND, m.clone()),
               Self::Validation(m) => (StatusCode::UNPROCESSABLE_ENTITY, m.clone()),
               Self::Unauthorized => (StatusCode::UNAUTHORIZED, "unauthorized".into()),
               Self::Forbidden => (StatusCode::FORBIDDEN, "forbidden".into()),
               Self::Internal(e) => {
                   tracing::error!(error = %e, "internal server error");
                   (StatusCode::INTERNAL_SERVER_ERROR, "internal server error".into())
               }
           };
           (status, Json(serde_json::json!({ "error": msg }))).into_response()
       }
   }
   ```

2. **Handler return type:** always `Result<impl IntoResponse, AppError>`.
3. **Convert rejections into `AppError`** for consistent JSON error shape.

### Response Types

1. **`Json<T>`** for standard responses, **`(StatusCode, Json<T>)`** tuple for non-200:
   ```rust
   async fn list_tasks(...) -> Result<Json<Vec<TaskResponse>>, AppError> { ... }
   async fn create_task(...) -> Result<(StatusCode, Json<TaskResponse>), AppError> {
       Ok((StatusCode::CREATED, Json(task.into())))
   }
   ```
2. **`Response` builder** for headers, streaming, or non-JSON (CSV, files).

### Validation

1. **`validator` crate with `#[derive(Validate)]`:**
   ```rust
   #[derive(Debug, Deserialize, Validate)]
   pub struct CreateTaskRequest {
       #[validate(length(min = 1, max = 255))]
       pub title: String,
       #[validate(range(min = 1, max = 5))]
       pub priority: u8,
   }
   ```

2. **Custom `ValidatedJson<T>` extractor** — implement `FromRequest<S>` that deserializes via `Json<T>` then calls `value.validate()`, converting failures to `AppError::Validation`:
   ```rust
   use axum::extract::{FromRequest, Request};
   use axum::Json;
   use serde::de::DeserializeOwned;
   use validator::Validate;

   pub struct ValidatedJson<T>(pub T);

   impl<S, T> FromRequest<S> for ValidatedJson<T>
   where
       S: Send + Sync,
       T: DeserializeOwned + Validate,
   {
       type Rejection = AppError;

       async fn from_request(req: Request, state: &S) -> Result<Self, Self::Rejection> {
           let Json(value) = Json::<T>::from_request(req, state)
               .await
               .map_err(|e| AppError::Validation(e.body_text()))?;
           value.validate().map_err(|e| AppError::Validation(e.to_string()))?;
           Ok(ValidatedJson(value))
       }
   }

   // Usage — replaces bare Json<T> in handler signatures
   async fn create_task(
       State(state): State<Arc<AppState>>,
       ValidatedJson(body): ValidatedJson<CreateTaskRequest>,
   ) -> Result<(StatusCode, Json<TaskResponse>), AppError> {
       let task = state.task_service.create(body).await?;
       Ok((StatusCode::CREATED, Json(task.into())))
   }
   ```

### Testing

> For universal testing principles, see `.agents/rules/testing-strategy.md`. Below: Axum-specific patterns only.

1. **`tower::ServiceExt::oneshot` — test handlers without spawning a server:**
   ```rust
   #[tokio::test]
   async fn test_create_task_returns_201() {
       let app = app(Arc::new(test_app_state().await));
       let response = app.oneshot(
           Request::builder().method("POST").uri("/api/v1/tasks")
               .header("content-type", "application/json")
               .body(Body::from(r#"{"title":"Test","priority":3}"#)).unwrap(),
       ).await.unwrap();
       assert_eq!(response.status(), StatusCode::CREATED);
   }
   ```

2. **Mock state helpers** — create a `test_app_state()` fn that swaps real services for test doubles.
3. **Integration tests** use a real database via `sqlx::test` or Testcontainers.

### Graceful Shutdown

```rust
// ✅ Signal-based graceful shutdown
let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;
axum::serve(listener, app)
    .with_graceful_shutdown(async {
        tokio::signal::ctrl_c().await.expect("failed to install CTRL+C handler");
        tracing::info!("shutdown signal received");
    })
    .await?;
```

### Anti-Patterns

- ❌ **Business logic in handlers** — extract to a service/logic layer; handlers only parse, delegate, respond
- ❌ **`Extension` instead of `State`** — `Extension` is untyped and pre-0.6; use `State<T>` always
- ❌ **Cloning entire state** — wrap in `Arc`, clone the `Arc`
- ❌ **Blocking in async handlers** — use `tokio::task::spawn_blocking` for CPU-bound or blocking I/O
- ❌ **Wrong extractor ordering** — body-consuming extractors (`Json`, `Form`) must be the last parameter
- ❌ **Returning string errors** — use typed `AppError` with `IntoResponse` for consistent error shape
- ❌ **Leaking internal error details** — log with `tracing::error!`, return generic message to client

### Formatting and Static Analysis

> Same tooling as Rust. See @.agents/skills/rust-idioms/SKILL.md#clippy-and-formatting.

### Related
- Code Idioms and Conventions @.agents/rules/code-idioms-and-conventions.md
- Rust Idioms @.agents/skills/rust-idioms/SKILL.md
- API Design Principles @.agents/rules/api-design-principles.md
- Security Principles @.agents/rules/security-principles.md
- Error Handling Principles @.agents/rules/error-handling-principles.md
- Architectural Patterns @.agents/rules/architectural-pattern.md
- Testing Strategy @.agents/rules/testing-strategy.md
- Logging and Observability Mandate @.agents/rules/logging-and-observability-mandate.md
- Logging Implementation @.agents/skills/logging-implementation/SKILL.md
