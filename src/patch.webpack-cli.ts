import chalk from "chalk";
import { parse } from "@babel/parser";
import generate from "@babel/generator";

import { getMatchedFiles, getMatchedHashes, getMatchedTargets } from "./specs";
import { targetPatch, getTargets, getTargetsHash } from "./adapter";

export const patch = (code: string, filename: string) => {
  const wpc = process.env.AIRPACK_WPC;
  const wpcVersion = process.env.AIRPACK_WPC_VERSION!;
  const files = getMatchedFiles(wpcVersion);
  const patchIndex = files.indexOf(filename);

  const target = getMatchedTargets(wpcVersion)[patchIndex];

  if (!target) {
    console.error(chalk`[airpack]: {red No targets defined in specs for file "${filename}"}`);
    process.exit()
  }

  const ast = parse(code);
  const pTargets = getTargets(ast, target);

  if (!pTargets.length) {
    console.error(chalk`[airpack]: {red No targets matched to the target "${target}"}`);
    process.exit()
  }

  const hash = getMatchedHashes(wpcVersion)[patchIndex];

  if (!hash) {
    console.error(chalk`[airpack]: {red No hash defined in specs for the target "${target}"}`);
    process.exit()
  }

  const pTargetsHash = getTargetsHash(pTargets);

  if (pTargetsHash !== hash) {
    console.error(chalk`[airpack]: {red Hash not matched to the target "${target}"}`);
    console.error(chalk`[airpack]: {green ${pTargetsHash}} {gray <-} {red ${hash}}`);
    process.exit()
  }

  targetPatch[target](pTargets);

  const { code: newCode } = generate(ast, { comments: false });

  return newCode;
};
