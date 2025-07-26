/** @type {import('@commitlint/types').UserConfig} */
const config = {
	extends: ["@commitlint/config-conventional"],
	rules: {
		/**
		 * Subject-case rule enforces the case of the subject in commit messages.
		 *
		 * @example
		 * OK
		 * feat: Add new feature
		 * fix: Resolve issue with API
		 *
		 * NG
		 * feat: add new feature
		 * fix: resolve issue with API
		 */
		"subject-case": [2, "always", ["pascal-case", "sentence-case"]],

		/**
		 * Allows commit body to have unlimited length
		 * This enables writing detailed explanations in commit messages
		 */
		"body-max-line-length": [0, "always", 0],
	},
	helpUrl:
		"https://github.com/conventional-changelog/commitlint/#what-is-commitlint",
};

module.exports = config;
