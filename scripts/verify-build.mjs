import { readFile } from "node:fs/promises";

const pkg = JSON.parse(await readFile("package.json", "utf8"));
const manifest = JSON.parse(
  await readFile(".scaffold/build/addon/manifest.json", "utf8"),
);
const zotero = manifest.applications?.zotero;

if (!zotero) throw new Error("Built manifest is missing applications.zotero");
const expectedUpdateURL =
  "https://github.com/Dennis-Huangm/zotero-ai-companion/releases/download/release/update.json";
if (zotero.update_url !== expectedUpdateURL) {
  throw new Error(
    `Built manifest update_url mismatch, got: ${zotero.update_url}`,
  );
}
if (manifest.version !== pkg.version) {
  throw new Error(
    `Built manifest version ${manifest.version} does not match package ${pkg.version}`,
  );
}
if (zotero.id !== pkg.config.addonID) {
  throw new Error(
    `Built add-on ID ${zotero.id} does not match package ${pkg.config.addonID}`,
  );
}
if (zotero.id !== "zotero-ai-companion@dennis-huangm.github.io") {
  throw new Error(`Built manifest uses unexpected add-on ID: ${zotero.id}`);
}
if (
  !String(manifest.homepage_url).includes("Dennis-Huangm/zotero-ai-companion")
) {
  throw new Error(`Unexpected homepage_url: ${manifest.homepage_url}`);
}

const updates = JSON.parse(
  await readFile(".scaffold/build/update.json", "utf8"),
);
const updateEntries =
  updates.addons?.["zotero-ai-companion@dennis-huangm.github.io"]?.updates;
if (!Array.isArray(updateEntries) || updateEntries.length === 0) {
  throw new Error("Built update.json is missing the companion update entry");
}
if (
  !String(updateEntries[0].update_link).includes(
    "Dennis-Huangm/zotero-ai-companion/releases/download/",
  )
) {
  throw new Error(`Unexpected update_link: ${updateEntries[0].update_link}`);
}

globalThis.console.log(
  "Verified build manifest and Zotero automatic-update metadata.",
);
