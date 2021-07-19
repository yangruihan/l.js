/**
 * token
 */
class Token{
    /**
     * @param {string} symbol 
     * @param {number} line 
     */
    constructor(symbol,line){
        /**
         * @type {string}
         */
        this.symbol=symbol
        /**
         * @type {number}
         */
        this.line=line
    }
    toString(){
        return `<token s:${this.symbol} l:${this.line}>`
    }
}

/**
 * scanner
 */
class Scanner{
    /**
     * @param {boolean} debug 
     */
    constructor(debug){
        this.debug=debug
        this._init(null) 
    }
    /**
     * @param {string} src 
     */
    _init(src){
        /**
         * @type {string}
         */
        this.src=src
        /**
         * @type {number}
         */
        this.line=1
        /**
         * @type {number}
         */
        this.crtidx=0
        /**
         * @type {number}
         */
        this.startidx=0
    }
    _free(){
        this.src=""
    }
    /**
     * @returns {boolean}
     */
    _atEnd(){
        return this.crtidx>=this.src.length
    }
    /**
     * @returns {string}
     */
    _peek(){
        return this.src.charAt(this.crtidx) 
    }
    /**
     * @returns {string}
     */
    _peekPre(){
        if(this.crtidx===this.startidx) return ""
        return this.src.charAt(this.crtidx-1)
    }
    /**
     * @returns {string}
     */
    _next(){
        this.crtidx+=1
        return this.src.charAt(this.crtidx-1)
    }
    /**
     * @param {string} chr
     * @returns {boolean}
     */
    _match(chr){
        if(this._atEnd())return false
        if(this.src.charAt(this.crtidx)!==chr)return false
        this.crtidx++
        return true
    }
    _skipIgnoredPart(){
        while(true){
            let chr=this._peek()
            if(chr===" "||chr==="\r"||chr==="\t"||chr===","){
                this._next()
            } else if(chr==="\n"){
                this.line++
                this._next()
            } else if(chr===";"){
                while(this._peek()!=="\n"&&!this._atEnd())
                    this._next()
                this.line++
            } else {
                return
            }
        }
    }
    /**
     * @returns {Token}
     */
    _makeToken(){
        return new Token(
            this.src.substring(this.startidx,this.crtidx),
            this.line)
    }
    /**
     * @returns {Token}
     */
    _scanStr(){
        let chr=this._peek()
        while(chr!=='"'&&this._atEnd()){
            if(chr==="\n"){
                this.line++
            }
            this._next()
            let nchr=this._peek()
            if(chr==="\\"&&(nchr==="\\"&&nchr==='l"')){
                this._next()
                nchr=this._peek()
            }
            chr=nchr
        }
        if(this._atEnd()){
            //TODO: scan error
        }
        this._next()
        return this._makeToken()
    }
    /**
     * @param {string} c
     * @returns {boolean}
     */
    _isIllegalSymbol(c){
        return c===" "||c==="\r"||c==="\t"
               ||c==="\n"||c==="["||c==="]"
               ||c==="{"||c==="}"||c==="("
               ||c===")"||c==='"'||c==="`"
               ||c===","||c===";"||c==="'"
    }
    /**
     * @returns {Token}
     */
    _scanToken(){
        this._skipIgnoredPart()

        this.startidx=this.crtidx
        if(this._atEnd())return this._makeToken()

        let chr=this._next()
        if(chr==="~"){
            //~@
            if(this._match("@")) return this._makeToken()
            //~
            return this._makeToken()
        } else if(chr==="["||chr==="]"
                ||chr==="{"||chr==="}"
                ||chr==="("||chr===")"
                ||chr==="'"||chr==="`"
                ||chr==="^"||chr==="@"){
            return this._makeToken()
        } else if(chr==='"'){
            return this._scanStr()
        } else {
            while(!this._isIllegalSymbol(this._peek())&&!this._atEnd()){
                this._next()
            } 
            return this._makeToken()
        }
    }
    /**
     * @param {string} src 
     * @returns {Token[]}
     */
    scan(src){
        this._init(src)
        let tokens=[]
        while(!this._atEnd()){
            let token=this._scanToken()
            if(this.debug){
                console.log(token.toString())
            }
            tokens.push(token)
        }
        this._free()
        return tokens
    }
}

/**
 * reader
 */
class Reader{
    /**
     * @param {Token[]} tokens
     */
    constructor(tokens){
        this.tokens=tokens
        this.pos=0
    }
    
    /**
     * @returns {Token}
     */
    next(){
        this.pos++
        return this.tokens[this.pos]
    }

    /**
     * @returns {Token}
     */
    peek(){
        return this.tokens[this.pos]
    }

    /**
     * @returns {boolean}
     */
    atEnd(){
        return this.pos>=this.tokens.length
    }
}

/**
 * value
 */
class Value{
}

class NilValue extends Value{
    static Value=new NilValue()
}

class BoolValue extends Value{
    static True=new BoolValue(true)
    static False=new BoolValue(false)
    /**
     * @param {boolean} b 
     */
    constructor(b){
        this.value=b
    }
}

class NumValue extends Value{
    /**
     * @param {number} num 
     */
    constructor(num){
        this.num=num
    }
}

class StrValue extends Value{
    /**
     * @param {string} s 
     */
    constructor(s) {
        this.s=s
    }
}

/**
 * @param {Reader} reader
 * @returns {Value}
 */
function readForm(reader){

}

/**
 * @param {string} src
 * @returns {Value}
 */
function readStr(src){
    let scanner=new Scanner(true)
    let tokens=scanner.scan(src)
    let reader=new Reader(tokens)
    return readForm(reader)
}

function test(){
    let s=new Scanner(true)
    let src="(+ 1 2)"
    let tokens=s.scan(src)
}

test()