import { useMemo } from "react";
import { DayList } from "../components/DayList";
import { Icon } from "../components/Icon";
import { groupByDay, monthFromKey, monthKey, monthTitle } from "../lib/dates";
import { formatBaht } from "../lib/money";
import { defaultFilters, filterEntries, NO_CATEGORY, type Filters } from "../lib/stats";
import type { Entry, Kind } from "../lib/types";

type Props = {
	entries: Entry[];
	categories: string[];
	today: Date;
	filters: Filters;
	onFilters: (filters: Filters) => void;
	onBack: () => void;
};

const KINDS: { value: "all" | Kind; label: string }[] = [
	{ value: "all", label: "Everything" },
	{ value: "spent", label: "Spent" },
	{ value: "received", label: "Received" },
	{ value: "saved", label: "Saved" },
];

export function History({ entries, categories, today, filters, onFilters, onBack }: Props) {
	const results = useMemo(() => filterEntries(entries, filters), [entries, filters]);
	const groups = useMemo(() => groupByDay(results, today).filter((group) => group.entries.length > 0), [results, today]);
	// The total follows the kind being looked at: spent by default, received or saved when filtered to those.
	const totalKind: Kind = filters.kind === "all" ? "spent" : filters.kind;
	const total = results.filter((entry) => entry.kind === totalKind).reduce((sum, entry) => sum + entry.satang, 0);

	// Months that actually have entries, newest first, plus the month being looked at.
	const months = useMemo(() => {
		const keys = new Set(entries.map((entry) => monthKey(entry.at)));
		keys.add(monthKey(today));
		if (filters.month) keys.add(filters.month);
		return [...keys].sort().reverse();
	}, [entries, today, filters.month]);

	const set = (patch: Partial<Filters>) => onFilters({ ...filters, ...patch });
	const untouched = filters.query === "" && filters.category === null && filters.kind === "all" && filters.month === monthKey(today);

	return (
		<div className="screen screen--sheet">
			<header className="topbar">
				<button type="button" className="icon-btn" onClick={onBack} aria-label="Back">
					<Icon name="back" />
				</button>
				<h1 className="topbar__title">History</h1>
				<span className="topbar__spacer" aria-hidden="true" />
			</header>

			<div className="sheet sheet--page">
				<div className="fields">
					<div className="field">
						<span className="field__label" aria-hidden="true">
							Find
						</span>
						<div className="field__body">
							<input
								type="search"
								className="note"
								value={filters.query}
								onChange={(event) => set({ query: event.target.value })}
								placeholder="Search notes, tags, amounts"
								aria-label="Search notes, tags and amounts"
							/>
						</div>
					</div>
					<div className="field">
						<span className="field__label" aria-hidden="true">
							Tag
						</span>
						<div className="field__body">
							<label className="select select--bare">
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
						</div>
					</div>
					<div className="field">
						<span className="field__label" aria-hidden="true">
							Kind
						</span>
						<div className="field__body">
							<label className="select select--bare">
								<select
									className="select__input"
									value={filters.kind}
									aria-label="Filter by kind"
									onChange={(event) => set({ kind: event.target.value as "all" | Kind })}
								>
									{KINDS.map((kind) => (
										<option key={kind.value} value={kind.value}>
											{kind.label}
										</option>
									))}
								</select>
								<Icon name="down" size={16} />
							</label>
						</div>
					</div>
					<div className="field">
						<span className="field__label" aria-hidden="true">
							Month
						</span>
						<div className="field__body">
							<label className="select select--bare">
								<select
									className="select__input"
									value={filters.month ?? ""}
									aria-label="Filter by month"
									onChange={(event) => set({ month: event.target.value || null })}
								>
									<option value="">All months</option>
									{months.map((key) => (
										<option key={key} value={key}>
											{monthTitle(monthFromKey(key))}
										</option>
									))}
								</select>
								<Icon name="down" size={16} />
							</label>
						</div>
					</div>

				</div>
				<div className="results">
					<p aria-live="polite">
						{results.length} {results.length === 1 ? "entry" : "entries"} · {formatBaht(total)} {totalKind}
					</p>
					{!untouched && (
						<button type="button" className="text-btn" onClick={() => onFilters(defaultFilters(monthKey(today)))}>
							Reset
						</button>
					)}
				</div>

				{groups.length === 0 ? (
					<p className="results__empty">Nothing matches. Try fewer filters, or choose All months.</p>
				) : (
					<DayList groups={groups} today={today} />
				)}
			</div>
		</div>
	);
}
