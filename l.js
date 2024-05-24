//#region Base Utils

// ------------------------------
// ---------- Base Utils --------
// ------------------------------

/**
 * @param {Array} a
 * @param {number} idx
 * @param {any} item
 * @returns {Array}
 */
function insert(a, idx, item) {
    // clone array
    let i = a.length;
    let ret = Array(i);
    while (i--) ret[i] = a[i];

    // insert item
    ret.splice(idx, 0, item);
    return ret;
}

// ------------------------------
// ---------- Base Utils End ----
// ------------------------------

// ------------------------------
// ---------- Error -------------
// ------------------------------

//#region Error

class ParseError extends Error { }

class EvalError extends Error { }

//#endregion

// ------------------------------
// ---------- Error End ---------
// ------------------------------

//#endregion

//#region Scanner

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
    static EscapeChar = [
        ["\\\\", "\\"],
        ['\\"', '"'],
        ["\\'", "'"],
        ["\\a", "\a"],
        ["\\b", "\b"],
        ["\\f", "\f"],
        ["\\n", "\n"],
        ["\\r", "\r"],
        ["\\t", "\t"],
        ["\\v", "\v"],
        ["\\0", "\0"]
    ]

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
        this.crtidx++;
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
        while (chr !== '"' && !this._atEnd()) {
            if (chr === "\n") {
                this.line++;
            }
            this._next();
            let nchr = this._peek();
            if (chr === "\\" && (nchr === "\\" || nchr === '\"')) {
                this._next();
                nchr = this._peek();
            }
            chr = nchr;
        }
        if (this._atEnd()) {
            throw new ParseError(`no match '"' at line ${this.line}`);
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
        return this.tokens[this.pos - 1];
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
 * printer
 */
class Printer {
    constructor() { }

    /**
     * @param {Value} v
     * @param {boolean} readably
     * @returns {string}
     */
    static printStr(v, readably) {
        if (readably === undefined) readably = false;
        if (v === undefined) return "";

        if (Value.isList(v)) {
            return `(${v.value.map(
                i => Printer.printStr(i, readably)
            ).join(" ")})`;
        } else if (Value.isVector(v)) {
            return `[${v.value.map(
                i => Printer.printStr(i, readably)
            ).join(" ")}]`;
        } else if (Value.isMap(v)) {
            let s = "{";
            let i = 0;
            for (const k in v.value) {
                i++;
                s += `${Printer.printStr(k)} ${Printer.printStr(v.value[k])}`;
                if (i !== v.value.length) {
                    s += ", ";
                }
            }
            s += "}";
            return s;
        } else if (Value.isString(v)) {
            if (readably) {
                let ret = v.value;
                for (let i = 0; i < Scanner.EscapeChar.length; i++) {
                    let l = Scanner.EscapeChar[i];
                    ret = ret.replaceAll(l[1], l[0]);
                }
                return `"${ret}"`;
            } else {
                return v.value;
            }
        } else if (Value.isFunc(v)) {
            return v.toString();
        } else if (Value.isNil(v)) {
            return "nil";
        } else {
            return `${v.value}`;
        }
    }
}

//#endregion

//#region Value

/**
 * value
 */
class Value {
    static None = new Value();

    /**
     * @param {object} o 
     * @returns {boolean}
     */
    static isValue(o) {
        return o instanceof Value;
    }

    /**
     * @param {boolean} b
     * @returns {BoolValue}
     */
    static bool(b) {
        return b ? BoolValue.True : BoolValue.False;
    }

    /**
     * @param {number} n
     * @returns {NumValue}
     */
    static num(n) {
        return new NumValue(n);
    }

    /**
     * @param {string} s
     * @returns {SymbolValue}
     */
    static symbol(s) {
        return new SymbolValue(s);
    }

    /**
     * @param {string?} s
     * @returns {StrValue}
     */
    static string(s) {
        if (s === undefined || s === "")
            return StrValue.Empty;
        return new StrValue(s);
    }

    /**
     * @param {Value[]} l
     * @returns {ListValue}
     */
    static list(l) {
        return new ListValue(l);
    }

    /**
     * @param {Function} f
     * @returns {FuncValue}
     */
    static func(f) {
        return new FuncValue(f);
    }

    /**
     * @param {Value[]} v
     * @returns {VectorValue}
     */
    static vector(v) {
        return new VectorValue(v);
    }

    /**
     * @param {Value} v
     * @returns {KeywordValue}
     */
    static keyword(v) {
        return new KeywordValue(v);
    }

    /**
     * @param {Value[]} v
     * @returns {MapValue}
     */
    static map(v) {
        return new MapValue(v);
    }

    /**
     * @param {Value} v
     * @returns {AtomValue}
     */
    static atom(v) {
        return new AtomValue(v);
    }

    /**
     * @param {string} v
     * @returns {ExceptionValue}
     */
    static exception(v) {
        return new ExceptionValue(v);
    }

    /**
     * @param {EnvValue} [outer]
     * @param {Value[]} [binds]
     * @param {Value[]} [exprs]
     * @returns {EnvValue}
     */
    static env(outer, binds, exprs) {
        return new EnvValue(outer, binds, exprs);
    }

    /**
     * @param {Value} v
     * @returns {boolean}
     */
    static isNil(v) {
        return v instanceof NilValue;
    }

    /**
     * @param {Value} v
     * @returns {boolean}
     */
    static isBool(v) {
        return v instanceof BoolValue;
    }

    /**
     * @param {Value} n
     * @returns {boolean}
     */
    static isNum(n) {
        return n instanceof NumValue;
    }

    /**
    * @param {Value} v
    * @returns {boolean}
    */
    static isList(v) {
        return v instanceof ListValue;
    }

    /**
     * @param {Value} v
     * @param {string} name
     * @returns {boolean}
     */
    static isSymbol(v, name) {
        if (name === undefined)
            return v instanceof SymbolValue;
        return v instanceof SymbolValue && v.value === name;
    }

    /**
     * @param {Value} s
     * @returns {boolean}
     */
    static isString(s) {
        return s instanceof StrValue;
    }

    /**
     * @param {Value} v
     * @returns {boolean}
     */
    static isKeyword(v) {
        return v instanceof KeywordValue;
    }

    /**
     * @param {Value} v
     * @returns {boolean}
     */
    static isVector(v) {
        return v instanceof VectorValue;
    }

    /**
     * @param {Value} v
     * @returns {boolean}
     */
    static isFunc(v) {
        return v instanceof FuncValue;
    }

    /**
     * @param {Value} v
     * @returns {boolean}
     */
    static isMacro(v) {
        return v instanceof FuncValue && v.ismacro;
    }

    /**
     * @param {Value} v
     * @returns {boolean}
     */
    static isMap(v) {
        return v instanceof MapValue;
    }

    /**
     * @param {Value} v
     * @returns {boolean}
     */
    static isAtom(v) {
        return v instanceof AtomValue;
    }

    /**
     * @param {Value} v
     * @returns {boolean}
     */
    static isException(v) {
        return v instanceof ExceptionValue;
    }

    /**
     * @param {Value} v
     * @returns {boolean}
     */
    static isFalse(v) {
        return Value.isNil(v) || (Value.isBool(v) && !v.value);
    }

    /**
     * @param {Value} v
     * @returns {boolean}
     */
    static isTrue(v) {
        return !Value.isFalse(v);
    }

    /**
     * @param {Value} v
     * @param {EnvValue} env
     * @returns {boolean}
     */
    static isMacroCall(v, env) {
        if (!Value.isList(v) || !Value.isSymbol(v.value[0])) {
            return false;
        }
        let [f, found] = env.get(v.value[0]);
        if (!found) return false;
        return Value.isMacro(f);
    }

    /**
     * @param {Value} v
     * @param {boolean} canEmpty
     * @returns {boolean}
     */
    static isPair(v, canEmpty) {
        canEmpty = canEmpty === undefined ? false : canEmpty;
        return (
            (v instanceof ListValue || v instanceof VectorValue) &&
            (canEmpty || v.value.length > 0)
        );
    }

    /**
     * @param {Value} f
     * @returns {boolean}
     */
    static isRealFunc(f) {
        return f instanceof FuncValue && !f.ismacro;
    }

    /**
     * @param {Value} v
     * @returns {boolean}
     */
    equals(v) {
        if (v === undefined || v === null)
            return false;

        if (this.constructor !== v.constructor)
            return false;

        if (Value.isList(this) || Value.isVector(this)) {
            if (this.value.length !== v.value.length)
                return false;

            for (let i = 0; i < this.value.length; i++) {
                if (!this.value[i].equals(v.value[i]))
                    return false;
            }

            return true;
        } else if (Value.isMap(this)) {
            for (const k in this.value) {
                if (!this.value[k].equals(v.value[k]))
                    return false;
            }
        }

        return this.value === v.value;
    }
}

class NilValue extends Value {
    static Value = new NilValue(null);

    constructor(v) {
        super();
        this.value = v;
    }

    toString() {
        return `<NilValue>`;
    }
}

class BoolValue extends Value {
    static True = new BoolValue(true);
    static False = new BoolValue(false);

    static create(b) {
        return b ? this.True : this.False;
    }

    /**
     * @param {boolean} b
     */
    constructor(b) {
        super();
        this.value = b;
    }

    toString() {
        return `<BoolValue ${this.value ? "True" : "False"}>`;
    }
}

class NumValue extends Value {
    static Zero = new NumValue(0);
    static One = new NumValue(1);

    /**
     * @param {number} num
     */
    constructor(num) {
        super();
        this.value = num;
    }

    toString() {
        return `<NumValue ${this.value}>`;
    }
}

class StrValue extends Value {
    static Empty = new StrValue("");

    //TODO: reuse StrValue instance

    /**
     * @param {string} s
     */
    constructor(s) {
        super();
        this.value = s;
    }

    toString() {
        return `<StrValue "${this.value}">`;
    }
}

class ListValue extends Value {
    static Empty = new ListValue();

    /**
     * @param {Value[]} items
     */
    constructor(items) {
        super();
        if (items === undefined) items = [];
        this.value = items;

        /**
         * @type {Value}
         */
        this.meta = Value.Nil;
    }

    toString() {
        let s = "<ListValue (";
        for (let i = 0; i < this.value.length; i++) {
            s += `${this.value[i]} `;
        }
        s += ")>";
        return s;
    }
}

class SymbolValue extends Value {
    //TODO: reuse StrValue instance

    /**
     * @param {string} s
     */
    constructor(s) {
        super();
        this.value = s;
    }

    toString() {
        return `<SymbolValue ${this.value}>`;
    }
}

class KeywordValue extends Value {
    /**
     * @param {string} k
     */
    constructor(k) {
        super();
        this.value = k;
    }

    toString() {
        return `<KeywordValue ${this.value}>`;
    }
}

class VectorValue extends Value {
    static Empty = new VectorValue();

    /**
     * @param {Value[]} items
     */
    constructor(items) {
        super();
        if (items === undefined) items = [];
        this.value = items;

        /**
         * @type {Value}
         */
        this.meta = Value.Nil;
    }

    toString() {
        let s = "<VectorValue [";
        for (let i = 0; i < this.value.length; i++) {
            s += `${this.value[i]} `;
        }
        s += "]>";
        return s;
    }
}

class MapValue extends Value {
    static Empty = new MapValue();

    /**
     * @param {Value[]} items
     */
    constructor(items) {
        super();

        /**
         * @type {Value}
         */
        this.meta = Value.Nil;

        /**
         * @type {Map<Value, Value>}
         */
        this.value = {};
        if (items !== undefined) {
            for (let i = 0; i < items.length; i += 2) {
                this.set(items[i], items[i + 1]);
            }
        }
    }

    /**
     * @param {Value} key
     * @param {Value} value
     */
    set(key, value) {
        if (!Value.isValue(value))
            throw new EvalError(`Map: Set error, value is not an instanceof ` +
                `Value ${value}(${typeof (value)})`)

        this.value[Value.isValue(key) ? key.value : key] = value;
    }

    /**
     * @param {Value} key
     * @returns {Value}
     */
    get(key) {
        return this.value[Value.isValue(key) ? key.value : key];
    }

    /**
     * @returns {MapValue}
     */
    clone() {
        let newM = new MapValue();
        for (const k in this.value) {
            newM.set(k, this.value[k]);
        }
        return newM;
    }

    toString() {
        let s = "<MapValue {";
        for (const key in this.value) {
            s += `[${key.toString()}: ${this.value[key].toString()}] `;
        }
        s += "}>";
        return s;
    }
}

class FuncValue extends Value {
    /**
     * @param {Function} f
     */
    constructor(f) {
        super();

        this.value = f;
        this.ismacro = false;

        /**
         * @type {Value}
         */
        this.meta = Value.Nil;
    }

    /**
     * @returns {FuncValue}
     */
    clone() {
        let f = new FuncValue(this.value);
        f.ismacro = false;
        return f;
    }

    toString() {
        return `<FuncValue ${this.value}>`;
    }
}

class EnvValue extends Value {
    /**
     * @param {EnvValue} outer
     * @param {Value[]} binds
     * @param {Value[]} exprs
     */
    constructor(outer, binds, exprs) {
        super();
        if (outer === undefined) outer = null;
        this.outer = outer;
        this.value = {};

        if (binds !== undefined && exprs !== undefined) {
            for (let i = 0; i < binds.length; i++) {
                let k = binds[i];
                if (k.value === "&") {
                    let vars = [];
                    for (let j = i; j < exprs.length; j++) {
                        vars.push(exprs[j]);
                    }
                    this.set(binds[i + 1], Value.list(vars));
                    break;
                } else {
                    this.set(k, exprs[i] === undefined ? Value.Nil : exprs[i]);
                }
            }
        }
    }

    toString() {
        return `<EnvValue outer: ${this.outer}>`;
    }

    /**
     * @param {SymbolValue} s
     * @param {Value} v
     * @returns {Value}
     */
    set(s, v) {
        if (!Value.isValue(v))
            throw new EvalError(`Env: set error, value is not an instance of ` +
                `Value ${v}(${typeof (v)})`);

        this.value[Value.isValue(s) ? s.value : s] = v;
        return v;
    }

    /**
     * @param {SymbolValue} symbol
     * @returns {Value}
     */
    find(symbol) {
        let ret = this.value[Value.isValue(symbol) ? symbol.value : symbol];
        let o = this.outer;
        while (ret === undefined && o !== null) {
            ret = o.value[Value.isValue(symbol) ? symbol.value : symbol];
            o = o.outer;
        }
        return [ret !== undefined ? ret : NilValue.Value,
        ret !== undefined];
    }

    /**
     * @param {SymbolValue} symbol
     * @returns {Value}
     */
    get(symbol) {
        return this.find(symbol);
    }
}

class AtomValue extends Value {
    /**
     * @param {Value} ref
     */
    constructor(ref) {
        super();
        this.value = ref;
    }

    toString() {
        return `<AtomValue ${this.value}>`;
    }
}

class ExceptionValue extends Value {
    /**
     * @param {string} info
     */
    constructor(info) {
        super();
        this.value = info;
    }

    toString() {
        return `<ExceptionValue ${this.value}>`;
    }
}

Value.Nil = NilValue.Value;
Value.True = BoolValue.True;
Value.False = BoolValue.False;

//#endregion 

//#region Parser

/**
 * parser
 */
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
        let t = r.next(); // consume "("
        if (r.atEnd()) {
            throw new ParseError(`no match ')' at line ${t.line}`);
        }

        // check empty list
        if (r.peek().symbol === ")") {
            r.next();
            return ListValue.Empty;
        }

        let items = [];
        t = r.peek();
        while (t.symbol !== ")") {
            let v = this._readForm();
            if (r.atEnd()) {
                throw new ParseError(`no match ')' at line ${t.line}`);
            }
            items.push(v);
            t = r.peek();
        }

        r.next(); // consume ")"
        return Value.list(items);
    }

    /**
     * @returns {Value}
     */
    _readVector() {
        let r = this.reader;
        let t = r.next(); // consume "["
        if (r.atEnd()) {
            throw new ParseError(`no match ']' at line ${t.line}`);
        }

        // check empty vector
        if (r.peek().symbol === "]") {
            r.next();
            return VectorValue.Empty;
        }

        let items = [];
        t = r.peek();
        while (t.symbol !== "]") {
            let v = this._readForm();
            if (r.atEnd()) {
                throw new ParseError(`no match ']' at line ${t.line}`);
            }
            items.push(v);
            t = r.peek();
        }

        r.next(); // consume "]"
        return Value.vector(items);
    }

    /**
     * @returns {Value}
     */
    _readMap() {
        let r = this.reader;
        let t = r.next(); // consume "{"
        if (r.atEnd()) {
            throw new ParseError(`no match ']' at line ${t.line}`);
        }

        // check empty map
        if (r.peek().symbol === "}") {
            r.next();
            return MapValue.Empty;
        }
        let items = [];
        t = r.peek();
        while (t.symbol !== "}") {
            let v = this._readForm();
            if (r.atEnd()) {
                throw new ParseError(`no match ']' at line ${t.line}`);
            }
            items.push(v);
            t = r.peek();
        }
        r.next(); // consume "}"
        return Value.map(items);
    }

    /**
     * @param {string} symbol
     */
    _expand(symbol) {
        let r = this.reader;
        r.next();
        let s = Value.symbol(symbol);
        let form = this._readForm();
        return Value.list([s, form]);
    }

    /**
     * @returns {Value}
     */
    _readAtom() {
        let r = this.reader;
        let t = r.next();
        if (t.symbol === "true") {
            return BoolValue.True;
        } else if (t.symbol === "false") {
            return BoolValue.False;
        } else if (t.symbol === "nil") {
            return NilValue.Value;
        } else if (t.symbol.startsWith(":")) {
            return Value.keyword(t.symbol);
        } else if (t.symbol.startsWith('"')) {
            let s = t.symbol.substring(1, t.symbol.length - 1);
            for (let i = 0; i < Scanner.EscapeChar.length; i++) {
                let l = Scanner.EscapeChar[i];
                s = s.replaceAll(l[0], l[1]);
            }
            return Value.string(s);
        } else if (!isNaN(t.symbol)) {
            return Value.num(Number(t.symbol));
        } else {
            return Value.symbol(t.symbol);
        }
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
        } else if (t.symbol === "'") {
            return this._expand("quote");
        } else if (t.symbol === "`") {
            return this._expand("quasiquote");
        } else if (t.symbol === "~") {
            return this._expand("unquote");
        } else if (t.symbol === "~@") {
            return this._epxand("splice-unquote");
        } else if (t.symbol === "@") {
            return this._expand("deref");
        } else if (t.symbol === "^") {
            let r = this.reader;
            r.next();
            let s = Value.symbol("with-meta");
            let f = this._readForm();
            let f2 = this._readForm();
            return Value.list([s, f2, f]);
        } else if (t.symbol === ")") {
            throw new ParseError(`no match ')' at line ${t.line}`);
        } else if (t.symbol === "]") {
            throw new ParseError(`no match ']' at line ${t.line}`);
        } else if (t.symbol === "}") {
            throw new ParseError(`no match '}' at line ${t.line}`);
        } else {
            return this._readAtom();
        }
    }

    /**
     * @param {string?} src
     * @returns {Value}
     */
    parse(src) {
        if (src === undefined || src === "")
            return Value.Nil;

        let scanner = new Scanner(false);
        let tokens = scanner.scan(src);
        this.reader = new Reader(tokens);
        let ret = this._readForm();
        this.reader = null;
        return ret;
    }
}

