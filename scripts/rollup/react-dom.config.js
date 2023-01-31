import { getPackageJson, resolvePkgPath, getBaseRollupPlugins } from './utils';
const { name, module, peerDependencies } = getPackageJson('react-dom');
console.log(name, module, peerDependencies, 'aaa');
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
				name: 'ReactDOM',
				format: 'umd'
			},
			{
				file: `${pkgdistPath}/client.js`,
				name: 'client',
				format: 'umd'
			}
		],
		// 这时打包react-dom时不会将react代码打包 是react-reconciler react 同用一个数据共享层
		external: [...Object.keys(peerDependencies)],
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
	},
	// react-test-utils
	{
		input: `${pkgPath}/test-utils.ts`,
		output: [
			{
				file: `${pkgdistPath}/test-utils.js`,
				name: 'testUtils',
				format: 'umd'
			}
		],
		// 这时打包react-dom时不会将react代码打包 是react-reconciler react 同用一个数据共享层
		external: ['react-dom', 'react'],
		plugins: [getBaseRollupPlugins()]
	}
];
