import * as fs from "node:fs";

export interface DirectoryReplacement {
  readonly staging: string;
  readonly destination: string;
}

export interface DirectoryTransactionOptions {
  readonly beforeInstall?: (index: number, replacement: DirectoryReplacement) => void;
}

/** Replaces a set of generated trees as one rollback-capable filesystem transaction. */
export const replaceDirectoriesTransactionally = (
  replacements: ReadonlyArray<DirectoryReplacement>,
  options: DirectoryTransactionOptions = {},
): void => {
  const suffix = `.previous-${process.pid}-${Date.now()}`;
  const state = replacements.map((replacement) => ({
    ...replacement,
    backup: `${replacement.destination}${suffix}`,
    hadDestination: fs.existsSync(replacement.destination),
    installed: false,
  }));
  for (const replacement of state) {
    if (!fs.existsSync(replacement.staging)) {
      throw new Error(`Missing staged directory: ${replacement.staging}`);
    }
    fs.rmSync(replacement.backup, { recursive: true, force: true });
  }
  try {
    for (const replacement of state) {
      if (replacement.hadDestination) fs.renameSync(replacement.destination, replacement.backup);
    }
    for (const [index, replacement] of state.entries()) {
      options.beforeInstall?.(index, replacement);
      fs.renameSync(replacement.staging, replacement.destination);
      replacement.installed = true;
    }
  } catch (error) {
    for (const replacement of state.toReversed()) {
      if (replacement.installed) {
        fs.rmSync(replacement.destination, { recursive: true, force: true });
      }
      if (replacement.hadDestination && fs.existsSync(replacement.backup)) {
        fs.renameSync(replacement.backup, replacement.destination);
      }
    }
    throw error;
  }
  for (const replacement of state) {
    fs.rmSync(replacement.backup, { recursive: true, force: true });
  }
};
