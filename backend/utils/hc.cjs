const fs = require('fs');
const path = require('path');
const sys = require('process');
const sodium = require('libsodium-wrappers');

let isSodiumReady = false;
sodium.ready.then(() => { isSodiumReady = true; });

// ==========================================
// 1. KONSTANTA UTAMA (Sesuai Python)
// ==========================================
const XOR_KEY = Buffer.from([0xe3, 0x82, 0xe4, 0xb8, 0xad, 0xc3, 0x86, 0xf0, 0x9f, 0x92, 0x93]);

const CHACHA_KEYS = {
    1: Buffer.from("2be4342943c6f91ff58987f41a1aafd179eeb4e053f5cea55b11d6a7db58bd7d", "hex"),
    2: Buffer.from("3380aa278b744ba5b529a7f32fa803e48749280dae378345d9b526cf1dbce372", "hex"),
    3: Buffer.from("cea9305c95168b162a335b137c61983b8df54e6375da01136547890f14c5fac3", "hex"),
    4: Buffer.from("4beeace0e42bae8f29470cf40cf2dfacd5f4e1f751912bf52e803c8c85792193", "hex"),
    5: Buffer.from("f8e5f6ebea90558eb32229da24fd0fb7d813091dafe89bb2954fda33b4c60f63", "hex"),
    6: Buffer.from("81342f558a6273bac4548d473f54c4ffc7c41747dee81369acab9c787d41ab9c", "hex"),
    7: Buffer.from("45635e6fc70486e2fd10d3c2b4780f02d0b4c5f4aa929fc54f86bb8fa4417944", "hex"),
    8: Buffer.from("3d632a251c9820f2baf83e15498d27548fc67921cb437f8ce48505989378adea", "hex"),
};

const NONCE = Buffer.alloc(8, 0xdb);

const EASYPRO_KEY = Buffer.from([
    0xd5, 0xd4, 0xd3, 0xd2, 0xd1, 0xd0, 0xcf, 0xce, 0xcd, 0xcc,
    0xbd, 0xbc, 0xbb, 0xba, 0xb9, 0xb8, 0xb7, 0xb6, 0xb5, 0xb4,
]);

const EASYPRO_DEF_KEY = Buffer.from("0f0e0d0c0b0a09080706050403020100fffefdfc", "hex");
const EASYPRO_JKL_13_KEY = Buffer.from("08090a0b0c0d0e0f1111050403020100fffefdfc", "hex");
const EASYPRO_JKL_14_KEY = Buffer.from("edecebeae9e8e7e6e5e4050403020100fffefdfc", "hex");
const EASYPRO_JKL_15_KEY = Buffer.from("edecebeae9e8e7e6e5e4d5d4d3d2d1d0cfcecdcc", "hex");

const BRAILLE_TO_NIBBLE = {
    '\u2801': 0, '\u2803': 1, '\u2809': 2, '\u2819': 3, '\u2811': 4, '\u280b': 5, '\u281b': 6, '\u2813': 7,
    '\u280a': 8, '\u281a': 9, '\u2805': 10, '\u2807': 11, '\u280d': 12, '\u281d': 13, '\u2815': 14, '\u280f': 15,
};

const FIELD_NAMES = [
    "payload", "proxy", "lockAllConfig", "blockedByRoot", "expiryTime", "noteEnabled", "notes",
    "sshField", "mobileDataAndLockProvider", "unlockUserAndPass", "ovpnConfig", "ovpnUserAndPass",
    "sni", "unlockUserAndPass2", "psiphon", "blockedByHwid", "cloudconfig", "hwid", "name",
    "blockArea", "connectionMode", "blockedByPassword", "password", "extraSniffer", "psiphon2",
    "v2rayEnabled", "v2rayConfig", "version", "slowdnsEnabled", "slowdnsNameserver", "slowdnsKey", "slowdnsServer"
];

