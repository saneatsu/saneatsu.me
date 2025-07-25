import path from "node:path";
import type { StorybookConfig } from "@storybook/experimental-nextjs-vite";

const config: StorybookConfig = {
  stories: [
    "./*.mdx",
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  addons: [
    "@storybook/addon-a11y",
    "@storybook/addon-essentials",
    "@storybook/addon-themes",
    "@chromatic-com/storybook",
  ],
  framework: {
    name: "@storybook/experimental-nextjs-vite",
    options: {},
  },
  staticDirs: ["../public"],
  core: {
    disableTelemetry: true,
  },
  viteFinal: async (config) => {
    return {
      ...config,
      server: {
        ...config.server,
        port: 6006,
      },
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          "@": path.resolve(__dirname, "../src"),
          "@/app": path.resolve(__dirname, "../src/app"),
          "@/entities": path.resolve(__dirname, "../src/entities"),
          "@/features": path.resolve(__dirname, "../src/features"),
          "@/shared": path.resolve(__dirname, "../src/shared"),
          "@/views": path.resolve(__dirname, "../src/views"),
          "@/widgets": path.resolve(__dirname, "../src/widgets"),
        },
      },
    };
  },
};

export default config;