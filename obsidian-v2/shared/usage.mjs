export function claudeWindows(data) {
    return [['five_hour', 300], ['seven_day', 10080]].flatMap(([key, minutes]) => {
        const w = data?.[key];
        if (typeof w?.utilization !== 'number' || !Number.isFinite(w.utilization) || w.utilization < 0 || w.utilization > 100)
            return [];
        const reset = typeof w.resets_at === 'string' ? Date.parse(w.resets_at) : NaN;
        // The account endpoint returns percentages already, not 0–1 fractions.
        return [{ usedPercent: w.utilization, windowDurationMins: minutes, resetsAt: Number.isFinite(reset) ? reset / 1000 : null }];
    });
}
// simon: per-model weekly buckets (seven_day_opus, seven_day_fable, ...) Claude reports alongside the totals.
export function claudeModels(data) {
    return Object.entries(data || {}).flatMap(([key, w]) => {
        const m = /^seven_day_([a-z0-9]+)$/.exec(key);
        if (!m || ['oauth_apps', 'cowork'].includes(m[1]) || typeof w?.utilization !== 'number' || !Number.isFinite(w.utilization)) return [];
        return [{ name: m[1][0].toUpperCase() + m[1].slice(1), usedPercent: Math.max(0, Math.min(100, w.utilization)) }];
    });
}
export function codexWindows(data) {
    // A Spark-specific bucket is not the general Codex allowance.
    const bucket = data?.rateLimitsByLimitId != null ? data.rateLimitsByLimitId.codex :
        (!data?.rateLimits?.limitId || data.rateLimits.limitId === 'codex' ? data?.rateLimits : null);
    return [bucket?.primary, bucket?.secondary].filter(w => w && typeof w.usedPercent === 'number' && Number.isFinite(w.usedPercent) && typeof w.windowDurationMins === 'number' && w.windowDurationMins > 0)
        .map(w => ({ usedPercent: Math.max(0, Math.min(100, w.usedPercent)), windowDurationMins: w.windowDurationMins, resetsAt: typeof w.resetsAt === 'number' && Number.isFinite(w.resetsAt) ? w.resetsAt : null }))
        .sort((a, b) => a.windowDurationMins - b.windowDurationMins);
}
export function windowLabel(minutes) { return minutes === 300 ? '5h window' : minutes === 10080 ? 'Weekly window' : minutes % 1440 === 0 ? `${minutes / 1440}d window` : minutes % 60 === 0 ? `${minutes / 60}h window` : `${minutes}m window`; }
// Presentation order only: preserve the reader's values and cached snapshot.
export function windowsForDisplay(windows) {
    return [...windows].sort((a,b)=>(a.windowDurationMins===10080?-1:0)-(b.windowDurationMins===10080?-1:0)||a.windowDurationMins-b.windowDurationMins);
}
