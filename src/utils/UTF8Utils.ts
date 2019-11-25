/**
 * UTF8Utils wraps encode and decode functions for utf-8 charset, it's copied from github.
 *
 * @author github
 */
export class UTF8Utils {

    /**
     * Marshals a string to an Uint8Array.
     *
     * @param s The original string to encode
     * @return the encoded byte[]
     */
    public static encodeUTF8(s: string): Uint8Array {
        let bytes = new Uint8Array(s.length * 4);
        let count = 0;
        for (let i = 0; i !== s.length; i++) {
            let cc = s.charCodeAt(i);
            if (cc < 128) {
                bytes[count++] = cc;
                continue;
            }
            if (cc < 2048) {
                bytes[count++] = cc >> 6 | 192;
                bytes[count++] = cc & 63 | 128;
                continue
            }
            if (cc > 0xD7FF && cc < 0xDC00) {
                if (++i >= s.length) {
                    throw new Error('UTF-8 encode: incomplete surrogate pair');
                }
                let c2 = s.charCodeAt(i);
                if (c2 < 0xDC00 || c2 > 0xDFFFF) {
                    throw new Error(`UTF-8 encode: second surrogate character 0x${c2.toString(16)} at index ${i} out of range`);
                }
                cc = 0x10000 + ((cc & 0x03FF) << 10) + (c2 & 0x03FF);
                bytes[count++] = cc >> 18 | 240;
                bytes[count++] = cc >> 12 & 63 | 128;
            } else {
                bytes[count++] = cc >> 12 | 224;
            }
            bytes[count++] = cc >> 6 & 63 | 128;
            bytes[count++] = cc & 63 | 128;
        }
        return bytes.subarray(0, count);
    }

    /**
     * Unmarshals a string from an Uint8Array.
     *
     * @param bytes The utf8 encoded byte[]
     * @return The original string
     */
    public static decodeUTF8(bytes: Uint8Array): string {
        let i = 0;
        let s = '';
        while (i < bytes.length) {
            let c = bytes[i++];
            if (c > 127) {
                if (c > 191 && c < 224) {
                    if (i >= bytes.length) {
                        throw new Error('UTF-8 decode: incomplete 2-byte sequence');
                    }
                    c = (c & 31) << 6 | bytes[i++] & 63;
                } else if (c > 223 && c < 240) {
                    if (i + 1 >= bytes.length) {
                        throw new Error('UTF-8 decode: incomplete 3-byte sequence');
                    }
                    c = (c & 15) << 12 | (bytes[i++] & 63) << 6 | bytes[i++] & 63;
                } else if (c > 239 && c < 248) {
                    if (i + 2 >= bytes.length) {
                        throw new Error('UTF-8 decode: incomplete 4-byte sequence');
                    }
                    c = (c & 7) << 18 | (bytes[i++] & 63) << 12 | (bytes[i++] & 63) << 6 | bytes[i++] & 63;
                } else {
                    throw new Error(`UTF-8 decode: unknown multibyte start 0x${c.toString(16)} at index ${i - 1}`);
                }
            }
            if (c <= 0xFFFF) {
                s += String.fromCharCode(c);
            } else if (c <= 0x10FFFF) {
                c -= 0x10000;
                s += String.fromCharCode(c >> 10 | 0xd800);
                s += String.fromCharCode(c & 0x3FF | 0xDC00);
            } else {
                throw new Error(`UTF-8 decode: code point 0x${c.toString(16)} exceeds UTF-16 reach`);
            }
        }
        return s;
    }

}
