// src/_data/eleventyinfo.js
import packagejson from "../../package.json" with { type: "json" };

// get version of 11ty/eleventy and make it available in templates as `site.version`
const eleventyVersion =
  packagejson.dependencies["@11ty/eleventy"] ||
  packagejson.devDependencies["@11ty/eleventy"];
const eleventyVersionClean = eleventyVersion.replace(/^[^0-9]*/, ""); // remove any non-numeric prefix (e.g., "^", "~")

export default function () {
  return {
    version: packagejson.version,
    eleventyVersion: eleventyVersionClean,
  };
}
