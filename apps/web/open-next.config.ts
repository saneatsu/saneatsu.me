// OpenNext configuration for Cloudflare Workers
const config = {
	default: {
		override: {
			wrapper: "cloudflare-node",
			converter: "edge",
			proxyExternalRequest: "fetch",
			incrementalCache: "dummy",
			tagCache: "dummy",
			queue: "dummy",
		},
	},
	edgeExternals: ["node:crypto"],
};

export default config;
