import { getPackageJson, resolvePkgPath, getBaseRollupPlugins } from './utils';
const { name, module } = getPackageJson('react');
import generatePackageJson from 'rollup-plugin-generate-package-json';
// react 包的路径
const pkgPath = resolvePkgPath(name);
const pkgdistPath = resolvePkgPath(name, true);
export default [
	// react
	{
		input: `${pkgPath}/${module}`,
		output: {
			file: `${pkgdistPath}/index.js`,
			name: 'React',
			format: 'umd'
		},
		plugins: [
			...getBaseRollupPlugins(),
			generatePackageJson({
				inputFolder: pkgPath,
				outputFolder: pkgdistPath,
				baseContents: ({ name, description, version }) => ({
					name,
					description,
					version,
					main: 'index.js'
				})
			})
		]
	},
	// jsx-runtime
	{
		input: `${pkgPath}/src/jsx.ts`,
		output: [
			// jsx-runtime
			{
				file: `${pkgdistPath}/jsx-runtime.js`,
				name: 'jsx-runtime',
				formate: 'umd'
			},
			// jsx-dev-runtime
			{
				file: `${pkgdistPath}/jsx-dev-runtime.js`,
				name: 'jsx-dev-runtime',
				formate: 'umd'
			}
		],
		plugins: getBaseRollupPlugins()
	}
];
