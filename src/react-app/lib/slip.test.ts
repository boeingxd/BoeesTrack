import { describe, expect, it } from "vitest";
import { parseSlip } from "./slip";

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
		expect(parseSlip("hello")).toEqual({ satang: null, at: null, receiver: "", slipRef: null });
	});
});