//#endregion

//#region Interpreter

/**
 * interpreter
 */
class Interpreter {
    constructor() {
        this.env = Value.env();
        this.evalMatchList = [];
        this.init();
    }

    init() {
        this.rep("(def! *host-language* \"js\")");
        this.rep("(def! not (fn* [a] (if a false true)))");
        this.rep("(def! load-file (fn* [f] (eval (read-string " +
            "(str \"(do \" (slurp f) \"\nnil)\")))))");
        this.rep("(defmacro! cond (fn* [& xs] (if (> (count xs) 0)" +
            " (list 'if (first xs) (if (> (count xs) 1) (nth xs 1) " +
            "(throw \"odd number of forms to cond\")) " +
            "(cons 'cond (rest (rest xs)))))))");
    }

    /**
     * @param {Value} v
     * @param {EnvValue} env
     * @returns {Value}
     */
    macroExpand(v, env) {
        while (Value.isMacroCall(v, env)) {
            let [f, found] = env.get(v.value[0]);
            if (!found) throw new Error(`MacroExpand: Variable ` +
                `${v.value[0].value} not found!`);
            //TODO: check f type
            v = f.value.apply(null, v.value.slice(1));
        }
        return v;
    }

    /**
     * @param {Value} v
     * @param {EnvValue} env
     * @returns {Value}
     */
    evalAst(v, env) {
        if (Value.isSymbol(v)) {
            let [ret, found] = env.get(v);
            if (!found) throw new EvalError(`EvalAst: Variable ` +
                `${v.value} not found!`);
            return ret;
        } else if (Value.isList(v)) {
            let ret = [];
            for (let i = 0; i < v.value.length; i++) {
                ret.push(this.eval(v.value[i], env));
            }
            return Value.list(ret);
        } else {
            return v;
        }
    }

