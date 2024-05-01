#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const postcss_1 = __importDefault(require("postcss"));
const postcss_scss_1 = __importDefault(require("postcss-scss"));
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
const getClasses = (scssFile) => __awaiter(void 0, void 0, void 0, function* () {
    const classes = [];
    const fileContent = fs_1.default.readFileSync(scssFile, "utf-8");
    const res = yield (0, postcss_1.default)().process(fileContent, {
        from: scssFile,
        parser: postcss_scss_1.default,
    });
    res.root.walkRules((rule) => {
        rule.selectors.forEach((selector) => {
            const selectors = selector.split(/[\s>+~:,]+/).map((s) => s.trim());
            selectors.forEach((s) => {
                if (s.startsWith(".") && /^[.#\[\w-]+$/.test(s)) {
                    const sliced = s.slice(1);
                    const classNames = sliced.split(".");
                    classes.push(...classNames);
                }
            });
        });
    });
    return classes;
});
const getClassesPerTsxFile = (tsxFiles) => {
    const tsxClasses = [];
    tsxFiles.forEach((tsxFilePath) => {
        const tsxContent = fs_1.default.readFileSync(tsxFilePath, "utf-8");
        const classNames = tsxContent.match(/(?<![a-zA-Z0-9_-])cn\.[\w-]+/g);
        if (classNames) {
            classNames.forEach((className) => {
                const formattedClassName = className.replace("cn.", "");
                const existingObject = tsxClasses.find((obj) => obj.tsxFile === tsxFilePath);
                if (existingObject) {
                    existingObject.classes.push(formattedClassName);
                }
                else {
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
const getDuplicateClasses = (scssFile) => __awaiter(void 0, void 0, void 0, function* () {
    const classes = yield getClasses(scssFile);
    const uniqueClasses = new Set();
    const duplicateClasses = classes.filter((item) => {
        if (uniqueClasses.has(item))
            return true;
        uniqueClasses.add(item);
        return false;
    });
    return Array.from(new Set(duplicateClasses));
});
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
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(TITLE_MESSAGE);
    const DUPLICATES = [];
    const NONEXISTING = [];
    const UNUSED = [];
    const allTsxFiles = getAllTsxFiles(path_1.default.join(projectDirectory, "src"));
    const tsxFilesWithScssImport = processTsxFiles(allTsxFiles);
    yield Promise.all(tsxFilesWithScssImport.map((_a) => __awaiter(void 0, [_a], void 0, function* ({ scssFile, tsxFiles }) {
        const declaredClasses = yield getClasses(scssFile);
        const duplicateClasses = yield getDuplicateClasses(scssFile);
        const tsxClasses = getClassesPerTsxFile(tsxFiles);
        if (duplicateClasses.length) {
            DUPLICATES.push({
                scssFile,
                duplicates: duplicateClasses,
            });
        }
        tsxClasses.forEach((usedClass) => {
            const nonExistingClasses = usedClass.classes.filter((className) => !declaredClasses.includes(className));
            if (nonExistingClasses.length) {
                NONEXISTING.push({
                    tsxFile: usedClass.tsxFile,
                    nonexisting: nonExistingClasses,
                });
            }
        });
        const mergedClasses = tsxClasses.reduce((acc, curr) => {
            const combinedClasses = acc.concat(curr.classes);
            return Array.from(new Set(combinedClasses));
        }, []);
        const unusedClasses = declaredClasses.filter((className) => !mergedClasses.includes(className));
        if (unusedClasses.length) {
            UNUSED.push({
                scssFile,
                unused: Array.from(new Set(unusedClasses)),
            });
        }
    })));
    if (DUPLICATES.length) {
        warn("Duplicate classes", "these classes are declared more than once in your .scss file");
        console.log(DUPLICATES);
        console.log("\n");
    }
    if (NONEXISTING.length) {
        warn("Non-existing classes", "these classes are used in your .tsx file but do not exist in your .scss file");
        console.log(NONEXISTING);
        console.log("\n");
    }
    if (UNUSED.length) {
        warn("Unused classes", "these classes exist in your .scss file but are not used in any .tsx files");
        console.log(UNUSED);
        console.log("\n");
    }
});
main();
