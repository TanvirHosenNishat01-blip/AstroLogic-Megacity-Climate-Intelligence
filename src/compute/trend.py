import math

def mann_kendall_test(values):
    n = len(values)
    if n < 2:
        return {
            "S": 0.0,
            "Z": 0.0,
            "p_value": 1.0,
            "direction": "no trend",
            "significant": False
        }
    
    s = 0
    for i in range(n - 1):
        for j in range(i + 1, n):
            diff = values[j] - values[i]
            if diff > 0:
                s += 1
            elif diff < 0:
                s -= 1

    var_s = n * (n - 1) * (2 * n + 5) / 18.0
    
    if s > 0:
        z = (s - 1) / math.sqrt(var_s) if var_s > 0 else 0.0
    elif s < 0:
        z = (s + 1) / math.sqrt(var_s) if var_s > 0 else 0.0
    else:
        z = 0.0

    p_value = math.erfc(abs(z) / math.sqrt(2.0))
    direction = "increasing" if s > 0 else ("decreasing" if s < 0 else "no trend")
    significant = bool(p_value < 0.05)

    return {
        "S": float(s),
        "Z": float(z),
        "p_value": float(p_value),
        "direction": direction,
        "significant": significant,
        "significant_at_0.05": significant
    }

# Alias for backwards compatibility
mann_kendall = mann_kendall_test

def theil_sen_slope(x, y):
    n = len(x)
    if n < 2:
        return {"slope": 0.0, "intercept": 0.0}
    
    slopes = []
    for i in range(n - 1):
        for j in range(i + 1, n):
            dx = x[j] - x[i]
            if dx != 0:
                slopes.append((y[j] - y[i]) / dx)
    
    if not slopes:
        return {"slope": 0.0, "intercept": 0.0}
    
    slopes.sort()
    mid = len(slopes) // 2
    slope = slopes[mid] if len(slopes) % 2 == 1 else (slopes[mid - 1] + slopes[mid]) / 2.0

    intercepts = [y[i] - slope * x[i] for i in range(n)]
    intercepts.sort()
    mid_int = len(intercepts) // 2
    intercept = intercepts[mid_int] if len(intercepts) % 2 == 1 else (intercepts[mid_int - 1] + intercepts[mid_int]) / 2.0

    return {
        "slope": float(slope),
        "intercept": float(intercept)
    }

# Alias for backwards compatibility
theil_sen = theil_sen_slope
