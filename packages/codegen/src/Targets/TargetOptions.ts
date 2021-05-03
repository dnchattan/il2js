import type { TypeVisitors } from './TypeVisitors';

export interface TargetOptions {
  imageGlobs?: string[];
  namespaceGlobs?: string[];
  typeNameGlobs?: string[];
  rootNamespace: string;
  visitors?: TypeVisitors;
}
