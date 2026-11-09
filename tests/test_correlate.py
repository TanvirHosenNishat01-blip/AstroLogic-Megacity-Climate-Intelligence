import math
import unittest

from src.compute.correlate import MIN_PAIRS, align_years, relate_values, student_two_sided_p


class CorrelateTests(unittest.TestCase):
    def test_student_t_near_five_percent(self):
        # Two-sided critical value for df=10 is about 2.228.
        p = student_two_sided_p(2.22813885199, 10)
        self.assertAlmostEqual(p, 0.05, places=3)

    def test_perfect_line(self):
        xs = list(range(1, 12))
        ys = [2 * x + 1 for x in xs]
        result = relate_values(xs, ys)
        self.assertEqual(result["status"], "ok")
        self.assertAlmostEqual(result["pearson"]["r"], 1.0, places=6)
        self.assertAlmostEqual(result["spearman"]["rho"], 1.0, places=6)
        self.assertEqual(result["pearson"]["p_value"], 0.0)
        self.assertAlmostEqual(result["line"]["slope"], 2.0, places=6)
        self.assertAlmostEqual(result["line"]["intercept"], 1.0, places=6)

    def test_perfect_negative(self):
        xs = list(range(1, 12))
        ys = [-3 * x for x in xs]
        result = relate_values(xs, ys)
        self.assertAlmostEqual(result["pearson"]["r"], -1.0, places=6)
        self.assertEqual(result["pearson"]["reading"]["strength"], "strong")
        self.assertEqual(result["pearson"]["reading"]["sign"], "negative")

    def test_known_moderate_pair(self):
        xs = [1, 2, 3, 4, 5, 6, 7, 8]
        ys = [2, 1, 4, 3, 6, 5, 8, 7]
        result = relate_values(xs, ys)
        self.assertEqual(result["n"], 8)
        self.assertAlmostEqual(result["pearson"]["r"], 38 / 42, places=6)
        self.assertTrue(result["pearson"]["significant"])

    def test_constant_series_has_no_coefficient(self):
        result = relate_values([1, 2, 3, 4, 5, 6, 7, 8], [4, 4, 4, 4, 4, 4, 4, 4])
        self.assertEqual(result["status"], "constant")
        self.assertNotIn("pearson", result)

    def test_too_few_pairs_are_not_reported_as_a_correlation(self):
        result = relate_values([1, 2, 3, 4], [1, 2, 3, 5])
        self.assertEqual(result["status"], "too_few")
        self.assertLess(result["n"], MIN_PAIRS)
        self.assertNotIn("pearson", result)

    def test_alignment_drops_unmatched_years(self):
        years, xs, ys = align_years([2004, 2005, 2007], [1, 2, 3], [2005, 2006, 2007], [4, 5, 6])
        self.assertEqual(years, [2005, 2007])
        self.assertEqual(xs, [2, 3])
        self.assertEqual(ys, [4, 6])

    def test_saved_power_file_pairs_one_city(self):
        from src.api.main import build_relation
        result = build_relation("dhaka", "sylhet", "ALL", 2004, 2024, refresh=False)
        dhaka = result["points"]["a"]["pairs"]["T2M|PRECTOTCORR"]
        family = result["points"]["a"]["pairs"]["T2M|T2M_MIN"]
        self.assertEqual(result["points"]["a"]["name"], "Dhaka")
        self.assertGreaterEqual(dhaka["n"], MIN_PAIRS)
        self.assertEqual(dhaka["status"], "ok")
        self.assertFalse(dhaka["same_family"])
        self.assertTrue(family["same_family"])
        self.assertNotIn("T2M|T2M", result["points"]["a"]["pairs"])
        self.assertIn("cause", result["method"]["cause"].lower())

    def test_ties_do_not_break_spearman(self):
        xs = [1, 2, 2, 4, 5, 6, 7, 8]
        ys = [1, 2, 3, 4, 5, 6, 7, 8]
        result = relate_values(xs, ys)
        self.assertTrue(math.isfinite(result["spearman"]["rho"]))
        self.assertGreater(result["spearman"]["rho"], 0.9)


if __name__ == "__main__":
    unittest.main()
