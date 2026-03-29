# curl diagnostics helper

When something goes wrong with an HTTP service or API, I often need to quickly craft `curl` commands
that reproduce the problem or gather basic diagnostics. This prompt generates appropriate `curl`
invocations and a short set of follow‑up checks given a description of the issue or the
selected request details.

## Inputs
- `{{description}}` &ndash; a brief summary of the issue or the context where the failure occurs.
- Optionally, if code or a request is selected in the editor, include the URL, method, headers,
and body so the task can use them directly.

## Behavior
1. Read the `description` and any selected HTTP request data.
2. Produce a `curl` command (or multiple commands) that will reproduce the request exactly,
   including method, headers (e.g. `-H 'Content-Type: application/json'`), query parameters,
   and body payload if present.
3. Suggest extra `curl` options for diagnostics, such as `-v`, `--trace`, `--write-out`, or
   `--retry` depending on the nature of the issue.
4. Provide a short explanation of how to interpret the output and any next steps (e.g. "check
   status code","compare response headers","capture TLS handshake").

## Example invocations
```text
# run on a selection containing a POST request
> genCurlDiagnostics "server returns 500 when creating a user"

# run with only a description, prompt the user for URL details
> genCurlDiagnostics "timeout occurs calling /api/health"
```

> Note: this prompt is **personal‑project scoped** and intended for quick reproduction of HTTP problems.
'/usr/local/bin/python3' -i /path/to/your_script.py