# Zotero 10 Compatibility

Zotero AI Companion 1.0.0 supports Zotero 7 through Zotero 10 from one XPI.
The add-on manifest uses `strict_min_version: 7.0` and
`strict_max_version: 10.0.*`, following Zotero's official Zotero 10 plugin
guidance.

## API audit

The runtime source was checked against the breaking changes listed in
[Zotero 10 for Developers](https://www.zotero.org/support/dev/zotero_10_for_developers)
and the Zotero 10.0.0 source tag.

| Zotero 10 change                                                 | Result in this plugin                                                                                                                                                          |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Singular collection-tree getters were removed                    | Not used. Item selection uses the still-supported `ZoteroPane.getSelectedItems()` array API.                                                                                   |
| `ItemTree.collectionTreeRow` and some `ItemTree` methods changed | Not used. The plugin does not create or walk an `ItemTree`.                                                                                                                    |
| Search conditions and the full-text database schema changed      | No direct `Zotero.Search` or full-text table access. Cached PDF text is read through `Zotero.Fulltext.getItemCacheFile()`, which remains present in Zotero 10.0.0.             |
| `Zotero.CookieSandbox` was removed                               | Not used. Provider and WebDAV requests use `fetch`.                                                                                                                            |
| Local HTTP server request rules changed                          | Not affected. The plugin does not call Zotero's port 23119 local API.                                                                                                          |
| Item type/path setters became stricter                           | Not used. Notes and annotations are created through Zotero object APIs.                                                                                                        |
| SQLite now uses WAL mode                                         | The plugin never reads the database at runtime. Generated backup commands use SQLite's transaction-safe `.backup` command and exclude live database sidecars from the archive. |
| Plugin localization registration changed                         | Existing FTL resources use Zotero's plugin localization hooks and require no version branch.                                                                                   |

The private integration points used for the custom sidebar and PDF tools were
also verified in the Zotero 10.0.0 source: `zotero-context-pane`,
`ZoteroPane.itemSelected`, `Zotero.Reader.getByTabID`,
`Zotero.Reader.registerEventListener`, `Zotero.Reader._readers`, and
`Zotero.Annotations.saveFromJSON`.

`tests/zotero10-compat.test.ts` protects the manifest range and rejects the
known removed APIs if they are introduced into runtime source later.

## Build verification

Run:

```bash
npm ci
npm test
npm run build
```

The distributable is generated at
`.scaffold/build/zotero-ai-companion.xpi`. The build still targets Firefox 115
syntax because Zotero 7 is the oldest supported runtime; that output is also
valid on the Firefox 140 ESR base used by Zotero 9 and 10.

## Zotero 10 smoke test

Use a separate Zotero profile and test the built XPI in Zotero 10:

1. Install the XPI from `Tools -> Plugins -> Install Plugin From File`.
2. Restart Zotero and confirm the AI column appears in both the library and PDF
   reader views.
3. Open a PDF and switch between tabs and selected library items; confirm the
   sidebar follows the active paper.
4. Configure a test model preset and verify streaming chat, current-item
   metadata, selected PDF text, cached full text, and annotations.
5. Verify point translation, full-text translation, image upload/paste,
   and chat history persistence.
6. Create a child note and a PDF annotation in YOLO mode or through the normal
   confirmation flow, then undo or remove the test data.
7. Open plugin preferences, save each settings section, restart Zotero, and
   confirm the settings persist.
8. Open a second Zotero main window and confirm each window receives one
   sidebar and unloads cleanly.

The automated suite verifies source compatibility and packaging. A real Zotero
10 smoke test remains necessary for private Reader DOM and layout behavior.
