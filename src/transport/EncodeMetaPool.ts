import {Const} from "transport/Const";
import {EncodeBuffer} from "transport/EncodeBuffer";
import {IDAllocator} from "transport/IDAllocator";

const HAS_NAME_TMP = 1;
const HAS_NAME_ADDED = 1 << 1;
const HAS_NAME_EXPIRED = 1 << 2;
const HAS_STRUCT_TMP = 1 << 3;
const HAS_STRUCT_ADDED = 1 << 4;
const HAS_STRUCT_EXPIRED = 1 << 5;
const HAS_STRUCT_REFERRED = 1 << 6;
const NEED_SEQ = HAS_NAME_ADDED | HAS_NAME_EXPIRED | HAS_STRUCT_ADDED | HAS_STRUCT_EXPIRED;

/**
 * EncodeMetaPool represents an area holds struct for sharing, which support temporary and context using.
 *
 * @author sulin
 * @since 2019-11-23 17:08:40
 */
export class EncodeMetaPool {

    private readonly cxtStructLimit: number;
    private status: number;

    tmpNames = new Array<string>();
    tmpNameIndex = new Map<string, number>();

    tmpStructs = new Array<Struct>();
    tmpStructIndex = new StructTree();

    cxtIdAlloc = new IDAllocator();
    cxtNames = new Array<Name>();
    cxtNameAdded = new Array<Name>();
    cxtNameExpired = new Array<number>();
    cxtNameIndex = new Map<string, Name>();

    cxtStructCount = 0;
    cxtStructIdAlloc = new IDAllocator();
    cxtStructs = new Array<Struct>();
    cxtStructAdded = new Array<Struct>();
    cxtStructExpired = new Array<number>();
    cxtStructReferred = new Array<Struct>();
    cxtStructIndex = new StructTree();

    public constructor(cxtStructLimit: number) {
        this.cxtStructLimit = cxtStructLimit;
    }

    /**
     * Register an struct for temporary using
     *
     * @param names Names which represents an temporary struct
     * @return Struct's ID
     */
    public registerTmpStruct(names: string[]): number {
        if (names == null) {
            throw new Error("names is null");
        }
        if (names.length == 0) {
            return 0;
        }
        let node = this.tmpStructIndex.getNode(names);
        let struct = node.struct;
        if (!struct) {
            let nameIds = new Array<number>(names.length);
            let off = 0;
            for (let i = 0; i < names.length; i++) {
                let name = names[i];
                let nameId = this.tmpNameIndex.get(name);
                if (nameId == null) {
                    nameId = this.tmpNames.push(name);
                    this.tmpNameIndex.set(name, nameId);
                }
                nameIds[off++] = nameId;
            }
            struct = new Struct(names, nameIds);
            struct.index = this.tmpStructs.push(struct);
            struct.id = (struct.index + 1) << 1; // identify temporary struct by suffixed 0

            node.struct = struct;
        }
        return struct.id;
    }

    /**
     * Register the specified struct into pool by its field-names.
     *
     * @param names FieldNames which represents an struct
     * @return Struct ID
     */
    public registerCxtStruct(names: string[]): number {
        if (names == null) {
            throw new Error("names is null");
        }
        if (names.length == 0) {
            return 0;
        }
        let node = this.cxtStructIndex.getNode(names);
        let struct = node.struct;
        if (struct == null) {
            let nameIds = new Array<number>(names.length);
            for (let str of names) {
                let name = this.cxtNameIndex.get(str);
                if (name == null) {
                    let index = this.cxtIdAlloc.acquire();
                    name = new Name(str, index);
                    this.cxtNames[index] = name;
                    this.cxtNameAdded.push(name); // record for outter using
                    this.cxtNameIndex.set(str, name);
                }
                nameIds.push(name.index);
                name.refCount++; // update counter
            }
            struct = new Struct(names, nameIds);
            struct.index = this.cxtStructIdAlloc.acquire();
            struct.id = ((struct.index + 1) << 1) | 1; // identify context struct by suffixed 1
            this.cxtStructs[struct.index] = struct;
            this.cxtStructAdded.push(struct);
            this.cxtStructCount++;

            node.struct = struct;
        }
        struct.lastTime = new Date().getTime(); // update timer
        if (!struct.refered) {
            struct.refered = true;
            this.cxtStructReferred.push(struct);
        }
        return struct.id;
    }

    needOutput(): boolean {
        let status = 0;
        if (this.tmpNames.length > 0) status |= HAS_NAME_TMP;
        if (this.cxtNameAdded.length > 0) status |= HAS_NAME_ADDED;
        if (this.cxtNameExpired.length > 0) status |= HAS_NAME_EXPIRED;
        if (this.tmpStructs.length > 0) status |= HAS_STRUCT_TMP;
        if (this.cxtStructAdded.length > 0) status |= HAS_STRUCT_ADDED;
        if (this.cxtStructExpired.length > 0) status |= HAS_STRUCT_EXPIRED;
        if (this.cxtStructReferred.length > 0) status |= HAS_STRUCT_REFERRED;

        return (this.status = status) > 0;
    }

    needSequence(): boolean {
        return (this.status & NEED_SEQ) > 0;
    }

