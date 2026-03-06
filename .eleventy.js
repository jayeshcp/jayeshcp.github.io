import EleventyVitePlugin from "@11ty/eleventy-plugin-vite";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";

export default function (eleventyConfig) {
  eleventyConfig.addFilter("bust", (url) => {
    const stat = fs.statSync(`./_site${url}`);
    const mtime = stat.mtimeMs;
    return `${url}?v=${mtime}`;
  });

  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPlugin(EleventyVitePlugin, {
    viteOptions: {
      plugins: [tailwindcss()],
    },
  });

  return {
    pathPrefix: "/",
    dir: {
      input: "src",
      output: "_site",
    },
  };
}
