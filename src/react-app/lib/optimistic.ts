// A change is already on screen; the save runs behind it. If the save fails, take the change back and say so.
export async function saveOrUndo(save: () => Promise<unknown>, undo: () => void, onFail: (message: string) => void): Promise<void> {
	try {
		await save();
	} catch {
		undo();
		onFail("Couldn't save that, so it was taken back.");
	}
}
