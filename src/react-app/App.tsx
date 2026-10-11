import { useEffect, useState } from "react";
import type { View } from "./components/ViewSwitch";
import { monthKey } from "./lib/dates";
import { DEFAULT_CATEGORIES, SAMPLE_BUDGET, sampleEntries, sampleSlips } from "./lib/sample";
import { defaultFilters, periodRange, type Filters, type Scale } from "./lib/stats";
import type { Entry, Slip } from "./lib/types";
import { AddSpend } from "./screens/AddSpend";
import { History } from "./screens/History";
import { Home } from "./screens/Home";
import { SlipReview } from "./screens/SlipReview";
import { Stats } from "./screens/Stats";

type Screen = "home" | "stats" | "history" | "add" | "slips";

function App() {
	const [today] = useState(() => new Date());
	const [entries, setEntries] = useState<Entry[]>(() => sampleEntries(today));
	const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
	const [slips, setSlips] = useState<Slip[]>([]);
	const [screen, setScreen] = useState<Screen>("home");
	const [justAddedId, setJustAddedId] = useState<string | null>(null);
	const [intro, setIntro] = useState(true);
	const [statsScale, setStatsScale] = useState<Scale>("month");
	const [statsAnchor, setStatsAnchor] = useState(today);
	const [filters, setFilters] = useState<Filters>(() => defaultFilters(monthKey(today)));
	// History is reached from Home or from a category on the Stats page, and goes back to where it came from.
	const [historyFrom, setHistoryFrom] = useState<"home" | "stats">("home");

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

	function openHistory(from: "home" | "stats", next: Filters) {
		setHistoryFrom(from);
		setFilters(next);
		setScreen("history");
	}

	function addEntries(added: Entry[]) {
		setEntries((current) => [...current, ...added]);
		setJustAddedId(added[0]?.id ?? null);
		setScreen("home");
	}

	return (
		<div className="app">
			{screen === "home" && (
				<Home
					entries={entries}
					budget={SAMPLE_BUDGET}
					today={today}
					intro={intro}
					justAddedId={justAddedId}
					onAdd={() => setScreen("add")}
					onView={goToView}
					onHistory={() => openHistory("home", defaultFilters(monthKey(today)))}
					onSlips={() => {
						setSlips(sampleSlips(today));
						setScreen("slips");
					}}
				/>
			)}
			{screen === "stats" && (
				<Stats
					entries={entries}
					budget={SAMPLE_BUDGET}
					today={today}
					scale={statsScale}
					anchor={statsAnchor}
					onAnchor={setStatsAnchor}
					onScale={changeScale}
					onView={goToView}
					onOpenDay={openDay}
					onOpenCategory={(category, month) => openHistory("stats", { ...defaultFilters(month), category })}
				/>
			)}
			{screen === "history" && (
				<History
					entries={entries}
					categories={categories}
					today={today}
					filters={filters}
					onFilters={setFilters}
					onBack={() => setScreen(historyFrom)}
				/>
			)}
			{screen === "add" && (
				<AddSpend
					categories={categories}
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
