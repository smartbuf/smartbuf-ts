import {Const} from "transport/Const";
import {EncodeBuffer} from "transport/EncodeBuffer";
import {IDAllocator} from "transport/IDAllocator";

const HAS_FLOAT = 1;
const HAS_DOUBLE = 1 << 1;
const HAS_VARINT = 1 << 2;
const HAS_STRING = 1 << 3;
const HAS_SYMBOL_ADDED = 1 << 4;
const HAS_SYMBOL_EXPIRED = 1 << 5;
const NEED_SEQ = HAS_SYMBOL_ADDED | HAS_SYMBOL_EXPIRED;

/**
 * EncodeDataPool represents an area holds data properties like float/double/varint/string/symbol.
 *
 * @author sulin
 * @since 2019-11-23 18:22:31
 */
export class EncodeDataPool {

    private readonly symbolLimit: number;
    private flags: number;

    floats = new Array<number>();
    floatIndex = new Map<number, number>();
    doubles = new Array<number>();
    doubleIndex = new Map<number, number>();
    varints = new Array<number>();
    varintIndex = new Map<number, number>();
    strings = new Array<string>();

    stringIndex = new Map<string, number>();
    symbolID = new IDAllocator();
    symbols = new Array<Symbol>();
    symbolAdded = new Array<Symbol>();
    symbolExpired = new Array<number>();
    symbolIndex = new Map<string, Symbol>();

    constructor(symbolLimit: number) {
        this.symbolLimit = symbolLimit;
    }

    /**
     * Register the specified float data into float-area
     *
     * @param f Float data
     * @return FloatID
     */
    public registerFloat(f: number): number {
        if (f == 0) {
            return 1;
        }
// return floatIndex.computeIfAbsent(f, floats::add) + 2;
        return 0;
    }

    /**
     * Register the specified double data into double-area
     *
     * @param d Double data
     * @return Double ID
     */
    public registerDouble(d: number): number {
        if (d == 0) {
            return 1;
        }
        // return doubleIndex.computeIfAbsent(d, doubles::add) + 2;
        return 0;
    }

    /**
     * Register the specified varint data into varint-area, which means long
     *
     * @param l Varint data
     * @return Varint ID
     */
    public registerVarint(l: number): number {
        if (l == 0) {
            return 1;
        }
        // return varintIndex.computeIfAbsent(l, varints::add) + 2;
        return 0;
    }

    /**
     * Register the specified string data into string-area
     *
     * @param str String data
     * @return String ID
     */
    public registerString(str: string): number {
        if (str === "") {
            return 1;
        }
        // return stringIndex.computeIfAbsent(str, strings::add) + 2;
        return 0;
    }

    /**
     * Register the specified symbol into symbol-area, symbol is a sort of special strings.
     *
     * @param str Symbol data
     * @return Symbol ID
     */
    public registerSymbol(str: string): number {
        if (str == null || str === "") {
            throw new Error("invalid symbol: " + str);
        }
        let symbol = this.symbolIndex[str];
        if (!symbol) {
            let index = this.symbolID.acquire();
            symbol = new Symbol(str, index);
            this.symbols[index] = symbol;
            this.symbolAdded.push(symbol);
        }
        symbol.lastTime = new Date().getTime();
        return symbol.index + 1;
    }

    /**
     * Check this data-pool need to output or not.
     */
    needOutput(): boolean {
        let flags = 0;
        if (this.floats.length > 0) flags |= HAS_FLOAT;
        if (this.doubles.length > 0) flags |= HAS_DOUBLE;
        if (this.varints.length > 0) flags |= HAS_VARINT;
        if (this.strings.length > 0) flags |= HAS_STRING;
        if (this.symbolAdded.length > 0) flags |= HAS_SYMBOL_ADDED;
        if (this.symbolExpired.length > 0) flags |= HAS_SYMBOL_EXPIRED;

        return (this.flags = flags) != 0;
    }

