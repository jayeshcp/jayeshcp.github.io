import { EleventyRenderPlugin } from "@11ty/eleventy";

export default async function(eleventyConfig) {
	// Configure Eleventy
    eleventyConfig.addPlugin(EleventyRenderPlugin);
    eleventyConfig.setOutputDirectory("public");
    eleventyConfig.addPassthroughCopy("css/index.css");
};