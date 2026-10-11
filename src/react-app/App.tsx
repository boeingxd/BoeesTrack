import { useEffect, useState } from "react";
import type { View } from "./components/ViewSwitch";
import { checkIn } from "./lib/balance";
import { DEFAULT_CATEGORIES, SAMPLE_PLAN, SAMPLE_POTS, sampleEntries, sampleSlips } from "./lib/sample";
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

type Screen = "home" | "stats" | "history" | "add" | "slips" | "savings" | "budget" | "entry";

function App() {
	const [today] = useState(() => new Date());
	const [entries, setEntries] = useState<Entry[]>(() => sampleEntries(today));
	const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
	const [plan, setPlan] = useState<BudgetPlan>(SAMPLE_PLAN);
	const [pots, setPots] = useState<Pot[]>(SAMPLE_POTS);
	const [slips, setSlips] = useState<Slip[]>([]);
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

	function addCategory(name: string) {
		setCategories((current) => (current.includes(name) ? current : [...current, name]));
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

	// "See all" and a category on Insight open History on the same day, week or month.
	function openHistory(patch: Partial<Filters> = {}) {
		setFilters({ ...defaultFilters(today), scale: statsScale, anchor: statsAnchor, ...patch });
		setScreen("history");
	}

	function openEntry(entry: Entry) {
		setDetail({ entry, from: screen });
		setScreen("entry");
	}

	function addEntries(added: Entry[]) {
		setEntries((current) => [...current, ...added]);
		setJustAddedId(added[0]?.id ?? null);
		setScreen("home");
	}

	function addCheckIn(bankSatang: number) {
		const adjustment = checkIn(entries, bankSatang, new Date());
		if (adjustment) setEntries((current) => [...current, adjustment]);
	}

	function addPot(pot: Pot) {
		setPots((current) => [...current, pot]);
	}

	// A renamed pot takes its entries with it, so its total survives.
	function editPot(oldName: string, pot: Pot) {
		setPots((current) => current.map((p) => (p.name === oldName ? pot : p)));
		if (pot.name !== oldName) setEntries((current) => current.map((e) => (e.pot === oldName ? { ...e, pot: pot.name } : e)));
	}

	return (
		<div className="app">
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
					onSlips={() => {
						setSlips(sampleSlips(today));
						setScreen("slips");
					}}
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
				/>
			)}
			{screen === "entry" && detail && <EntryDetail entry={detail.entry} today={today} onClose={() => setScreen(detail.from)} />}
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
					onSave={(next) => {
						setPlan(next);
						setScreen("home");
					}}
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
					onChange={setSlips}
					onClose={() => setScreen("home")}
					onAddByHand={() => setScreen("add")}
					onConfirm={(ready) =>
						addEntries(
							ready.map((slip) => ({
								id: `entry-${slip.id}`,
								kind: "spent" as const,
								satang: slip.satang ?? 0,
								at: slip.at ?? new Date(),
								category: slip.category,
								note: "",
								slipRef: slip.ref,
							})),
						)
					}
				/>
			)}
		</div>
	);
}

export default App;
