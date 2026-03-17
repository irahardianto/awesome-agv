---
trigger: model_decision
description: When serializing, deserializing, or validating data formats (JSON, XML, YAML, Protocol Buffers, MessagePack, etc.)
---

## Data Serialization and Interchange Principles

### Validate at System Boundaries

**All data entering system must be validated:**

- API requests, file uploads, message queue messages  
- Validate type, format, range, required fields  
- Fail fast on invalid data (don't process partially valid data)  
- Return clear validation errors to client

### Handle Encoding Explicitly

**Default to UTF-8:**

- UTF-8 for all text data (API responses, file contents, database strings)  
- Specify encoding explicitly when reading/writing files  
- Handle encoding errors gracefully (replacement characters or error)

**Encoding errors:**

- Invalid UTF-8 sequences (malformed bytes)  
- Mixing encodings (reading UTF-8 as ISO-8859-1)  
- Always validate and normalize encoding

### Serialization Format Selection

**JSON:**

- Human-readable, widely supported, language-agnostic  
- Good for: APIs, configuration files, web applications  
- Limitations: No binary support, larger size than binary formats

**Protocol Buffers:**

- Compact binary format, fast serialization/deserialization  
- Schema evolution (backward/forward compatibility)  
- Good for: Internal microservices, high-throughput systems  
- Limitations: Not human-readable, requires schema definition

**MessagePack:**

- Binary JSON-like format, faster and more compact than JSON  
- Good for: Internal APIs, when JSON too slow but readability still desired  
- Limitations: Less widely supported than JSON

**XML:**

- Verbose, legacy systems, document-oriented  
- Good for: Enterprise systems, SOAP APIs, RSS/Atom feeds  
- Limitations: Verbosity, complexity, security issues (XXE attacks)

**YAML:**

- Human-friendly, good for configuration files  
- Good for: Config files, Infrastructure as Code (Kubernetes, CI/CD)  
- Limitations: Complex parsing, performance, security issues (arbitrary code execution)

### Security Considerations

**Validate before deserialization:**

- Prevent deserialization attacks (arbitrary code execution)  
- Set size limits on payloads (prevent memory exhaustion)  
- Whitelist allowed types/classes for deserialization

**Disable dangerous features:**

- XML: Disable external entity processing (XXE prevention)  
- YAML: Disable unsafe constructors  
- Python pickle: Never deserialize untrusted data

### Related Principles
- Error Handling Principles @error-handling-principles.md
- Security Mandate @security-mandate.md
- Security Principles @security-principles.md
- API Design Principles @api-design-principles.md
