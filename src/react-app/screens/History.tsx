import { useMemo, useState } from "react";
import { ClearPictures } from "../components/ClearPictures";
import { DayList, EntryLine } from "../components/DayList";
import { Icon } from "../components/Icon";
import { ScaleSwitch, ViewSwitch, type View } from "../components/ViewSwitch";
import { entriesToCsv } from "../lib/csv";
import { dayKey, dayMonth, groupByDay, monthKey } from "../lib/dates";
import { formatBaht } from "../lib/money";
import { defaultFilters, filterEntries, NO_CATEGORY, periodRange, periodTitle, shiftAnchor, sortEntries, type Filters, type Sort } from "../lib/stats";
import type { Entry, Kind } from "../lib/types";

type Props = {
	entries: Entry[];
	categories: string[];
	today: Date;
	filters: Filters;
	onFilters: (filters: Filters) => void;
	onView: (view: View) => void;
	onOpenEntry: (entry: Entry) => void;
	onDeleteShown: (entries: Entry[]) => void;
	onClearPictures: (before: Date) => void;
};

const KINDS: { value: Kind; label: string }[] = [
	{ value: "spent", label: "Spent" },
	{ value: "received", label: "Received" },
	{ value: "saved", label: "Saved" },
	{ value: "adjust", label: "Adjust" },
];

const SORTS: { value: Sort; label: string }[] = [
	{ value: "newest", label: "Newest" },
	{ value: "oldest", label: "Oldest" },
	{ value: "biggest", label: "Biggest" },
	{ value: "smallest", label: "Smallest" },
];

// A temporary link to an in-memory file is how a browser "saves" text it built itself.
function downloadCsv(entries: Entry[], today: Date) {
	const url = URL.createObjectURL(new Blob([entriesToCsv(entries)], { type: "text/csv;charset=utf-8" }));
	const link = document.createElement("a");
	link.href = url;
	link.download = `boeestrack-entries-${dayKey(today)}.csv`;
	link.click();
	URL.revokeObjectURL(url);
}

