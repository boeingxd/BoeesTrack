import { describe, expect, it } from "vitest";
import { findNameBox, pickName, type OcrLine } from "./nameRead";

// Invented slip geometry: a 1000 x 2000 picture. Each character is { text, x0 }.
const line = (top: number, text: string, x0 = 80): OcrLine => ({ top, chars: [...text].map((t, i) => ({ text: t, x0: x0 + i * 10 })) });

describe("findNameBox", () => {
	const lines = [line(300, "date"), line(1200, "ไปที่"), line(1200, "SHOP", 420), line(1500, "ค่าธรรมเนียม"), line(1800, "ref")];

	it("covers the area right of the logo column, from the label down to the fee line", () => {
		const box = findNameBox(lines, 1000, 2000);
		expect(box).toEqual({ left: 385, top: 1180, width: 600, height: 316 });
	});

	it("matches the label when its characters are separate and the logo is read as text", () => {
		const withLogo: OcrLine = { top: 1200, chars: [...line(1200, "ไปที่").chars, { text: "i", x0: 320 }, ...line(1200, "SHOP", 420).chars] };
		expect(findNameBox([withLogo], 1000, 2000)?.top).toBe(1180);
	});

	it("falls back to a fixed height when there is no fee line, and null with no label", () => {
		expect(findNameBox([line(1200, "ไปที่")], 1000, 2000)?.height).toBe(220 + 20);
		expect(findNameBox([line(300, "hello")], 1000, 2000)).toBeNull();
	});
});

describe("pickName", () => {
	it("prefers clean Thai over a combined reading that mixes in Latin", () => {
		expect(pickName({ both: "นาย Sudv ยิ่งยง", thai: "นายธัชอิง ยิ่งยง", eng: "uly Sudv" })).toBe("นายธัชอิง ยิ่งยง");
	});

	it("uses the English reading when the combined one is Thai mixed with digits", () => {
		expect(pickName({ both: "แห7 4 ร039735รแห", thai: "แห7 4 ร039735รแห", eng: "AMZ A_SC3973S IIT" })).toBe("AMZ A_SC3973S IIT");
	});

	it("does not take English gibberish for a Thai name, and keeps a good combined reading", () => {
		expect(pickName({ both: "ร6ธ8ม", thai: "ร6ธ8ม", eng: "uly Sudv" })).toBe("ร6ธ8ม");
		expect(pickName({ both: "MR HTOO HTET OO", thai: "ร ธ", eng: "MR HTOO" })).toBe("MR HTOO HTET OO");
	});

	it("falls back to whichever reading exists", () => {
		expect(pickName({ both: "", thai: "", eng: "SHOP" })).toBe("SHOP");
	});
});
