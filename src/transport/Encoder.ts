import {Const} from "transport/Const";
import {EncodeBuffer} from "transport/EncodeBuffer";
import {EncodeDataPool} from "transport/EncodeDataPool";
import {EncodeMetaPool} from "transport/EncodeMetaPool";

/**
 * Encoder wraps smartbuf's encode implementation.
 * It could scan any data and encode it into highly compressed bytecodes
 *
 * @author sulin
 * @since 2019-11-25 20:54:56
 */
export class Encoder {

    public static PACKET_LIMIT = 64 * 1024 * 1024;
    public static SYMBOL_LIMIT = 1 << 16;
    public static STRUCT_LIMIT = 1 << 16;

    private readonly enableStreamMode: boolean;

    private sequence: number;

    public bodyBuf: EncodeBuffer;
    public headBuf: EncodeBuffer;

    public dataPool: EncodeDataPool;
    public metaPool: EncodeMetaPool;

    /**
     * Initialize Encoder, it is reusable
     *
     * @param enableStreamMode Enable stream-model or not
     */
    constructor(enableStreamMode: boolean) {
        this.enableStreamMode = enableStreamMode;
        this.bodyBuf = new EncodeBuffer(Encoder.PACKET_LIMIT);
        this.headBuf = new EncodeBuffer(Encoder.PACKET_LIMIT);
        this.dataPool = new EncodeDataPool(Encoder.SYMBOL_LIMIT);
        this.metaPool = new EncodeMetaPool(Encoder.STRUCT_LIMIT);
    }

    /**
     * Encode any object into bytecodes
     *
     * @param o Any object
     * @return encoded byte[]
     */
    public encode(o: any): Uint8Array {
        this.bodyBuf.reset();
        this.headBuf.reset();
        this.dataPool.reset();
        this.metaPool.reset();
        this.writeAny(o);

        let hasData = this.dataPool.needOutput();
        let hasMeta = this.metaPool.needOutput();
        let hasSeq = this.dataPool.needSequence() || this.metaPool.needSequence();

        // 1-byte for summary
        let head = Const.VER;
        if (this.enableStreamMode) head |= Const.VER_STREAM;
        if (hasData) head |= Const.VER_HAS_DATA;
        if (hasMeta) head |= Const.VER_HAS_META;
        if (hasSeq) head |= Const.VER_HAS_SEQ;
        this.headBuf.writeByte(head);
        // 1-byte for context sequence, if need
        if (hasSeq) {
            this.headBuf.writeByte((++this.sequence) & 0xFF);
        }
        // output sharing meta
        if (hasMeta) {
            this.metaPool.write(this.headBuf);
        }
        // output sharing data
        if (hasData) {
            this.dataPool.write(this.headBuf);
        }

        // copy into byte[]
        let result = new Uint8Array(this.bodyBuf.offset + this.headBuf.offset);
        result.set(this.headBuf.data.slice(0, this.headBuf.offset), 0);
        result.set(this.bodyBuf.data, this.headBuf.offset);
        return result;
    }

    /**
     * Write any object into the buffer, support null.
     */
    private writeAny(obj: any) {
        if (obj === null || obj === undefined) {
            this.bodyBuf.writeVarUint(Const.CONST_NULL);
            return;
        }
        let dataId;
        switch (typeof obj) {
            case "boolean":
                this.bodyBuf.writeVarUint(obj ? Const.CONST_TRUE : Const.CONST_FALSE);
                break;
            case "number":
                if (obj % 1 === 0) {
                    dataId = this.dataPool.registerVarint(obj);
                    this.bodyBuf.writeVarUint((dataId << 3) | Const.TYPE_VARINT);
                } else {
                    dataId = this.dataPool.registerDouble(obj);
                    this.bodyBuf.writeVarUint((dataId << 3) | Const.TYPE_DOUBLE);
                }
                break;
            case "bigint":
                dataId = this.dataPool.registerString(JSON.stringify(obj));
                this.bodyBuf.writeVarUint((dataId << 3) | Const.TYPE_STRING);
                break;
            case "string":
                dataId = this.dataPool.registerString(obj);
                this.bodyBuf.writeVarUint((dataId << 3) | Const.TYPE_STRING);
                break;
            case "object":
                if (Array.isArray(obj)) {
                    this.writeArray(obj);
                } else {
                    this.writeObject(obj);
                }
                break;
            default:
                throw new Error("cannot encode data: " + obj);
        }
    }

    /**
     * Write an object into bodyBuf.
     */
    private writeObject(obj: object) {
        // TODO
    }

    /**
     * Write an array into bodyBuf.
     */
    private writeArray(arr: Array<any>) {
        // TODO
    }

}
