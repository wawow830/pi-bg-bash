# pi-bg-bash

Adds `background` to pi's `bash` tool. With `background: true` the call returns
immediately; when the command exits, its output is sent to the session in the
same format as `!cmd`, triggering a turn if the agent is idle.

```bash
pi install ./
```
