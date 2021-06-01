/*
 * @Author: your name
 * @Date: 2021-04-08 13:41:59
 * @LastEditTime: 2021-06-01 19:34:54
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /fe-otms-monitor/src/containers/Demo/index.tsx
 */
import * as React from 'react';
import { Upload, Modal, Button } from 'antd';
const rewritePattern = require('regexpu-core');
const { generateRegexpuOptions } = require('@babel/helper-create-regexp-features-plugin/lib/util');

const { RegExp } = window;
try {
  // eslint-disable-next-line no-new
  new RegExp('a', 'u');
} catch (err) {
  (window  as any).RegExp = (pattern: any, flags: any) => {
    if (flags && flags.includes('u')) {
      return new RegExp(rewritePattern(pattern, flags, generateRegexpuOptions({flags, pattern})));
    }
    return new RegExp(pattern, flags);
  };
  (window.RegExp as any).prototype = RegExp;
}
const ExcelJS = require('exceljs/dist/exceljs.bare');
const Papa = require('papaparse');
const jschardet = require('jschardet');
const atob = require('atob');

const { Dragger } = Upload as any;
/**类型定义 */
interface IProps {
    sheetProps?: ISheetProps;
    handleMoreValidate?: (rows: any, worksheet?: any) => string,
    dragProps?: object,
    style?: object,
    children?: React.ReactNode | string,
    uploadToolTip?: React.ReactNode | string,
    resultTitle?: string,
    type?: 'excel' | 'csv', // 默认excel
};
type IType = 'list' | 'number' | 'text' | 'custome'; 
interface ISheetProps {
   [key: string]: {
        colTitle: string;
        type: IType,
        allowBlank: boolean;
        valueErrorMessage?: string;
        formulae?: any;
        isUnique?: boolean;
   }
};
interface ICellErrorInfo {
    cellIndex: string;
    errorMessage: string;
}

/**
 * 工具函数
 * @returns 
 */
function getEN() {
    var arr = [null] as any;
    for(var i = 65; i < 91; i++){
        arr.push(String.fromCharCode(i));
    }
    return arr;
}

function isInteger(value: number) {
    return value % 1 === 0;
}

function dataValidation(value: any, validation: any) {
    if (!validation) {
        return true;
    }
    if (!validation.allowBlank && !String(value)) {
        return false;
    }
    //  默认规则
    if (value && validation.type === 'list' && !validation.formulae.includes(String(value))) {
        return false;
    }
    if (value && validation.type === 'number' && !isInteger(Number(value))) {
        return false;
    }
    if (value && validation.type === 'custom' && !validation.formulae.test(value)) {
        return false;
    }
    if (value && validation.type === 'text' && validation.formulae && value.length > validation.formulae) {
        return false;
    }
    return true;
}

const A2Zarray = getEN();

function checkEncoding(base64Str: any) {
    // 这种方式得到的是一种二进制串
    let str = atob(base64Str.split(';base64,')[1]);
    // console.log(str);
    // 要用二进制格式
    let encoding = jschardet.detect(str);
    encoding = encoding.encoding;
    // console.log( encoding );
    if (encoding === 'windows-1252') {
      // 有时会识别错误（如UTF8的中文二字）
      encoding = 'ANSI';
    }
    return encoding;
}

async function getFileReaderResult(file: any) {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader()
        fileReader.readAsDataURL(file);
        fileReader.onload = (e: any) => {
            const result = e.target.result;
            const encoding = checkEncoding(result);
            resolve({
                file,
                encoding,
            });
        }
    });
}

async function getJsonFromCsv(file: any) {
    const data = await getFileReaderResult(file) as any;
    return new Promise((resolve, reject) => {
        Papa.parse(data.file, {
            encoding: data.encoding,
            complete: function(results: any) {
                resolve(results.data);
            }
        });
    });
}

/**
 * 组件
 * @param props 
 * @returns 
 */
