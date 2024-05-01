#!/usr/bin/env node
import path from "path";
import { TITLE_MESSAGE, projectDirectory } from "./constants";
import {
  getAllTsxFiles,
  getDuplicateClasses,
  getScssClasses,
  getTsxClasses,
  sendWarning,
  processTsxFiles,
} from "./utils";

const main = async () => {
  console.log(TITLE_MESSAGE);

  const DUPLICATES: { scssFile: string; duplicates: string[] }[] = [];
  const NONEXISTING: { tsxFile: string; nonexisting: string[] }[] = [];
  const UNUSED: { scssFile: string; unused: string[] }[] = [];

  const allTsxFiles = getAllTsxFiles(path.join(projectDirectory, "src"));
  const tsxFilesWithScssImport = processTsxFiles(allTsxFiles);

  await Promise.all(
    tsxFilesWithScssImport.map(async ({ scssFile, tsxFiles }) => {
      const declaredClasses = await getScssClasses(scssFile);
      const duplicateClasses = await getDuplicateClasses(scssFile);
      const tsxClasses = getTsxClasses(tsxFiles);

      if (duplicateClasses.length) {
        DUPLICATES.push({
          scssFile,
          duplicates: Array.from(new Set(duplicateClasses)),
        });
      }

      tsxClasses.forEach((usedClass) => {
        const nonExistingClasses = usedClass.classes.filter(
          (className: string) => !declaredClasses.includes(className)
        );
        if (nonExistingClasses.length) {
          NONEXISTING.push({
            tsxFile: usedClass.tsxFile,
            nonexisting: Array.from(new Set(nonExistingClasses)),
          });
        }
      });

      const mergedClasses = tsxClasses.reduce((acc: string[], curr) => {
        const combinedClasses = acc.concat(curr.classes);
        return Array.from(new Set(combinedClasses));
      }, []);

      const unusedClasses = declaredClasses.filter(
        (className) => !mergedClasses.includes(className)
      );

      if (unusedClasses.length) {
        UNUSED.push({
          scssFile,
          unused: Array.from(new Set(unusedClasses)),
        });
      }
    })
  );

  if (DUPLICATES.length) {
    sendWarning({
      title: "Duplicate classes",
      description:
        "these classes are declared more than once in your .scss file",
      array: DUPLICATES,
    });
  }

  if (NONEXISTING.length) {
    sendWarning({
      title: "Non-existing classes",
      description:
        "these classes are used in your .tsx file but do not exist in your .scss file",
      array: NONEXISTING,
    });
  }

  if (UNUSED.length) {
    sendWarning({
      title: "Unused classes",
      description:
        "these classes exist in your .scss file but are not used in any .tsx files",
      array: UNUSED,
    });
  }
};

main();
