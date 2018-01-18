const rp = require("request-promise");
const { writeFileSync, mkdirSync, existsSync } = require("fs");
const { exec } = require("child_process");
const rimraf = require('rimraf');

const npmModules = ["express", "lodash"];
const earliestVersion = new Date("2016-01-01T00:00:00.000Z");

(async function() {
  for (const npmModule of npmModules) {
    const body = await rp({
      uri: `https://registry.npmjs.org/${npmModule}`,
      json: true
    });

    for (const version in body.time) {
      if (["modified", "created"].includes(version)) continue;
      if (new Date(body.time[version]) < earliestVersion) continue;
      console.log(`creating directory`, npmModule, version, body.time[version]);
      createDirectoryForVersion(npmModule, version);
    }
  }
})();

function createDirectoryForVersion(name, version) {
  const directory = `./packages/${name}@${version}`;
  if (!existsSync(directory)) {
    mkdirSync(directory);
  }
  const packageJson = {
    dependencies: {
      [name]: version
    }
  };
  writeFileSync(
    `${directory}/package.json`,
    JSON.stringify(packageJson, null, 2)
  );
  exec("npm install", { cwd: directory }, (error, sdtout, sdterr) => {
    if(error) {
      console.error(`failed to install dependencies for ${name}@${version}`, error);
      return;
    }
    console.info(`installed dependencies for ${name}@${version}`);
    rimraf.sync(`${directory}/node_modules`);
  });
}
