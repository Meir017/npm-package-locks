const fs = require("fs");
const tarballs = new Map();

const glob = require('glob');

const packages = glob.sync('./packages/**/package-lock.json')
  .map(packageLockPath => {
    const packageJson = require(packageLockPath.replace('package-lock.json', 'package.json'));
    const name = Object.keys(packageJson.dependencies)[0];
    const version = packageJson.dependencies[name];
    return { name, version, lock: require(packageLockPath) };
  });

let i = 0;
for (const package of packages) {
  console.log(`[${++i}/${packages.length}] processing package ${package.name} ${package.version} ...`);
  _enumerateDependencies(package.lock.dependencies);
}

function _enumerateDependencies(dependencies) {
  for (const dependencyName in dependencies) {
    const dependency = dependencies[dependencyName];
    if (dependency.resolved) {
      const packageVersions = tarballs.get(dependencyName) || new Map();
      packageVersions.set(
        `${dependencyName}-${dependency.version}.tgz`,
        dependency.resolved
      );
      tarballs.set(dependencyName, packageVersions);
    }
    if (dependency.dependencies) {
      _enumerateDependencies(dependency.dependencies);
    }
  }
}

const results = [];
tarballs.forEach((versions, name) => {
  versions.forEach((version, url) => {
    results.push({
      version,
      url
    });
  });
});

fs.writeFileSync("tarballs.json", JSON.stringify(results, null, 2));