export function History({ entries, categories, today, filters, onFilters, onView, onOpenEntry, onDeleteShown, onClearPictures }: Props) {
	const results = useMemo(() => filterEntries(entries, filters), [entries, filters]);
	const [filtersOpen, setFiltersOpen] = useState(false);
	const filtersSet = [filters.kind !== "all", filters.category !== null, filters.source !== "all"].filter(Boolean).length;
	// The question is tied to the filters it was asked under, so changing a filter closes it and the count always matches the screen.
	const [askedFor, setAskedFor] = useState<Filters | null>(null);
	const confirming = askedFor === filters;
	const setConfirming = (on: boolean) => setAskedFor(on ? filters : null);
	const flat = filters.sort === "biggest" || filters.sort === "smallest";
	const sorted = useMemo(() => (flat ? sortEntries(results, filters.sort) : []), [flat, results, filters.sort]);
	// Day pages run newest first; "oldest" flips both the days and the lines inside each.
	const groups = useMemo(() => {
		const days = groupByDay(results, today).filter((group) => group.entries.length > 0);
		return filters.sort === "oldest" ? days.reverse().map((group) => ({ ...group, entries: [...group.entries].reverse() })) : days;
	}, [results, today, filters.sort]);
	// The total follows the kind being looked at: spent by default, received or saved when filtered to those.
	const totalKind: Kind = filters.kind === "all" ? "spent" : filters.kind;
	const total = results.filter((entry) => entry.kind === totalKind).reduce((sum, entry) => sum + entry.satang, 0);

	const range = useMemo(() => periodRange(filters.scale, filters.anchor), [filters.scale, filters.anchor]);
	// Typing searches all time, so the period and its arrows step aside until the search is cleared.
	const searching = filters.query.trim() !== "";
	const current = range.to.getTime() > today.getTime();

	// A date picked in the calendar always lands on that single day.
	const pickDate = (value: string) => {
		if (!value) return;
		const [y, m, d] = value.split("-").map(Number);
		set({ scale: "day", anchor: new Date(y, m - 1, d) });
	};
	const set = (patch: Partial<Filters>) => onFilters({ ...filters, ...patch });
	const step = (n: number) => set({ anchor: shiftAnchor(filters.scale, filters.anchor, n) });
	const untouched =
		filters.query === "" &&
		filters.category === null &&
		filters.kind === "all" &&
		filters.source === "all" &&
		filters.sort === "newest" &&
		filters.scale === "month" &&
		monthKey(filters.anchor) === monthKey(today);

	return (
		<main className="home">
			<header className="topnav">
				<ViewSwitch value="history" onChange={onView} />
			</header>

			<section className="today" aria-label="Find entries">
				<div className="ledger-head__top">
					<div className="month-pick">
						<h1 className="month">{searching ? "All time" : periodTitle(filters.scale, range, today)}</h1>
						{!searching && (
							<>
								<Icon name="down" size={16} />
								<input
									type="date"
									className="month-pick__input"
									value={dayKey(filters.anchor)}
									max={dayKey(today)}
									aria-label="Jump to a date"
									onChange={(event) => pickDate(event.target.value)}
									onClick={(event) => event.currentTarget.showPicker?.()}
								/>
							</>
						)}
					</div>
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
				{!searching && <ScaleSwitch scale={filters.scale} onChange={(scale) => set({ scale })} />}
				<label className="search-box">
					<Icon name="search" size={18} />
					<input
						type="search"
						className="note search"
						value={filters.query}
						onChange={(event) => set({ query: event.target.value })}
						placeholder="Search notes, tags, amounts"
						aria-label="Search notes, tags and amounts"
					/>
				</label>
				<div className="toolbar">
					<button type="button" className="filters__toggle" aria-expanded={filtersOpen} aria-controls="filter-panel" onClick={() => setFiltersOpen(!filtersOpen)}>
						<Icon name="filter" size={18} />
						<span>Filters</span>
						{filtersSet > 0 && <span className="filters__count">{filtersSet} set</span>}
						<Icon name="down" size={16} />
					</button>
					<label className="select select--bare results__sort">
						<span className="results__icon">
							<Icon name="sort" size={16} />
						</span>
						<select className="select__input" value={filters.sort} aria-label="Sort entries" onChange={(event) => set({ sort: event.target.value as Sort })}>
							{SORTS.map((sort) => (
								<option key={sort.value} value={sort.value}>
									{sort.label}
								</option>
							))}
						</select>
						<Icon name="down" size={16} />
					</label>
				</div>
				{filtersOpen && (
					<div className="filters" id="filter-panel" role="group" aria-label="Filters">
						<label className={filters.kind === "all" ? "filters__row" : "filters__row filters__row--on"}>
							<span className="filters__label">Kind</span>
							<span className="select select--bare">
								<select className="select__input" value={filters.kind} onChange={(event) => set({ kind: event.target.value as Filters["kind"] })}>
									<option value="all">All kinds</option>
									{KINDS.map((kind) => (
										<option key={kind.value} value={kind.value}>
											{kind.label}
										</option>
									))}
								</select>
								<Icon name="down" size={16} />
							</span>
						</label>
						<label className={filters.category === null ? "filters__row" : "filters__row filters__row--on"}>
							<span className="filters__label">Tag</span>
							<span className="select select--bare">
								<select className="select__input" value={filters.category ?? ""} onChange={(event) => set({ category: event.target.value || null })}>
									<option value="">Any tag</option>
									{[...categories, NO_CATEGORY].map((name) => (
										<option key={name} value={name}>
											{name}
										</option>
									))}
								</select>
								<Icon name="down" size={16} />
							</span>
						</label>
						<label className={filters.source === "all" ? "filters__row" : "filters__row filters__row--on"}>
							<span className="filters__label">Source</span>
							<span className="select select--bare">
								<select className="select__input" value={filters.source} onChange={(event) => set({ source: event.target.value as Filters["source"] })}>
									<option value="all">All sources</option>
									<option value="slips">Slips</option>
									<option value="manual">Typed in by hand</option>
								</select>
								<Icon name="down" size={16} />
							</span>
						</label>
					</div>
				)}
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
				) : flat ? (
					<ul className="day__lines">
						{sorted.map((entry) => (
							<EntryLine key={entry.id} entry={entry} when={dayMonth(entry.at)} onOpen={onOpenEntry} />
						))}
					</ul>
				) : (
					<DayList groups={groups} today={today} onOpenEntry={onOpenEntry} />
				)}
			</section>

			<footer className="backup">
				<div className="backup__links">
					<a className="text-btn" href="/api/data" download={`boeestrack-backup-${dayKey(today)}.json`}>
						Download backup
					</a>
					<button type="button" className="text-btn" onClick={() => downloadCsv(entries, today)}>
						Spreadsheet
					</button>
				</div>
				<ClearPictures entries={entries} today={today} onClear={onClearPictures} />
				{results.length > 0 &&
					(confirming ? (
						<div className="detail__confirm">
							<p className="today__note today__note--warn" role="alert">
								<Icon name="warning" size={18} />
								<span>
									Delete {results.length} {results.length === 1 ? "entry" : "entries"} ({formatBaht(total)} {totalKind}) and their slip pictures? Download a backup first. This
									can't be undone.
								</span>
							</p>
							<button type="button" className="detail__btn detail__btn--keep" onClick={() => setConfirming(false)}>
								Keep them
							</button>
							<button
								type="button"
								className="detail__btn detail__btn--delete"
								onClick={() => {
									setConfirming(false);
									onDeleteShown(results);
								}}
							>
								Yes, delete {results.length}
							</button>
						</div>
					) : (
						<button type="button" className="detail__btn detail__btn--outline detail__delete" onClick={() => setConfirming(true)}>
							Delete these {results.length} {results.length === 1 ? "entry" : "entries"}
						</button>
					))}
			</footer>
		</main>
	);
}