    /**
     * @param {string} src
     * @returns {Value}
     */
    read(src) {
        let p = new Parser();
        return p.parse(src);
    }

    /**
     * @param {Value} v
     * @param {EnvValue} env
     * @returns {Value}
     */
    eval(v, env) {
        while (true) {
            if (Value.isList(v)) {
                if (v.value.length === 0) {
                    return v;
                } else {
                    v = this.macroExpand(v, env);
                    if (!Value.isList(v)) {
                        return this.evalAst(v, env);
                    }

                    let firstValue = v.value[0].value;
                    if (firstValue === "def!") {
                        return env.set(v.value[1], this.eval(v.value[2], env));
                    } else if (firstValue === "defmacro!") {
                        let f = this.eval(v.value[2], env);
                        let newF = f.clone();
                        newF.ismacro = true;
                        return env.set(v.value[1], newF);
                    } else if (firstValue === "let*") {
                        let newEnv = Value.env(env);
                        /**
                         * @type {Value[]}
                         */
                        let binds = v.value[1].value;

                        for (let i = 0; i < binds.length; i += 2) {
                            let k = binds[i];
                            let v = this.eval(binds[i + 1], newEnv);
                            newEnv.set(k, v);
                        }

                        v = v.value[2];
                        env = newEnv;
                    } else if (firstValue === "do") {
                        let seq = v.value.slice(1, -1);
                        if (seq.length > 0) {
                            this.evalAst(Value.list(seq), env);
                        }
                        v = v.value[v.value.length - 1];
                    } else if (firstValue === "if") {
                        let cond = this.eval(v.value[1], env);
                        if (Value.isTrue(cond)) {
                            v = v.value[2];
                        } else {
                            v = v.value[3] === undefined
                                ? NilValue.Value
                                : v.value[3];
                        }
                    } else if (firstValue === "fn*") {
                        let i = this;
                        let binds = v.value[1].value;
                        let body = null;
                        // combine function body with (do )
                        if (v.value.length > 3) {
                            body = new ListValue([
                                new SymbolValue("do"),
                                ...v.value.slice(2)
                            ])
                        } else {
                            body = v.value[2];
                        }
                        return Value.func(function (...args) {
                            let newEnv = Value.env(
                                env,
                                binds,
                                args
                            );
                            return i.eval(body, newEnv);
                        });
                    } else if (firstValue === "quote") {
                        return v.value[1];
                    } else if (firstValue === "quasiquote") {
                        let quasiquote = null;
                        quasiquote = function (a) {
                            if (!Value.isPair(a)) {
                                return Value.list([Value.symbol("quote"), a]);
                            } else {
                                let firstValue = a.value[0];
                                if (Value.isSymbol(firstValue, "unquote")) {
                                    return a.value[1];
                                } else if (
                                    Value.isPair(firstValue)
                                    && Value.isSymbol(firstValue.value[0],
                                        "splice-unquote")) {
                                    return Value.list([
                                        Value.symbol("concat"),
                                        firstValue.value[1],
                                        quasiquote(
                                            Value.list(a.value.slice(1))
                                        )
                                    ]);
                                } else {
                                    return Value.list([
                                        Value.symbol("cons"),
                                        quasiquote(a.value[0]),
                                        quasiquote(
                                            Value.list(a.value.slice(1))
                                        )
                                    ]);
                                }
                            }
                        };
                        v = quasiquote(v.value[1]);
                    } else if (firstValue === "macroexpand") {
                        return this.macroExpand(v.value[1], env);
                    } else if (firstValue === "try*") {
                        // TODO: exception
                        let exp = null;
                        let ret = null;
                        try {
                            ret = this.eval(v.value[1], env);
                        } catch (exception) {
                            exp = exception;
                        }

                        if (exp !== null) {
                            if (exp instanceof Error) {
                                exp = Value.exception(exp.message);
                            }

                            // check there is a catch
                            if (v.value[2] !== undefined
                                && Value.isPair(v.value[2])
                                && Value.isSymbol(
                                    v.value[2].value[0], "catch*")) {
                                ret = this.eval(v.value[2].value[2], Value.env(
                                    env,
                                    [v.value[2].value[1]],
                                    [exp]
                                ));
                            } else {
                                throw new Error(exp.value);
                            }
                        }

                        return ret;
                    } else {
                        // eval match mode
                        if (this.evalMatchList.length > 0
                            && Value.isSymbol(v.value[0])) {
                            for (let i = this.evalMatchList.length - 1; i >= 0; i--) {
                                let item = this.evalMatchList[i];
                                if (item[0].test(v.value[0].value)) {
                                    let params = this.evalAst(
                                        Value.list(v.value.slice(1)),
                                        env);
                                    return item[1].apply(null, insert(params.value, 0, v.value[0]));
                                }
                            }
                        }

                        let ret = this.evalAst(v, env);
                        let func = ret.value[0];
                        let params = ret.value.slice(1);
                        return func.value.apply(null, params);
                    }
                }
            } else if (Value.isVector(v)) {
                let newV = [];
                for (let i = 0; i < v.value.length; i++) {
                    newV.push(this.eval(v.value[i], env));
                }
                return Value.vector(newV);
            } else if (Value.isMap(v)) {
                let newMap = Value.map();
                for (const key in v.value) {
                    newMap.set(key, this.eval(v.value[key], env));
                }
                return newMap;
            } else {
                return this.evalAst(v, env);
            }
        }
    }

