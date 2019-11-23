/**
 * Allocate incremental id, and support reusing.
 *
 * @author sulin
 * @since 2019-11-23 14:50:49
 */
import {ArrayUtils} from "utils/ArrayUtils";

export class IDAllocator {
    private nextId: number;
    private reuseCount: number;
    private reuseIds: number[] = [];

    /**
     * Acquire an unique and incremental ID
     *
     * @return Unique and incremental id
     */
    public acquire(): number {
        if (this.reuseCount == 0) {
            return this.nextId++;
        }
        return this.reuseIds[--this.reuseCount];
    }

    /**
     * Release the specified id, It will be used in high priority.
     *
     * @param id ID was released
     */
    public release(id: number) {
        if (id >= this.nextId) {
            throw new Error(id + " is not acquired");
        }
        if (this.reuseCount >= this.reuseIds.length) {
            this.reuseIds.push(id);
        } else {
            this.reuseIds[this.reuseCount] = id;
        }
        ArrayUtils.descFastSort(this.reuseIds, 0, this.reuseCount);

        this.reuseCount++;
    }
}
