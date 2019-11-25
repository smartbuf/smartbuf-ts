import {describe, it} from 'mocha';
import {assert} from 'chai';
import {UTF8Utils} from "utils/UTF8Utils";

/**
 * DOCS:
 * http://www.columbia.edu/~fdc/utf8/
 * https://www.browserling.com/tools/utf8-encode
 */
let data = [
    // 1-byte
    {'text': '\0', 'encoded': '\0'},
    {'text': '\x5C', 'encoded': '\x5C'},
    {'text': '\x7F', 'encoded': '\x7F'},

    // 2-byte
    {'text': '\x80', 'encoded': '\xC2\x80'},
    {'text': '\u05CA', 'encoded': '\xD7\x8A'},
    {'text': '\u07FF', 'encoded': '\xDF\xBF'},

    // 3-byte
    {'text': '\u0800', 'encoded': '\xE0\xA0\x80'},
    {'text': '\u2C3C', 'encoded': '\xE2\xB0\xBC'},
    {'text': '\uFFFF', 'encoded': '\xEF\xBF\xBF'},
    // unmatched surrogate halves
    // high surrogates: 0xD800 to 0xDBFF
    {'text': '\uD800', 'encoded': '\xED\xA0\x80', 'error': true},
    {'text': '\uD800\uD800', 'encoded': '\xED\xA0\x80\xED\xA0\x80', 'error': true},
    {'text': '\uD800A', 'encoded': '\xED\xA0\x80A', 'error': true},
    {'text': '\uD800\uD834\uDF06\uD800', 'encoded': '\xED\xA0\x80\xF0\x9D\x8C\x86\xED\xA0\x80', 'error': true},
    {'text': '\uD9AF', 'encoded': '\xED\xA6\xAF', 'error': true},
    {'text': '\uDBFF', 'encoded': '\xED\xAF\xBF', 'error': true},
    // low surrogates: 0xDC00 to 0xDFFF
    {'text': '\uDC00', 'encoded': '\xED\xB0\x80', 'error': true},
    {'text': '\uDC00\uDC00', 'encoded': '\xED\xB0\x80\xED\xB0\x80', 'error': true},
    {'text': '\uDC00A', 'encoded': '\xED\xB0\x80A', 'error': true},
    {'text': '\uDC00\uD834\uDF06\uDC00', 'encoded': '\xED\xB0\x80\xF0\x9D\x8C\x86\xED\xB0\x80', 'error': true},
    {'text': '\uDEEE', 'encoded': '\xED\xBB\xAE', 'error': true},
    {'text': '\uDFFF', 'encoded': '\xED\xBF\xBF', 'error': true},

    // 4-byte
    {'text': '\uD800\uDC00', 'encoded': '\xF0\x90\x80\x80'},
    {'text': '\uD834\uDF06', 'encoded': '\xF0\x9D\x8C\x86'},
    {'text': '\uDBFF\uDFFF', 'encoded': '\xF4\x8F\xBF\xBF'},

    // examples
    {
        'text': '我能吞下玻璃而不伤身体。',
        'encoded': '\xe6\x88\x91\xe8\x83\xbd\xe5\x90\x9e\xe4\xb8\x8b\xe7\x8e\xbb\xe7\x92\x83\xe8\x80\x8c\xe4\xb8\x8d\xe4\xbc\xa4\xe8\xba\xab\xe4\xbd\x93\xe3\x80\x82'
    },
    {
        'text': '我能吞下玻璃而不傷身體。',
        'encoded': '\xe6\x88\x91\xe8\x83\xbd\xe5\x90\x9e\xe4\xb8\x8b\xe7\x8e\xbb\xe7\x92\x83\xe8\x80\x8c\xe4\xb8\x8d\xe5\x82\xb7\xe8\xba\xab\xe9\xab\x94\xe3\x80\x82'
    },
    {
        'text': 'ᚠᛇᚻ᛫ᛒᛦᚦ᛫ᚠᚱᚩᚠᚢᚱ᛫ᚠᛁᚱᚪ᛫ᚷᛖᚻᚹᛦᛚᚳᚢᛗ',
        'encoded': '\xe1\x9a\xa0\xe1\x9b\x87\xe1\x9a\xbb\xe1\x9b\xab\xe1\x9b\x92\xe1\x9b\xa6\xe1\x9a\xa6\xe1\x9b\xab\xe1\x9a\xa0\xe1\x9a\xb1\xe1\x9a\xa9\xe1\x9a\xa0\xe1\x9a\xa2\xe1\x9a\xb1\xe1\x9b\xab\xe1\x9a\xa0\xe1\x9b\x81\xe1\x9a\xb1\xe1\x9a\xaa\xe1\x9b\xab\xe1\x9a\xb7\xe1\x9b\x96\xe1\x9a\xbb\xe1\x9a\xb9\xe1\x9b\xa6\xe1\x9b\x9a\xe1\x9a\xb3\xe1\x9a\xa2\xe1\x9b\x97'
    },
    {
        'text': 'Sîne klâwen durh die wolken sint geslagen',
        'encoded': '\x53\xc3\xae\x6e\x65\x20\x6b\x6c\xc3\xa2\x77\x65\x6e\x20\x64\x75\x72\x68\x20\x64\x69\x65\x20\x77\x6f\x6c\x6b\x65\x6e\x20\x73\x69\x6e\x74\x20\x67\x65\x73\x6c\x61\x67\x65\x6e'
    },
    {
        'text': 'τοῦ Ὀδυσσέα Ἐλύτη',
        'encoded': '\xcf\x84\xce\xbf\xe1\xbf\xa6\x20\xe1\xbd\x88\xce\xb4\xcf\x85\xcf\x83\xcf\x83\xce\xad\xce\xb1\x20\xe1\xbc\x98\xce\xbb\xcf\x8d\xcf\x84\xce\xb7'
    },
    {
        'text': 'რუსთაველი',
        'encoded': '\xe1\x83\xa0\xe1\x83\xa3\xe1\x83\xa1\xe1\x83\x97\xe1\x83\x90\xe1\x83\x95\xe1\x83\x94\xe1\x83\x9a\xe1\x83\x98'
    },
    {
        'text': 'யாமறிந்த',
        'encoded': '\xe0\xae\xaf\xe0\xae\xbe\xe0\xae\xae\xe0\xae\xb1\xe0\xae\xbf\xe0\xae\xa8\xe0\xaf\x8d\xe0\xae\xa4'
    },
    {
        'text': 'ನಿತ್ಯವೂ',
        'encoded': '\xe0\xb2\xa8\xe0\xb2\xbf\xe0\xb2\xa4\xe0\xb3\x8d\xe0\xb2\xaf\xe0\xb2\xb5\xe0\xb3\x82'
    },
    {
        'text': '私はガラスを食べられます',
        'encoded': '\xe7\xa7\x81\xe3\x81\xaf\xe3\x82\xac\xe3\x83\xa9\xe3\x82\xb9\xe3\x82\x92\xe9\xa3\x9f\xe3\x81\xb9\xe3\x82\x89\xe3\x82\x8c\xe3\x81\xbe\xe3\x81\x99'
    },
    {
        'text': '나는 유리를 먹을 수 있어요',
        'encoded': '\xeb\x82\x98\xeb\x8a\x94\x20\xec\x9c\xa0\xeb\xa6\xac\xeb\xa5\xbc\x20\xeb\xa8\xb9\xec\x9d\x84\x20\xec\x88\x98\x20\xec\x9e\x88\xec\x96\xb4\xec\x9a\x94'
    },
];

describe("UTF8Utils", function () {
    it("testNormal", function () {
        for (let i = 0; i < data.length; i++) {
            let item = data[i];

            try {
                let encoded = UTF8Utils.encodeUTF8(item.text);
                assert(item.text == UTF8Utils.decodeUTF8(encoded));

                let realEncoded = toUint8Array(item.encoded);
                assert(arrayEquals(encoded, realEncoded));

                assert(item.error !== true);
            } catch (e) {
                assert(item.error);
            }
        }
    });
});

function arrayEquals(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length != b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i] != b[i]) {
            return false;
        }
    }
    return true;
}

function toUint8Array(s: string): Uint8Array {
    let arr = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) {
        arr[i] = s.charCodeAt(i);
    }
    return arr;
}
