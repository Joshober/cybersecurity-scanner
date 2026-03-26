/**
 * @typedef {Object} RouteRecord
 * @property {string} method
 * @property {string} path
 * @property {string} fullPath
 * @property {string[]} params
 * @property {string[]} queryParams
 * @property {string[]} bodyFields
 * @property {string[]} [reqParamFields]
 * @property {string[]} middlewares
 * @property {string} file
 * @property {number} line
 * @property {string} handlerSource
 * @property {import('@babel/types').Function|undefined} [handlerNode]
 * @property {string|undefined} [routerVar]
 */

/**
 * @typedef {Object} ParsedFile
 * @property {string} path
 * @property {string} source
 * @property {import('@babel/types').File} ast
 */

/**
 * @typedef {Object} ExtractResult
 * @property {RouteRecord[]} routes
 * @property {ParsedFile[]} files
 */

/**
 * @typedef {Object} ScanContext
 * @property {RouteRecord[]} routes
 * @property {ParsedFile[]} files
 * @property {Map<string, ParsedFile>} astByPath
 * @property {string} rootDir
 */

/**
 * @typedef {Object} Finding
 * @property {string} ruleId
 * @property {string} message
 * @property {string} [cwe]
 * @property {string} [owasp]
 * @property {'critical'|'high'|'medium'|'low'|'info'} severity
 * @property {string} file
 * @property {number} line
 * @property {string} [column]
 * @property {string} [snippet]
 */

export {};
