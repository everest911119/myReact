import { getPackageJson, resolvePkgPath, getBaseRollupPlugins } from './utils';
const { name, module, peerDependencies } = getPackageJson(
	'react-noop-renderer'
);
import generatePackageJson from 'rollup-plugin-generate-package-json';
import alias from '@rollup/plugin-alias';
// react-noop-renderer路径
const pkgPath = resolvePkgPath(name);
const pkgdistPath = resolvePkgPath(name, true);
const basePlugins = getBaseRollupPlugins({
	typescript: {
		// 排除react-dom在tsconfig中的打包流程
		exclude: ['./packages/react-dom/**/*'],
		tsconfigOverride: {
			compilerOptions: {
				paths: {
					hostConfig: [`./${name}/src/hostConfig.ts`]
				}
			}
		}
	}
});
export default [
	// react-noop-renderer
	{
		input: `${pkgPath}/${module}`,
		output: [
			{
				file: `${pkgdistPath}/index.js`,
				name: 'ReactNoopRenderer',
				format: 'umd'
			}
		],
		// 调度useEffect执行的调度器
		external: [...Object.keys(peerDependencies), 'scheduler'],
		plugins: [
			...getBaseRollupPlugins({
				typescript: {
					// 排除react-dom在tsconfig中的打包流程
					exclude: ['./packages/react-dom/**/*'],
					tsconfigOverride: {
						compilerOptions: {
							paths: {
								hostConfig: [`./${name}/src/hostConfig.ts`]
							}
						}
					}
				}
			}),
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