    /**
     * @param {Value} v
     * @returns {string}
     */
    print(v) {
        return Printer.printStr(v);
    }

    /**
     * @param {string} src
     */
    rep(src) {
        let ast = this.read(src);
        let ret = this.eval(ast, this.env);
        return this.print(ret);
    }

    /**
     * @param {[][]} lib
     */
    registerLib(lib) {
        for (let i = 0; i < lib.length; i++) {
            this.env.set(Value.symbol(lib[i][0]), Value.func(lib[i][1]));
        }
    }

    /**
     * @param {RegExp} re 
     * @param {Function} callback 
     */
    registerEvalMatchMode(re, callback) {
        this.evalMatchList.push([re, callback]);
    }

    /**
     * @param {RegExp} re 
     * @param {Function} callback 
     */
    unregisterEvalMatchMode(re, callback) {
        let idx = this.evalMatchList.findIndex(
            i => i[0] === re && i[1] === callback);
        if (idx >= 0 && idx < this.evalMatchList.length)
            this.evalMatchList.splice(idx, 1);
    }

    /**
     * @param {string|SymbolValue} k 
     * @param {Value} v 
     */
    setEnvValue(k, v) {
        this.env.set(k, v)
    }
}

//#endregion

//#region CoreLib

// ------------------------------
// ---------- Core lib ----------
// ------------------------------
class CoreLib {
    static readFileCallback = null;
    static outputCallback = null;
    static inputCallback = null;