const PROTECTION_KEYS = { 'verCfg': 'b', 'url': 'c', 'blockApps': 'd', 'password': 'e' };
const OUTER_FIELD_NAMES = { 'hwid': 'bb', 'isLoginHwid': 'aa', 'verApp': 'vw', 'expiryTime': 'dc', 'areaCode': 'ed', 'area': 'fe', 'pingUrl': 'rq' };

// ==========================================
// 2. CRYPTO & VALIDATION HELPER FUNCTIONS
// ==========================================
function crypto_chacha_decrypt(ciphertext, key, nonce) {
    try {
        return Buffer.from(sodium.crypto_aead_chacha20poly1305_decrypt(null, ciphertext, null, nonce, key));
    } catch (e) {
        throw new Error("Authentication failed");
    }
}

function crypto_chacha_decrypt_any(ciphertext, nonce) {
    for (const kv of [8, 2, 3, 4, 1, 5, 6, 7]) {
        try {
            const pt = sodium.crypto_aead_chacha20poly1305_decrypt(null, ciphertext, null, nonce, CHACHA_KEYS[kv]);
            return { kv, text: Buffer.from(pt).toString('utf8') };
        } catch (e) {}
    }
    return null;
}

function crypto_chacha_encrypt(plaintext, key, nonce) {
    return Buffer.from(sodium.crypto_aead_chacha20poly1305_encrypt(plaintext, null, null, nonce, key));
}

function _h_encode(text) {
    if (!text) return "";
    return Array.from(text).map(c => c.charCodeAt(0).toString(16)).join("");
}

function _hex2bin_nonce(text, size = 8, fill = 0xdb) {
    const out = Buffer.alloc(size, fill);
    const clipped = text.slice(0, 17);
    let pos = 0, idx = 0;
    while (idx < size && pos + 1 < clipped.length) {
        const pair = clipped.slice(pos, pos + 2);
        if (!/^[0-9a-fA-F]{2}$/.test(pair)) break;
        out[idx] = parseInt(pair, 16);
        idx++;
        pos += 2;
    }
    return out;
}

function xor_deobfuscate(raw_bytes) {
    const text = raw_bytes.toString('utf8');
    const hex_bytes = Buffer.alloc(text.length);
    for (let i = 0; i < text.length; i++) {
        hex_bytes[i] = text.charCodeAt(i) ^ XOR_KEY[i % XOR_KEY.length];
    }
    return Buffer.from(hex_bytes.toString('utf8'), 'hex');
}

function xor_obfuscate(bin_bytes) {
    const text = bin_bytes.toString('hex');
    let outStr = "";
    for (let i = 0; i < text.length; i++) {
        const cp = text.charCodeAt(i) ^ XOR_KEY[i % XOR_KEY.length];
        outStr += String.fromCharCode(cp);
    }
    return Buffer.from(outStr, 'utf8');
}

function _is_hex_encrypted(part) {
    return part && part.length >= 32 && part.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(part);
}

// ==========================================
// 3. LOGIKA VALIDASI TEXT SCORE & EMBEDDED HEX
// ==========================================
function _text_score(text, field_index) {
    if (!text) return -1000;
    let printable = 0;
    for (let i = 0; i < text.length; i++) {
        const ch = text.charCodeAt(i);
        if (ch < 32 && ch !== 10 && ch !== 13 && ch !== 9) return -1000;
        if ((ch >= 32 && ch < 127) || ch === 10 || ch === 13 || ch === 9) printable++;
    }
    let score = printable / Math.max(text.length, 1);
    if (text.includes('\ufffd')) score -= 1.0;
    if (field_index === 7 && text.includes('@') && text.includes(':')) score += 10.0;
    if (field_index === 12 && /^[A-Za-z0-9._-]+$/.test(text)) score += 5.0;
    if (field_index === 30 && /^[0-9a-fA-F]{16,}$/.test(text)) score += 5.0;
    return score;
}

