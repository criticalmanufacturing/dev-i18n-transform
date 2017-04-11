import * as chai from "chai";
import { Translation } from "../../src/model/translation";

describe("Translation Model", () => {
    it("should be able to create a translation model", () => {
        let language = "en-US", text = "Translation 1";
        let translation = new Translation(language, text);

        chai.expect(translation.language).to.equal(language);
        chai.expect(translation.text).to.equal(text);
    });
});