    /**
     * @param {Value} a 
     * @param {Value} b 
     * @returns {Value}
     */
    static add(a, b) {
        //TODO: check a b type
        if (Value.isNum(a) && Value.isNum(b))
            return Value.num(a.value + b.value);
        else if (Value.isString(a) || Value.isString(b))
            return Value.string(a.value + b.value);

        throw new EvalError(`add arg must be number or string`);
    }

    /**
     * @param {Value} a 
     * @param {Value} b 
     * @returns {Value}
     */
    static dec(a, b) {
        //TODO: check a b type
        return Value.num(a.value - b.value);
    }

    /**
     * @param {Value} a 
     * @param {Value} b 
     * @returns {Value}
     */
    static mul(a, b) {
        //TODO: check a b type
        return Value.num(a.value * b.value);
    }

    /**
     * @param {Value} a 
     * @param {Value} b 
     * @returns {Value}
     */
    static div(a, b) {
        //TODO: check a b type
        return Value.num(a.value / b.value);
    }

    /**
     * @param {Value} a 
     * @param {Value} b 
     * @returns {Value}
     */
    static equal(a, b) {
        //TODO: check a b type
        return BoolValue.create(a.equals(b));
    }

    /**
     * @param {Value} a 
     * @param {Value} b 
     * @returns {Value}
     */
    static less(a, b) {
        //TODO: check a b type
        return BoolValue.create(a.value < b.value);
    }

    /**
     * @param {Value} a 
     * @param {Value} b 
     * @returns {Value}
     */
    static lessEq(a, b) {
        //TODO: check a b type
        return BoolValue.create(a.value <= b.value);
    }

    /**
     * @param {Value} a 
     * @param {Value} b 
     * @returns {Value}
     */
    static great(a, b) {
        //TODO: check a b type
        return BoolValue.create(a.value > b.value);
    }

    /**
     * @param {Value} a 
     * @param {Value} b 
     * @returns {Value}
     */
    static greatEq(a, b) {
        //TODO: check a b type
        return BoolValue.create(a.value >= b.value);
    }

    /**
     * @param  {...Value} args 
     * @returns {Value}
     */
    static list(...args) {
        return Value.list(args);
    }

    /**
     * @param  {Value} l
     * @returns {Value}
     */
    static listCheck(l) {
        return BoolValue.create(Value.isList(l));
    }

    /**
     * @param  {Value} l
     * @returns {Value}
     */
    static emptyCheck(l) {
        return BoolValue.create(Value.isList(l) && l.value.length == 0);
    }

    /**
     * @param  {Value} l
     * @returns {Value}
     */
    static count(l) {
        return Value.isList(l)
            ? Value.num(l.value.length)
            : NumValue.Zero;
    }

    /**
     * @param  {...Value} args 
     * @returns {Value}
     */
    static prstr(...args) {
        if (args.length == 0) return StrValue.Empty;
        return Value.string(args.map(v => Printer.printStr(v, true)).join(""));
    }

    /**
     * @param  {...Value} args 
     * @returns {Value}
     */
    static str(...args) {
        if (args.length == 0) return StrValue.Empty;
        return Value.string(args.map(v => Printer.printStr(v, false)).join(""));
    }

    /**
     * @param  {...Value} args 
     * @returns {Value}
     */
    static prn(...args) {
        CoreLib.outputCallback?.apply(null,
            [args.map(v => Printer.printStr(v, true)).join("")]);
        return NilValue.Value;
    }

    /**
     * @param  {...Value} args 
     * @returns {Value}
     */
    static println(...args) {
        CoreLib.outputCallback?.apply(null,
            [args.map(v => Printer.printStr(v, false)).join("")]);
        return NilValue.Value;
    }

    /**
     * @param  {Value} s
     * @returns {Value}
     */
    static readString(s) {
        //TODO: catch parse exception
        let p = new Parser();
        let v = p.parse(s.value);
        if (!Value.isValue(v)) {
            throw new EvalError(`parse return invalid`);
        }

        return v;
    }

