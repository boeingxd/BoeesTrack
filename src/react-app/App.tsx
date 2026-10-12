import { useEffect, useRef, useState } from "react";
import type { View } from "./components/ViewSwitch";
import { checkIn } from "./lib/balance";
import * as api from "./lib/api";
import { saveOrUndo } from "./lib/optimistic";
import { flagDuplicates, newSlip, readBatch } from "./lib/slipBatch";
import { defaultFilters, periodRange, type Filters, type Scale } from "./lib/stats";
import type { BudgetPlan, Entry, Pot, Slip } from "./lib/types";
import { AddSpend } from "./screens/AddSpend";
import { BudgetSheet } from "./screens/BudgetSheet";
import { EntryDetail } from "./screens/EntryDetail";
import { History } from "./screens/History";
import { Home } from "./screens/Home";
import { Savings } from "./screens/Savings";
import { SlipReview } from "./screens/SlipReview";
import { Stats } from "./screens/Stats";

type Screen = "home" | "stats" | "history" | "add" | "slips" | "savings" | "budget" | "entry" | "edit";

function App() {
	const [today] = useState(() => new Date());
	const [entries, setEntries] = useState<Entry[]>([]);
	const [categories, setCategories] = useState<string[]>([]);
	const [plan, setPlan] = useState<BudgetPlan>({ monthly: 0, daily: "auto" });
	const [pots, setPots] = useState<Pot[]>([]);
	const [load, setLoad] = useState<"loading" | "failed" | "ready">("loading");
	const [attempt, setAttempt] = useState(0);
	const [notice, setNotice] = useState<string | null>(null);
	const [slips, setSlips] = useState<Slip[]>([]);
	const picker = useRef<HTMLInputElement>(null);
	// Counts batches, so a batch you closed stops being read.
	const batchId = useRef(0);
	const [screen, setScreen] = useState<Screen>("home");
	const [justAddedId, setJustAddedId] = useState<string | null>(null);
	const [intro, setIntro] = useState(true);
	const [statsScale, setStatsScale] = useState<Scale>("month");
	const [statsAnchor, setStatsAnchor] = useState(today);
	const [filters, setFilters] = useState<Filters>(() => defaultFilters(today));
	// An entry opens from any list and closes back to the screen it was opened from.
	const [detail, setDetail] = useState<{ entry: Entry; from: Screen } | null>(null);

	// The page-load entrance plays once; coming back to home from another screen stays still.
	useEffect(() => {
		const timer = setTimeout(() => setIntro(false), 900);
		return () => clearTimeout(timer);
	}, []);

	// Everything comes from D1 once; the screens then work on this copy and save each change behind it.
	useEffect(() => {
		let cancelled = false;
		api.loadAll().then(
			(all) => {
				if (cancelled) return;
				setEntries(all.entries);
				setPots(all.pots);
				setCategories(all.categories);
				setPlan(all.plan);
				setLoad("ready");
			},
			() => {
				if (!cancelled) setLoad("failed");
			},
		);
		return () => {
			cancelled = true;
		};
	}, [attempt]);

	// Each change shows at once; if the save fails it is taken back and a notice appears.
	function save(request: () => Promise<unknown>, undo: () => void) {
		void saveOrUndo(request, undo, setNotice);
	}

	function addCategory(name: string) {
		if (categories.includes(name)) return;
		setCategories((current) => [...current, name]);
		save(() => api.addCategory(name), () => setCategories((current) => current.filter((c) => c !== name)));
	}

	// Opening Insight from Home shows today's period at the scale you last used.
	function goToView(view: View) {
		if (view === "stats" && screen === "home") setStatsAnchor(today);
		setScreen(view);
	}

	// Changing scale keeps the period you are in: if it contains today, the new scale starts at today.
	function changeScale(scale: Scale) {
		const range = periodRange(statsScale, statsAnchor);
		if (range.from.getTime() <= today.getTime() && today.getTime() < range.to.getTime()) setStatsAnchor(today);
		setStatsScale(scale);
	}

	function openDay(date: Date) {
		setStatsAnchor(date);
		setStatsScale("day");
	}

	function openWeek(date: Date) {
		setStatsAnchor(date);
		setStatsScale("week");
	}

	// "See all" and a category on Insight open History on the same day, week or month.
	function openHistory(patch: Partial<Filters> = {}) {
		setFilters({ ...defaultFilters(today), scale: statsScale, anchor: statsAnchor, ...patch });
		setScreen("history");
	}

	function openEntry(entry: Entry) {
		setDetail({ entry, from: screen });
		setScreen("entry");
	}

	// The change shows at once and is saved behind it; a failed save puts the old entry back.
	function editEntry(updated: Entry) {
		const before = entries.find((e) => e.id === updated.id);
		if (!before) return;
		setEntries((current) => current.map((e) => (e.id === updated.id ? updated : e)));
		setDetail((current) => (current ? { ...current, entry: updated } : current));
		save(() => api.editEntry(updated), () => setEntries((current) => current.map((e) => (e.id === updated.id ? before : e))));
		setScreen("entry");
	}

	function deleteEntry(entry: Entry) {
		setEntries((current) => current.filter((e) => e.id !== entry.id));
		save(() => api.deleteEntry(entry.id), () => setEntries((current) => [...current, entry]));
		setScreen(detail?.from ?? "home");
	}

	// History's "delete these": gone from the screen at once, and put back if the save fails.
	function deleteEntries(list: Entry[]) {
		const ids = new Set(list.map((e) => e.id));
		setEntries((current) => current.filter((e) => !ids.has(e.id)));
		save(() => api.deleteEntries([...ids]), () => setEntries((current) => [...current, ...list]));
	}

	function storeEntries(added: Entry[]) {
		setEntries((current) => [...current, ...added]);
		const ids = new Set(added.map((e) => e.id));
		save(() => api.addEntries(added), () => setEntries((current) => current.filter((e) => !ids.has(e.id))));
	}

	function addEntries(added: Entry[]) {
		storeEntries(added);
		setJustAddedId(added[0]?.id ?? null);
		setScreen("home");
	}

	const savedRefs = () => new Set(entries.flatMap((e) => (e.slipRef ? [e.slipRef] : [])));

	// Picking pictures opens the review at once; each slip fills in as it is read, then its name is looked at again more closely.
	async function startBatch(files: File[]) {
		const id = ++batchId.current;
		const stamp = Date.now();
		const batch = files.map((file, i) => newSlip(file, `slip-${stamp}-${i}`));
		setSlips(flagDuplicates(batch, savedRefs()));
		setScreen("slips");
		await readBatch(
			batch,
			entries,
			(slipId, change) => setSlips((current) => flagDuplicates(current.map((s) => (s.id === slipId ? change(s) : s)), savedRefs())),
			() => batchId.current !== id,
		);
	}

	// Closing a batch frees the picture previews it was holding.
	function endBatch() {
		batchId.current++;
		slips.forEach((slip) => slip.url && URL.revokeObjectURL(slip.url));
		setSlips([]);
		setScreen("home");
	}

	// The entries save first, because the Worker only keeps a picture for an entry that exists.
	// A picture that fails to upload never undoes its entry: the money is saved, so it only warns.
	function confirmSlips(ready: Slip[]) {
		const added: Entry[] = ready.map((slip) => ({
			id: `entry-${slip.id}`,
			kind: "spent",
			satang: slip.satang ?? 0,
			at: slip.at ?? new Date(),
			category: slip.category,
			note: slip.note,
			slipRef: slip.ref,
			payeeKey: slip.payeeKey,
		}));
		setEntries((current) => [...current, ...added]);
		setJustAddedId(added[0]?.id ?? null);
		endBatch();
		const ids = new Set(added.map((e) => e.id));
		save(
			async () => {
				await api.addEntries(added);
				const stored = new Set<string>();
				for (const slip of ready) {
					try {
						if (slip.file && slip.ref) await api.putSlip(slip.ref, slip.file);
						if (slip.ref) stored.add(slip.ref);
					} catch {
						// counted below
					}
				}
				setEntries((current) => current.map((e) => (e.slipRef && stored.has(e.slipRef) ? { ...e, hasImage: true } : e)));
				if (stored.size < ready.length) setNotice(`Saved the entries, but ${ready.length - stored.size} of the pictures did not upload.`);
			},
			() => setEntries((current) => current.filter((e) => !ids.has(e.id))),
		);
	}

	function addCheckIn(bankSatang: number) {
		const adjustment = checkIn(entries, bankSatang, new Date());
		if (adjustment) storeEntries([adjustment]);
	}

	function addPot(pot: Pot) {
		setPots((current) => [...current, pot]);
		save(() => api.addPot(pot), () => setPots((current) => current.filter((p) => p.name !== pot.name)));
	}

	// A renamed pot takes its entries with it, so its total survives; a failed rename puts both back.
	function editPot(oldName: string, pot: Pot) {
		const before = pots.find((p) => p.name === oldName);
		setPots((current) => current.map((p) => (p.name === oldName ? pot : p)));
		if (pot.name !== oldName) setEntries((current) => current.map((e) => (e.pot === oldName ? { ...e, pot: pot.name } : e)));
		save(
			() => api.editPot(oldName, pot),
			() => {
				if (before) setPots((current) => current.map((p) => (p.name === pot.name ? before : p)));
				if (pot.name !== oldName) setEntries((current) => current.map((e) => (e.pot === pot.name ? { ...e, pot: oldName } : e)));
			},
		);
	}

	function savePlan(next: BudgetPlan) {
		const before = plan;
		setPlan(next);
		save(() => api.savePlan(next), () => setPlan(before));
		setScreen("home");
	}

	if (load !== "ready") {
		return (
			<div className="app">
				<p className="boot" role="status">
					{load === "loading" ? (
						"Opening your notebook…"
					) : (
						<>
							Couldn't load your data.
							<button
								type="button"
								onClick={() => {
									setLoad("loading");
									setAttempt((n) => n + 1);
								}}
							>
								Try again
							</button>
						</>
					)}
				</p>
			</div>
		);
	}

	return (
		<div className="app">
			<input
				ref={picker}
				type="file"
				accept="image/jpeg,image/png,image/webp"
				multiple
				hidden
				onChange={(event) => {
					const files = [...(event.target.files ?? [])];
					event.target.value = "";
					if (files.length > 0) void startBatch(files);
				}}
			/>
			{notice && (
				<button type="button" className="notice" role="alert" onClick={() => setNotice(null)}>
					{notice} Tap to dismiss.
				</button>
			)}
			{screen === "home" && (
				<Home
					entries={entries}
					plan={plan}
					today={today}
					intro={intro}
					justAddedId={justAddedId}
					onAdd={() => setScreen("add")}
					onView={goToView}
					onCheckIn={addCheckIn}
					onBudget={() => setScreen("budget")}
					onOpenEntry={openEntry}
					onSlips={() => picker.current?.click()}
				/>
			)}
			{screen === "stats" && (
				<Stats
					entries={entries}
					today={today}
					scale={statsScale}
					anchor={statsAnchor}
					onAnchor={setStatsAnchor}
					onScale={changeScale}
					onView={goToView}
					onOpenDay={openDay}
					onOpenWeek={openWeek}
					onOpenCategory={(category) => openHistory({ category })}
					onOpenHistory={() => openHistory()}
					onOpenEntry={openEntry}
				/>
			)}
			{screen === "history" && (
				<History
					entries={entries}
					categories={categories}
					today={today}
					filters={filters}
					onFilters={setFilters}
					onView={goToView}
					onOpenEntry={openEntry}
					onDeleteShown={deleteEntries}
				/>
			)}
			{screen === "entry" && detail && (
				<EntryDetail
					entry={detail.entry}
					today={today}
					onClose={() => setScreen(detail.from)}
					onEdit={() => setScreen("edit")}
					onDelete={() => deleteEntry(detail.entry)}
				/>
			)}
			{screen === "edit" && detail && (
				<AddSpend
					editing={detail.entry}
					categories={categories}
					pots={pots}
					onAddPot={addPot}
					onAddCategory={addCategory}
					onClose={() => setScreen("entry")}
					onSave={(draft) => editEntry({ ...detail.entry, ...draft })}
				/>
			)}
			{screen === "savings" && (
				<Savings
					entries={entries}
					pots={pots}
					today={today}
					onView={goToView}
					onAddPot={addPot}
					onEditPot={editPot}
				/>
			)}
			{screen === "budget" && (
				<BudgetSheet
					plan={plan}
					onClose={() => setScreen("home")}
					onSave={savePlan}
				/>
			)}
			{screen === "add" && (
				<AddSpend
					categories={categories}
					pots={pots}
					onAddPot={addPot}
					onAddCategory={addCategory}
					onClose={() => setScreen("home")}
					onSave={(draft) => addEntries([{ id: `entry-${Date.now()}`, ...draft }])}
				/>
			)}
			{screen === "slips" && (
				<SlipReview
					slips={slips}
					categories={categories}
					onChange={(next) => setSlips(flagDuplicates(next, savedRefs()))}
					onClose={endBatch}
					onAddByHand={() => setScreen("add")}
					onConfirm={confirmSlips}
				/>
			)}
		</div>
	);
}

export default App;
