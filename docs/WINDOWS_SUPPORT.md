# Windows Support

Windows is a first-class runtime target for Zotero AI Companion.

## Runtime files

Runtime files use the separator style of Zotero's configured directory. On a
default Windows setup they are written to the Zotero data directory:

```text
C:\Users\<name>\Zotero\zotero-ai-sidebar-chat-history.json
C:\Users\<name>\Zotero\zai_translate_debug.log
```

If the data directory is unavailable, chat history falls back to the Zotero
profile directory.

## Windows-first cleanup

- Removed the built-in screen-capture feature and its Linux external-tool
  fallbacks (`gnome-screenshot`, Flameshot, and ImageMagick).
- Removed unused code that generated POSIX-only `tar`, `restic`, and `sqlite3`
  backup commands.
- Replaced hard-coded `/tmp` translation logging with the Zotero data/profile
  directory.
- Centralized Windows/POSIX-safe path joining and covered both separator styles
  with tests.

Reader event guards that mention Linux remain because they are harmless
cross-platform fallbacks and do not invoke Linux tools or paths on Windows.

## Development

`npm ci`, `npm test`, and `npm run build` work in PowerShell. The optional
release helper scripts under `scripts/` are Bash-based and are only needed by
maintainers publishing Git tags; they are not included in the XPI runtime.