const Demo = (props: IProps) => {
    const { sheetProps, type='excel' } = props;
    const [modal, setModal] = React.useState({
        visible: false,
        resultContent: '',
    });
    const dragProps = {
        name: 'file',
        multiple: true,
        accept: '.csv,.xlsx',
        action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
        beforeUpload: async (file: any) => {
            if (!sheetProps) {
                return true;
            }
           
            return new Promise(async (resolve, reject) => {
                if (type === 'csv') {
                    const json = await getJsonFromCsv(file) as any;
                    const csvInfo = {
                        bodyErrorInfo: [],
                        titleError: [],
                        isEmptyCsv: false,
                        extraErrorInfo: '',
                    } as any;
                    // isEmpty
                    if (!json.length) {
                        csvInfo.isEmptyCsv = true;
                        // setModal({
                        //     visible: true,
                        //     resultContent: `${modal.resultContent}\n上传为空表，请检查`,
                        // });
                        // reject(false);
                    }
                    // isErrorTitle
                    Object.values(sheetProps).forEach((item: any, index: number) => {
                        if (item.colTitle !== json[0][index]) {
                            csvInfo.titleError = (csvInfo.titleError || []).concat(index);
                        }
                    });
                    // isErrorbody
                    json.forEach((item: any, index: number) => {
                        if (index) {
                            item.forEach((value: any, i: number) => {
                                if (!dataValidation(value, sheetProps[A2Zarray[i + 1]])) {
                                    csvInfo.bodyErrorInfo.push({
                                        cellIndex: `${index + 1}行 ${A2Zarray[i + 1]}列`,
                                        errorMessage: sheetProps[A2Zarray[i + 1]].valueErrorMessage || '值为空或类型错误，请检查',
                                    });
                                };
                            });
                        }
                    });
                    // extraInfo
                    if (props.handleMoreValidate) {
                        csvInfo.extraErrorInfo = props.handleMoreValidate(json);
                    }
                    // 来吧，展示
                    let errorInfo = '';
                    if (csvInfo.isEmptyCsv) {
                        errorInfo += '上传为空表，请检查';
                    }
                    if (csvInfo.titleError.length) {
                        errorInfo += `\n列标题错误，请检查${csvInfo.titleError}`;
                    }
                    if (csvInfo.bodyErrorInfo.length) {
                        errorInfo += `\n内容错误，错误信息如下：\n${csvInfo.bodyErrorInfo.map((i: any) => (`${i.cellIndex}:${i.errorMessage}\n`)).join('')}`;
                    }
                    if (csvInfo.extraErrorInfo) {
                        errorInfo += `\n${csvInfo.extraErrorInfo}`;
                    }
                    if (errorInfo) {
                        setModal({
                            visible: true,
                            resultContent: errorInfo,
                        });
                        reject(false);
                    }
                    resolve(true);
                    return;
                }
                // 以下是对excel的处理
                // const buffer = file.arrayBuffer();
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.load(file);
                let sheetInfo = {} as any;
                workbook.eachSheet(async function(worksheet: any, sheetId: any) {
                    // 先获取当前sheet中的有效数据
                    // 校验列标题和列号是不是正确的
                    // 遍历body每一行数据，校验每个cell
                    sheetInfo[sheetId] = {
                        name: worksheet.name,
                    };
                    // let breakRowNumber = null as any;
                    let errorTitleIndex = [] as any;
                    let isEmptySheet = false;
                    // 检查主规则
                    let bodyErrorInfo: ICellErrorInfo[] = [];
                    worksheet.eachRow({ includeEmpty: true }, function(row: any, rowNumber: any) {
                        // 检查头部
                        if (rowNumber === 1) {
                            row.values.forEach((title: string, index: number) => {
                                if (index && sheetProps[A2Zarray[index]] && sheetProps[A2Zarray[index]].colTitle !== title) {
                                    errorTitleIndex.push(A2Zarray[index]);
                                }
                            });
                        }
                        // 检查是否是空表
                        if (rowNumber === 1 && !row.values.length) {
                            isEmptySheet = true;
                        }
                        // 截取有效数据部分
                        if (rowNumber > 1) {
                            row.values.forEach((value: any, index: number) => {
                                const colIndex = A2Zarray[index];
                                const cellIndex = `${rowNumber}行 ${colIndex}列`;
                                if (!dataValidation(value, sheetProps[colIndex])) {
                                    bodyErrorInfo.push({
                                        cellIndex,
                                        errorMessage: sheetProps[colIndex].valueErrorMessage || '值为空或类型错误，请检查',
                                    });
                                };
                            });
                        }
                    });
                    // 检查唯一性
                    /////////////// ......
                    // 检查额外逻辑的处理
                    let extraErrorInfo: string = '';
                    if (props.handleMoreValidate) {
                        const rows = worksheet._rows.map((e: any) => Array.isArray(e.values) && e.values.slice(1));
                        extraErrorInfo = props.handleMoreValidate(rows, worksheet);
                    }
                    sheetInfo[sheetId] = {
                        ...sheetInfo[sheetId],
                        isEmptySheet,
                        // breakRowNumber,
                        errorTitleIndex,
                        bodyErrorInfo,
                        extraErrorInfo,
                    };
                });
                let errorInfo = '';
                // 对结果进行提示
                Object.keys(sheetInfo).forEach((key: string | number) => {
                    if (sheetInfo[key].isEmptySheet) {
                        errorInfo +=  `${sheetInfo[key].name}为空表`;
                    }
                    if (sheetInfo[key].errorTitleIndex.length) {
                        errorInfo +=  `\n${sheetInfo[key].name}表标题错误，请检查，列如下：\n${sheetInfo[key].errorTitleIndex}`;
                    }
                    if (sheetInfo[key].bodyErrorInfo.length) {
                        errorInfo +=  `\n${sheetInfo[key].name}表内容错误，请检查，单元格如下：\n${sheetInfo[key].bodyErrorInfo.map((i: any) => (`${i.cellIndex}:${i.errorMessage}\n`)).join('')}`;
                    }
                    if (sheetInfo[key].extraErrorInfo) {
                        errorInfo +=  `\n${sheetInfo[key].extraErrorInfo}`;
                    }
                });
                if (errorInfo) {
                    setModal({
                        visible: true,
                        resultContent: errorInfo,
                    });
                    reject(false);
                }
                resolve(true);
                return;
            });
        },
        onChange(info: any) {
          const { status } = info.file;
          if (status !== 'uploading') {
            // console.log(info.file, info.fileList);
          }
          if (status === 'done') {
            // message.success(`${info.file.name} file uploaded successfully.`);
          } else if (status === 'error') {
            // message.error(`${info.file.name} file upload failed.`);
          }
        },
        ...props.dragProps || {},
    };

    const handleCancelModal = () => {
        setModal({
            visible: false,
            resultContent: '',
        });
    }
    
    return (
        <div style={props.style || {}}>
            { props.children || null }
            <Modal
              style={{ whiteSpace: 'pre-line' }}
              visible={modal.visible} title={props.resultTitle || '校验结果'}
              footer = { <Button  type = "primary" onClick = { handleCancelModal }>确定</Button> }
            >
                {
                    modal.resultContent
                }
            </Modal>
            <Dragger {...dragProps}>
                <p>
                    { props.uploadToolTip || 'Support CSV and EXCEL file for analysis' }
                </p>
            </Dragger>
        </div>
    );
}

export default Demo;
