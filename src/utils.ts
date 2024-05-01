import fs from "fs";
import path from "path";
import postcss from "postcss";
import postcssScss from "postcss-scss";
import { COLOR_CODE, projectDirectory } from "./constants";
import { FileObject, TsxClass, WarnProps } from "./types";

export const sendWarning = ({ title, description, array }: WarnProps) => {
  console.warn(
    `${COLOR_CODE.YELLOW}WARNING:${COLOR_CODE.DEFAULT} ${title} ${COLOR_CODE.GRAY}- ${description}${COLOR_CODE.DEFAULT}`
  );
  console.log(array);
  console.log("\n");
};

export const getAllTsxFiles = (directory: string): string[] => {
  let tsxFiles: string[] = [];

  const items = fs.readdirSync(directory);

  items.forEach((item: string) => {
    const itemPath = path.join(directory, item);

    if (fs.statSync(itemPath).isDirectory()) {
      tsxFiles = tsxFiles.concat(getAllTsxFiles(itemPath));
    } else if (item.endsWith(".tsx")) {
      tsxFiles.push(itemPath);
    }
  });

  return tsxFiles;
};

export const processTsxFiles = (tsxFiles: string[]) => {
  const fileObjects: FileObject[] = [];

  tsxFiles.forEach((tsxFile: string) => {
    const fileContent = fs.readFileSync(tsxFile, "utf-8");
    const scssImportMatch = fileContent.match(
      /import\s+cn\s+from\s+['"](.+\.module\.scss)['"]/
    );
    if (scssImportMatch) {
      const scssFileName = scssImportMatch[1];
      const scssFilePath = path.join(
        `${path.join(projectDirectory, "src")}`,
        scssFileName
      );
      const existingObject = fileObjects.find(
        (obj) => obj.scssFile === scssFilePath
      );
      if (existingObject) {
        existingObject.tsxFiles.push(tsxFile);
      } else {
        fileObjects.push({ scssFile: scssFilePath, tsxFiles: [tsxFile] });
      }
    }
  });

  return fileObjects;
};

export const getScssClasses = async (scssFile: string) => {
  const scssClasses: string[] = [];

  const fileContent = fs.readFileSync(scssFile, "utf-8");

  const res = await postcss().process(fileContent, {
    from: scssFile,
    parser: postcssScss,
  });

  res.root.walkRules((rule) => {
    rule.selectors.forEach((selector) => {
      const selectors = selector.split(/[\s>+~:,]+/).map((s) => s.trim());
      selectors.forEach((s: string) => {
        if (s.startsWith(".") && /^[.#\[\w-]+$/.test(s)) {
          const sliced = s.slice(1);
          const classNames = sliced.split(".");
          scssClasses.push(...classNames);
        }
      });
    });
  });

  return scssClasses;
};

export const getTsxClasses = (tsxFiles: string[]) => {
  const tsxClasses: TsxClass[] = [];

  tsxFiles.forEach((tsxFilePath: string) => {
    const tsxContent = fs.readFileSync(tsxFilePath, "utf-8");

    const classNames = tsxContent.match(/(?<![a-zA-Z0-9_-])cn\.[\w-]+/g);

    if (classNames) {
      classNames.forEach((className: string) => {
        const formattedClassName = className.replace("cn.", "");
        const existingObject = tsxClasses.find(
          (obj) => obj.tsxFile === tsxFilePath
        );
        if (existingObject) {
          existingObject.classes.push(formattedClassName);
        } else {
          tsxClasses.push({
            tsxFile: tsxFilePath,
            classes: [formattedClassName],
          });
        }
      });
    }
  });

  return tsxClasses;
};

export const getDuplicateClasses = async (scssFile: string) => {
  const classes = await getScssClasses(scssFile);

  const uniqueClasses = new Set();
  const duplicateClasses = classes.filter((item) => {
    if (uniqueClasses.has(item)) return true;
    uniqueClasses.add(item);
    return false;
  });

  return duplicateClasses;
};
