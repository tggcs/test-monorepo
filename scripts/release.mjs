// @ts-check
// @参考vue3: vue/core/scripts/release.mjs
import minimist from "minimist";
import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import semver from "semver";
import enquirer from "enquirer";
import { execa } from "execa";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const { prompt } = enquirer;
const currentVersion = createRequire(import.meta.url)(
  "../package.json"
).version;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = minimist(process.argv.slice(2));
const preId = args.preid || semver.prerelease(currentVersion)?.[0];
const isDryRun = args.dry;
// const skipTests = args.skipTests
// const skipBuild = args.skipBuild
const packages = fs
  .readdirSync(path.resolve(__dirname, "../packages"))
  .filter((p) => !p.endsWith(".ts") && !p.startsWith("."));

// const skippedPackages = []

const pkgTag = 'tgtest'

const versionIncrements = [
  "patch",
  "minor",
  "major",
  ...(preId ? ["prepatch", "preminor", "premajor", "prerelease"] : []),
];

const inc = (i) => semver.inc(currentVersion, i, preId);
// const bin = name => path.resolve(__dirname, '../node_modules/.bin/' + name)
const run = (bin, args, opts = {}) =>
  execa(bin, args, { stdio: "inherit", ...opts });
const dryRun = (bin, args, opts = {}) =>
  console.log(chalk.blue(`[dryrun] ${bin} ${args.join(" ")}`), opts);
const runIfNotDry = isDryRun ? dryRun : run;
const getPkgRoot = (pkg) => path.resolve(__dirname, "../packages/" + pkg);
const step = (msg) => console.log(chalk.cyan(msg));

async function main() {
  let targetVersion = args._[0];

  if (!targetVersion) {
    // no explicit version, offer suggestions
    // @ts-ignore
    const { release } = await prompt({
      type: "select",
      name: "release",
      message: "Select release type",
      choices: versionIncrements
        .map((i) => `${i} (${inc(i)})`)
        .concat(["custom"]),
    });

    if (release === "custom") {
      const result = await prompt({
        type: "input",
        name: "version",
        message: "Input custom version",
        initial: currentVersion,
      });
      // @ts-ignore
      targetVersion = result.version;
    } else {
      targetVersion = release.match(/\((.*)\)/)[1];
    }
  }

  if (!semver.valid(targetVersion)) {
    throw new Error(`invalid target version: ${targetVersion}`);
  }

  // @ts-ignore
  const { yes } = await prompt({
    type: "confirm",
    name: "yes",
    message: `Releasing v${targetVersion}. Confirm?`,
  });

  if (!yes) {
    return;
  }

  // run tests before release
  step("\nRunning tests...");
  // todo test

  // update all package versions and inter-dependencies
  step("\nUpdating cross dependencies...");
  updateVersions(targetVersion);

  // build all packages with types
  step("\nBuilding all packages...");
  // todo

  // generate changelog
  step("\nGenerating changelog...");
  // todo

  // update pnpm-lock.yaml
  step("\nUpdating lockfile...");
  // todo

  const { stdout } = await run("git", ["diff"], { stdio: "pipe" });
  if (stdout) {
    step("\nCommitting changes...");
    await runIfNotDry("git", ["add", "-A"]);
    await runIfNotDry("git", ["commit", "-m", `release: v${targetVersion}`]);
  } else {
    console.log("No changes to commit.");
  }

  // publish packages
  step("\nPublishing packages...");
  for (const pkg of packages) {
    await publishPackage(pkg, targetVersion, runIfNotDry);
  }

  return;

  // push to Git?
  step("\nPushing to Git?...");
  await runIfNotDry("git", ["tag", `v${targetVersion}`]);
  await runIfNotDry("git", ["push", "origin", `refs/tags/v${targetVersion}`]);
  await runIfNotDry("git", ["push"]);

  if (isDryRun) {
    console.log(`\nDry run finished - run git diff to see package changes.`);
  }
}

function updateVersions(version) {
  // 1. update root package.json
  updatePackage(path.resolve(__dirname, ".."), version);
  // 2. update all packages
  packages.forEach((p) => updatePackage(getPkgRoot(p), version));
}

function updatePackage(pkgRoot, version) {
  const pkgPath = path.resolve(pkgRoot, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  pkg.version = version;
  updateDeps(pkg, "dependencies", version);
  updateDeps(pkg, "peerDependencies", version);
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
}

function updateDeps(pkg, depType, version) {
  const deps = pkg[depType];
  if (!deps) return;
  Object.keys(deps).forEach((dep) => {
    if (dep.startsWith(pkgTag)) {
      console.log(
        chalk.yellow(`${pkg.name} -> ${depType} -> ${dep}@${version}`)
      );
      deps[dep] = version;
    }
  });
}

async function publishPackage(pkgName, version, runIfNotDry) {
  const pkgRoot = getPkgRoot(pkgName);
  const pkgPath = path.resolve(pkgRoot, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  if (pkg.private) {
    return;
  }

  let releaseTag = null;
  if (args.tag) {
    releaseTag = args.tag;
  } else if (version.includes("alpha")) {
    releaseTag = "alpha";
  } else if (version.includes("beta")) {
    releaseTag = "beta";
  } else if (version.includes("rc")) {
    releaseTag = "rc";
  }

  step(`Publishing ${pkgName}...`);
  try {
    await runIfNotDry(
      // note: use of yarn is intentional here as we rely on its publishing
      // behavior.
      "yarn",
      [
        "publish",
        "--new-version",
        version,
        ...(releaseTag ? ["--tag", releaseTag] : []),
        "--access",
        "public",
      ],
      {
        cwd: pkgRoot,
        stdio: "pipe",
      }
    );
    console.log(chalk.green(`Successfully published ${pkgName}@${version}`));
  } catch (e) {
    if (e.stderr.match(/previously published/)) {
      console.log(chalk.red(`Skipping already published: ${pkgName}`));
    } else {
      throw e;
    }
  }
}

main().catch((err) => {
  updateVersions(currentVersion);
  console.error(err);
});
