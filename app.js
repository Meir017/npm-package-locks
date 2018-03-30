const rp = require("request-promise");
const { writeFileSync, mkdirSync, existsSync } = require("fs");
const { exec, execSync } = require("child_process");
const rimraf = require("rimraf");

const { npmModules, earliestVersion } = require("./config");

(async function() {
  if (!existsSync("./packages")) {
    mkdirSync("./packages");
  }
  for (const npmModule of npmModules) {
    const body = await rp({
      uri: `https://registry.npmjs.org/${npmModule.replace('/', '%2F')}`,
      json: true
    });

    for (const version in body.time) {
      if (["modified", "created"].includes(version)) continue;
      if (version.toUpperCase() !== version) continue;
      if (new Date(body.time[version]) < earliestVersion) continue;
      createDirectoryForVersion(npmModule, version, body.time[version]);
    }
  }
})();

function ensureDirectoryExists(directory) {
  if (!existsSync(directory)) {
    mkdirSync(directory);
    console.log(`creating directory`, directory);
  }
}

function createDirectoryForVersion(name, version, time) {
  const baseDirectory = `./packages/${name}`;
  const directory = `${baseDirectory}/${version}`;
  if(name.startsWith('@')) {
    const [scope] = name.split('/');
    ensureDirectoryExists(`./packages/${scope}`);    
  }
  ensureDirectoryExists(baseDirectory);
  ensureDirectoryExists(directory);

  const packageJson = {
    dependencies: {
      [name]: version
    }
  };
  if (existsSync(`${directory}/package-lock.json`)) {
    console.log(`skipping package ${name}@${version}...`);
    return;
  }
  console.log(`processing package ${name}@${version}...`);
  writeFileSync(
    `${directory}/package.json`,
    JSON.stringify(packageJson, null, 2)
  );

  npmInstall(true);

  function npmInstall(sync) {
    if (sync) {
      try {
        execSync("npm install", { cwd: directory });
        console.info(`installed dependencies for ${name}@${version}`);
        rimraf.sync(`${directory}/node_modules`);
      } catch (error) {
        console.error(`failed to install dependencies for ${name}@${version}`);
      }
    } else {
      exec("npm install", { cwd: directory }, (error, sdtout, sdterr) => {
        if (error) {
          console.error(
            `failed to install dependencies for ${name}@${version}`,
            error
          );
          return;
        }
        console.info(`installed dependencies for ${name}@${version}`);
        rimraf.sync(`${directory}/node_modules`);
      });
    }
  }
}
