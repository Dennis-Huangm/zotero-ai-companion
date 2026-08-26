import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();

interface AddonManifest {
  applications: {
    zotero: {
      strict_min_version: string;
      strict_max_version: string;
    };
  };
}

describe("Zotero 10 compatibility", () => {
  it("declares the supported Zotero 7-10 range", () => {
    const manifest = JSON.parse(
      readFileSync(join(projectRoot, "addon", "manifest.json"), "utf8"),
    ) as AddonManifest;

    expect(manifest.applications.zotero).toMatchObject({
      strict_min_version: "7.0",
      strict_max_version: "10.0.*",
    });
  });

  it("uses a fork-specific add-on ID", () => {
    const pkg = JSON.parse(
      readFileSync(join(projectRoot, "package.json"), "utf8"),
    ) as { config: { addonID: string } };
    expect(pkg.config.addonID).toBe(
      "zotero-ai-companion@dennis-huangm.github.io",
    );
    expect(pkg.config.addonID).not.toBe("zotero-ai-sidebar@local");
  });

  it("does not use APIs removed by Zotero 10", () => {
    const forbidden = [
      /\bgetCollectionTreeRow\s*\(/,
      /\bgetSelectedLibraryID\s*\(/,
      /\bgetSelectedCollection\s*\(/,
      /\bgetSelectedSavedSearch\s*\(/,
      /\bgetSelectedGroup\s*\(/,
      /\.collectionTreeRow\b/,
      /\bfulltextWord\b/,
      /\bCookieSandbox\b/,
      /advancedSearch\.xhtml/,
    ];
    const runtimeFiles = [
      ...sourceFiles(join(projectRoot, "src")),
      join(projectRoot, "addon", "bootstrap.js"),
    ];
    const violations: string[] = [];

    for (const path of runtimeFiles) {
      const source = readFileSync(path, "utf8");
      for (const pattern of forbidden) {
        if (pattern.test(source)) {
          violations.push(`${relative(projectRoot, path)}: ${pattern.source}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("uses lifecycle-independent timers for bundled SDK retries", () => {
    const bootstrap = readFileSync(
      join(projectRoot, "addon", "bootstrap.js"),
      "utf8",
    );
    expect(bootstrap).toContain("resource://gre/modules/Timer.sys.mjs");
    expect(bootstrap).toContain("setTimeout: timer.setTimeout");
    expect(bootstrap).not.toContain("setTimeout: window?.setTimeout");
  });
});

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(?:ts|tsx|js)$/.test(entry.name) ? [path] : [];
  });
}
