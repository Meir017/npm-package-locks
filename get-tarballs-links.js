const fs = require("fs");
const packages = fs.readdirSync("./packages");

const tarballs = new Map();

for (const package of packages) {
  if (fs.existsSync(`./packages/${package}/package-lock.json`)) {
    console.log(`processing package ${package}...`);
    const packageLock = require(`./packages/${package}/package-lock.json`);
    _enumerateDependencies(packageLock.dependencies);
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
