#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const [projectDirectory] = __dirname.split("/node_modules/");
const YELLOW_COLOR_CODE = "\x1b[33m";
const GRAY_COLOR_CODE = "\x1b[90m";
const RESET_COLOR_CODE = "\x1b[0m";
const warn = (title, description) => {
    console.warn(`${YELLOW_COLOR_CODE}WARNING:${RESET_COLOR_CODE} ${title} ${GRAY_COLOR_CODE}- ${description}${RESET_COLOR_CODE}`);
};
const getAllTsxFiles = (directory) => {
    let result = [];
    const items = fs_1.default.readdirSync(directory);
    items.forEach((item) => {
        const itemPath = path_1.default.join(directory, item);
        if (fs_1.default.statSync(itemPath).isDirectory()) {
            result = result.concat(getAllTsxFiles(itemPath));
        }
        else if (item.endsWith(".tsx")) {
            result.push(itemPath);
        }
    });
    return result;
};
const processTsxFiles = (tsxFiles) => {
    const result = [];
    tsxFiles.forEach((tsxFile) => {
        const fileContent = fs_1.default.readFileSync(tsxFile, "utf-8");
        const scssImportMatch = fileContent.match(/import\s+cn\s+from\s+['"](.+\.module\.scss)['"]/);
        if (scssImportMatch) {
            const scssFileName = scssImportMatch[1];
            const scssFilePath = path_1.default.join(`${path_1.default.join(projectDirectory, "src")}`, scssFileName);
            const existingObject = result.find((obj) => obj.scssFile === scssFilePath);
            if (existingObject) {
                existingObject.tsxFiles.push(tsxFile);
            }
            else {
                result.push({ scssFile: scssFilePath, tsxFiles: [tsxFile] });
            }
        }
    });
    return result;
};
const getDeclaredClasses = (scssFile) => {
    const result = [];
    const fileContent = fs_1.default.readFileSync(scssFile, "utf-8");
    const classNames = fileContent.match(/\.([a-zA-Z][\w-]*)/g);
    if (classNames) {
        classNames.forEach((className) => {
            const formattedClassName = className.replace(".", "");
            result.push(formattedClassName);
        });
    }
    return result;
};
const getClassesPerTsxFile = (tsxFiles) => {
    const result = [];
    tsxFiles.forEach((tsxFilePath) => {
        const tsxContent = fs_1.default.readFileSync(tsxFilePath, "utf-8");
        const classNames = tsxContent.match(/(?<![a-zA-Z0-9_-])cn\.[\w-]+/g);
        if (classNames) {
            classNames.forEach((className) => {
                const formattedClassName = className.replace("cn.", "");
                const existingObject = result.find((obj) => obj.tsxFile === tsxFilePath);
                if (existingObject) {
                    existingObject.classes.push(formattedClassName);
                }
                else {
                    result.push({ tsxFile: tsxFilePath, classes: [formattedClassName] });
                }
            });
        }
    });
    return result;
};
const getDuplicateClasses = (scssFile) => {
    const classes = [];
    const fileContent = fs_1.default.readFileSync(scssFile, "utf-8");
    const classNames = fileContent.match(/\.([a-zA-Z][\w-]*)/g);
    if (classNames) {
        classNames.forEach((className) => {
            const formattedClassName = className.replace(".", "");
            classes.push(formattedClassName);
        });
    }
    const uniqueClasses = new Set();
    const duplicateClasses = classes.filter((item) => {
        if (uniqueClasses.has(item))
            return true;
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
const allTsxFiles = getAllTsxFiles(path_1.default.join(projectDirectory, "src"));
const tsxFilesWithScssImport = processTsxFiles(allTsxFiles);
tsxFilesWithScssImport.forEach(({ scssFile, tsxFiles }) => {
    const declaredClasses = getDeclaredClasses(scssFile);
    const duplicateClasses = getDuplicateClasses(scssFile);
    const tsxClasses = getClassesPerTsxFile(tsxFiles);
    const mergedClasses = tsxClasses.reduce((acc, curr) => {
        const combinedClasses = acc.concat(curr.classes);
        return Array.from(new Set(combinedClasses));
    }, []);
    const unusedClasses = declaredClasses.filter((className) => !mergedClasses.includes(className));
    if (unusedClasses.length) {
        warn("Unused classes", "these classes exist in your .scss file but are not used in any .tsx files");
        console.log(scssFile);
        console.log(Array.from(new Set(unusedClasses)));
        console.log("\n");
    }
    if (duplicateClasses.length) {
        warn("Duplicate classes", "these classes are declared more than once in your .scss file");
        console.log(scssFile);
        console.log(duplicateClasses);
        console.log("\n");
    }
    tsxClasses.forEach((usedClass) => {
        const nonExistingClasses = usedClass.classes.filter((className) => !declaredClasses.includes(className));
        if (nonExistingClasses.length) {
            warn("Non-existing classes", "these classes are used in your .tsx file but do not exist in your .scss file");
            console.log(usedClass.tsxFile);
            console.log(nonExistingClasses);
            console.log("\n");
        }
    });
});
