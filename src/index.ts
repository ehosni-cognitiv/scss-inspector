#!/usr/bin/env node
import fs from "fs";
import path from "path";
import postcss from "postcss";
import postcssScss from "postcss-scss";

const [projectDirectory] = __dirname.split("/node_modules/");

const YELLOW_COLOR_CODE = "\x1b[33m";
const GRAY_COLOR_CODE = "\x1b[90m";
const RESET_COLOR_CODE = "\x1b[0m";

interface FileObject {
  scssFile: string;
  tsxFiles: string[];
}

interface TsxClass {
  tsxFile: string;
  classes: string[];
}

const warn = (title: string, description: string) => {
  console.warn(
    `${YELLOW_COLOR_CODE}WARNING:${RESET_COLOR_CODE} ${title} ${GRAY_COLOR_CODE}- ${description}${RESET_COLOR_CODE}`
  );
};

const getAllTsxFiles = (directory: string): string[] => {
  let result: string[] = [];

  const items = fs.readdirSync(directory);

  items.forEach((item: string) => {
    const itemPath = path.join(directory, item);

    if (fs.statSync(itemPath).isDirectory()) {
      result = result.concat(getAllTsxFiles(itemPath));
    } else if (item.endsWith(".tsx")) {
      result.push(itemPath);
    }
  });

  return result;
};

const processTsxFiles = (tsxFiles: string[]) => {
  const result: FileObject[] = [];

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
      const existingObject = result.find(
        (obj) => obj.scssFile === scssFilePath
      );
      if (existingObject) {
        existingObject.tsxFiles.push(tsxFile);
      } else {
        result.push({ scssFile: scssFilePath, tsxFiles: [tsxFile] });
      }
    }
  });

  return result;
};

const getClasses = async (scssFile: string) => {
  const classes: string[] = [];

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
          classes.push(...classNames);
        }
      });
    });
  });

  return classes;
};

const getClassesPerTsxFile = (tsxFiles: string[]) => {
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

const getDuplicateClasses = async (scssFile: string) => {
  const classes = await getClasses(scssFile);

  const uniqueClasses = new Set();
  const duplicateClasses = classes.filter((item) => {
    if (uniqueClasses.has(item)) return true;
    uniqueClasses.add(item);
    return false;
  });

  return Array.from(new Set(duplicateClasses));
};

const TITLE_MESSAGE = `
                  SCSS-INSPECTOR                  
                                                  
                ▒▒▓▓██▓▒                          
           ▒▒▓▓█████████▓▒▒▒▒▒                    
         ▒▒███████████████▓▒▒▒▒▒▒▒▒▒▒             
        ▒▒▒███████▓▓▒▓█████▓▒▒▒▒▒▒▒▒▒▒▒▒▒         
       ▒▒▒▒▒▒▓▓▓▓█████▒▓██▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒      
      ▒▒▒▒▒▒▒▒▒▒▒▓███▓▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓███▓▒▒▒▒▒    
     ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓██████████████▓▒▒▒▒▒   
     ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓██████████▓▓▓▒▒▒▒▒▒▒▒▒ 
     ▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▓████▒▒▒▒▒▒▒▒▒▒▒▒▒
     ▒▒▒▒▒▒▒▒▒▒▒██████████▓▓▓▒▒▒▒▒▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
       ▒▒▒▒▒▒▒▒▒▒▓▓▓████████████▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
        ▒▒▒▒▒▓▓▓▓▒▒▒▒▒▒▓▓▓████████████▓▓▓▒▒▒▒▒▒▒▒▒
          ▒▒▒▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▓▓▓████████████▓▓▓▒▒▒
           ▒▒▒▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓██████████▓▒
             ▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▓▓▓████▓▒
            ▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒
             ▒▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  
               ▒▒▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒         
                      ▒▒▒▒▒▒▒▒▒▒▒▒▒▒              
                                                  
                  INSPECTING SCSS                 
`;

const main = async () => {
  console.log(TITLE_MESSAGE);

  const DUPLICATES: { scssFile: string; duplicates: string[] }[] = [];
  const NONEXISTING: { tsxFile: string; nonexisting: string[] }[] = [];
  const UNUSED: { scssFile: string; unused: string[] }[] = [];

  const allTsxFiles = getAllTsxFiles(path.join(projectDirectory, "src"));
  const tsxFilesWithScssImport = processTsxFiles(allTsxFiles);

  await Promise.all(
    tsxFilesWithScssImport.map(async ({ scssFile, tsxFiles }) => {
      const declaredClasses = await getClasses(scssFile);
      const duplicateClasses = await getDuplicateClasses(scssFile);
      const tsxClasses = getClassesPerTsxFile(tsxFiles);

      if (duplicateClasses.length) {
        DUPLICATES.push({
          scssFile,
          duplicates: duplicateClasses,
        });
      }

      tsxClasses.forEach((usedClass) => {
        const nonExistingClasses = usedClass.classes.filter(
          (className: string) => !declaredClasses.includes(className)
        );
        if (nonExistingClasses.length) {
          NONEXISTING.push({
            tsxFile: usedClass.tsxFile,
            nonexisting: nonExistingClasses,
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
    warn(
      "Duplicate classes",
      "these classes are declared more than once in your .scss file"
    );
    console.log(DUPLICATES);
    console.log("\n");
  }

  if (NONEXISTING.length) {
    warn(
      "Non-existing classes",
      "these classes are used in your .tsx file but do not exist in your .scss file"
    );
    console.log(NONEXISTING);
    console.log("\n");
  }

  if (UNUSED.length) {
    warn(
      "Unused classes",
      "these classes exist in your .scss file but are not used in any .tsx files"
    );
    console.log(UNUSED);
    console.log("\n");
  }
};
main();
