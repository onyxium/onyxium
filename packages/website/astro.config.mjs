import { defineConfig } from "astro/config"
import tailwind from "@astrojs/tailwind"
import sitemap from "@astrojs/sitemap"
import mdx from "@astrojs/mdx"
import prefetch from "@astrojs/prefetch"
import preact from "@astrojs/preact"

// https://astro.build/config
export default defineConfig({
	integrations: [tailwind(), sitemap(), mdx(), prefetch(), preact()],
	site: "https://onyxium.daimond113.com",
})
