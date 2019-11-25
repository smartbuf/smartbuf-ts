import {ArrayUtils} from "utils/ArrayUtils";
import {describe, it} from 'mocha';
import {assert} from 'chai';

describe("ArrayUtils", function () {
    it("testDescFastSort", function () {
        let numbers = [100, 2, 1000, 200, 111, 200000];
        ArrayUtils.descFastSort(numbers, 0, numbers.length - 1);
        for (let i = 1; i < numbers.length; i++) {
            assert(numbers[i - 1] >= numbers[i]);
        }
    });
});