    /**
     * Write this MetaPool into the specified output buffer.
     */
    write(buf: EncodeBuffer): void {
        let status = this.status;
        let len;
        if ((status & HAS_NAME_TMP) > 0) {
            status ^= HAS_NAME_TMP;
            len = this.tmpNames.length;
            buf.writeVarUint((len << 4) | Const.FLAG_META_NAME_TMP | 1); // must have structTmp
            for (let i = 0; i < len; i++) {
                buf.writeString(this.tmpNames[i]);
            }
        }
        if ((status & HAS_NAME_EXPIRED) > 0) {
            status ^= HAS_NAME_EXPIRED;
            len = this.cxtNameExpired.length;
            buf.writeVarUint((len << 4) | Const.FLAG_META_NAME_EXPIRED | 1); // must have structExpired
            for (let i = 0; i < len; i++) {
                buf.writeVarUint(this.cxtNameExpired[i]);
            }
        }
        if ((status & HAS_NAME_ADDED) > 0) {
            status ^= HAS_NAME_ADDED;
            len = this.cxtNameAdded.length;
            buf.writeVarUint((len << 4) | Const.FLAG_META_NAME_ADDED | 1); // must have structAdded
            for (let i = 0; i < len; i++) {
                buf.writeString(this.cxtNameAdded[i].name);
            }
        }
        if ((status & HAS_STRUCT_TMP) > 0) {
            status ^= HAS_STRUCT_TMP;
            len = this.tmpStructs.length;
            buf.writeVarUint((len << 4) | Const.FLAG_META_STRUCT_TMP | (status == 0 ? 0 : 1));
            for (let i = 0; i < len; i++) {
                let struct = this.tmpStructs[i];
                buf.writeVarUint(struct.nameIds.length);
                for (let nameId of struct.nameIds) {
                    buf.writeVarUint(nameId);
                }
            }
        }
        if ((status & HAS_STRUCT_EXPIRED) > 0) {
            len = this.cxtStructAdded.length;
            status ^= HAS_STRUCT_EXPIRED;
            buf.writeVarUint((len << 4) | Const.FLAG_META_STRUCT_EXPIRED | (status == 0 ? 0 : 1));
            for (let i = 0; i < len; i++) {
                buf.writeVarUint(this.cxtStructExpired[i]);
            }
        }
        if ((status & HAS_STRUCT_ADDED) > 0) {
            len = this.cxtStructAdded.length;
            status ^= HAS_STRUCT_ADDED;
            buf.writeVarUint((len << 4) | Const.FLAG_META_STRUCT_ADDED | 1); // must has HAS_STRUCT_REFERRED suffixed
            for (let i = 0; i < len; i++) {
                let nameIds = this.cxtStructAdded[i].nameIds;
                buf.writeVarUint(nameIds.length);
                for (let nameId of nameIds) {
                    buf.writeVarUint(nameId);
                }
            }
        }
        if ((status & HAS_STRUCT_REFERRED) > 0) {
            len = this.cxtStructReferred.length;
            buf.writeVarUint((len << 4) | Const.FLAG_META_STRUCT_REFERRED);
            for (let i = 0; i < len; i++) {
                let struct = this.cxtStructReferred[i];
                buf.writeVarUint(struct.index);
                buf.writeVarUint(struct.names.length);
            }
        }
    }

    /**
     * Reset this struct pool, and execute struct-expire automatically
     */
    reset(): void {
        this.tmpNames = new Array<string>();
        this.tmpNameIndex = new Map<string, number>();
        this.cxtNameAdded = new Array<Name>();
        this.cxtNameExpired = new Array<number>();

        this.tmpStructs = new Array<Struct>();
        this.tmpStructIndex = new StructTree();
        this.cxtStructAdded = new Array<Struct>();
        this.cxtStructExpired = new Array<number>();
        this.cxtStructReferred = new Array<Struct>();

        for (let struct of this.cxtStructs) {
            struct.refered = false;
        }

        // execute automatically expire for context-struct
        let expireCount = this.cxtStructCount - this.cxtStructLimit;
        if (expireCount <= 0) {
            return;
        }
        let structs = new Array<Struct>();
        for (let struct of this.cxtStructs) {
            struct && structs.push(struct);
        }
        structs.sort((a, b) => (a.lastTime - b.lastTime)); // asc sort by lastTime
        // pick the earlier structs to release
        for (let i = 0, len = Math.min(expireCount, structs.length); i < len; i++) {
            let expiredStruct = structs[i];
            this.cxtStructIndex.getNode(expiredStruct.names).struct = null;
            this.cxtStructIdAlloc.release(expiredStruct.index);
            this.cxtStructExpired.push(expiredStruct.index);
            this.cxtStructs[expiredStruct.index] = null;
            // synchronize cxtNames
            for (let nameId of expiredStruct.nameIds) {
                let meta = this.cxtNames[nameId];
                meta.refCount--;
                if (meta.refCount == 0) {
                    this.cxtNames[meta.index] = null;
                    this.cxtIdAlloc.release(meta.index);
                    this.cxtNameExpired.push(meta.index);
                    this.cxtNameIndex.delete(meta.name);
                }
            }
        }
    }
}

/**
 * field-name's metadata
 */
export class Name {
    name: string;
    index: number;

    refCount: number;

    constructor(name: string, index: number) {
        this.name = name;
        this.index = index;
    }
}

/**
 * Struct model for inner usage
 */
export class Struct {
    id: number;
    index: number;
    lastTime: number;
    names: string[];
    nameIds: number[];
    refered: boolean;

    constructor(names: string[], nameIds: number[]) {
        this.names = names;
        this.nameIds = nameIds;
    }
}

class StructTree {
    private root = new StructNode("");

    public getNode(names: string[]): StructNode {
        let node = this.root;
        for (let i = 0; i < names.length; i++) {
            node = node.findNode(names[i]);
        }
        return node;
    }
}

class StructNode {
    private name: string;
    private subNodes = new Map<string, StructNode>();

    struct: Struct = null;

    constructor(name: string) {
        this.name = name;
    }

    public findNode(name: string): StructNode {
        let node = this.subNodes[name];
        if (node == null) {
            node = new StructNode(name);
            this.subNodes.set(name, node);
        }
        return node;
    }
}
