#!/usr/bin/env node
import fs from "fs";
import path from "path";

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

const getDeclaredClasses = (scssFile: string) => {
  const result: string[] = [];

  const fileContent = fs.readFileSync(scssFile, "utf-8");

  const classNames = fileContent.match(/\.([a-zA-Z][\w-]*)/g);

  if (classNames) {
    classNames.forEach((className: string) => {
      const formattedClassName = className.replace(".", "");
      result.push(formattedClassName);
    });
  }

  return result;
};

const getClassesPerTsxFile = (tsxFiles: string[]) => {
  const result: TsxClass[] = [];

  tsxFiles.forEach((tsxFilePath: string) => {
    const tsxContent = fs.readFileSync(tsxFilePath, "utf-8");

    const classNames = tsxContent.match(/(?<![a-zA-Z0-9_-])cn\.[\w-]+/g);

    if (classNames) {
      classNames.forEach((className: string) => {
        const formattedClassName = className.replace("cn.", "");
        const existingObject = result.find(
          (obj) => obj.tsxFile === tsxFilePath
        );
        if (existingObject) {
          existingObject.classes.push(formattedClassName);
        } else {
          result.push({ tsxFile: tsxFilePath, classes: [formattedClassName] });
        }
      });
    }
  });

  return result;
};

const getDuplicateClasses = (scssFile: string) => {
  const classes: string[] = [];

  const fileContent = fs.readFileSync(scssFile, "utf-8");

  const classNames = fileContent.match(/\.([a-zA-Z][\w-]*)/g);

  if (classNames) {
    classNames.forEach((className: string) => {
      const formattedClassName = className.replace(".", "");
      classes.push(formattedClassName);
    });
  }

  const uniqueClasses = new Set();
  const duplicateClasses = classes.filter((item) => {
    if (uniqueClasses.has(item)) return true;
    uniqueClasses.add(item);
    return false;
  });

  return Array.from(new Set(duplicateClasses));
};

console.log(`
             SCSS-INSPECTOR             
                                        
              ▒▒▒▒                      
         ▒▒▓▓██████▓▒                   
       ▒▓██████▓▓████▓▒▒▒▒▒▒▒▒          
      ▒▒▒▓████▓▓▓▓████▒▒▒▒▒▒▒▒▒▒▒▒      
     ▒▒▒▒▒▒▒▒▒███▓▒▒▒▒▒▒▒▒▓▓▓▓▓▓▒▒▒▒    
    ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓███████████▒▒▒▒▒  
    ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓███████▓▓▓▒▒▒▒▒▒▒ 
    ▒▒▒▒▒▒▒▒▒▓███▓▓▓▓▒▒▒▒▒▓▓▓▒▒▒▒▒▒▒▒▒▒▒
     ▒▒▒▒▒▒▒▒▓█████████▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒
       ▒▒▒▒▓▓▓▒▒▒▒▓▓▓█████████▓▓▓▒▒▒▒▒▒▒
        ▒▒▒▓▓▓▓▒▒▒▒▒▒▒▒▒▓▓▓████████▓▓▓▒▒
          ▒▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓██████▒
          ▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▓▓▓▒▒
          ▒▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ 
            ▒▒▓▓▒▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒        
                                        
             INSPECTING SCSS            
`);

const allTsxFiles = getAllTsxFiles(path.join(projectDirectory, "src"));
const tsxFilesWithScssImport = processTsxFiles(allTsxFiles);

tsxFilesWithScssImport.forEach(({ scssFile, tsxFiles }: FileObject) => {
  const declaredClasses = getDeclaredClasses(scssFile);
  const duplicateClasses = getDuplicateClasses(scssFile);
  const tsxClasses = getClassesPerTsxFile(tsxFiles);

  const mergedClasses = tsxClasses.reduce((acc: string[], curr) => {
    const combinedClasses = acc.concat(curr.classes);
    return Array.from(new Set(combinedClasses));
  }, []);

  const unusedClasses = declaredClasses.filter(
    (className) => !mergedClasses.includes(className)
  );

  if (unusedClasses.length) {
    warn(
      "Unused classes",
      "these classes exist in your .scss file but are not used in any .tsx files"
    );
    console.log(scssFile);
    console.log(Array.from(new Set(unusedClasses)));
    console.log("\n");
  }

  if (duplicateClasses.length) {
    warn(
      "Duplicate classes",
      "these classes are declared more than once in your .scss file"
    );
    console.log(scssFile);
    console.log(duplicateClasses);
    console.log("\n");
  }

  tsxClasses.forEach((usedClass) => {
    const nonExistingClasses = usedClass.classes.filter(
      (className: string) => !declaredClasses.includes(className)
    );
    if (nonExistingClasses.length) {
      warn(
        "Non-existing classes",
        "these classes are used in your .tsx file but do not exist in your .scss file"
      );
      console.log(usedClass.tsxFile);
      console.log(nonExistingClasses);
      console.log("\n");
    }
  });
});