function is_easypro_encoded(s) {
    if (!s || s.length < 4 || s.length % 4 !== 0) return false;
    return /^[A-Za-z0-9+/=]+$/.test(s);
}

function easypro_decode(encoded_str) {
    try {
        const xored = Buffer.from(encoded_str, 'base64');
        const intermediate = Buffer.alloc(xored.length);
        for (let i = 0; i < xored.length; i++) {
            intermediate[i] = xored[i] ^ EASYPRO_KEY[i % EASYPRO_KEY.length];
        }
        return Buffer.from(intermediate.toString('utf8'), 'base64').toString('utf8');
    } catch { return null; }
}

function _easypro_xor_filter_bytes(data, key) {
    let out = "";
    for (let i = 0; i < data.length; i++) {
        if (data[i] <= 0x7F) out += String.fromCharCode(data[i] ^ key[i % key.length]);
    }
    return out;
}

function _try_legacy_easypro_decode(text, field_index) {
    if (!is_easypro_encoded(text)) return null;
    const candidates = [];
    const pairs = [[1,5, EASYPRO_JKL_15_KEY], [1,4, EASYPRO_JKL_14_KEY], [1,3, EASYPRO_JKL_13_KEY], [1,2, EASYPRO_DEF_KEY]];

    for (const [f, s, key] of pairs) {
        try {
            const decodedB64 = Buffer.from(text, 'base64');
            const filtered = _easypro_xor_filter_bytes(decodedB64, key);
            const finalStr = Buffer.from(filtered, 'base64').toString('utf8');
            candidates.push({ text: finalStr, score: _text_score(finalStr, field_index) });
        } catch {}
    }
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].score > 0 ? candidates[0].text : null;
}

function _try_easypro_decode(text, field_index) {
    if (!is_easypro_encoded(text) || /^[0-9a-fA-F]{16,}$/.test(text)) return null;
    const decoded = easypro_decode(text);
    if (!decoded) return null;
    if (is_braille_hex(decoded)) return decoded;
    if (_text_score(decoded, field_index) <= 0) return null;
    return decoded;
}

// ==========================================
// Penempatan Braille Hex Decoder
// ==========================================
function is_braille_hex(s) {
    if (!s || s.length % 2 !== 0) return false;
    for (let i = 0; i < s.length; i++) {
        if (!(s[i] in BRAILLE_TO_NIBBLE)) return false;
    }
    return true;
}

// ==========================================
// Penempatan Braille Hex Decoder
// ==========================================
function braille_hex_decode(s) {
    const result = Buffer.alloc(s.length / 2);
    for (let i = 0; i < s.length; i += 2) {
        const hi = BRAILLE_TO_NIBBLE[s[i]];
        const lo = BRAILLE_TO_NIBBLE[s[i + 1]];
        result[i / 2] = (hi << 4) | lo;
    }
    return result.toString('utf8');
}

function _should_decrypt_embedded_hex(text, field_index) {
    if (field_index === 14 || field_index === 24) return true;
    return !/^[0-9a-fA-F]{16,}$/.test(text || "");
}

function _decrypt_embedded_hex(text) {
    if (!/[0-9a-fA-F]{32}/.test(text)) return text;

    let result = "";
    let i = 0;
    while (i < text.length) {
        const remainingStr = text.slice(i);
        const match = remainingStr.match(/^[0-9a-fA-F]{32,}/);

        if (!match) {
            result += text[i];
            i++;
            continue;
        }

        const hex_run = match[0];
        let pos = 0;

        while (pos < hex_run.length) {
            const remaining_len = hex_run.length - pos;
            if (remaining_len < 32) {
                result += hex_run.slice(pos);
                pos = hex_run.length;
                break;
            }

            let found = false;
            const max_byte_len = Math.floor(remaining_len / 2);
            for (let byte_len = 16; byte_len <= max_byte_len; byte_len++) {
                const chunk_hex = hex_run.slice(pos, pos + byte_len * 2);
                if (chunk_hex.length !== byte_len * 2) continue;

                try {
                    const pt = sodium.crypto_aead_chacha20poly1305_decrypt(
                        null,
                        Buffer.from(chunk_hex, 'hex'),
                        null,
                        NONCE,
                        CHACHA_KEYS[8]
                    );
                    result += Buffer.from(pt).toString('utf8');
                    pos += byte_len * 2;
                    found = true;
                    break;
                } catch (e) {
                    continue;
                }
            }

            if (!found) {
                result += hex_run.slice(pos);
                pos = hex_run.length;
            }
        }
        i += hex_run.length;
    }
    return result;
}

