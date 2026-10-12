import { describe, expect, it, vi } from "vitest";
import { saveOrUndo } from "./optimistic";

describe("saveOrUndo", () => {
	it("does nothing more when the save works", async () => {
		const undo = vi.fn();
		const onFail = vi.fn();
		await saveOrUndo(() => Promise.resolve(), undo, onFail);
		expect(undo).not.toHaveBeenCalled();
		expect(onFail).not.toHaveBeenCalled();
	});

	it("undoes once and tells the owner when the save fails", async () => {
		const undo = vi.fn();
		const onFail = vi.fn();
		await saveOrUndo(() => Promise.reject(new Error("409")), undo, onFail);
		expect(undo).toHaveBeenCalledTimes(1);
		expect(onFail).toHaveBeenCalledTimes(1);
		expect(onFail.mock.calls[0][0]).toMatch(/taken back/);
	});

	it("also undoes when the save throws before returning a promise", async () => {
		const undo = vi.fn();
		await saveOrUndo(() => {
			throw new Error("offline");
		}, undo, vi.fn());
		expect(undo).toHaveBeenCalledTimes(1);
	});
});