    /**
     * @param  {Value} s
     * @returns {Value}
     */
    static slurp(s) {
        if (!CoreLib.readFileCallback) {
            throw new Error("read file not implement!");
        }

        try {
            let fileContent = CoreLib.readFileCallback(s.value) + "\n";
            return Value.string(fileContent);
        } catch (exp) {
            throw new EvalError(`Slurp: read file error, ${exp.message}`);
        }
    }

    /**
     * @param  {Value} v
     * @returns {Value}
     */
    static atom(v) {
        return Value.atom(v);
    }

    /**
     * @param  {Value} v
     * @returns {Value}
     */
    static atomCheck(v) {
        return BoolValue.create(Value.isAtom(v));
    }

    /**
     * @param  {Value} a
     * @returns {Value}
     */
    static deref(a) {
        //TODO: check a type
        if (!Value.isValue(a.value)) {
            throw new EvalError(`atom value is not an instance of Value,` +
                ` ${a.value}(${typeof (a.value)})`)
        }

        return a.value;
    }

    /**
     * @param  {Value} a
     * @param  {Value} newV
     * @returns {Value}
     */
    static reset(a, newV) {
        //TODO: check a type
        a.value = newV;
        return newV;
    }

    /**
     * 
     * @param {Value} a 
     * @param {Value} f 
     * @param  {...Value} args 
     * @returns {Value}
     */
    static swap(a, f, ...args) {
        //TODO: check type
        a.value = f.value.apply(null, [a.value, ...args]);
        if (!Value.isValue(a.value)) {
            throw new EvalError(`swap value is not an instance of Value,` +
                ` ${a.value}(${typeof (a.value)})`)
        }

        return a.value;
    }

    /**
     * @param  {Value} f
     * @param  {Value} l
     * @returns {Value}
     */
    static cons(f, l) {
        //TODO: check type
        return Value.list(insert(l.value, 0, f))
    }

    /**
     * @param  {...Value} args
     * @returns {Value[]}
     */
    static _concat(...args) {
        let ret = []
        for (let i = 0; i < args.length; i++) {
            let v = args[i];
            if (Value.isList(v) || Value.isVector(v)) {
                for (let i = 0; i < v.value.length; i++) {
                    ret.push(v.value[i]);
                }
            } else if (Value.isMap(v) || !Value.isNil(v)) {
                ret.push(v);
            }
        }

        return ret;
    }

    /**
     * @param  {...Value} args 
     * @returns {Value}
     */
    static concat(...args) {
        return Value.list(CoreLib._concat(...args));
    }

    /**
     * @param  {Value} v
     * @returns {Value}
     */
    static vec(v) {
        if (Value.isVector(v)) {
            return v;
        } else if (Value.isList(v)) {
            let l = v.value.slice();
            return Value.vector(l);
        } else {
            throw new EvalError(`vec called with non-sequential`);
        }
    }

    /**
     * @param  {Value} l
     * @param  {Value} idx
     * @returns {Value}
     */
    static nth(l, idx) {
        if (!Value.isPair(l)) {
            throw new EvalError(`nth arg is not a pair`);
        }

        let i = idx.value;
        if (i < 0 || i >= l.value.length) {
            throw new Error(`index out of range (${i}/${l.value.length})`);
        }

        return l.value[i];
    }

    /**
     * @param  {Value} l
     * @returns {Value}
     */
    static first(l) {
        if (Value.isNil(l) || l.value.length == 0)
            return NilValue.Value;

        return l.value[0];
    }

    /**
     * @param  {Value} l
     * @returns {Value}
     */
    static rest(l) {
        //TODO: check type
        if (Value.isNil(l) || l.value.length <= 1)
            return ListValue.Empty;

        return Value.list(l.value.slice(1));
    }

    /**
     * @param  {Value} exc
     * @returns {Error}
     */
    static throw(exc) {
        //TODO: check type
        throw new EvalError(exc);
    }

    /**
     * @param  {Value} f
     * @param  {...Value} args
     * @returns {Value}
     */
    static apply(f, ...args) {
        //TODO: check type
        let ret = f.value.apply(null, CoreLib._concat(...args));
        if (!Value.isValue(ret)) {
            throw new EvalError(`apply ret is not an instance of Value,` +
                ` ${ret}(${typeof (ret)})`);
        }
        return ret;
    }

    /**
     * @param  {Value} f
     * @param  {...Value} args
     * @returns {Value}
     */
    static map(f, ...args) {
        //TODO: check type
        let arr = CoreLib._concat(...args);
        return Value.list(arr.map(
            i => f.value(i)));
    }

    /**
     * @param  {Value} a
     * @returns {Value}
     */
    static nilCheck(a) {
        return BoolValue.create(Value.isNil(a));
    }

    /**
     * @param  {Value} a
     * @returns {Value}
     */
    static trueCheck(a) {
        return BoolValue.create(Value.isBool(a) && a.value);
    }

    /**
     * @param  {Value} a
     * @returns {Value}
     */
    static falseCheck(a) {
        return BoolValue.create(Value.isBool(a) && !a.value);
    }

    /**
     * @param  {Value} a
     * @returns {Value}
     */
    static symbolCheck(a) {
        return BoolValue.create(Value.isSymbol(a));
    }

    /**
     * @param  {Value} s
     * @returns {Value}
     */
    static symbol(s) {
        //TODO: check type
        return Value.symbol(s.value);
    }

    /**
     * @param  {Value} s
     * @returns {Value}
     */
    static keyword(s) {
        //TODO: check type
        return Value.keyword(s.value);
    }

    /**
     * @param  {Value} k
     * @returns {Value}
     */
    static keywordCheck(k) {
        return BoolValue.create(Value.isKeyword(k));
    }

    /**
     * @param  {...Value} args
     * @returns {Value}
     */
    static vector(...args) {
        return Value.vector(args);
    }

    /**
     * @param  {Value} v
     * @returns {Value}
     */
    static vectorCheck(v) {
        return BoolValue.create(Value.isVector(v));
    }

    /**
     * @param  {Value} s
     * @returns {Value}
     */
    static sequentialCheck(s) {
        return BoolValue.create(Value.isList(s) || Value.isVector(s));
    }

    /**
     * @param  {...Value} args
     * @returns {Value}
     */
    static hashmap(...args) {
        return Value.map(args);
    }

    /**
     * @param  {Value} m
     * @returns {Value}
     */
    static mapCheck(m) {
        return BoolValue.create(Value.isMap(m));
    }

