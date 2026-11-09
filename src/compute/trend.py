"""Mann-Kendall test and Theil-Sen slope with a 95% confidence interval.

The calculations are deterministic. Nothing in this module calls a language model.
"""
import math
from collections import Counter

ALPHA = 0.05


def _normsinv(p: float) -> float:
    """Inverse of the standard normal CDF (Acklam's approximation)."""
    if p <= 0.0 or p >= 1.0:
        raise ValueError("probability must be between 0 and 1")
    a = [
        -3.969683028665376e01,
        2.209460984245205e02,
        -2.759285104469687e02,
        1.383577518672690e02,
        -3.066479806614716e01,
        2.506628277459239e00,
    ]
    b = [
        -5.447609879822406e01,
        1.615858368580409e02,
        -1.556989798598866e02,
        6.680131188771972e01,
        -1.328068155288572e01,
    ]
    c = [
        -7.784894002430293e-03,
        -3.223964580411365e-01,
        -2.400758277161838e00,
        -2.549732539343734e00,
        4.374664141464968e00,
        2.938163982698783e00,
    ]
    d = [
        7.784695709041462e-03,
        3.224671290700398e-01,
        2.445134137142996e00,
        3.754408661907416e00,
    ]
    plow = 0.02425
    phigh = 1 - plow
    if p < plow:
        q = math.sqrt(-2 * math.log(p))
        return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / (
            (((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1
        )
    if p > phigh:
        q = math.sqrt(-2 * math.log(1 - p))
        return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / (
            (((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1
        )
    q = p - 0.5
    r = q * q
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (
        ((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1
    )


def _variance_s(values) -> float:
    """Variance of the Mann-Kendall S statistic, with a correction for ties."""
    n = len(values)
    tie_term = 0
    for count in Counter(values).values():
        if count > 1:
            tie_term += count * (count - 1) * (2 * count + 5)
    return (n * (n - 1) * (2 * n + 5) - tie_term) / 18.0


def mann_kendall_test(values, alpha: float = ALPHA) -> dict:
    """Two-sided Mann-Kendall test for a monotonic trend."""
    n = len(values)
    if n < 3:
        return {
            "n": n,
            "S": 0.0,
            "var_s": 0.0,
            "Z": 0.0,
            "p_value": 1.0,
            "alpha": alpha,
            "direction": "no trend",
            "significant": False,
            "significant_at_0.05": False,
        }

    s = 0
    for i in range(n - 1):
        for j in range(i + 1, n):
            diff = values[j] - values[i]
            if diff > 0:
                s += 1
            elif diff < 0:
                s -= 1

    var_s = _variance_s(values)
    if var_s <= 0:
        z = 0.0
        p_value = 1.0
    elif s > 0:
        z = (s - 1) / math.sqrt(var_s)
        p_value = math.erfc(abs(z) / math.sqrt(2.0))
    elif s < 0:
        z = (s + 1) / math.sqrt(var_s)
        p_value = math.erfc(abs(z) / math.sqrt(2.0))
    else:
        z = 0.0
        p_value = 1.0

    if s > 0:
        direction = "increasing"
    elif s < 0:
        direction = "decreasing"
    else:
        direction = "no trend"
    significant = bool(p_value < alpha)
    return {
        "n": n,
        "S": float(s),
        "var_s": float(var_s),
        "Z": float(z),
        "p_value": float(p_value),
        "alpha": alpha,
        "direction": direction,
        "significant": significant,
        "significant_at_0.05": bool(p_value < 0.05),
    }


mann_kendall = mann_kendall_test


def _median(sorted_values):
    mid = len(sorted_values) // 2
    if len(sorted_values) % 2 == 1:
        return sorted_values[mid]
    return (sorted_values[mid - 1] + sorted_values[mid]) / 2.0


def theil_sen_slope(x, y, alpha: float = ALPHA) -> dict:
    """Theil-Sen median slope and its (1-alpha) confidence interval.

    The interval follows Sen (1968), using the variance of the Mann-Kendall S
    statistic as described by Gilbert (1987).
    """
    n = len(x)
    if n < 3 or n != len(y):
        return {
            "slope": 0.0,
            "intercept": 0.0,
            "ci_low": 0.0,
            "ci_high": 0.0,
            "confidence": 1 - alpha,
            "n_slopes": 0,
        }

    slopes = []
    for i in range(n - 1):
        for j in range(i + 1, n):
            dx = x[j] - x[i]
            if dx != 0:
                slopes.append((y[j] - y[i]) / dx)
    if not slopes:
        return {
            "slope": 0.0,
            "intercept": 0.0,
            "ci_low": 0.0,
            "ci_high": 0.0,
            "confidence": 1 - alpha,
            "n_slopes": 0,
        }

    slopes.sort()
    slope = _median(slopes)
    intercepts = sorted(y[i] - slope * x[i] for i in range(n))
    intercept = _median(intercepts)

    count = len(slopes)
    var_s = _variance_s(y)
    z = _normsinv(1 - alpha / 2.0)
    c_alpha = z * math.sqrt(var_s) if var_s > 0 else 0.0
    # Ranks are 1-based positions in the ordered list of pairwise slopes.
    rank_low = int(math.floor((count - c_alpha) / 2.0))
    rank_high = int(math.ceil((count + c_alpha) / 2.0))
    rank_low = max(1, min(count, rank_low))
    rank_high = max(1, min(count, rank_high))
    ci_low = slopes[rank_low - 1]
    ci_high = slopes[rank_high - 1]

    return {
        "slope": float(slope),
        "intercept": float(intercept),
        "ci_low": float(ci_low),
        "ci_high": float(ci_high),
        "confidence": 1 - alpha,
        "n_slopes": count,
    }


theil_sen = theil_sen_slope
