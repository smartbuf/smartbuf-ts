/**
 * NumberUtils provides some useful features for number convert operation.
 *
 * @author sulin
 * @since 2019-11-23 15:14:54
 */
export class NumberUtils {

    public static intToUint(l: number): number {
        return (l << 1) ^ (l >> 63);
    }

    public static uintToInt(l: number): number {
        return (l >>> 1) ^ -(l & 1);
    }

    public static floatToBits(f: number): number {
        // return Float.floatToRawIntBits(f);
        return 0;
    }

    public static bitsToFloat(i: number): number {
        // return Float.intBitsToFloat(i);
        return 0;
    }

    public static doubleToBits(d: number): number {
        // return Double.doubleToRawLongBits(d);
        return 0;
    }

    public static bitsToDouble(l: number): number {
        // return Double.longBitsToDouble(l);
        return 0;
    }
}