function decode_config_part(part, nonce = NONCE, field_index = null) {
    if (!part) return "";
    let inner = part;

    if (_is_hex_encrypted(part)) {
        const use_nonce = (field_index === 22) ? NONCE : nonce;
        let dec = crypto_chacha_decrypt_any(Buffer.from(part, 'hex'), use_nonce);

        if (dec === null) {
            if (!use_nonce.equals(NONCE)) {
                dec = crypto_chacha_decrypt_any(Buffer.from(part, 'hex'), NONCE);
            }
            if (dec === null) {
                inner = _decrypt_embedded_hex(part);
                if (inner === part) {
                    return part;
                }
            } else {
                inner = dec.text;
            }
        } else {
            inner = dec.text;
        }
    } else {
        inner = part;
    }

    const legacyDec = _try_legacy_easypro_decode(inner, field_index);
    if (legacyDec !== null) inner = legacyDec;

    if (_should_decrypt_embedded_hex(inner, field_index)) {
        inner = _decrypt_embedded_hex(inner);
    }

    const easyDec = _try_easypro_decode(inner, field_index);
    if (easyDec !== null) inner = easyDec;

    if (is_braille_hex(inner)) {
        inner = braille_hex_decode(inner);
    }

    if ((field_index === 7 || field_index === 11) && inner.includes('@')) {
        inner = decode_ssh_credentials(inner);
    }

    return inner;
}

function _discover_salt_nonce(parts, outer_json) {
    const hex_parts = parts.filter(_is_hex_encrypted);
    if (hex_parts.length === 0) return NONCE;

    const counts = {};
    hex_parts.forEach(p => counts[p] = (counts[p] || 0) + 1);
    const sentinel_val = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);

    if (crypto_chacha_decrypt_any(Buffer.from(sentinel_val, 'hex'), NONCE) !== null) {
        return NONCE;
    }

    const candidates = new Set([""]);
    if (parts.length > 17) candidates.add(parts[17]);

    const a_dict = outer_json.a || {};
    Object.entries(a_dict).forEach(([k, hex_val]) => {
        if (k === 'xy' || k === 'uv') return;
        try {
            const dec = crypto_chacha_decrypt(Buffer.from(hex_val, 'hex'), CHACHA_KEYS[8], NONCE);
            const txt = dec.toString('utf8');
            if (txt !== 'true' && txt !== 'false') candidates.add(txt);
        } catch (e) {}
    });

    for (const v1 of candidates) {
        for (const v2 of candidates) {
            const salt = _h_encode(v1 + v2);
            const nonce = _hex2bin_nonce(salt);
            if (nonce.equals(NONCE)) continue;
            if (crypto_chacha_decrypt_any(Buffer.from(sentinel_val, 'hex'), nonce) !== null) {
                return nonce;
            }
        }
    }
    return NONCE;
}

