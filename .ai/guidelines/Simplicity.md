---
description: 'Code simplicity and maintainability standards'
applyTo: '**/*.php'
---

# Code Simplicity and Maintainability

## Code Quality Guidelines

### Readable Variable Names

- Always use descriptive, meaningful variable names that clearly convey their purpose.
- Use `$registeredUsers` instead of `$ru` or `$data`.
- Use `$isActive` instead of `$flag` or `$status`.
- Method names should describe what they do: `calculateTotalPrice()` not `calc()`.

### Code Simplicity

- Write code that is easy to understand and maintain.
- Avoid over-simplification that sacrifices clarity or functionality.
- Avoid over-complication that makes code harder to read and maintain.
- Strike a balance: the solution should be as simple as possible, but no simpler.
- Prefer straightforward logic over clever tricks.

### Service Classes

- Use Service classes to encapsulate complex business logic.
- Keep controllers thin and focused on handling HTTP requests/responses.
- Move reusable logic into Service classes to avoid crowded controllers.
- Service classes should have a single, clear responsibility.

### Controllers

- Controllers should stay thin and orchestration-focused.
- Controllers should primarily coordinate the request, call the service or action, and return the response.
- Do not place heavy business logic, complex data transformation, or documentation-heavy endpoint details in controllers.

### Request Validation

- Always use Form Request classes for validation, never validate inline in controllers.
- Create dedicated Request classes for each form submission or API endpoint.
- Include both validation rules and custom error messages in Request classes.
- Follow existing application conventions for array-based or string-based validation rules.

### Scribe Documentation

- Maintain Scribe documentation for API endpoints that are meant to be consumed by frontend clients, third parties, or other systems.
- Do not bloat controllers with Scribe documentation metadata when it belongs to the request input.
- Prefer Form Request classes as the primary home for request-related API documentation, including validation-driven field details, examples, and request-specific descriptions.
- When request fields change, update the related Form Request so validation and Scribe-generated documentation stay aligned.
- Keep controllers focused on behavior; keep request input documentation close to the request class.
- If documentation cannot reasonably live in the request, keep the controller documentation minimal and only add what is truly endpoint-specific.

### File Organization

- Group related files into module-specific directories when there are multiple files for a module.
- Avoid cluttering the root directory with module-specific files.
- Create subdirectories for Controllers, Requests, Services, and Models when they belong to the same module.
