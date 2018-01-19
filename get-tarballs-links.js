const fs = require("fs");
const tarballs = new Map();

for (const package of fs.readdirSync("./packages")) {
  for (const version of fs.readdirSync(`./packages/${package}`)) {
    if (fs.existsSync(`./packages/${package}/${version}/package-lock.json`)) {
      console.log(`processing package ${package} ${version} ...`);
      const packageLock = require(`./packages/${package}/${version}/package-lock.json`);
      _enumerateDependencies(packageLock.dependencies);
    }
  }
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
    results.push({ version, url });
  });
});

fs.writeFileSync("tarballs.json", JSON.stringify(results, null, 2));
