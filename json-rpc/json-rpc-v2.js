export var JsonRpc;
(function (JsonRpc) {
    let ErrorCode;
    (function (ErrorCode) {
        ErrorCode[ErrorCode["ParseError"] = -32700] = "ParseError";
        ErrorCode[ErrorCode["InvalidRequest"] = -32600] = "InvalidRequest";
        ErrorCode[ErrorCode["MethodNotFound"] = -32601] = "MethodNotFound";
        ErrorCode[ErrorCode["InvalidParams"] = -32602] = "InvalidParams";
        ErrorCode[ErrorCode["InternalError"] = -32603] = "InternalError";
        // -32000 to -32099 reserved for server errors
    })(ErrorCode = JsonRpc.ErrorCode || (JsonRpc.ErrorCode = {}));
})(JsonRpc || (JsonRpc = {}));
//# sourceMappingURL=json-rpc-v2.js.map