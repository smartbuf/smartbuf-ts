/**
 * Constants that shared between input and output
 *
 * @author sulin
 * @since 2019-11-23 15:10:07
 */
export class Const {

    static VER: number = 0b0001_0000;
    static VER_STREAM: number = 0b0000_1000;
    static VER_HAS_DATA: number = 0b0000_0100;
    static VER_HAS_META: number = 0b0000_0010;
    static VER_HAS_SEQ: number = 0b0000_0001;

    static FLAG_META_NAME_TMP: number = 1 << 1;
    static FLAG_META_NAME_ADDED: number = 2 << 1;
    static FLAG_META_NAME_EXPIRED: number = 3 << 1;
    static FLAG_META_STRUCT_TMP: number = 4 << 1;
    static FLAG_META_STRUCT_ADDED: number = 5 << 1;
    static FLAG_META_STRUCT_EXPIRED: number = 6 << 1;
    static FLAG_META_STRUCT_REFERRED: number = 7 << 1;

    static FLAG_DATA_FLOAT: number = 1 << 1;
    static FLAG_DATA_DOUBLE: number = 2 << 1;
    static FLAG_DATA_VARINT: number = 3 << 1;
    static FLAG_DATA_STRING: number = 4 << 1;
    static FLAG_DATA_SYMBOL_ADDED: number = 5 << 1;
    static FLAG_DATA_SYMBOL_EXPIRED: number = 6 << 1;

    static CONST_NULL: number = 0x00;
    static CONST_FALSE: number = 0x01;
    static CONST_TRUE: number = 0x02;
    static CONST_ZERO_ARRAY: number = 0x03;

    static TYPE_CONST: number = -1;
    static TYPE_VARINT: number = 0;
    static TYPE_FLOAT: number = 1;
    static TYPE_DOUBLE: number = 2;
    static TYPE_STRING: number = 3;
    static TYPE_SYMBOL: number = 4;
    static TYPE_OBJECT: number = 5;
    static TYPE_NARRAY: number = 6;
    static TYPE_ARRAY: number = 7;

    static TYPE_NARRAY_BOOL: number = 1 << 3 | Const.TYPE_NARRAY;
    static TYPE_NARRAY_BYTE: number = 2 << 3 | Const.TYPE_NARRAY;
    static TYPE_NARRAY_SHORT: number = 3 << 3 | Const.TYPE_NARRAY;
    static TYPE_NARRAY_INT: number = 4 << 3 | Const.TYPE_NARRAY;
    static TYPE_NARRAY_LONG: number = 5 << 3 | Const.TYPE_NARRAY;
    static TYPE_NARRAY_FLOAT: number = 6 << 3 | Const.TYPE_NARRAY;
    static TYPE_NARRAY_DOUBLE: number = 7 << 3 | Const.TYPE_NARRAY;

    static TYPE_SLICE_NULL: number = 0x00;
    static TYPE_SLICE_BOOL: number = 0x01;
    static TYPE_SLICE_FLOAT: number = 0x02;
    static TYPE_SLICE_DOUBLE: number = 0x03;
    static TYPE_SLICE_BYTE: number = 0x04;
    static TYPE_SLICE_SHORT: number = 0x05;
    static TYPE_SLICE_INT: number = 0x06;
    static TYPE_SLICE_LONG: number = 0x07;
    static TYPE_SLICE_STRING: number = 0x08;
    static TYPE_SLICE_SYMBOL: number = 0x09;
    static TYPE_SLICE_OBJECT: number = 0x0A;
    static TYPE_SLICE_UNKNOWN: number = 0x0B;

}
