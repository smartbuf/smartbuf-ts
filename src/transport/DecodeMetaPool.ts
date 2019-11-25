import {Const} from "transport/Const";
import {DecodeBuffer} from "transport/DecodeBuffer";
import {IDAllocator} from "transport/IDAllocator";

/**
 * DecodeMetaPool holds the state of input's metadata, it maintains all temporary and context structs.
 *
 * @author sulin
 * @since 2019-11-25 10:50:08
 */
export class DecodeMetaPool {

    private readonly cxtNameId = new IDAllocator();
    private cxtNames = new Array<string>();
    private tmpNames = new Array<string>();

    private readonly cxtStructID = new IDAllocator();
    private cxtStructs = new Array<Struct>();
    private tmpStructs = new Array<Struct>();

    /**
     * Read meta info from the specified buffer.
     *
     * @param buf The specified input buffer
     * @throws IOException any io exception
     */
    public read(buf: DecodeBuffer): void {
        let hasMore = true;
        while (hasMore) {
            let head = buf.readVarUint();
            let size = (head >>> 4);
            hasMore = (head & 0b0000_0001) == 1;
            let flag = (head & 0b0000_1110);
            switch (flag) {
                case Const.FLAG_META_NAME_TMP:
                    for (let i = 0; i < size; i++) {
                        this.tmpNames.push(buf.readString());
                    }
                    break;
                case Const.FLAG_META_NAME_ADDED:
                    for (let i = 0; i < size; i++) {
                        let offset = this.cxtNameId.acquire();
                        this.cxtNames[offset] = buf.readString();
                    }
                    break;
                case Const.FLAG_META_NAME_EXPIRED:
                    for (let i = 0; i < size; i++) {
                        let id = buf.readVarUint();
                        this.cxtNameId.release(id);
                        this.cxtNames[id] = null;
                    }
                    break;
                case Const.FLAG_META_STRUCT_TMP:
                    for (let i = 0; i < size; i++) {
                        let nameCount = buf.readVarUint();
                        let names = new String[nameCount];
                        for (let j = 0; j < nameCount; j++) {
                            names[j] = this.tmpNames[buf.readVarUint()];
                        }
                        this.tmpStructs.push(Struct.valueOf(names));
                    }
                    break;
                case Const.FLAG_META_STRUCT_ADDED:
                    for (let i = 0; i < size; i++) {
                        let nameCount = buf.readVarUint();
                        let names = new Array<string>(nameCount);
                        for (let j = 0; j < nameCount; j++) {
                            names[j] = this.cxtNames[buf.readVarUint()];
                        }
                        let structId = this.cxtStructID.acquire();
                        this.cxtStructs[structId] = new Struct(true, names);
                    }
                    break;
                case Const.FLAG_META_STRUCT_EXPIRED:
                    for (let i = 0; i < size; i++) {
                        let structId = buf.readVarUint();
                        this.cxtStructID.release(structId);
                        this.cxtStructs[structId] = null;
                    }
                    break;
                case Const.FLAG_META_STRUCT_REFERRED:
                    for (let i = 0; i < size; i++) {
                        buf.readVarUint(); // ignored context struct index
                        buf.readVarUint(); // ignored context struct size
                    }
                    break;
                default:
                    throw new Error("invalid meta flag: " + flag);
            }
        }
    }

    /**
     * Find an struct by its unique id
     *
     * @param id struct's unique id
     * @return struct info
     * @throws InvalidStructException if id is invalid
     */
    public findStructByID(id: number): Struct {
        if (id == 0) {
            return null; // Empty Struct
        }
        let index = (id >>> 1) - 1;
        if (index < 0) {
            throw new Error("invalid struct id: " + id);
        }
        if ((id & 1) == 0) {
            if (index >= this.tmpStructs.length) {
                throw new Error("invalid temporary struct id: " + id);
            }
            return this.tmpStructs[index];
        }
        if (index >= this.cxtStructs.length) {
            throw new Error("invalid context struct id: " + id);
        }
        let struct = this.cxtStructs[index];
        if (struct == null) {
            throw new Error("invalid context struct id: " + id);
        }
        return struct;
    }

    /**
     * Reset this pool, but don't clean context structs
     */
    public reset(): void {
        // this.tmpNames.clear(); // TODO clean
        // this.tmpStructs.clear();// TODO clean
    }

}

export class Struct {
    readonly ordered: boolean;
    readonly fieldNames: string[];

    constructor(ordered: boolean, fieldNames: string[]) {
        this.ordered = ordered;
        this.fieldNames = fieldNames;
    }

    public static valueOf(fieldNames: string[]): Struct {
        let ordered = true;
        let prev: string = null;
        for (let str of fieldNames) {
            if (prev != null && str.localeCompare(prev) < 0) {
                ordered = false;
            }
            prev = str;
        }
        return new Struct(ordered, fieldNames);
    }
}
