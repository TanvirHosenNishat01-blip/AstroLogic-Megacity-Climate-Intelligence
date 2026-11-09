import unittest

from src.compute.trend import mann_kendall_test, theil_sen_slope


class TrendTests(unittest.TestCase):
    def test_clear_increase_is_significant(self):
        values = list(range(1, 22))
        result = mann_kendall_test(values)
        self.assertEqual(result["direction"], "increasing")
        self.assertTrue(result["significant"])
        self.assertLess(result["p_value"], 0.05)
        slope = theil_sen_slope(list(range(2004, 2025)), values)
        self.assertAlmostEqual(slope["slope"], 1.0)
        self.assertLessEqual(slope["ci_low"], 1.0)
        self.assertGreaterEqual(slope["ci_high"], 1.0)

    def test_flat_series_is_not_significant(self):
        result = mann_kendall_test([5, 5, 5, 5, 5, 5, 5, 5])
        self.assertEqual(result["direction"], "no trend")
        self.assertFalse(result["significant"])
        self.assertEqual(result["p_value"], 1.0)

    def test_decrease_has_negative_slope(self):
        years = [2000, 2001, 2002, 2003, 2004, 2005]
        values = [10, 8, 6, 4, 2, 0]
        result = mann_kendall_test(values)
        slope = theil_sen_slope(years, values)
        self.assertEqual(result["direction"], "decreasing")
        self.assertAlmostEqual(slope["slope"], -2.0)
        self.assertLess(slope["ci_low"], 0)
        self.assertLess(slope["ci_high"], 0)

    def test_normal_quantile_is_about_1_96(self):
        from src.compute.trend import _normsinv
        self.assertAlmostEqual(_normsinv(0.975), 1.95996398454, places=6)


if __name__ == "__main__":
    unittest.main()
