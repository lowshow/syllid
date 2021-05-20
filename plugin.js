const fs = require("fs")

module.exports = function (_, {file}) {
	return {
		name: "plugin-passthru",
		resolve: {input: [".js"], output: [".js"]},
		async load({filePath}) {
			if (filePath.includes(file)) {
				const fileContent = fs.readFileSync(filePath, 'utf-8')
				const json = JSON.stringify(fileContent)
					.replace(/\u2028/g, '\\u2028')
					.replace(/\u2029/g, '\\u2029')
				return `export default ${json}`
			}
		}
	};
};