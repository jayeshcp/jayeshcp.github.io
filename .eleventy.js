import EleventyVitePlugin from "@11ty/eleventy-plugin-vite";
import tailwindcss from "@tailwindcss/vite";
import htmlminifier from "html-minifier-terser";
import fs from "fs";
import "dotenv/config";

export default function (eleventyConfig) {
  const isProd = process.env.NODE_ENV === "prod";

  if (isProd) {
    eleventyConfig.addTransform("htmlmin", function (content) {
      if ((this.page.outputPath || "").endsWith(".html")) {
        return htmlminifier.minify(content, {
          useShortDoctype: true,
          removeComments: true,
          collapseWhitespace: true,
          minifyCSS: true,
          minifyJS: true,
        });
      }
      return content;
    });

    eleventyConfig.addFilter("bust", (url) => {
      const stat = fs.statSync(`./_site${url}`);
      const mtime = stat.mtimeMs;
      return `${url}?v=${mtime}`;
    });
  }

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
