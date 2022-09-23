"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerStatus = exports.BoardSpace = void 0;
var BoardSpace;
(function (BoardSpace) {
    BoardSpace[BoardSpace["blank"] = -1] = "blank";
    BoardSpace[BoardSpace["incorrect"] = 0] = "incorrect";
    BoardSpace[BoardSpace["partial"] = 1] = "partial";
    BoardSpace[BoardSpace["correct"] = 2] = "correct";
})(BoardSpace = exports.BoardSpace || (exports.BoardSpace = {}));
var PlayerStatus;
(function (PlayerStatus) {
    PlayerStatus[PlayerStatus["done"] = 0] = "done";
    PlayerStatus[PlayerStatus["playing"] = 1] = "playing";
    PlayerStatus[PlayerStatus["dead"] = 2] = "dead";
})(PlayerStatus = exports.PlayerStatus || (exports.PlayerStatus = {}));