function decode_dot_hash_string(encoded) {
    if (!encoded || typeof encoded !== 'string' || !encoded.includes('.')) {
        return null;
    }
    const parts = encoded.split('.');
    if (parts.length < 2 || parts.length % 2 !== 0) {
        return null;
    }

    const numbers = [];
    for (let i = 0; i < parts.length; i++) {
        const num = Number(parts[i]);
        if (isNaN(num)) return null;
        numbers.push(num);
    }

    const n_chars = Math.floor(numbers.length / 2);
    const shifts = [];
    for (let i = 1; i < numbers.length; i += 2) {
        const shift = numbers[i] - n_chars;
        if (shift < 1 || shift > 24) {
            return null;
        }
        shifts.push(shift);
    }

    const resultBytes = [];
    for (let i = 0; i < n_chars; i++) {
        const combined_plus_len = numbers[2 * i];
        const shift = shifts[i];
        const combined = combined_plus_len - n_chars;
        const byte_val = (combined >> shift) & 0xFF;
        resultBytes.push(byte_val);
    }

    // Menggunakan Buffer agar mendukung karakter ASCII maupun UTF-8 dengan sempurna
    return Buffer.from(resultBytes).toString('utf8');
}

// ============================================================================
// 2. FUNGSI ENCODE (Rumus Inversi Matematika: Teks -> Angka Bertitik)
// ============================================================================
function encode_dot_hash_string(plainText) {
    if (!plainText) return "";

    const buf = Buffer.from(plainText, 'utf8');
    const n_chars = buf.length;
    if (n_chars === 0) return "";

    const parts = [];
    for (let i = 0; i < n_chars; i++) {
        const byte_val = buf[i];

        // 1. Pilih nilai shift acak antara 1 sampai 20 (batas valid di script adalah 1..24)
        const shift = Math.floor(Math.random() * 20) + 1;

        // 2. Tambahkan noise acak di bit-bit rendah (di bawah posisi shift) agar angka bervariasi
        const lowNoise = Math.floor(Math.random() * (1 << shift));

        // 3. Susun nilai combined agar saat di-hitung (combined >> shift) & 0xFF mengembalikan byte_val
        const combined = (byte_val << shift) | lowNoise;

        // 4. Tambahkan panjang string (n_chars) sesuai aturan kebalikan dari dekode
        const combined_plus_len = combined + n_chars;
        const shift_plus_len = shift + n_chars;

        parts.push(`${combined_plus_len}.${shift_plus_len}`);
    }

    return parts.join('.');
}
function decode_ssh_credentials(sshString) {
    // 1. Cek apakah string mengandung format user@host atau host@user:pass
    if (!sshString || !sshString.includes('@')) return sshString;

    const parts = sshString.split('@');
    const hostPort = parts[0];
    const credentials = parts[1]; // Bagian "1053645221.22...:1053641814.7"

    if (!credentials || !credentials.includes(':')) return sshString;

    const [encUser, encPass] = credentials.split(':');

    // 2. Cek apakah formatnya deretan angka bertitik
    if (/^[0-9.-]+$/.test(encUser)) {
        const decodedUser = decode_dot_hash_string(encUser); // Fungsi rumus dari Python
        const decodedPass = decode_dot_hash_string(encPass);
        return `${hostPort}@${decodedUser}:${decodedPass}`;
    }

    return sshString;
}

