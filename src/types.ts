export interface FileObject {
  scssFile: string;
  tsxFiles: string[];
}

export interface TsxClass {
  tsxFile: string;
  classes: string[];
}

export interface WarnProps {
  title: string;
  description: string;
  array: any[];
}
