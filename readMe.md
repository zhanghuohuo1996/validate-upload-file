<!--
 * @Author: your name
 * @Date: 2021-04-19 11:04:27
 * @LastEditTime: 2021-04-19 11:12:39
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /validate-upload-file/readme.md
-->
## 说明
### 支持浏览器端excel\csv文件的校验并上传

## 属性
|  属性   | 说明  |  类型  |
|  ----  | ----  |  ---- |
| sheetProps  | 校验属性和规则等信息（必选） | object |
| handleMoreValidate? | 额外自定义校验（可选） |  function |
| dragProps?  | antd组件属性的透传，可缺省（可选） |   object |
| style?  | container容器样式（可选） | object  |
| children?  | 子组件或节点（可选） |  React.ReactNode | string |
| uploadToolTip?  | 容器内部提示文案或节点（可选） |  React.ReactNode | string |

### sheetProps 

|  字段   | 说明  | 
|  ----  | ----  | 
| colTitle  | string，表示列名称（必须） | 
| type | 'list' | 'number' | 'text' | 'custome' 表示字段的类型（必须） | 
| allowBlank  | boolean，表示是否允许为空（必须） | 
| valueErrorMessage  | string，表示当前字段的错误提示（可选） | 
| formulae  | type == list时，为array，表示枚举范围（必须）

type == number时，为number，表示最大值（可选）

type == text时，为number，表示文本最大长度（可选）

type == custom时，为reg，表示匹配的正则（必须） | 
| isUnique  | boolean，表示该字段是否唯一（可选） |

### handleMoreValidate
|  字段   | 说明  | 
|  ----  | ----  | 
| (worksheet: any) => string  | 参数worksheet表示每一个sheet，返回string为展示的错误信息 | 

## 更多参考链接
https://github.com/exceljs/exceljs
