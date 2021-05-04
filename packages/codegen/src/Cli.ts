import caporal from 'caporal';
import fs from 'fs';
import path from 'path';
import { terminal, Terminal } from 'terminal-kit';
import { codegen } from './Codegen';
import type { Il2JsConfigFile } from './Il2JsConfigFile';
import type { Il2CppTypeDefinitionInfo } from './Types';

interface RawPackageJson {
  version: string;
}

interface CliArguments {
  config: string;
  optimize?: boolean;
  force?: boolean;
}

async function generate(_: never, originalArgs: Record<string, any>, _logger: ReturnType<typeof caporal.logger>) {
  // eslint-disable-next-line no-restricted-syntax
  for (const key in originalArgs) {
    if (typeof originalArgs[key] === 'boolean') {
      if (originalArgs[key] === true) {
        if (/no[A-Z]/.exec(key)) {
          // eslint-disable-next-line no-param-reassign
          originalArgs[key] = !originalArgs[key];
        }
      } else {
        // eslint-disable-next-line no-param-reassign
        delete originalArgs[key];
      }
    }
  }
  const args: CliArguments = originalArgs as any;

  const configPath = path.isAbsolute(args.config) ? args.config : path.join(process.cwd(), args.config);

  // eslint-disable-next-line import/no-dynamic-require, global-require
  const config = require(configPath) as Il2JsConfigFile;
  if (args.force !== undefined) {
    config.force = args.force;
  }
  if (args.optimize !== undefined) {
    config.optimize = args.optimize;
  }

  let progress: Terminal.ProgressBarController | undefined;
  let lastItem: string | undefined;
  function progressCallback(n: number, m: number, label: string, item?: Il2CppTypeDefinitionInfo) {
    if (!progress) {
      progress = terminal.progressBar({
        width: Math.min(process.stdout.columns - 10, 120),
        title: 'Processing input structs',
        eta: true,
        percent: true,
        syncMode: false,
        items: m,
        inline: true,
      });
    }

    if (lastItem) {
      progress.itemDone(lastItem);
      lastItem = undefined;
    }
    lastItem = item ? item.Type.TypeName : label;
    if (lastItem) {
      progress.startItem(lastItem);
    }
    progress.update({ progress: n / m, items: m });
  }
  await codegen(config, { progressCallback });
  if (progress) {
    progress.stop();
  }
  terminal('\n');
}

const { version } = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')) as RawPackageJson;

const cli = caporal.version(version).description('Il2Js codegen tool');

cli
  .command('generate', 'Generates code using the provided configuration')
  .option(
    '--config <config>',
    'Path to configuration file',
    caporal.STRING,
    path.join(process.cwd(), '.il2js.config.js')
  )
  .option('--force', 'Force build without caching')
  .option('--optimize', 'Enable optimization', caporal.BOOLEAN)
  .option('--no-optimize', 'Disable optimization', caporal.BOOLEAN)
  .action(generate as any);
cli.parse(process.argv);
