---
trigger: model_decision
description: When working with application configuration, environment variables, settings files, or secrets management
---

## Configuration Management Principles

### Separation of Configuration and Code

**Configuration:**

- Environment-specific values (URLs, credentials, feature flags, timeouts)  
- Changes between dev/staging/prod  
- Can change without code deployment

**Code:**

- Business logic and application behavior  
- Same across all environments  
- Requires deployment to change

**Never hardcode configuration in code:**

- ❌ `const DB_URL = "postgresql://prod-db:5432/myapp"`  
- ✅ `const DB_URL = process.env.DATABASE_URL`

### Configuration Validation

**Validate at startup:**

- Check all required configuration is present  
- Fail fast if required config is missing or invalid  
- Provide clear error messages for misconfiguration  
- Example: "DATABASE_URL environment variable is required"

**Validation checks:**

- Type (string, number, boolean, enum)  
- Format (URL, email, file path)  
- Range (port numbers 1-65535)  
- Dependencies (if feature X enabled, config Y required)

### Configuration Hierarchy

**Precedence (highest to lowest):**

1. **Command-line arguments:** Override everything (for testing, debugging)  
2. **Environment variables:** Override config files  
3. **Config files:** Environment-specific (config.prod.yaml, config.dev.yaml)  
4. **Defaults:** Reasonable defaults in code (fallback)

**Example:**

Database port resolution:

1. Check CLI arg: --db-port=5433

2. Check env var: DB_PORT=5432

3. Check config file: database.port=5432

4. Use default: 5432

### Configuration Organization

Hybrid Approach (config files + .env files): define the structure of configuration in config files (e.g. config/database.yaml) and use .env files to inject the secret values.

**.env files:** Description: A file dedicated to a specific environment (development) for production these values comes from secrets/environment platfrom or manager not a physical `.env` file on disk. When to Use: Use this only for secrets (API keys, passwords) and a few environment-specific values (like a server IP). These files except `.env.template` should never be committed to version control (git).

- `.env.template` - Consist of credentials and secrets with blank value (SHOULD commit to git)  
- `.env.development` - Local development credentials and secrets (SHOULD NOT commit to git)  

**Example `.env.development`:**
```
DEV_DB_HOST=123.45.67.89
DEV_DB_USERNAME=prod_user
DEV_DB_PASSWORD=a_very_secure_production_password
```

**Feature files:** Description: Settings are grouped into files based on what they do (database, auth, etc.). This keeps your configuration organized. When to Use: Use this as your primary method for organizing non-secret settings. It’s the best way to keep your configuration clean and scalable as your application grows.

- `config/database.yaml` - Database settings  
- `config/redis.yaml` - Cache settings  
- `config/auth.yaml` - Authentication settings

**Example `config/database.yaml`:**
```
default: &default
  adapter: postgresql
  pool: 5
development:
  <<: *default
  host: localhost
  database: myapp_dev
  username: <%= ENV['DEV_DB_USERNAME'] %> # Placeholder for a secret
  password: <%= ENV['DEV_DB_PASSWORD'] %>
production:
  <<: *default
  host: <%= ENV['PROD_DB_HOST'] %>
  database: myapp_prod
  username: <%= ENV['PROD_DB_USERNAME'] %>
  password: <%= ENV['PROD_DB_PASSWORD'] %>
```

### Related Principles
- Security Mandate @security-mandate.md
- Security Principles @security-principles.md