function encode_ssh_credentials(sshString) {
    if (!sshString || !sshString.includes('@')) return sshString;

    const parts = sshString.split('@');
    const hostPort = parts[0];
    const credentials = parts[1]; // Contoh: "iniuser:inipass"

    if (!credentials || !credentials.includes(':')) return sshString;

    const [plainUser, plainPass] = credentials.split(':');

    // Ubah string teks biasa menjadi format angka bertitik (sesuaikan dengan rumus Python-mu)
    const encodedUser = encode_dot_hash_string(plainUser);
    const encodedPass = encode_dot_hash_string(plainPass);

    return `${hostPort}@${encodedUser}:${encodedPass}`;
}
// ==========================================
// 4. CORE DECODE PIPELINE (DIPESAN KHUSUS UNTUK V2RAY)
// ==========================================
function decode_hc_file(filepath) {
    const raw = fs.readFileSync(filepath);
    const encrypted = xor_deobfuscate(raw);
    const outer_pt = crypto_chacha_decrypt(encrypted, CHACHA_KEYS[6], NONCE);
    const outer_json = JSON.parse(outer_pt.toString('utf8'));

    const result = {
        format: "",
        uuid: "",
        config: {},
        metadata: {},
        protections: {}
    };

    if ('cfg' in outer_json) {
        result.format = "new";
        if (outer_json.verCfg !== undefined) result.verCfg = outer_json.verCfg;

        Object.keys(outer_json.cfg).forEach(k => {
            if (k !== 'content') result.metadata[k] = outer_json.cfg[k];
        });

        const content_hex = outer_json.cfg.content;
        if (_is_hex_encrypted(content_hex)) {
            const content_pt = crypto_chacha_decrypt(Buffer.from(content_hex, 'hex'), CHACHA_KEYS[2], NONCE).toString('utf8');
            const parts = content_pt.split("[splitConfig]");

            parts.forEach((part, i) => {
                const fname = FIELD_NAMES[i] || `field${i}`;
                let decodedVal = decode_config_part(part, NONCE, i);

                // PENYESUAIAN: Parsing Otomatis v2rayConfig menjadi Objek JSON Asli
                if (fname === 'v2rayConfig' && decodedVal) {
                    try { decodedVal = JSON.parse(decodedVal); } catch (e) {}
                }
                result.config[fname] = decodedVal;
            });
        }
        return result;

    } else if ('a' in outer_json) {
        result.format = "old";
        const a_dict = outer_json.a;

        const uuid = crypto_chacha_decrypt(Buffer.from(a_dict.uv, 'hex'), CHACHA_KEYS[8], NONCE).toString('utf8');
        result.uuid = uuid;

        const xy_pt = crypto_chacha_decrypt(Buffer.from(a_dict.xy, 'hex'), CHACHA_KEYS[2], NONCE).toString('utf8');
        const sep = crypto_chacha_encrypt(Buffer.from(uuid, 'utf8'), CHACHA_KEYS[8], NONCE).toString('hex');
        const parts = xy_pt.split(sep);

        const salt_nonce = _discover_salt_nonce(parts, outer_json);

        Object.keys(PROTECTION_KEYS).forEach(pname => {
            const key = PROTECTION_KEYS[pname];
            if (outer_json[key] !== undefined) {
                try {
                    result.protections[pname] = crypto_chacha_decrypt(Buffer.from(outer_json[key], 'hex'), CHACHA_KEYS[8], NONCE).toString('utf8');
                } catch {
                    result.protections[pname] = outer_json[key];
                }
            }
        });

        Object.keys(a_dict).forEach(k => {
            if (k !== 'xy' && k !== 'uv') {
                const displayKey = Object.keys(OUTER_FIELD_NAMES).find(key => OUTER_FIELD_NAMES[key] === k) || k;
                try {
                    result.metadata[displayKey] = crypto_chacha_decrypt(Buffer.from(a_dict[k], 'hex'), CHACHA_KEYS[8], NONCE).toString('utf8');
                } catch {
                    result.metadata[displayKey] = a_dict[k];
                }
            }
        });

        parts.forEach((part, i) => {
            const fname = FIELD_NAMES[i] || `field${i}`;
            let decodedVal = decode_config_part(part, salt_nonce, i);

            // PENYESUAIAN: Parsing Otomatis v2rayConfig menjadi Objek JSON Asli
            if (fname === 'v2rayConfig' && decodedVal) {
                try { decodedVal = JSON.parse(decodedVal); } catch (e) {}
            }
            result.config[fname] = decodedVal;
        });

        return result;
    }
    throw new Error("Format biner berkas .hc tidak dikenal atau rusak.");
}

