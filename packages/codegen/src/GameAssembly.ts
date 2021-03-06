import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import fetchGithubRelease from '@terascope/fetch-github-release';
import { stderr } from 'chalk';
import md5 from 'md5';
import { Il2JsonFile } from './Types';
import { IGameAssembly } from './IGameAssembly';
import { TypeFilter, OutputFilter } from './OutputFilter';

const findNodeModules: (opts?: { cwd?: string; relative?: boolean }) => string[] = require('find-node-modules');

function getCachePath(...subdirs: string[]) {
  const nodeModulesDir = path.resolve(findNodeModules()[0]);
  const cachePath = path.join(nodeModulesDir, '.cache', 'il2js', ...subdirs);
  if (!fs.existsSync(cachePath)) {
    fs.mkdirSync(cachePath, { recursive: true });
  }
  return cachePath;
}

async function getIl2CppDumperExePath() {
  const devConfig = path.join(__dirname, '../il2cpp.config.js');
  if (fs.existsSync(devConfig)) {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    return require(devConfig);
  }

  const cachePath = getCachePath();
  const il2CppDumperExePath = path.join(cachePath, 'il2CppDumper.exe');
  if (fs.existsSync(il2CppDumperExePath)) {
    return il2CppDumperExePath;
  }
  // download il2cpp release
  await fetchGithubRelease(
    'dnchattan',
    'Il2CppDumper',
    cachePath,
    ((release: any) => !release.prerelease) as any,
    (asset: { name: string }) => asset.name.endsWith('.zip'),
    false
  );
  return il2CppDumperExePath;
}

export function isGameAssembly(value: unknown): value is IGameAssembly {
  return !!(value as IGameAssembly).gameAssemblyDllPath;
}

export class GameAssembly implements IGameAssembly {
  public structs!: Il2JsonFile;
  public cached: boolean = false;
  private readonly outDir: string;

  constructor(
    readonly gameAssemblyDllPath: string,
    readonly globalMetadataPath: string,
    readonly version: string,
    private readonly filterOutputVisitor?: TypeFilter
  ) {
    this.outDir = getCachePath(version);
  }

  async load() {
    if (!this.structs) {
      await this.ensureDumpExists();
      this.structs = JSON.parse(await fs.promises.readFile(path.resolve(this.outDir, `structs.json`), 'utf8'));
      if (this.filterOutputVisitor) {
        this.structs.TypeInfoList = Array.from(
          new OutputFilter(this.structs).include(this.filterOutputVisitor).typesList.values()
        );
      }
    }
  }

  private async ensureDumpExists(): Promise<void> {
    const il2CppDumperExePath = await getIl2CppDumperExePath();
    const il2CppDumperDllPath = il2CppDumperExePath.replace('.exe', '.dll');
    const hashPath = `${il2CppDumperDllPath}.hash.txt`;
    const structsPath = path.join(this.outDir, 'structs.json');
    if (!fs.existsSync(this.outDir)) {
      fs.mkdirSync(this.outDir, { recursive: true });
    }

    const currentHash = md5(fs.readFileSync(il2CppDumperDllPath));
    if (fs.existsSync(structsPath)) {
      const lastHash = fs.existsSync(hashPath) ? fs.readFileSync(hashPath, 'utf8') : undefined;
      if (lastHash === currentHash) {
        console.log(`Re-using output (hash=${currentHash})`);
        this.cached = true;
        return;
      }
    }

    fs.writeFileSync(hashPath, currentHash, 'utf8');

    const cmd = [il2CppDumperExePath, this.gameAssemblyDllPath, this.globalMetadataPath, this.outDir]
      .map((part) => `"${part}"`)
      .join(' ');
    const result = await promisify(exec)(cmd);
    if (result.stderr) {
      console.error(stderr);
    } else {
      console.log(result.stdout);
    }
  }
}
