import { useMemo } from "react";
import { DayList } from "../components/DayList";
import { Icon } from "../components/Icon";
import { ViewSwitch, type View } from "../components/ViewSwitch";
import { groupByDay, monthKey } from "../lib/dates";
import { formatBaht } from "../lib/money";
import { defaultFilters, filterEntries, NO_CATEGORY, periodRange, periodTitle, shiftAnchor, type Filters } from "../lib/stats";
import type { Entry, Kind } from "../lib/types";

type Props = {
	entries: Entry[];
	categories: string[];
	today: Date;
	filters: Filters;
	onFilters: (filters: Filters) => void;
	onView: (view: View) => void;
	onOpenEntry: (entry: Entry) => void;
};

const KINDS: { value: Kind; label: string }[] = [
	{ value: "spent", label: "Spent" },
	{ value: "received", label: "Received" },
	{ value: "saved", label: "Saved" },
	{ value: "adjust", label: "Adjust" },
];

export function History({ entries, categories, today, filters, onFilters, onView, onOpenEntry }: Props) {
	const results = useMemo(() => filterEntries(entries, filters), [entries, filters]);
	const groups = useMemo(() => groupByDay(results, today).filter((group) => group.entries.length > 0), [results, today]);
	// The total follows the kind being looked at: spent by default, received or saved when filtered to those.
	const totalKind: Kind = filters.kind === "all" ? "spent" : filters.kind;
	const total = results.filter((entry) => entry.kind === totalKind).reduce((sum, entry) => sum + entry.satang, 0);

	const range = useMemo(() => periodRange(filters.scale, filters.anchor), [filters.scale, filters.anchor]);
	// Typing searches all time, so the period and its arrows step aside until the search is cleared.
	const searching = filters.query.trim() !== "";
	const current = range.to.getTime() > today.getTime();

	const set = (patch: Partial<Filters>) => onFilters({ ...filters, ...patch });
	const step = (n: number) => set({ anchor: shiftAnchor(filters.scale, filters.anchor, n) });
	const untouched =
		filters.query === "" &&
		filters.category === null &&
		filters.kind === "all" &&
		filters.scale === "month" &&
		monthKey(filters.anchor) === monthKey(today);

	return (
		<main className="home">
			<header className="topnav">
				<ViewSwitch value="history" onChange={onView} />
			</header>

			<section className="today" aria-label="Find entries">
				<div className="ledger-head__top">
					<h1 className="month">{searching ? "All time" : periodTitle(filters.scale, range, today)}</h1>
					{!searching && (
						<div className="month-nav">
							<button type="button" className="icon-btn" aria-label={`Previous ${filters.scale}`} onClick={() => step(-1)}>
								<Icon name="back" />
							</button>
							<button type="button" className="icon-btn" aria-label={`Next ${filters.scale}`} disabled={current} onClick={() => step(1)}>
								<Icon name="forward" />
							</button>
						</div>
					)}
				</div>
				<input
					type="search"
					className="note search"
					value={filters.query}
					onChange={(event) => set({ query: event.target.value })}
					placeholder="Search notes, tags, amounts"
					aria-label="Search notes, tags and amounts"
				/>
				<div className="chips" role="group" aria-label="Filters">
					<label className={filters.category === null ? "select select--bare chip" : "select select--bare chip chip--on"}>
						<select
							className="select__input"
							value={filters.category ?? ""}
							aria-label="Filter by tag"
							onChange={(event) => set({ category: event.target.value || null })}
						>
							<option value="">Any tag</option>
							{[...categories, NO_CATEGORY].map((name) => (
								<option key={name} value={name}>
									{name}
								</option>
							))}
						</select>
						<Icon name="down" size={16} />
					</label>
					{KINDS.map((kind) => (
						<button
							key={kind.value}
							type="button"
							className="chip"
							aria-pressed={filters.kind === kind.value}
							onClick={() => set({ kind: filters.kind === kind.value ? "all" : kind.value })}
						>
							{kind.label}
						</button>
					))}
				</div>
				<div className="results">
					<p aria-live="polite">
						{results.length} {results.length === 1 ? "entry" : "entries"} · {formatBaht(total)} {totalKind}
					</p>
					{!untouched && (
						<button type="button" className="text-btn" onClick={() => onFilters(defaultFilters(today))}>
							Reset
						</button>
					)}
				</div>
			</section>

			<section className="sheet sheet--page" aria-label="Matching entries">
				{groups.length === 0 ? (
					<p className="results__empty">Nothing matches. Try fewer filters{searching ? "." : ", or search to look through all time."}</p>
				) : (
					<DayList groups={groups} today={today} onOpenEntry={onOpenEntry} />
				)}
			</section>
		</main>
	);
}
