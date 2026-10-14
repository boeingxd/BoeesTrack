import { describe, expect, it } from "vitest";
import { parseSlip, receiverFromCrop } from "./slip";

// Invented text in the shape of OCR output from a transfer slip: not taken from any real slip.
const SHOP = `© Bangkok Bank
รายการสําเร็จ
03 ม.ค. 70, 09:15
จํานวนเงิน
1,250.50 tHe
จาก           ©)   นาย Test
000-0-xxx000
ธนาคารกรุงเทพ
ไปที่           © TEST CAFE
(ร้านทดสอบ)
Biller ID:000000000000000
รหัสร้านค้า
000000000000000
คําธรรมเนียม 0.00 THB
เลขที่อ้างอิง
2030010309150012345678AD  junk`;

const PERSON = `Bangkok Bank
รายการสําเร็จ
12 ธ.ค. 69, 18:40
จํานวนเงิน
75.00 THB
จาก   นาย Test
ไปที่   MR TEST PERSON
SECOND NAME
094-xxx-0000
พร้อมเพย์
คําธรรมเนียม 0.00 THB
เลขที่อ้างอิง
2026121218400012345678901`;

describe("parseSlip", () => {
	it("reads amount, time, receiver and reference from a shop payment", () => {
		const slip = parseSlip(SHOP);
		expect(slip.satang).toBe(125050);
		expect(slip.at).toEqual(new Date(2027, 0, 3, 9, 15));
		expect(slip.receiver).toBe("TEST CAFE (ร้านทดสอบ)");
		expect(slip.slipRef).toBe("2030010309150012345678AD");
	});

	it("takes the dated reference, not the shop code a shop slip prints above it", () => {
		const withCode = SHOP.replace("000000000000000\nคําธรรมเนียม", "08000000000000000000\nคําธรรมเนียม");
		expect(withCode).toContain("08000000000000000000");
		expect(parseSlip(withCode).slipRef).toBe("2030010309150012345678AD");
	});

	it("drops the shop icon OCR reads as a short lowercase word, but keeps MR and 7 Eleven", () => {
		const receiver = (first: string) => parseSlip(`12 ธ.ค. 69, 18:40\n75.00\nจาก x\nไปที่ ${first}\nพร้อมเพย์`).receiver;
		expect(receiver("fn TEST SHOP")).toBe("TEST SHOP");
		expect(receiver("© fn TEST SHOP")).toBe("TEST SHOP");
		expect(receiver("MR TEST")).toBe("MR TEST");
		expect(receiver("7 Eleven")).toBe("7 Eleven");
	});

	it("keys a shop by Biller ID plus shop code, so shops sharing a biller get different keys", () => {
		const slip = (code: string) => `ไปที่ TEST SHOP\nBiller ID:010000000000001\nรหัสร้านค้า\n${code}\nรหัสธุรกรรม`;
		expect(parseSlip(slip("KB000002265832")).payeeKey).toBe("b:010000000000001:000002265832");
		expect(parseSlip(slip("KB000009999999")).payeeKey).toBe("b:010000000000001:000009999999");
		expect(parseSlip(slip("รเพอ00002265832")).payeeKey).toBe("b:010000000000001:00002265832");
	});

	it("gives no key to a biller with no readable shop code, rather than risk another shop's name", () => {
		expect(parseSlip("ไปที่ TEST\nBiller ID:010000000000001\nหมายเลขอ้างอิง 1\n341038367").payeeKey).toBeNull();
		expect(parseSlip("ไปที่ TEST\nBiller ID:010000000000001\nรหัสร้านค้า\n12").payeeKey).toBeNull();
	});

	it("keys a person by the masked account or wallet number, never by the sender's own", () => {
		const person = PERSON.replace("094-xxx-0000", "094-X*%-6338").replace("จาก   นาย Test", "จาก นาย Test\n028-7-xxx883");
		expect(parseSlip(person).payeeKey).toBe("a:094-xxx-6338");
		expect(parseSlip("ไปที่ TEST\nเติมเงิน\nหมายเลข e-wallet\n00699-044-482-4128").payeeKey).toBe("w:00699-044-482-4128");
		expect(parseSlip("จาก\n028-7-xxx883\nไปที่ MR TEST\nพร้อมเพย์").payeeKey).toBeNull();
	});

	it("ends the receiver at a Service Code line", () => {
		expect(receiverFromCrop("TEST BILLER\nService Code:ABC123\n")).toBe("TEST BILLER");
		expect(receiverFromCrop("TEST PAYMENT\nSERVICE\nBiller ID:010000000000001")).toBe("TEST PAYMENT SERVICE");
		// Digits and a dash inside a shop name are not an account number; one at the start of a line is.
		expect(receiverFromCrop("TEST MART_1234-SIAM\nSQUARE\n\nBiller |ID:010000000000001")).toBe("TEST MART_1234-SIAM SQUARE");
		expect(receiverFromCrop("TEST PERSON\n123-4-xxx567\nธนาคารทดสอบ")).toBe("TEST PERSON");
		expect(receiverFromCrop("TEST PERSON\n1-2345-xxxxx-67-8\nพร้อมเพย์")).toBe("TEST PERSON");
		expect(receiverFromCrop("7-ELEVEN TEST\nBiller ID:010000000000001")).toBe("7-ELEVEN TEST");
	});

	it("reads a name from a crop that has no label, dropping the logo junk", () => {
		expect(receiverFromCrop("© fn TEST SHOP\n(ร้านทดสอบ)\nBiller ID:010000000000001")).toBe("TEST SHOP (ร้านทดสอบ)");
	});

	it("stops the receiver at the account line on a person-to-person slip", () => {
		const slip = parseSlip(PERSON);
		expect(slip.satang).toBe(7500);
		expect(slip.at).toEqual(new Date(2026, 11, 12, 18, 40));
		expect(slip.receiver).toBe("MR TEST PERSON SECOND NAME");
	});

	it("falls back to the reference for the time when the Thai month is garbled", () => {
		const slip = parseSlip(SHOP.replace("ม.ค.", "wx"));
		expect(slip.at).toEqual(new Date(2030, 0, 3, 9, 15));
	});

	it("never takes the 0.00 fee as the amount, and returns nulls for junk", () => {
		expect(parseSlip("คําธรรมเนียม 0.00 THB").satang).toBeNull();
		expect(parseSlip("hello")).toEqual({ satang: null, at: null, receiver: "", slipRef: null, payeeKey: null });
	});
});
