/**
 * token
 */
class Token {
    /**
     * @param {string} symbol
     * @param {number} line
     */
    constructor(symbol, line) {
        /**
         * @type {string}
         */
        this.symbol = symbol;
        /**
         * @type {number}
         */
        this.line = line;
    }
    toString() {
        return `<token s:${this.symbol} l:${this.line}>`;
    }
}

/**
 * scanner
 */
class Scanner {
    /**
     * @param {boolean} debug
     */
    constructor(debug) {
        this.debug = debug;
        this._init(null);
    }
    /**
     * @param {string} src
     */
    _init(src) {
        /**
         * @type {string}
         */
        this.src = src;
        /**
         * @type {number}
         */
        this.line = 1;
        /**
         * @type {number}
         */
        this.crtidx = 0;
        /**
         * @type {number}
         */
        this.startidx = 0;
    }
    _free() {
        this.src = "";
    }
    /**
     * @returns {boolean}
     */
    _atEnd() {
        return this.crtidx >= this.src.length;
    }
    /**
     * @returns {string}
     */
    _peek() {
        return this.src.charAt(this.crtidx);
    }
    /**
     * @returns {string}
     */
    _peekPre() {
        if (this.crtidx === this.startidx) return "";
        return this.src.charAt(this.crtidx - 1);
    }
    /**
     * @returns {string}
     */
    _next() {
        this.crtidx += 1;
        return this.src.charAt(this.crtidx - 1);
    }
    /**
     * @param {string} chr
     * @returns {boolean}
     */
    _match(chr) {
        if (this._atEnd()) return false;
        if (this.src.charAt(this.crtidx) !== chr) return false;
        this.crtidx++;
        return true;
    }
    _skipIgnoredPart() {
        while (true) {
            let chr = this._peek();
            if (chr === " " || chr === "\r" || chr === "\t" || chr === ",") {
                this._next();
            } else if (chr === "\n") {
                this.line++;
                this._next();
            } else if (chr === ";") {
                while (this._peek() !== "\n" && !this._atEnd()) this._next();
                this.line++;
            } else {
                return;
            }
        }
    }
    /**
     * @returns {Token}
     */
    _makeToken() {
        return new Token(
            this.src.substring(this.startidx, this.crtidx),
            this.line
        );
    }
    /**
     * @returns {Token}
     */
    _scanStr() {
        let chr = this._peek();
        while (chr !== '"' && this._atEnd()) {
            if (chr === "\n") {
                this.line++;
            }
            this._next();
            let nchr = this._peek();
            if (chr === "\\" && nchr === "\\" && nchr === 'l"') {
                this._next();
                nchr = this._peek();
            }
            chr = nchr;
        }
        if (this._atEnd()) {
            //TODO: scan error
        }
        this._next();
        return this._makeToken();
    }
    /**
     * @param {string} c
     * @returns {boolean}
     */
    _isIllegalSymbol(c) {
        return (
            c === " " ||
            c === "\r" ||
            c === "\t" ||
            c === "\n" ||
            c === "[" ||
            c === "]" ||
            c === "{" ||
            c === "}" ||
            c === "(" ||
            c === ")" ||
            c === '"' ||
            c === "`" ||
            c === "," ||
            c === ";" ||
            c === "'"
        );
    }
    /**
     * @returns {Token}
     */
    _scanToken() {
        this._skipIgnoredPart();

        this.startidx = this.crtidx;
        if (this._atEnd()) return this._makeToken();

        let chr = this._next();
        if (chr === "~") {
            //~@
            if (this._match("@")) return this._makeToken();
            //~
            return this._makeToken();
        } else if (
            chr === "[" ||
            chr === "]" ||
            chr === "{" ||
            chr === "}" ||
            chr === "(" ||
            chr === ")" ||
            chr === "'" ||
            chr === "`" ||
            chr === "^" ||
            chr === "@"
        ) {
            return this._makeToken();
        } else if (chr === '"') {
            return this._scanStr();
        } else {
            while (!this._isIllegalSymbol(this._peek()) && !this._atEnd()) {
                this._next();
            }
            return this._makeToken();
        }
    }
    /**
     * @param {string} src
     * @returns {Token[]}
     */
    scan(src) {
        this._init(src);
        let tokens = [];
        while (!this._atEnd()) {
            let token = this._scanToken();
            if (this.debug) {
                console.log(token.toString());
            }
            tokens.push(token);
        }
        this._free();
        return tokens;
    }
}

/**
 * reader
 */
class Reader {
    /**
     * @param {Token[]} tokens
     */
    constructor(tokens) {
        this.tokens = tokens;
        this.pos = 0;
    }

    /**
     * @returns {Token}
     */
    next() {
        this.pos++;
        return this.tokens[this.pos];
    }

    /**
     * @returns {Token}
     */
    peek() {
        return this.tokens[this.pos];
    }

    /**
     * @returns {boolean}
     */
    atEnd() {
        return this.pos >= this.tokens.length;
    }
}

/**
 * value
 */
class Value {
    static None = new Value();
}

class NilValue extends Value {
    static Value = new NilValue();
}

