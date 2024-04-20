import * as html5parser from "html5parser"

describe("Tokenizer", () => {
  it("tokenizes things", () => {
    console.log(html5parser.parse("<div>hello</div>"))
  })
})
