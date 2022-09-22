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
    PlayerStatus[PlayerStatus["dead"] = 0] = "dead";
    PlayerStatus[PlayerStatus["playing"] = 1] = "playing";
    PlayerStatus[PlayerStatus["done"] = 2] = "done";
})(PlayerStatus = exports.PlayerStatus || (exports.PlayerStatus = {}));
