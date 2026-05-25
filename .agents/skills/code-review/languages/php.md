# PHP Anti-Patterns (Auto-Fail)

> **Load this file** during code reviews of PHP code. Patterns listed here are **immediate findings** — no judgment needed. If the pattern exists, it is a finding.

---

## Auto-Fail Table

| Pattern | Severity | Tag | Correct Fix |
|---|---|---|---|
| SQL injection (`"SELECT ... $var"`) | Critical | `[SEC]` | Use prepared statements with `PDO::prepare()` |
| `eval()` or `preg_replace` with `e` flag | Critical | `[SEC]` | Refactor to avoid dynamic code execution |
| `$_GET` / `$_POST` used directly without validation | Critical | `[SEC]` | Validate and sanitize all input |
| `echo` raw user input (XSS) | Critical | `[SEC]` | Use `htmlspecialchars()` or template engine auto-escaping |
| `catch (Exception $e) { }` empty catch | Critical | `[ERR]` | Handle, log, or rethrow |
| `@` error suppression operator | Major | `[ERR]` | Handle errors properly — `@` hides bugs |
| `extract()` on user input | Critical | `[SEC]` | Never use `extract()` with untrusted data |
| Missing type declarations (PHP 8+) | Major | `[PAT]` | Add parameter types, return types, property types |
| `global $var` keyword | Major | `[ARCH]` | Use dependency injection — pass via constructor |
| `var_dump()` / `print_r()` in production | Major | `[OBS]` | Use Monolog or PSR-3 logger |
| `die()` / `exit()` for error handling | Major | `[ERR]` | Throw exceptions — `die()` prevents cleanup |
| `mysql_*` functions (removed in PHP 7) | Critical | `[ERR]` | Use PDO or MySQLi |
| `md5()` / `sha1()` for password hashing | Critical | `[SEC]` | Use `password_hash()` with `PASSWORD_ARGON2ID` |
| Missing `declare(strict_types=1)` | Major | `[PAT]` | Add to every PHP file — enables strict type checking |

---

## Detection Commands

```bash
# SQL injection (string interpolation in queries)
grep -rn '"SELECT\|"INSERT\|"UPDATE\|"DELETE' --include='*.php' | grep '\$'

# eval usage
grep -rn '\beval(' --include='*.php'

# Direct superglobal access
grep -rn '\$_GET\|\$_POST\|\$_REQUEST\|\$_SERVER' --include='*.php' | grep -v 'test\|Test\|Request\|filter_input'

# Error suppression
grep -rn '@\$\|@fopen\|@file\|@include\|@require' --include='*.php'

# var_dump/print_r
grep -rn 'var_dump\|print_r\|dd(' --include='*.php' | grep -v 'test\|Test'

# die/exit
grep -rn '\bdie(\|\bexit(' --include='*.php' | grep -v 'test\|Test'

# Weak password hashing
grep -rn 'md5(\|sha1(\|sha256(' --include='*.php' | grep -v 'test\|Test\|hash\|checksum'

# Missing strict_types
find . -name '*.php' -exec grep -L 'strict_types' {} \; | grep -v 'vendor\|test'

# Global keyword
grep -rn '\bglobal \$' --include='*.php'
```

---

## Correct Patterns (Reference)

### SQL Safety

```php
// ❌ SQL injection
$result = $pdo->query("SELECT * FROM tasks WHERE id = '$id'");

// ✅ Prepared statement
$stmt = $pdo->prepare('SELECT * FROM tasks WHERE id = :id');
$stmt->execute(['id' => $id]);
$result = $stmt->fetch(PDO::FETCH_ASSOC);
```

### Input Validation

```php
// ❌ Direct superglobal usage
$email = $_POST['email'];

// ✅ Filter and validate
$email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
if ($email === false) {
    throw new ValidationException('Invalid email');
}
```

### Type Safety (PHP 8+)

```php
<?php
declare(strict_types=1);

// ✅ Fully typed
function createTask(string $title, Priority $priority): Task
{
    // ...
}

// ✅ Readonly properties (PHP 8.1+)
class Task
{
    public function __construct(
        public readonly string $id,
        public readonly string $title,
        public readonly Priority $priority,
    ) {}
}
```

---

## References
- PHP Idioms @.agents/skills/php-idioms/SKILL.md
- Security Principles @security-principles.md
- Error Handling Principles @error-handling-principles.md
