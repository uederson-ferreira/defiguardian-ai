// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//src/libraries/MessageFormatter.sol

library AlertMessageFormatter {
    function formatRiskMessage(address _protocol, uint256 _threshold) 
        internal pure returns (string memory) {
        // Simplificação para hackathon; usar abi.encode para strings dinâmicas
        return string(abi.encodePacked(
            "Risk threshold exceeded for protocol ",
            toHexString(_protocol),
            " at ",
            uintToString(_threshold)
        ));
    }

    function toHexString(address _addr) private pure returns (string memory) {
        bytes memory buffer = new bytes(40);
        for (uint256 i = 0; i < 20; i++) {
            uint8 b = uint8(uint160(_addr) >> (8 * (19 - i)));
            buffer[2 * i] = bytes1(uint8(b >> 4) + (b >> 4 < 10 ? 48 : 87));
            buffer[2 * i + 1] = bytes1(uint8(b & 0x0f) + (b & 0x0f < 10 ? 48 : 87));
        }
        return string(abi.encodePacked("0x", buffer));
    }

    function uintToString(uint256 _value) private pure returns (string memory) {
        if (_value == 0) return "0";
        uint256 temp = _value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (_value != 0) {
            digits--;
            buffer[digits] = bytes1(uint8(48 + _value % 10));
            _value /= 10;
        }
        return string(buffer);
    }
}