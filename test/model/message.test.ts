import * as chai from "chai";
import { Message } from "../../src/model/message";
import { Translation } from "../../src/model/translation";

describe("Message Model", () => {

    describe("#constructor", () => {
        it("should be able to create a message without translations", () => {
            let id = "1", description = "2";
            let msg = new Message(id, description);

            chai.expect(msg).to.be.instanceof(Message);
            chai.expect(msg.id).to.equal(id);
            chai.expect(msg.description).to.equal(description);
        });
    });

    describe("#addOrUpdateTranslation", () => {

        let message: Message;

        beforeEach(() => {
             message = new Message("MessageModel.addOrUpdateTranslation", "beforeEach");
        });

        it("should be able to add a new translation", () => {
            message.addOrUpdateTranslation(new Translation("en-US", "English"));

            chai.expect(message.hasTranslation("en-US")).to.be.true;
            chai.expect(message.hasTranslation("pt-PT")).to.be.false;
        });

        it("should be able to add more than one new translation", () => {

            message.addOrUpdateTranslation(new Translation("en-US", "English"));
            message.addOrUpdateTranslation(new Translation("pt-PT", "Portuguese"));

            chai.expect(message.hasTranslation("en-US")).to.be.true;
            chai.expect(message.hasTranslation("pt-PT")).to.be.true;

        });

        it("should be able to update an existing translation", () => {
            message.addOrUpdateTranslation(new Translation("en-US", "English"));
            message.addOrUpdateTranslation(new Translation("en-US", "Keyword"));

            let enUSMessage = message.getTranslation("en-US");
            chai.expect(enUSMessage.text).to.equal("Keyword");
        });
    });

    describe("#merge", () => {
        it("should be able to merge message with different languages", () => {
            let message1 = new Message("MessageModel.merge", "1");
            message1.addOrUpdateTranslation(new Translation("en-US", "English"));

            chai.expect(message1.hasTranslation("pt-PT")).to.be.false;

            let message2 = new Message("MessageModel.merge", "1");
            message2.addOrUpdateTranslation(new Translation("pt-PT", "Portuguese"));

            message1.merge(message2);

            chai.expect(message1.hasTranslation("pt-PT")).to.be.true;
            let ptTranslation1 = message1.getTranslation("pt-PT");
            let ptTranslation2 = message2.getTranslation("pt-PT");

            chai.expect(ptTranslation1).to.be.equal(ptTranslation2);
        });

        it("should be able to update messages with the same translation", () => {

            let message1 = new Message("MessageModel.merge", "1");
            message1.addOrUpdateTranslation(new Translation("en-US", "English"));

            chai.expect(message1.hasTranslation("pt-PT")).to.be.false;

            let message2 = new Message("MessageModel.merge", "1");
            message2.addOrUpdateTranslation(new Translation("en-US", "Keyword"));

            message1.merge(message2);

            chai.expect(message1.getTranslation("en-US").text).to.equal("Keyword");
        });
    });
});