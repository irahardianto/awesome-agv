---
paths:
  - "**/Application.java"
  - "**/application.yml"
  - "**/application.properties"
---

## Spring Boot Idioms and Patterns

Spring Boot (3.x) rewards auto-configuration, constructor injection, and actuator-driven observability. Idiomatic Spring = annotation-driven, testable, production-ready.

> Scope: Spring Boot-specific patterns. For Java: `@.agents/skills/java-idioms/SKILL.md`.

### Dependency Injection

1. **Constructor injection only** — never field injection:
   ```java
   @Service
   public class TaskService {
       private final TaskRepository repository;
       private final TaskMapper mapper;

       public TaskService(TaskRepository repository, TaskMapper mapper) {
           this.repository = repository;
           this.mapper = mapper;
       }
   }
   ```

2. **`@ConfigurationProperties`** over `@Value` for typed config.

### Spring Data JPA

1. **Query methods for simple queries:**
   ```java
   interface TaskRepository extends JpaRepository<Task, UUID> {
       List<Task> findByStatusOrderByCreatedAtDesc(TaskStatus status);
       @Query("SELECT t FROM Task t WHERE t.priority = :priority AND t.status = 'ACTIVE'")
       List<Task> findActivByPriority(@Param("priority") Priority priority);
   }
   ```

2. **Projections** for read-only views — avoid loading full entities.
3. **`@Transactional`** on service methods, never on repositories.

### REST Controllers

1. **`@RestController` + DTOs** — never expose entities directly:
   ```java
   @RestController
   @RequestMapping("/api/v1/tasks")
   public class TaskController {
       @PostMapping
       @ResponseStatus(HttpStatus.CREATED)
       public TaskResponse create(@Valid @RequestBody CreateTaskRequest request) {
           return taskService.create(request);
       }
   }
   ```

2. **`@ControllerAdvice`** for global exception handling.

### Actuator and Observability

1. **Actuator endpoints** enabled for health, metrics, info.
2. **Micrometer** for custom metrics.
3. **Structured logging** with MDC for correlation IDs.

### Testing

> For universal testing principles, see `.agents/rules/testing-strategy.md`. Below: language-specific patterns only.

1. **`@SpringBootTest`** for integration, `@WebMvcTest` for controller slices:
   ```java
   @WebMvcTest(TaskController.class)
   class TaskControllerTest {
       @Autowired MockMvc mockMvc;
       @MockBean TaskService taskService;

       @Test
       void createTask_returns201() throws Exception {
           mockMvc.perform(post("/api/v1/tasks")
               .contentType(MediaType.APPLICATION_JSON)
               .content("{\"title\":\"Test\",\"priority\":\"HIGH\"}"))
               .andExpect(status().isCreated());
       }
   }
   ```

2. **TestContainers** for database integration tests.

### Related
- Java Idioms @.agents/skills/java-idioms/SKILL.md
- Database Design Principles @.agents/rules/database-design-principles.md
- API Design Principles @.agents/rules/api-design-principles.md