    /**
     * @param  {Value} m
     * @param  {...Value} args
     * @returns {Value}
     */
    static assoc(m, ...args) {
        //TODO: check type
        if (!Value.isMap(m)) {
            throw new EvalError(`assoc m is not an instance of Map, ` +
                `${m}(${typeof (m)})`);
        }

        let newM = m.clone();
        for (let i = 0; i < args.length; i += 2) {
            if (!Value.isValue(args[i])) {
                throw new EvalError(`assoc arg(${i}) is not an instance ` +
                    `of Value, ${args[i]}(${typeof (args[i])})`);
            }

            if (!Value.isValue(args[i + 1])) {
                throw new EvalError(`assoc arg(${i + 1}) is not an instance` +
                    ` of Value, ${args[i + 1]}(${typeof (args[i + 1])})`);
            }

            newM.set(args[i], args[i + 1]);
        }
        return newM;
    }

    /**
     * @param  {Value} m
     * @param  {...Value} args
     * @returns {Value}
     */
    static dissoc(m, ...args) {
        //TODO: check type
        if (!Value.isMap(m)) {
            throw new EvalError(`dissoc m is not an instance of Map,` +
                ` ${m}(${typeof (m)})`);
        }

        let newM = m.clone();
        for (let i = 0; i < args.length; i++) {
            if (!Value.isValue(args[i])) {
                throw new EvalError(`dissoc arg(${i}) is not an instance` +
                    ` of Value, ${args[i]}(${typeof (args[i])})`);
            }

            newM.set(args[i], undefined);
        }
        return newM;
    }

    /**
     * @param  {Value} m
     * @param  {Value} key
     * @returns {Value}
     */
    static get(m, key) {
        //TODO: check type
        if (!Value.isMap(m)) {
            throw new EvalError(`get m is not an instance of Map,` +
                ` ${m}(${typeof (m)})`);
        }

        let ret = m.get(key);

        return ret === undefined ? NilValue.Value : ret;
    }

    /**
     * @param  {Value} m
     * @param  {Value} key
     * @returns {Value}
     */
    static containsCheck(m, key) {
        return BoolValue.create(m.get(key) !== undefined);
    }

    /**
     * @param  {Value} m
     * @returns {Value}
     */
    static keys(m) {
        //TODO: check type
        let keys = [];
        for (const k in m.value) {
            keys.push(Value.symbol(k));
        }
        return Value.list(keys);
    }

    /**
     * @param  {Value} m
     * @returns {Value}
     */
    static vals(m) {
        //TODO: check type
        let vals = []
        for (const k in m.value) {
            vals.push(m.vals[k]);
        }
        return Value.list(vals);
    }

    /**
     * @param  {Value} s
     * @returns {Value}
     */
    static readline(s) {
        //TODO: check type
        if (CoreLib.outputCallback !== null)
            CoreLib.outputCallback(s.value);

        if (CoreLib.inputCallback === null)
            return NilValue.Value;

        let input = CoreLib.inputCallback();
        return input === undefined || input === null
            ? StrValue.Empty
            : Value.string(input);
    }

    /**
     * @returns {Value}
     */
    static timems() {
        return Value.num(Date.now());
    }

    /**
     * @param  {Value} f
     * @returns {Value}
     */
    static meta(f) {
        //TODO: check type
        let ret = f.meta;
        return ret === undefined ? NilValue.Value : ret;
    }

    /**
     * @param  {Value} f
     * @param  {Value} v
     * @returns {Value}
     */
    static withmeta(f, v) {
        //TODO: check type
        let newF = f.clone();
        newF.meta = v;
        return newF;
    }

    /**
     * @param  {Value} f
     * @returns {Value}
     */
    static fnCheck(f) {
        //TODO: check type
        return BoolValue.create(Value.isRealFunc(f));
    }

    /**
     * @param  {Value} m
     * @returns {Value}
     */
    static macroCheck(m) {
        return BoolValue.create(Value.isMacro(m));
    }

    /**
     * @param  {Value} s
     * @returns {Value}
     */
    static stringCheck(s) {
        return BoolValue.create(Value.isString(s));
    }

    /**
     * @param  {Value} n
     * @returns {Value}
     */
    static numberCheck(n) {
        return BoolValue.create(Value.isNumber(n));
    }

    /**
     * @param  {Value} v
     * @returns {Value}
     */
    static seq(v) {
        //TODO: check type
        if (Value.isNil(v)) {
            return v;
        } else if (Value.isList(v)) {
            if (v.value.length === 0) {
                return Value.Nil;
            }
            return v;
        } else if (Value.isVector(v)) {
            if (v.value.length === 0) {
                return Value.Nil;
            }
            return Value.list(v.value.slice());
        } else if (Value.isString(v)) {
            if (v.value.length === 0) {
                return Value.Nil;
            }
            let ret = [];
            for (let i = 0; i < v.value.length; i++) {
                ret.push(v.value[i]);
            }
            return Value.list(ret);
        }
    }

    /**
     * @param  {Value} l
     * @param  {...Value} args
     * @returns {Value}
     */
    static conj(l, ...args) {
        //TODO: check type
        let ret = l.value.slice();
        if (Value.isList(l)) {
            for (let i = 0; i < args.length; i++) {
                insert(ret, 0, args[i]);
            }
            return Value.list(ret);
        } else if (Value.isVector(l)) {
            for (let i = 0; i < args.length; i++) {
                insert(ret, 0, args[i]);
            }
            return Value.vector(ret);
        }
    }

