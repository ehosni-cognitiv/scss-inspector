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
exports.getDuplicateClasses = exports.getTsxClasses = exports.getScssClasses = exports.processTsxFiles = exports.getAllTsxFiles = exports.sendWarning = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const postcss_1 = __importDefault(require("postcss"));
const postcss_scss_1 = __importDefault(require("postcss-scss"));
const constants_1 = require("./constants");
const sendWarning = ({ title, description, array }) => {
    console.warn(`${constants_1.COLOR_CODE.YELLOW}WARNING:${constants_1.COLOR_CODE.DEFAULT} ${title} ${constants_1.COLOR_CODE.GRAY}- ${description}${constants_1.COLOR_CODE.DEFAULT}`);
    console.log(array);
    console.log("\n");
};
exports.sendWarning = sendWarning;
const getAllTsxFiles = (directory) => {
    let tsxFiles = [];
    const items = fs_1.default.readdirSync(directory);
    items.forEach((item) => {
        const itemPath = path_1.default.join(directory, item);
        if (fs_1.default.statSync(itemPath).isDirectory()) {
            tsxFiles = tsxFiles.concat((0, exports.getAllTsxFiles)(itemPath));
        }
        else if (item.endsWith(".tsx")) {
            tsxFiles.push(itemPath);
        }
    });
    return tsxFiles;
};
exports.getAllTsxFiles = getAllTsxFiles;
const processTsxFiles = (tsxFiles) => {
    const fileObjects = [];
    tsxFiles.forEach((tsxFile) => {
        const fileContent = fs_1.default.readFileSync(tsxFile, "utf-8");
        const scssImportMatch = fileContent.match(/import\s+cn\s+from\s+['"](.+\.module\.scss)['"]/);
        if (scssImportMatch) {
            const scssFileName = scssImportMatch[1];
            const scssFilePath = path_1.default.join(`${path_1.default.join(constants_1.projectDirectory, "src")}`, scssFileName);
            const existingObject = fileObjects.find((obj) => obj.scssFile === scssFilePath);
            if (existingObject) {
                existingObject.tsxFiles.push(tsxFile);
            }
            else {
                fileObjects.push({ scssFile: scssFilePath, tsxFiles: [tsxFile] });
            }
        }
    });
    return fileObjects;
};
exports.processTsxFiles = processTsxFiles;
const getScssClasses = (scssFile) => __awaiter(void 0, void 0, void 0, function* () {
    const scssClasses = [];
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
                    scssClasses.push(...classNames);
                }
            });
        });
    });
    return scssClasses;
});
exports.getScssClasses = getScssClasses;
const getTsxClasses = (tsxFiles) => {
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
exports.getTsxClasses = getTsxClasses;
const getDuplicateClasses = (scssFile) => __awaiter(void 0, void 0, void 0, function* () {
    const classes = yield (0, exports.getScssClasses)(scssFile);
    const uniqueClasses = new Set();
    const duplicateClasses = classes.filter((item) => {
        if (uniqueClasses.has(item))
            return true;
        uniqueClasses.add(item);
        return false;
    });
    return duplicateClasses;
});
exports.getDuplicateClasses = getDuplicateClasses;