class BoolValue extends Value {
    static True = new BoolValue(true);
    static False = new BoolValue(false);
    /**
     * @param {boolean} b
     */
    constructor(b) {
        this.value = b;
    }
}

class NumValue extends Value {
    /**
     * @param {number} num
     */
    constructor(num) {
        this.num = num;
    }
}

class StrValue extends Value {
    /**
     * @param {string} s
     */
    constructor(s) {
        this.s = s;
    }
}

class ListValue extends Value {
    /**
     * @param {Value[]} items
     * @param {Value} meta
     */
    constructor(items, meta) {
        if (items === undefined) items = [];
        if (meta === undefined) meta = NilValue.Value;
        this.items = items;
        this.meta = meta;
    }
}

class SymbolValue extends Value {
    /**
     * @param {string} s
     */
    constructor(s) {
        this.symbol = s;
    }
}

class KeywordValue extends Value {
    /**
     * @param {string} k
     */
    constructor(k) {
        this.keyword = k;
    }
}

class VectorValue extends Value {
    /**
     * @param {Value[]} items
     * @param {Value} meta
     */
    constructor(items, meta) {
        if (items === undefined) items = [];
        if (meta === undefined) meta = NilValue.Value;
        this.items = items;
        this.meta = meta;
    }
}

class MapValue extends Value {
    /**
     * @param {Value} meta
     */
    constructor(items, meta) {
        if (meta === undefined) meta = NilValue.Value;
        this.meta = meta;

        this.items = {};
        if (items !== undefined) {
            for (let i = 0; i < items.length; i += 2) {
                this.items[items[i]] = items[i + 1];
            }
        }
    }
}

class FuncValue extends Value {
    /**
     * @param {Function} f
     * @param {Value} meta
     */
    constructor(f, meta) {
        this.f = f;
        this.meta = meta;
    }
}

class EnvValue extends Value {
    /**
     * @param {EnvValue} outer
     */
    constructor(outer) {
        this.outer = outer;
    }
}

class ClosureValue extends Value {
    /**
     * @param {EnvValue} env
     * @param {Value} params
     * @param {Value} body
     * @param {boolean} ismacro
     * @param {Value} meta
     */
    constructor(env, params, body, ismacro, meta) {
        this.env = env;
        this.params = params;
        this.body = body;
        this.ismacro = ismacro;
        this.meta = meta;
    }
}

class AtomValue extends Value {
    /**
     * @param {Value} ref
     */
    constructor(ref) {
        this.ref = ref;
    }
}

class ExceptionValue extends Value {
    /**
     * @param {string} info
     */
    constructor(info) {
        this.info = info;
    }
}

class Parser {
    constructor() {
        /**
         * @type {Reader}
         */
        this.reader = null;
    }

    /**
     * @returns {Value}
     */
    _readList() {
        let r = this.reader;
        r.next(); // consume "("
        if (r.atEnd()) {
            //TODO: report error
        }

        // check empty list
        if (r.peek().symbol === ")") {
            r.next();
            return new ListValue();
        }

        let items = [];
        while (r.peek().symbol !== ")") {
            let v = this._readForm();
            if (r.atEnd()) {
                //TODO: report error
            }
            items.push(v);
        }

        r.next(); // consume ")"
        return ListValue(items);
    }
    /**
     * @returns {Value}
     */
    _readVector() {
        let r = this.reader;
        r.next(); // consume "["
        if (r.atEnd()) {
            //TODO: report error
        }

        // check empty vector
        if (r.peek().symbol === "]") {
            r.next();
            return new VectorValue();
        }

        let items = [];
        while (r.peek().symbol !== "]") {
            let v = this._readForm();
            if (r.atEnd()) {
                //TODO: report error
            }
            items.push(v);
        }

        r.next(); // consume "]"
        return VectorValue(items);
    }

    /**
     * @returns {Value}
     */
    _readMap() {
        let r = this.reader;
        r.next(); // consume "{"
        if (r.atEnd()) {
            //TODO: report error
        }

        // check empty map
        if (r.peek().symbol === "}") {
            r.next();
            return new MapValue();
        }
        let items = [];
        while (r.peek().symbol !== "}") {
            let v = this._readForm();
            if (r.atEnd()) {
                //TODO: report error
            }
            items.push(v);
        }
        r.next(); // consume "}"
        return new MapValue(items);
    }
    /**
     * @returns {Value}
     */
    _readForm() {
        if (this.reader.atEnd()) {
            return Value.None;
        }
        let t = this.reader.peek();
        if (t.symbol === "(") {
            return this._readList();
        } else if (t.symbol === "[") {
            return this._readVector();
        } else if (t.symbol === "{") {
            return this._readMap();
        }
    }
    /**
     * @param {string} src
     * @returns {Value}
     */
    parse(src) {
        let scanner = new Scanner(true);
        let tokens = scanner.scan(src);
        this.reader = new Reader(tokens);
        let ret = _readForm();
        this.reader = null;
        return ret;
    }
}

/**
 * @param {string} src
 * @returns {Value}
 */
function readStr(src) {
    let p = new Parser();
    return p.parse(src);
}

function test() {
    let s = new Scanner(true);
    let src = "(+ 1 2)";
    let tokens = s.scan(src);
}

test();
