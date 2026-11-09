"""Pearson and Spearman correlation for paired annual observations.

The p-value treats each pair as independent. Climate years usually are not,
so the p-value can look too small. Nothing here claims that one measure caused another.
"""
import math

MIN_PAIRS = 8
BANDS = (0.20, 0.40, 0.70)


def _mean(values):
    return sum(values) / len(values)


def _betacf(a, b, x):
    """Continued fraction for the incomplete beta function."""
    max_iter = 200
    eps = 3e-12
    tiny = 1e-30
    qab = a + b
    qap = a + 1.0
    qam = a - 1.0
    c = 1.0
    d = 1.0 - qab * x / qap
    if abs(d) < tiny:
        d = tiny
    d = 1.0 / d
    h = d
    for m in range(1, max_iter + 1):
        m2 = 2 * m
        aa = m * (b - m) * x / ((qam + m2) * (a + m2))
        d = 1.0 + aa * d
        if abs(d) < tiny:
            d = tiny
        c = 1.0 + aa / c
        if abs(c) < tiny:
            c = tiny
        d = 1.0 / d
        h *= d * c
        aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2))
        d = 1.0 + aa * d
        if abs(d) < tiny:
            d = tiny
        c = 1.0 + aa / c
        if abs(c) < tiny:
            c = tiny
        d = 1.0 / d
        delta = d * c
        h *= delta
        if abs(delta - 1.0) < eps:
            break
    return h


def _regularized_beta(a, b, x):
    if x <= 0.0:
        return 0.0
    if x >= 1.0:
        return 1.0
    ln_bt = math.lgamma(a + b) - math.lgamma(a) - math.lgamma(b) + a * math.log(x) + b * math.log(1.0 - x)
    front = math.exp(ln_bt)
    if x < (a + 1.0) / (a + b + 2.0):
        return front * _betacf(a, b, x) / a
    return 1.0 - front * _betacf(b, a, 1.0 - x) / b


def student_two_sided_p(t_stat, df):
    """Two-sided Student t probability."""
    if df <= 0:
        return 1.0
    x = df / (df + t_stat * t_stat)
    return _regularized_beta(df / 2.0, 0.5, x)


def _pearson_r(xs, ys):
    n = len(xs)
    mx = _mean(xs)
    my = _mean(ys)
    dx = [x - mx for x in xs]
    dy = [y - my for y in ys]
    sxx = sum(d * d for d in dx)
    syy = sum(d * d for d in dy)
    if sxx == 0.0 or syy == 0.0:
        return None, sxx, syy, mx, my
    sxy = sum(a * b for a, b in zip(dx, dy))
    r = sxy / math.sqrt(sxx * syy)
    return max(-1.0, min(1.0, r)), sxx, syy, mx, my


def _ranks(values):
    order = sorted(range(len(values)), key=lambda i: values[i])
    rank = [0.0] * len(values)
    i = 0
    while i < len(values):
        j = i
        while j + 1 < len(values) and values[order[j + 1]] == values[order[i]]:
            j += 1
        average = ((i + 1) + (j + 1)) / 2.0
        for k in range(i, j + 1):
            rank[order[k]] = average
        i = j + 1
    return rank


def _p_for(coef, n):
    if n < MIN_PAIRS or coef is None or abs(coef) >= 1.0:
        if coef is not None and abs(coef) >= 1.0 and n >= MIN_PAIRS:
            return 0.0
        return None
    df = n - 2
    denom = 1.0 - coef * coef
    if denom <= 0.0 or df <= 0:
        return None
    t_stat = abs(coef) * math.sqrt(df / denom)
    return student_two_sided_p(t_stat, df)


def interpret(coef):
    """Strength bands are a reading convention, not a scientific law."""
    if coef is None:
        return {"strength": "unavailable", "sign": "none"}
    mag = abs(coef)
    if mag < BANDS[0]:
        strength = "little"
    elif mag < BANDS[1]:
        strength = "weak"
    elif mag < BANDS[2]:
        strength = "moderate"
    else:
        strength = "strong"
    sign = "none" if strength == "little" else ("positive" if coef > 0 else "negative")
    return {"strength": strength, "sign": sign}


def align_years(years_x, values_x, years_y, values_y):
    """Keep a year only when both series have a value that year."""
    left = {year: value for year, value in zip(years_x, values_x)}
    right = {year: value for year, value in zip(years_y, values_y)}
    years = sorted(set(left).intersection(right))
    return years, [left[year] for year in years], [right[year] for year in years]


def relate_values(xs, ys):
    """Correlate two equal-length numeric series. Does not claim a cause."""
    if len(xs) != len(ys):
        return {"status": "uneven", "n": min(len(xs), len(ys))}
    n = len(xs)
    if n < 3:
        return {"status": "too_few", "n": n, "minimum_pairs": MIN_PAIRS}
    r, sxx, syy, mx, my = _pearson_r(xs, ys)
    if r is None:
        return {"status": "constant", "n": n, "minimum_pairs": MIN_PAIRS}
    if n < MIN_PAIRS:
        return {"status": "too_few", "n": n, "minimum_pairs": MIN_PAIRS}
    rho, _, _, _, _ = _pearson_r(_ranks(xs), _ranks(ys))
    pr = _p_for(r, n)
    ps = _p_for(rho, n)
    line = None
    if sxx > 0.0 and syy > 0.0:
        slope = r * math.sqrt(syy / sxx)
        line = {"slope": slope, "intercept": my - slope * mx}
    return {
        "status": "ok",
        "n": n,
        "minimum_pairs": MIN_PAIRS,
        "pearson": {
            "r": r,
            "p_value": pr,
            "significant": bool(pr is not None and pr < 0.05),
            "reading": interpret(r),
        },
        "spearman": {
            "rho": rho,
            "p_value": ps,
            "significant": bool(ps is not None and ps < 0.05),
            "reading": interpret(rho),
        },
        "line": line,
        "independence_note": "The p-value treats each year as independent. Neighbouring years in a climate record are usually related, so this p-value can look too small.",
        "cause_note": "A correlation is not evidence that one measure caused the other.",
    }
