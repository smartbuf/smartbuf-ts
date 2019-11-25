import {NumberUtils} from "utils/NumberUtils";
import {UTF8Utils} from "utils/UTF8Utils";

export class DecodeBuffer {

    private readonly data: Uint8Array;
    private offset: number;

    constructor(data: Uint8Array) {
        this.data = data;
        this.offset = 0;
    }

    public readByte(): number {
        if (this.offset >= this.data.length) {
            throw new Error("EOF");
        }
        return this.data[this.offset++];
    }

    public readShort(): number {
        let high = this.readByte();
        let low = this.readByte();
        return (high << 8) | (low & 0xFF);
    }

    public readVarInt(): number {
        let l = this.readVarUint();
        return NumberUtils.uintToInt(l);
    }

    public readVarUint(): number {
        let l = 0;
        for (let i = 0; ; i++) {
            let b = this.readByte();
            l |= (b & 0x7F) << (i * 7);
            if ((b & 0x80) == 0) {
                break;
            }
            if (i == 10) {
                throw new Error("hit invalid varint");
            }
        }
        return l;
    }

    public readFloat(): number {
        let bits = 0;
        let b;
        for (let i = 0; i < 4; i++) {
            b = this.readByte() & 0xFF;
            bits |= b << (8 * i);
        }
        return NumberUtils.bitsToFloat(bits);
    }

    public readDouble(): number {
        let bits = 0;
        let b;
        for (let i = 0; i < 8; i++) {
            b = this.readByte() & 0xFF;
            bits |= b << (8 * i);
        }
        return NumberUtils.bitsToDouble(bits);
    }

    public readString(): string {
        let len = this.readVarUint();
        let bytes = this.readByteArray(len);
        return UTF8Utils.decodeUTF8(bytes);
    }

    public readBooleanArray(len: number): boolean[] {
        let result = new Array<boolean>(len);
        for (let i = 0; i < len; i += 8) {
            let b = this.readByte();
            for (let j = 0; j < 8; j++) {
                if (i + j >= len) {
                    break;
                }
                result[i + j] = (b & (1 << j)) > 0;
            }
        }
        return result;
    }

    public readByteArray(len: number): Uint8Array {
        let bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = this.readByte();
        }
        return bytes;
    }

    public readShortArray(len: number): Int16Array {
        let result = new Int16Array(len);
        for (let i = 0; i < len; i++) {
            result[i] = this.readShort();
        }
        return result;
    }

    public readIntArray(len: number): Int32Array {
        let result = new Int32Array(len);
        for (let i = 0; i < len; i++) {
            result[i] = this.readVarInt();
        }
        return result;
    }

    public readLongArray(len: number): Array<number> {
        let result = new Array<number>();
        for (let i = 0; i < len; i++) {
            result[i] = this.readVarInt();
        }
        return result;
    }

    public readFloatArray(len: number): Float32Array {
        let result = new Float32Array(len);
        for (let i = 0; i < len; i++) {
            result[i] = this.readFloat();
        }
        return result;
    }

    public readDoubleArray(len: number): Float64Array {
        let result = new Float64Array(len);
        for (let i = 0; i < len; i++) {
            result[i] = this.readDouble();
        }
        return result;
    }

}
