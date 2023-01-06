import { getPackageJson, resolvePkgPath, getBaseRollupPlugins } from './utils';
const { name, module } = getPackageJson('react-dom');
import generatePackageJson from 'rollup-plugin-generate-package-json';
import alias from '@rollup/plugin-alias';
// react-dom 包的路径
const pkgPath = resolvePkgPath(name);
const pkgdistPath = resolvePkgPath(name, true);
export default [
	// react-dom
	{
		input: `${pkgPath}/${module}`,
		output: [
			{
				file: `${pkgdistPath}/index.js`,
				name: 'index.js',
				format: 'umd'
			},
			{
				file: `${pkgdistPath}/client.js`,
				name: 'client.js',
				format: 'umd'
			}
		],
		plugins: [
			...getBaseRollupPlugins(),
			// webpack resolve alias 功能
			alias({
				entries: {
					hostConfig: `${pkgPath}/src/hostConfig.ts`
				}
			}),
			generatePackageJson({
				inputFolder: pkgPath,
				outputFolder: pkgdistPath,
				baseContents: ({ name, description, version }) => ({
					name,
					description,
					version,
					peerDependencies: {
						react: version
					},
					main: 'index.js'
				})
			})
		]
	}
];
