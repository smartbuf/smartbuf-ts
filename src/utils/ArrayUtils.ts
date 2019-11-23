/**
 * Some utils for array, meanly sort
 *
 * @author sulin
 * @since 2019-11-23 14:57:46
 */
export class ArrayUtils {

    /**
     * Fast-Sort arithmetic which support descend sort for int[]
     *
     * @param arr  Source array
     * @param from start offset, include
     * @param to   end offset, include
     */
    public static descFastSort(arr: number[], from: number, to: number): void {
        if ((to - from) < 1) {
            return;
        }
        let low: number = from;
        let high: number = to;
        let baseVal: number = arr[low];
        while (low < high) {
            for (; high > low; high--) {
                if (arr[high] > baseVal) {
                    arr[low] = arr[high];
                    low++;
                    break;
                }
            }
            for (; high > low; low++) {
                if (arr[low] < baseVal) {
                    arr[high] = arr[low];
                    high--;
                    break;
                }
            }
        }

        arr[low] = baseVal;
        if ((low - from) > 1) {
            ArrayUtils.descFastSort(arr, from, (low - 1));
        }
        if ((to - low) > 1) {
            ArrayUtils.descFastSort(arr, (low + 1), to);
        }
    }
}
