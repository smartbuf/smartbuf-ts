import {Const} from "transport/Const";
import {DecodeBuffer} from "transport/DecodeBuffer";
import {IDAllocator} from "transport/IDAllocator";

export class DecodeDataPool {

    private floats = new Array<number>();
    private doubles = new Array<number>();
    private varints = new Array<number>();
    private strings = new Array<string>();

    private symbolID = new IDAllocator();
    private symbols = new Array<string>();

    /**
     * Execute synchronization for schema and metadata of context
     *
     * @param buf Input buffer to read
     * @throws IOException any io exception
     */
    public read(buf: DecodeBuffer): void {
        let hasMore = true;
        let flag;
        while (hasMore) {
            let head = buf.readVarUint();
            let size = (head >> 4);
            hasMore = (head & 0b0000_0001) == 1;
            flag = (head & 0b0000_1110);
            switch (flag) {
                case Const.FLAG_DATA_FLOAT:
                    for (let i = 0; i < size; i++) {
                        this.floats.push(buf.readFloat());
                    }
                    break;
                case Const.FLAG_DATA_DOUBLE:
                    for (let i = 0; i < size; i++) {
                        this.doubles.push(buf.readDouble());
                    }
                    break;
                case Const.FLAG_DATA_VARINT:
                    for (let i = 0; i < size; i++) {
                        this.varints.push(buf.readVarInt());
                    }
                    break;
                case Const.FLAG_DATA_STRING:
                    for (let i = 0; i < size; i++) {
                        this.strings.push(buf.readString());
                    }
                    break;
                case Const.FLAG_DATA_SYMBOL_ADDED:
                    for (let i = 0; i < size; i++) {
                        let symbol = buf.readString();
                        let id = this.symbolID.acquire();
                        this.symbols[id] = symbol;
                    }
                    break;
                case Const.FLAG_DATA_SYMBOL_EXPIRED:
                    for (let i = 0; i < size; i++) {
                        let id = buf.readVarUint();
                        this.symbolID.release(id);
                        this.symbols[id] = null;
                    }
                    break;
                default:
                    throw new Error("invalid flag: " + flag);
            }
        }
    }

    /**
     * Find a float data by its unique ID
     *
     * @param index Data index of float value
     * @return float value
     * @throws InvalidDataException If the specified index is invalid
     */
    public getFloat(index: number): number {
        if (index == 1) {
            return 0;
        }
        try {
            return this.floats[index - 2];
        } catch (e) {
            throw new Error("invalid float id: " + index);
        }
    }

    /**
     * Find a double data by its unique ID
     *
     * @param index Data index of double value
     * @return double value
     * @throws InvalidDataException If the specified index is invalid
     */
    public getDouble(index: number): number {
        if (index == 1) {
            return 0.0;
        }
        try {
            return this.doubles[index - 2];
        } catch (e) {
            throw new Error("invalid double id: " + index);
        }
    }

    /**
     * Find a varint data by its unique ID
     *
     * @param index Data index of varint value
     * @return varint value
     * @throws InvalidDataException If the specified index is invalid
     */
    public getVarint(index: number): number {
        if (index == 1) {
            return 0;
        }
        try {
            return this.varints[index - 2];
        } catch (e) {
            throw new Error("invalid varint id: " + index);
        }
    }

    /**
     * Find an string data by its unique ID
     *
     * @param id Data index of string value
     * @return string value
     * @throws InvalidDataException If the specified id is invalid
     */
    public getString(id: number): string {
        if (id == 1) {
            return "";
        }
        let str: string = null;
        try {
            str = this.strings[id - 2];
        } catch (e) {
        }
        if (str == null) {
            throw new Error("invalid string id: " + id);
        }
        return str;
    }

    /**
     * Find an symbol data by its unique ID
     *
     * @param id Data index of symbol value
     * @return symbol value
     * @throws InvalidDataException If the specified id is invalid
     */
    public getSymbol(id: number): string {
        let dataId = id - 1;
        if (dataId >= this.symbols.length) {
            throw new Error("invalid symbol Id: " + id);
        }
        let symbol = this.symbols[dataId];
        if (symbol == null) {
            throw new Error("invalid symbol id: " + id);
        }
        return symbol;
    }

    /**
     * reset this pool, but don't clean symbols
     */
    public reset(): void {
        // TODO add clear()
        // this.floats.clear();
        // this.doubles.clear();
        // this.varints.clear();
        // this.strings.clear();
    }
}
