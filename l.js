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
    while(i--) ret[i] = a[i];

    // insert item
    ret.splice(idx, 0, item);
    return ret;
}

// ------------------------------
// ---------- Base Utils End ----
// ------------------------------

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
    constructor() {}

    /**
     * @param {Value} v
     * @param {boolean} readably
     * @returns {string}
     */
    static printStr(v, readably) {
        if (readably === undefined) readably = false;

        // TODO: finish this function

        return v.toString();
    }
}

/**
 * value
 */
class Value {
    static None = new Value();

    static isMacro(v) {
        return v instanceof FuncValue && v.ismacro;
    }

    static isMacroCall(v, env) {
        if (!(v instanceof ListValue) || !(v.value[0] instanceof SymbolValue)) {
            return false;
        }
        let f = env.get(v.value[0]);
        return Value.isMacro(f);
    }

    static isPair(v) {
        return (
            (v instanceof ListValue || v instanceof VectorValue) &&
            v.value.length > 0
        );
    }
}

class NilValue extends Value {
    static Value = new NilValue();

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
        this.meta = null;
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
    /**
     * @param {Value[]} items
     */
    constructor(items) {
        super();
        if (items === undefined) items = [];
        if (meta === undefined) meta = NilValue.Value;
        this.value = items;

        /**
         * @type {Value}
         */
        this.meta = null;
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
    /**
     * @param {Value[]} items
     */
    constructor(items) {
        super();

        /**
         * @type {Value}
         */
        this.meta = null;

        /**
         * @type {Map<Value, Value>}
         */
        this.value = {};
        if (items !== undefined) {
            for (let i = 0; i < items.length; i += 2) {
                this.value[items[i]] = items[i + 1];
            }
        }
    }

    /**
     * @param {Value} key
     * @param {Value} value
     */
    set(key, value) {
        this.value[key] = value;
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
        this.meta = null;
    }

    /**
     * @param {FuncValue} v
     * @returns {FuncValue}
     */
    clone(v) {
        let f = new FuncValue(v.value);
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
                    this.set(binds[i + 1], new ListValue(vars));
                    break;
                } else {
                    this.set(k, exprs[i]);
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
        this.value[s.value] = v;
        return v;
    }

    /**
     * @param {SymbolValue} symbol
     * @returns {Value}
     */
    find(symbol) {
        let ret = this.value[symbol.value];
        let o = this.outer;
        while (ret === undefined && o !== null) {
            ret = o.value[symbol.value];
            o = o.outer;
        }
        return ret !== undefined ? ret : NilValue.Value;
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
        r.next(); // consume "("
        if (r.atEnd()) {
            //TODO: report error
        }

        // check empty list
        if (r.peek().symbol === ")") {
            r.next();
            return ListValue.Empty;
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
        return new ListValue(items);
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
        return new VectorValue(items);
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
     * @param {string} symbol
     */
    _expand(symbol) {
        let r = this.reader;
        r.next();
        let s = new SymbolValue(symbol);
        let form = this._readForm();
        return new ListValue([s, form]);
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
            return new KeywordValue(t.symbol);
        } else if (t.symbol.startsWith('"')) {
            return new StrValue(t.symbol.substring(1, t.symbol.length - 1));
        } else if (!isNaN(t.symbol)) {
            return new NumValue(Number(t.symbol));
        } else {
            return new SymbolValue(t.symbol);
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
            let s = new SymbolValue("with-meta");
            let f = this._readForm();
            let f2 = this._readForm();
            return new ListValue([s, f2, f]);
        } else if (t.symbol === ")") {
            //TODO: report error
        } else if (t.symbol === "]") {
            //TODO: report error
        } else if (t.symbol === "}") {
            //TODO: report error
        } else {
            return this._readAtom();
        }
    }
    /**
     * @param {string} src
     * @returns {Value}
     */
    parse(src) {
        let scanner = new Scanner(false);
        let tokens = scanner.scan(src);
        this.reader = new Reader(tokens);
        let ret = this._readForm();
        this.reader = null;
        return ret;
    }
}

/**
 * interpreter
 */
class Interpreter {
    constructor() {
        this.env = new EnvValue();
    }

    /**
     * @param {Value} v
     * @param {EnvValue} env
     * @returns {Value}
     */
    macroExpand(v, env) {
        while (Value.isMacroCall(v, env)) {
            let f = env.get(v.value[0]);
            v = f.apply(null, v.value.splice(1));
        }
        return v;
    }

    /**
     * @param {Value} v
     * @param {EnvValue} env
     * @returns {Value}
     */
    evalAst(v, env) {
        if (v instanceof SymbolValue) {
            let ret = env.get(v);
            return ret;
        } else if (v instanceof ListValue) {
            let ret = new ListValue();
            for (let i = 0; i < v.value.length; i++) {
                ret.value.push(this.eval(v.value[i], env));
            }
            return ret;
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
            if (v instanceof ListValue) {
                if (v.value.length === 0) {
                    return v;
                } else {
                    v = this.macroExpand(v, env);
                    if (!(v instanceof ListValue)) {
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
                        let newEnv = new EnvValue(env);
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
                        let seq = v.value.splice(1);
                        if (seq.length > 0) {
                            this.evalAst(new ListValue(seq), env);
                        }
                        v = v.value[v.value.length - 1];
                    } else if (firstValue === "if") {
                        let cond = this.eval(v.value[1], env);
                        if (cond.value) {
                            v = v.value[2];
                        } else {
                            v =
                                v.value[3] === undefined
                                    ? NilValue.Value
                                    : v.value[3];
                        }
                    } else if (firstValue === "fn*") {
                        return new FuncValue(function (...args) {
                            let newEnv = new EnvValue(
                                env,
                                v.value[1].value,
                                args
                            );
                            return this.eval(v.value[2], newEnv);
                        });
                    } else if (firstValue === "quote") {
                        return v.value[1];
                    } else if (firstValue === "quasiquote") {
                        let quasiquote = null;
                        quasiquote = function (a) {
                            if (!Value.isPair(a)) {
                                return new ListValue([SymbolValue("quote"), a]);
                            } else {
                                let firstValue = a.value[0];
                                if (
                                    firstValue instanceof SymbolValue &&
                                    firstValue.value === "unquote"
                                ) {
                                    return a.value[1];
                                } else if (
                                    Value.isPair(firstValue) &&
                                    firstValue.value[0] instanceof
                                        SymbolValue &&
                                    firstValue.value[0].value ===
                                        "splice-unquote"
                                ) {
                                    return new ListValue([
                                        new SymbolValue("concat"),
                                        firstValue.value[1],
                                        quasiquote(
                                            new ListValue(a.value.splice(1))
                                        )
                                    ]);
                                } else {
                                    return new ListValue([
                                        new SymbolValue("cons"),
                                        quasiquote(a.value[0]),
                                        quasiquote(
                                            new ListValue(a.value.splice(1))
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
                    } else {
                        let ret = this.evalAst(v, env);
                        let func = ret.value[0];
                        let params = ret.value.splice(1);
                        return func.value.apply(null, params);
                    }
                }
            } else if (v instanceof VectorValue) {
                let newV = [];
                for (let i = 0; i < v.value.length; i++) {
                    newV.push(this.eval(v.value[i], env));
                }
                return new VectorValue(newV);
            } else if (v instanceof MapValue) {
                let newMap = new MapValue();
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
    repl(src) {
        let ast = this.read(src);
        let ret = this.eval(ast, this.env);
        return this.print(ret);
    }

    /**
     * @param {[][]} lib
     */
    registerLib(lib) {
        for (let i = 0; i < lib.length; i++) {
            this.env.set(new SymbolValue(lib[i][0]), new FuncValue(lib[i][1]));
        }
    }
}

// ------------------------------
// ---------- Core lib ----------
// ------------------------------
class CoreLib {
    static logCallback = null;
    static readFileCallback = null;

    static add(a, b) {
        //TODO: check a b type
        if (a instanceof NumValue && b instanceof NumValue)
            return new NumValue(a.value + b.value);
        else if (a instanceof StrValue || b instanceof StrValue)
            return new StrValue(a.value + b.value);
    }

    static dec(a, b) {
        //TODO: check a b type
        return new NumValue(a.value - b.value);
    }

    static mul(a, b) {
        //TODO: check a b type
        return new NumValue(a.value * b.value);
    }

    static div(a, b) {
        //TODO: check a b type
        return new NumValue(a.value / b.value);
    }

    static equal(a, b) {
        //TODO: check a b type
        return a === b ? BoolValue.True : BoolValue.False;
    }

    static less(a, b) {
        //TODO: check a b type
        return a.value < b.value ? BoolValue.True : BoolValue.False;
    }

    static lessEq(a, b) {
        //TODO: check a b type
        return a.value <= b.value ? BoolValue.True : BoolValue.False;
    }

    static great(a, b) {
        //TODO: check a b type
        return a.value > b.value ? BoolValue.True : BoolValue.False;
    }

    static greatEq(a, b) {
        //TODO: check a b type
        return a.value >= b.value ? BoolValue.True : BoolValue.False;
    }

    static list(...args) {
        return new ListValue(args);
    }

    static listCheck(l) {
        return l instanceof ListValue ? BoolValue.True : BoolValue.False;
    }

    static emptyCheck(l) {
        return l instanceof ListValue && l.value.length == 0
            ? BoolValue.True
            : BoolValue.False;
    }

    static count(l) {
        return l instanceof ListValue
            ? new NumValue(l.value.length)
            : NumValue.Zero;
    }

    static prstr(...args) {
        if (args.length == 0) return StrValue.Empty;
        return new StrValue(args.map(v => Printer.printStr(v, true)).join(""));
    }

    static str(...args) {
        if (args.length == 0) return StrValue.Empty;
        return new StrValue(args.map(v => Printer.printStr(v, false)).join(""));
    }

    static prn(...args) {
        CoreLib.logCallback?.apply(null, [CoreLib.prstr(args)]);
        return NilValue.Value;
    }

    static println(...args) {
        CoreLib.logCallback?.apply(null, [CoreLib.str(args)]);
        return NilValue.Value;
    }

    static readString(s) {
        //TODO: catch parse exception
        let p = new Parser();
        return p.parse(p);
    }

    static slurp(s) {
        if (!CoreLib.readFileCallback) {
            throw new Error("read file not implement!");
        }

        //TODO: catch read file exception
        return new StrValue(CoreLib.readFileCallback(s.value) + "\n");
    }

    static atom(v) {
        return new AtomValue(v);
    }

    static atomCheck(v) {
        return v instanceof AtomValue ? BoolValue.True : BoolValue.False;
    }

    static deref(a) {
        //TODO: check a type
        return a.value;
    }

    static reset(a, newV) {
        //TODO: check a type
        a.value = newV;
        return newV;
    }

    static swap(a, f, ...args) {
        //TODO: check type
        a.value = f.value(a.value, args);
        return a.value;
    }

    static cons(f, l) {
        //TODO: check type
        return new ListValue(insert(l.value, 0, f))
    }

    static _concat(...args) {
        let ret = []
        for (let i = 0; i < args.length; i++) {
            let v = args[i];
            if (v instanceof ListValue || v instanceof VectorValue) {
                for (const item in v.value) {
                    ret.push(item);
                }
            } else if (v instanceof MapValue || !(v instanceof NilValue)) {
                ret.push(v);
            }
        }

        return ret;
    }

    static concat(...args) {
        return new ListValue(CoreLib._concat(args));
    }

    static nth(l, idx) {
        //TODO: check type
        let i = idx.value;
        if (i < 0 || i >= l.value.length) {
            throw new Error(`index out of range (${i}/${l.value.length})`);
        }

        return l.value[i];
    }

    static first(l) {
        //TODO: check type
        if (l instanceof NilValue || l.value.length == 0)
            return NilValue.Value;

        return l.value[0];
    }

    static rest(l) {
        //TODO: check type
        if (l instanceof NilValue || l.value.length <= 1)
            return ListValue.Empty;

        return new ListValue(l.value.splice(1));
    }

    static throw(exc) {
        //TODO: check type
        throw new Error(exc);
    }

    static apply(f, ...args) {
        //TODO: check type
        return f.value(args);
    }

    static map(f, ...args) {
        //TODO: check type
        let arr = CoreLib._concat(args);
        return new ListValue(arr.map(f.value));
    }

    static nilCheck(a) {
        return BoolValue.create(a instanceof NilValue);
    }

    static trueCheck(a) {
        return BoolValue.create(a instanceof BoolValue && a.value);
    }

    static falseCheck(a) {
        return BoolValue.create(a instanceof BoolValue && !a.value);
    }

    static symbolCheck(a) {
        return BoolValue.create(a instanceof SymbolValue);
    }

    static symbol(s) {
        //TODO: check type
        return new SymbolValue(s.value);
    }

    static keyword(s) {
        //TODO: check type
        return new KeywordValue(s.value);
    }

    static keywordCheck(k) {
        return BoolValue.create(k instanceof KeywordValue);
    }

    static vector(...args) {
        return new VectorValue(args);
    }

    static vectorCheck(v) {
        return BoolValue.create(v instanceof VectorValue);
    }

    static sequentialCheck(s) {
        return BoolValue.create(s instanceof ListValue || s instanceof VectorValue);
    }

    static hashmap(...args) {
        return new MapValue(args);
    }

    static mapCheck(m) {
        return BoolValue.create(m instanceof MapValue);
    }
}

const coreLib = [
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
    ["count", CoreLib.count]
];

// ------------------------------
// ---------- Core lib End ------
// ------------------------------

function test() {
    let vm = new Interpreter();
    vm.registerLib(coreLib);
    let src = "(list 1 2 3)";
    console.log(vm.repl(src));
}

test();