    static libs = [
        ["+", CoreLib.add],
        ["-", CoreLib.dec],
        ["*", CoreLib.mul],
        ["/", CoreLib.div],
        ["=", CoreLib.equal],
        ["<", CoreLib.less],
        ["<=", CoreLib.lessEq],
        [">", CoreLib.great],
        [">=", CoreLib.greatEq],
        ["list", CoreLib.list],
        ["list?", CoreLib.listCheck],
        ["empty?", CoreLib.emptyCheck],
        ["count", CoreLib.count],
        ["pr-str", CoreLib.prstr],
        ["str", CoreLib.str],
        ["prn", CoreLib.prn],
        ["println", CoreLib.println],
        ["read-string", CoreLib.readString],
        ["slurp", CoreLib.slurp],
        ["atom", CoreLib.atom],
        ["atom?", CoreLib.atomCheck],
        ["deref", CoreLib.deref],
        ["reset!", CoreLib.reset],
        ["swap!", CoreLib.swap],
        ["cons", CoreLib.cons],
        ["concat", CoreLib.concat],
        ["vec", CoreLib.vec],
        ["nth", CoreLib.nth],
        ["first", CoreLib.first],
        ["rest", CoreLib.rest],
        ["throw", CoreLib.throw],
        ["apply", CoreLib.apply],
        ["map", CoreLib.map],
        ["nil?", CoreLib.nilCheck],
        ["true?", CoreLib.trueCheck],
        ["false?", CoreLib.falseCheck],
        ["symbol?", CoreLib.symbolCheck],
        ["symbol", CoreLib.symbol],
        ["keyword", CoreLib.keyword],
        ["keyword?", CoreLib.keywordCheck],
        ["vector", CoreLib.vector],
        ["vector?", CoreLib.vectorCheck],
        ["sequential?", CoreLib.sequentialCheck],
        ["hash-map", CoreLib.hashmap],
        ["map?", CoreLib.mapCheck],
        ["assoc", CoreLib.assoc],
        ["dissoc", CoreLib.dissoc],
        ["get", CoreLib.get],
        ["contains?", CoreLib.containsCheck],
        ["keys", CoreLib.keys],
        ["vals", CoreLib.vals],
        ["readline", CoreLib.readline],
        ["time-ms", CoreLib.timems],
        ["meta", CoreLib.meta],
        ["with-meta", CoreLib.withmeta],
        ["fn?", CoreLib.fnCheck],
        ["macro?", CoreLib.macroCheck],
        ["string?", CoreLib.stringCheck],
        ["number?", CoreLib.numberCheck],
        ["seq", CoreLib.seq],
        ["conj", CoreLib.conj],
    ];

    /**
     * @param {Interpreter} interpreter 
     */
    static registerLib(interpreter) {
        interpreter.registerLib(CoreLib.libs);
    }
}

// ------------------------------
// ---------- Core lib End ------
// ------------------------------

//#endregion

//#region Js extend

// ------------------------------
// ---------- Js extend ---------
// ------------------------------

class JsObjValue extends Value {
    /**
     * @param {object} o 
     */
    constructor(o) {
        super();
        this.value = o;
    }
}

Value.jsObj = function (o) {
    return new JsObjValue(o);
}

Value.isJsObjValue = function (v) {
    return v instanceof JsValue;
}

class JsLib {
    // call jsobj method like .method
    static ObjCallRe = /^\.(.+)/;

    // assign jsobj property like .=
    static propertyAssignRe = /^\.=$/;

    // call js function like $eval
    static FnCallRe = /^\$(.+)/;

    static Global = null;

    static libs = [
        ["new", JsLib.new],
        ["evaljs", JsLib.evaljs],
        ["jsobj", JsLib.jsobj]
    ];

    /**
     * @param {Value} v 
     * @returns {any}
     */
    static toJsValue(v) {
        if (Value.isList(v) || Value.isVector(v)) {
            let ret = Array(v.value.length);
            for (let i = 0; i < v.value.length; i++) {
                ret[i] = JsLib.toJsValue(v.value[i]);
            }
            return ret;
        } else if (Value.isMap(v)) {
            let ret = {};
            for (const k in v.value) {
                ret[k] = JsLib.toJsValue(v.value[k]);
            }
            return ret;
        }

        return v.value;
    }

    /**
     * @param {any} v 
     * @returns {Value}
     */
    static toLValue(v) {
        if (v === undefined || v === null) {
            return Value.Nil;
        } else if (Value.isValue(v)) {
            return v;
        } else if (typeof v === "boolean") {
            return Value.bool(v);
        } else if (typeof v === "number") {
            return Value.num(v);
        } else if (typeof v === "string") {
            return Value.string(v);
        } else if (v instanceof Array) {
            return Value.list(v.slice().map(x => JsLib.toLValue(x)));
        } else if (v.constructor === Object) {
            let ret = Value.map();
            for (const k in v) {
                ret.set(k, JsLib.toLValue(v[k]));
            }
            return ret;
        } else {
            return Value.jsObj(v);
        }
    }

    /**
     * @param {Value} objname 
     * @param  {...Value} args 
     * @returns {Value}
     */
    static new(objname, ...args) {
        let params = args.map(x => JsLib.toJsValue(x));
        try {
            const constructor = JsLib.Global[objname.value];
            if (constructor) {
                let o = new constructor(...params);
                return Value.jsObj(o);
            } else {
                // create object with eval
                let s = `new ${objname.value}(${params.map(x => `${x}`).join(",")})`;
                let o = JsLib.Global.eval(s);
                return Value.jsObj(o);
            }
        } catch (exp) {
            throw new EvalError(`new "${objname.value}" error: ${exp.message}`);
        }
    }

    /**
     * @param {Value} s 
     * @returns {Value}
     */
    static evaljs(s) {
        try {
            let ret = JsLib.Global.eval(s.value);
            return JsLib.toLValue(ret);
        } catch (exp) {
            throw new EvalError(`evaljs "${s.value}" error: ${exp.message}`);
        }
    }

    /**
     * @param {Value} s 
     * @returns {Value}
     */
    static jsobj(s) {
        try {
            let o = JsLib.Global[s.value];
            return Value.jsObj(o);
        } catch (exp) {
            throw new EvalError(`jsobj "${s.value}" error: ${exp.message}`);
        }
    }

    /**
     * @private
     */
    static _initGlobal() {
        try {
            JsLib.Global = Function('return this')() || (42, eval)('this');
        } catch (e) {
            JsLib.Global = window;
        }
    }

    /**
    * @param {Interpreter} interpreter 
    */
    static registerLib(interpreter) {
        JsLib._initGlobal();
        interpreter.registerLib(JsLib.libs);

        interpreter.registerEvalMatchMode(JsLib.ObjCallRe, function (funcNameValue, ...args) {
            let o = args[0].value;
            let params = args.slice(1).map(x => JsLib.toJsValue(x));
            let v = o[funcNameValue.value.slice(1)];
            if (typeof v === "function" && args.length > 0) {
                return JsLib.toLValue(v.apply(o, params));
            } else {
                return JsLib.toLValue(v);
            }
        });

        interpreter.registerEvalMatchMode(JsLib.propertyAssignRe, function (_, obj, property, value) {
            console.log(obj, property, value);
            try {
                obj.value[property.value] = JsLib.toJsValue(value);
            } catch (exp) {
                throw new EvalError(`property assign error: ${exp.message}`);
            }
        });

        interpreter.registerEvalMatchMode(JsLib.FnCallRe, function (funcNameValue, ...args) {
            let funcName = funcNameValue.value.substring(1);
            let params = args.map(x => JsLib.toJsValue(x));
            return JsLib.toLValue(JsLib.Global[funcName].apply(null, params));
        });
    }
}

// ------------------------------
// ---------- Js extend End -----
// ------------------------------

//#endregion