    /**
     * Check this data-pool need to output sequence or not.
     */
    needSequence(): boolean {
        return (this.flags & NEED_SEQ) != 0;
    }

    /**
     * Write this data-pool into the specified output buffer
     */
    write(buf: EncodeBuffer): void {
        let flags = this.flags;
        let len = 0;
        if ((flags & HAS_FLOAT) != 0) {
            len = this.floats.length;
            flags ^= HAS_FLOAT;
            buf.writeVarUint((len << 4) | Const.FLAG_DATA_FLOAT | (flags == 0 ? 0 : 1));
            for (let i = 0; i < len; i++) {
                buf.writeFloat(this.floats[i]);
            }
        }
        if ((flags & HAS_DOUBLE) != 0) {
            len = this.doubles.length;
            flags ^= HAS_DOUBLE;
            buf.writeVarUint((len << 4) | Const.FLAG_DATA_DOUBLE | (flags == 0 ? 0 : 1));
            for (let i = 0; i < len; i++) {
                buf.writeDouble(this.doubles[i]);
            }
        }
        if ((flags & HAS_VARINT) != 0) {
            len = this.varints.length;
            flags ^= HAS_VARINT;
            buf.writeVarUint((len << 4) | Const.FLAG_DATA_VARINT | (flags == 0 ? 0 : 1));
            for (let i = 0; i < len; i++) {
                buf.writeVarInt(this.varints[i]);
            }
        }
        if ((flags & HAS_STRING) != 0) {
            len = this.strings.length;
            flags ^= HAS_STRING;
            buf.writeVarUint((len << 4) | Const.FLAG_DATA_STRING | (flags == 0 ? 0 : 1));
            for (let i = 0; i < len; i++) {
                buf.writeString(this.strings[i]);
            }
        }
        if ((flags & HAS_SYMBOL_EXPIRED) != 0) {
            len = this.symbolExpired.length;
            flags ^= HAS_SYMBOL_EXPIRED;
            buf.writeVarUint((len << 4) | Const.FLAG_DATA_SYMBOL_EXPIRED | (flags == 0 ? 0 : 1));
            for (let i = 0; i < len; i++) {
                buf.writeVarUint(this.symbolExpired[i]);
            }
        }
        if ((flags & HAS_SYMBOL_ADDED) != 0) {
            len = this.symbolAdded.length;
            buf.writeVarUint((len << 4) | Const.FLAG_DATA_SYMBOL_ADDED);
            for (let i = 0; i < len; i++) {
                buf.writeString(this.symbolAdded[i].value);
            }
        }
    }

    /**
     * Reset this data pool, execute context data's expiring automatically
     */
    reset(): void {
        this.floats = new Array<number>();
        this.floatIndex.clear();
        this.doubles = new Array<number>();
        this.doubleIndex.clear();
        this.varints = new Array<number>();
        this.varintIndex.clear();
        this.strings = new Array<string>();
        this.stringIndex.clear();
        this.symbolAdded = new Array<Symbol>();
        this.symbolExpired = new Array<number>();

        // check and expire symbols if thay are too many
        let expireNum = 0; // symbolIndex.length - symbolLimit;
        if (expireNum <= 0) {
            return;
        }
        let symbols = new Array<Symbol>();
        symbols.sort((a, b) => a.lastTime - b.lastTime);
        for (let i = 0, len = Math.min(expireNum, symbols.length); i < len; i++) {
            let expiredSymbol = symbols[i];
            this.symbolIndex.delete(expiredSymbol.value);
            this.symbolID.release(expiredSymbol.index);
            this.symbols[expiredSymbol.index] = null;
            this.symbolExpired.push(expiredSymbol.index);
        }
    }
}

class Symbol {
    readonly value: string;
    readonly index: number;

    lastTime: number;

    constructor(value: string, index: number) {
        this.value = value;
        this.index = index;
    }
}
