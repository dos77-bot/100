# Project 100

This repository contains various Swift and JavaScript components used in personal experiments and utilities.

## Utilities

### Curl Diagnostics Helper

A small workspace prompt to speed up HTTP/API troubleshooting. When an HTTP request fails or behaves unexpectedly, use the `genCurlDiagnostics` prompt to automatically generate a `curl` command (or commands) that reproduce the issue and add diagnostic flags such as `-v`, `--trace`, or `--write-out`.

**Usage examples:**

```sh
# If you have an HTTP request selected in the editor
> genCurlDiagnostics "server returns 500 when creating a user"

# Or just describe the problem
> genCurlDiagnostics "timeout occurs calling /api/health"
```

The prompt will also include guidance on interpreting the output and suggestions for next steps.

> _Note: this prompt is personal‑project scoped and intended for quick reproduction of HTTP problems._

Feel free to edit the prompt file under `.prompt/curl-diagnostics.prompt.md` if you need to extend its behavior or adapt it to other tools.
