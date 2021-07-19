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
        return `<token ${this.symbol} ${this.line}>`
    }
}

/**
 * scanner
 */
class Scanner{
    constructor(){
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

        this.startid=this.crtidx
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
            tokens.push(this._scanToken())
        }
        this._free()
        return tokens
    }
}

function test(){
    let s=new Scanner()
    let src="(+ 1 2)"
    let tokens=s.scan(src)
    tokens.forEach(t => {
        console.log(t.toString())
    })
}

test()