// ==========================================
// 5. CORE ENCODE PIPELINE (PERBAIKAN & MENDUKUNG OBJECT)
// ==========================================
function encode_hc_file(jsonObj) {
    let outer_json = {};

    const configObj = jsonObj.config || jsonObj.raw_values || {};
    const encodingsObj = jsonObj.encodings || {};
    const totalFields = Object.keys(configObj).length;
    const parts = [];
    const isLockAll = configObj.lockAllConfig === "true";
    const isUserPassLocked = configObj.unlockUserAndPass === "false";
    const shouldScrambleCredentials = isLockAll && isUserPassLocked;

    const DEFAULT_ENCODINGS = {
        "payload": ["chacha_8_hex_nonce_default", "easypro"],
        "proxy": ["easypro"],
        "sshField": ["chacha_8_hex_nonce_default", "easypro"],
        "ovpnConfig": ["chacha_8_hex_nonce_default"],
        "ovpnUserAndPass": ["chacha_8_hex_nonce_default"],
        "sni": ["chacha_8_hex_nonce_default", "easypro"],
        "password": ["chacha_8_hex_nonce_default"],
        "v2rayConfig": ["chacha_8_hex_nonce_default", "easypro"],
        "slowdnsNameserver": ["chacha_8_hex_nonce_default"],
        "slowdnsKey": ["chacha_8_hex_nonce_default"],
        "slowdnsServer": ["chacha_8_hex_nonce_default"],
        "psiphon2": ["embedded_hex"]
    };

    const pwd = configObj.password ? String(configObj.password) : "";
    const hwid = configObj.hwid ? String(configObj.hwid) : "";
    const salt = _h_encode(pwd + hwid);
    const salt_nonce = _hex2bin_nonce(salt);

    const NIBBLE_TO_BRAILLE = Object.fromEntries(
        Object.entries(BRAILLE_TO_NIBBLE).map(([ch, num]) => [num, ch])
    );

    function easypro_encode(text) {
        const b64_1 = Buffer.from(text, 'utf8').toString('base64');
        const buf_1 = Buffer.from(b64_1, 'utf8');
        const intermediate = Buffer.alloc(buf_1.length);
        for (let i = 0; i < buf_1.length; i++) {
            intermediate[i] = buf_1[i] ^ EASYPRO_KEY[i % EASYPRO_KEY.length];
        }
        return intermediate.toString('base64');
    }

    function braille_hex_encode(text) {
        const buf = Buffer.from(text, 'utf8');
        let res = "";
        for (let i = 0; i < buf.length; i++) {
            const byte = buf[i];
            const hi = (byte >> 4) & 0x0F;
            const lo = byte & 0x0F;
            res += NIBBLE_TO_BRAILLE[hi] + NIBBLE_TO_BRAILLE[lo];
        }
        return res;
    }

    for (let i = 0; i < Math.max(totalFields, FIELD_NAMES.length); i++) {
        const fname = FIELD_NAMES[i] || `field${i}`;
        let val = configObj[fname] !== undefined ? configObj[fname] : "";

        if (val !== "") {
            // PENYESUAIAN: Jika bertipe Objek (seperti v2rayConfig terstruktur), ubah ke string JSON padat
            let current = (typeof val === 'object' && val !== null) ? JSON.stringify(val) : String(val);
				if ((fname === 'sshField' || fname === 'ovpnUserAndPass') && current.includes('@')) {
                if (shouldScrambleCredentials) {
                    // Hanya ubah ke deretan angka bertitik jika statusnya TERKUNCI
                    current = encode_ssh_credentials(current);
                } else {
//                    console.log(`[INFO] Kolom ${fname} dibiarkan plain-text karena proteksi dinonaktifkan.`);
                }
            }
            const encodings = encodingsObj[fname] !== undefined ? encodingsObj[fname] : (DEFAULT_ENCODINGS[fname] || []);

            for (let j = encodings.length - 1; j >= 0; j--) {
                const enc = encodings[j];
                if (enc === "easypro") {
                    current = easypro_encode(current);
                } else if (enc === "chacha_8_hex_nonce_default" || enc === "embedded_hex") {
                    const encrypted = crypto_chacha_encrypt(Buffer.from(current, 'utf8'), CHACHA_KEYS[8], NONCE);
                    current = encrypted.toString('hex');
                } else if (enc === "chacha_8_hex_nonce_salt") {
                    const encrypted = crypto_chacha_encrypt(Buffer.from(current, 'utf8'), CHACHA_KEYS[8], salt_nonce);
                    current = encrypted.toString('hex');
                } else if (enc === "braille_hex") {
                    current = braille_hex_encode(current);
                }
            }
            val = current;
        }

        parts.push(val);
    }

    if (jsonObj.format === "new") {
        const content_pt = parts.join("[splitConfig]");
        const content_hex = crypto_chacha_encrypt(Buffer.from(content_pt, 'utf8'), CHACHA_KEYS[2], NONCE).toString('hex');
        outer_json = { cfg: { ...jsonObj.metadata, content: content_hex } };
        if (jsonObj.verCfg !== undefined) outer_json.verCfg = jsonObj.verCfg;

    } else if (jsonObj.format === "old") {
        const uuid = jsonObj.uuid || "";
        const sep = crypto_chacha_encrypt(Buffer.from(uuid, 'utf8'), CHACHA_KEYS[8], NONCE).toString('hex');
        const xy_pt = parts.join(sep);

        const xy_hex = crypto_chacha_encrypt(Buffer.from(xy_pt, 'utf8'), CHACHA_KEYS[2], NONCE).toString('hex');
        const uv_hex = crypto_chacha_encrypt(Buffer.from(uuid, 'utf8'), CHACHA_KEYS[8], NONCE).toString('hex');

        const a_dict = { xy: xy_hex, uv: uv_hex };
        if (jsonObj.metadata) {
            Object.entries(jsonObj.metadata).forEach(([key, val]) => {
                const shortKey = OUTER_FIELD_NAMES[key] || key;
                if (val !== "") {
                    a_dict[shortKey] = crypto_chacha_encrypt(Buffer.from(String(val), 'utf8'), CHACHA_KEYS[8], NONCE).toString('hex');
                } else {
                    a_dict[shortKey] = "";
                }
            });
        }

        outer_json = { a: a_dict };

        if (jsonObj.protections) {
            Object.entries(jsonObj.protections).forEach(([key, val]) => {
                const shortKey = PROTECTION_KEYS[key] || key;
                if (val !== "") {
                    outer_json[shortKey] = crypto_chacha_encrypt(Buffer.from(String(val), 'utf8'), CHACHA_KEYS[8], NONCE).toString('hex');
                }
            });
        }
    }

    const outer_pt = Buffer.from(JSON.stringify(outer_json), 'utf8');
    const outer_encrypted = crypto_chacha_encrypt(outer_pt, CHACHA_KEYS[6], NONCE);
    return xor_obfuscate(outer_encrypted);
}

// ==========================================
// 6. RUNNER CLI
// ==========================================
function main() {
    const args = process.argv.slice(2);
    if (args.length < 3 || (args[0] !== 'decode' && args[0] !== 'encode')) {
        console.log("Cara Penggunaan:\n  node hc.js decode <input.hc> <output.json>\n  node hc.js encode <input.json> <output.hc>");
        process.exit(1);
    }
    const [mode, inputFile, outputFile] = args;
    try {
        if (mode === 'decode') {
            const result = decode_hc_file(inputFile);
            fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), 'utf8');
            console.log(`[SUKSES] Berkas berhasil di-decode dengan config bersih murni -> ${outputFile}`);
        } else if (mode === 'encode') {
            const rawJson = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
            const resultBuffer = encode_hc_file(rawJson);
            fs.writeFileSync(outputFile, resultBuffer);
            console.log(`[SUKSES] Berkas biner berhasil di-encode ulang menjadi .hc -> ${outputFile}`);
        }
    } catch (error) {
        console.error("Terjadi Kegagalan:", error.message);
        process.exit(1);
    }
}

module.exports = {
  decode_hc_file,
  encode_hc_file,
  waitUntilReady: () => sodium.ready
};
