import path from "node:path";

export const getProjectPaths = () => {
  const root = process.cwd();
  const dataDir = path.resolve(root, "data");
  const defaultsDir = path.resolve(root, "defaults");
  const backgroundsDir = path.join(dataDir, "backgrounds");

  return {
    root,
    dataDir,
    defaultsDir,
    backgroundsDir,
    configFile: path.join(dataDir, "config.json"),
    defaultConfigFile: path.join(defaultsDir, "config.json"),
  };
};
