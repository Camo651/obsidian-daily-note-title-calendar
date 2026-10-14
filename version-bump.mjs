import { readFileSync, writeFileSync } from "fs";

/** The version being released, taken from the npm lifecycle environment. */
const targetVersion = process.env.npm_package_version;
/** The parsed plugin manifest. */
const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
/** The minimum Obsidian version the plugin supports. */
const { minAppVersion } = manifest;
manifest.version = targetVersion;
writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t"));

/** The mapping of plugin versions to their minimum Obsidian version. */
const versions = JSON.parse(readFileSync("versions.json", "utf8"));
if (!(targetVersion in versions)) {
  versions[targetVersion] = minAppVersion;
  writeFileSync("versions.json", JSON.stringify(versions, null, "\t"));
}
