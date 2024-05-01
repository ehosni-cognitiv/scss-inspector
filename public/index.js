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
const path_1 = __importDefault(require("path"));
const constants_1 = require("./constants");
const utils_1 = require("./utils");
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(constants_1.TITLE_MESSAGE);
    const DUPLICATES = [];
    const NONEXISTING = [];
    const UNUSED = [];
    const allTsxFiles = (0, utils_1.getAllTsxFiles)(path_1.default.join(constants_1.projectDirectory, "src"));
    const tsxFilesWithScssImport = (0, utils_1.processTsxFiles)(allTsxFiles);
    yield Promise.all(tsxFilesWithScssImport.map((_a) => __awaiter(void 0, [_a], void 0, function* ({ scssFile, tsxFiles }) {
        const declaredClasses = yield (0, utils_1.getScssClasses)(scssFile);
        const duplicateClasses = yield (0, utils_1.getDuplicateClasses)(scssFile);
        const tsxClasses = (0, utils_1.getTsxClasses)(tsxFiles);
        if (duplicateClasses.length) {
            DUPLICATES.push({
                scssFile,
                duplicates: Array.from(new Set(duplicateClasses)),
            });
        }
        tsxClasses.forEach((usedClass) => {
            const nonExistingClasses = usedClass.classes.filter((className) => !declaredClasses.includes(className));
            if (nonExistingClasses.length) {
                NONEXISTING.push({
                    tsxFile: usedClass.tsxFile,
                    nonexisting: Array.from(new Set(nonExistingClasses)),
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
        (0, utils_1.sendWarning)({
            title: "Duplicate classes",
            description: "these classes are declared more than once in your .scss file",
            array: DUPLICATES,
        });
    }
    if (NONEXISTING.length) {
        (0, utils_1.sendWarning)({
            title: "Non-existing classes",
            description: "these classes are used in your .tsx file but do not exist in your .scss file",
            array: NONEXISTING,
        });
    }
    if (UNUSED.length) {
        (0, utils_1.sendWarning)({
            title: "Unused classes",
            description: "these classes exist in your .scss file but are not used in any .tsx files",
            array: UNUSED,
        });
    }
});
main();
