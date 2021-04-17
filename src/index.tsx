/*
 * @Author: your name
 * @Date: 2021-04-08 13:41:59
 * @LastEditTime: 2021-04-17 14:07:14
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /fe-otms-monitor/src/containers/Demo/index.tsx
 */
import * as React from 'react';
import { Upload, Modal } from 'antd';
import * as ExcelJS from 'exceljs/dist/exceljs.bare';

const { Dragger } = Upload as any;
/**类型定义 */
interface IProps {
    sheetProps: ISheetProps;
    handleMoreValidate?: (worksheet: any) => string,
    dragProps?: object,
    style?: object,
    children?: React.ReactNode | string,
    uploadToolTip?: React.ReactNode | string,
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
    if (validation.type === 'list' && !validation.formulae.includes(value)) {
        return false;
    }
    if (validation.type === 'number' && !isInteger(Number(value))) {
        return false;
    }
    if (validation.type === 'custom' && !validation.formulae.test(value)) {
        return false;
    }
    if (validation.type === 'text' && validation.formulae && value.length > validation.formulae) {
        return false;
    }
    return true;
}

const A2Zarray = getEN();
/**
 * 组件
 * @param props 
 * @returns 
 */
const Demo = (props: IProps) => {
    const { sheetProps } = props;
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
           
            return new Promise(async (resolve, reject) => {
                console.log('file', file.arrayBuffer());
                const buffer = file.arrayBuffer();
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.load(buffer);
                let sheetInfo = {} as any;
                workbook.eachSheet(async function(worksheet: any, sheetId: any) {
                    // 先获取当前sheet中的有效数据
                    // 校验列标题和列号是不是正确的
                    // 遍历body每一行数据，校验每个cell
                    sheetInfo[sheetId] = {
                        name: worksheet.name,
                    };
                    
                    console.log(worksheet, sheetId);
                    // let breakRowNumber = null as any;
                    let errorTitleIndex = [] as any;
                    let isEmptySheet = false;
                    // 检查主规则
                    let bodyErrorInfo: ICellErrorInfo[] = [];
                    worksheet.eachRow({ includeEmpty: true }, function(row: any, rowNumber: any) {
                        console.log('Row ' + rowNumber + ' = ' + JSON.stringify(row.values));
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
                                const cellIndex = `${colIndex}${rowNumber}`
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
                        extraErrorInfo = props.handleMoreValidate(worksheet);
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
                // 对结果进行提示
                Object.keys(sheetInfo).forEach((key: string | number) => {
                    if (sheetInfo[key].isEmptySheet) {
                        // message.warning(`${sheetInfo[key].name}为空表`);
                        setModal({
                            visible: true,
                            resultContent: `${modal.resultContent}\n${sheetInfo[key].name}为空表`,
                        })
                    }
                    if (sheetInfo[key].errorTitleIndex.length) {
                        // message.warning(`${sheetInfo[key].name}表标题错误，请检查，列如下：\n${sheetInfo[key].errorTitleIndex}`);
                        setModal({
                            visible: true,
                            resultContent: `${modal.resultContent}\n${sheetInfo[key].name}表标题错误，请检查，列如下：\n${sheetInfo[key].errorTitleIndex}`,
                        })
                    }
                    if (sheetInfo[key].bodyErrorInfo.length) {
                        // console.log(`${sheetInfo[key].name}表内容错误，请检查，单元格如下：\n${sheetInfo[key].bodyErrorInfo.map((i: any) => (`${i.cellIndex}:${i.errorMessage}\n`))}`);
                        // message.warning(`${sheetInfo[key].name}表内容错误，请检查，单元格如下：\n${sheetInfo[key].bodyErrorInfo.map((i: any) => (`${i.cellIndex}:${i.errorMessage}\n`))}`);
                        setModal({
                            visible: true,
                            resultContent: `${modal.resultContent}\n${sheetInfo[key].name}表内容错误，请检查，单元格如下：\n${sheetInfo[key].bodyErrorInfo.map((i: any) => (`${i.cellIndex}:${i.errorMessage}\n`))}`,
                        });
                    }
                    if (sheetInfo[key].extraErrorInfo) {
                        setModal({
                            visible: true,
                            resultContent: `${modal.resultContent}\n${sheetInfo[key].extraErrorInfo}`,
                        });
                    }
                });
                console.log(sheetInfo);
                reject(false);
            });
        },
        onChange(info: any) {
          const { status } = info.file;
          if (status !== 'uploading') {
            console.log(info.file, info.fileList);
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
            <Modal visible={modal.visible} onOk={handleCancelModal} onCancel={handleCancelModal}>
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
