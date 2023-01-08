import { readFileSync } from "fs";
import { writeFile } from "fs/promises";
import { basename, normalize, resolve } from "path";

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
export type TStoreBaseData = Record<string, Json>;
export type TStore<TStoreData extends TStoreBaseData> = {
  /** Return value from store by key */
  get<TKey extends keyof TStoreData>(key: TKey): TStoreData[TKey];
  /**
   * Save `value` to store for `key`.
   * Synchronously stores data to local in-memory storage.
   * Asynchronously updates storage on the file system.
   * @param key
   * @param value
   * @return `undefined`
   */
  set<TKey extends keyof TStoreData>(
    key: TKey,
    value: TStoreData[TKey]
  ): Promise<void>;
};

/**
 * @private
 * @return value of `--user-data-dir` command line argument
 */
function resolveUserDataPath() {
  const arg = process.argv.find((arg) => arg.startsWith("--user-data-dir="));
  if (!arg) {
    throw new Error(
      "Unable to find --user-data-dir with valid path in process.argv"
    );
  }
  const dir = arg.split("=")[1]?.trim();

  if (!dir) {
    throw new Error(
      "Unable to find --user-data-dir with valid path in process.argv"
    );
  }

  return normalize(dir);
}

/**
 * Resolve full path to store file by store name
 * @param storeName
 * @param dir custom store dir. By default in `electron.app.getPath('userData')`
 * @return Absolute path to file
 */
export function resolveStoreFilePath(storeName: string, dir: string) {
  return resolve(dir, `${storeName}.json`);
}

function loadFromFs(filePath: string) {
  try {
    const source = readFileSync(filePath, { encoding: "utf8" });
    return source.trim() ? source : "{}";
  } catch (e) {
    if (e instanceof Error && "code" in e && e.code === "ENOENT") {
      return "{}";
    }
    throw e;
  }
}

export function createStore<TStoreData extends TStoreBaseData>(
  storeName: string,
  userDataPath?: string
): TStore<TStoreData> {
  if (basename(storeName) !== storeName) {
    throw new Error(
      `${JSON.stringify(
        storeName
      )} is invalid store name. Store name should not contain any path fragments`
    );
  }

  const filePath = resolveStoreFilePath(
    storeName,
    userDataPath || resolveUserDataPath()
  );
  const _cachedStore = JSON.parse(loadFromFs(filePath));

  function getValue<TKey extends keyof TStoreData>(
    key: TKey
  ): TStoreData[TKey] {
    return _cachedStore[key];
  }

  function setValue<TKey extends keyof TStoreData>(
    key: TKey,
    value: TStoreData[TKey]
  ) {
    _cachedStore[key] = value;
    return writeFile(filePath, JSON.stringify(_cachedStore), {
      encoding: "utf8",
    });
  }

  return {
    get: getValue,
    set: setValue,
  };
}
