import unittest

from src.acquire.safe import load_saved
from src.api.main import build_comparison, comparison_csv


class RecordTests(unittest.TestCase):
    def test_five_cities_are_different_places(self):
        dhaka, _, _ = load_saved("dhaka")
        delhi, _, _ = load_saved("delhi")
        jakarta, _, _ = load_saved("jakarta")
        cairo, _, _ = load_saved("cairo")
        lagos, _, _ = load_saved("lagos")
        self.assertLess(float(delhi["T2M"]["20040101"]), 15)
        self.assertGreater(float(jakarta["T2M"]["20040101"]), 24)
        self.assertGreater(float(lagos["T2M"]["20040101"]), 24)
        self.assertNotEqual(dhaka["T2M"]["20040101"], delhi["T2M"]["20040101"])
        self.assertNotEqual(dhaka["T2M"]["20040101"], cairo["T2M"]["20040101"])
        self.assertEqual(len(dhaka["T2M"]), 7671)

    def test_same_country_pair_uses_two_records(self):
        dhaka, _, _ = load_saved("dhaka")
        sylhet, _, _ = load_saved("sylhet")
        self.assertNotEqual(dhaka["T2M"]["20040101"], sylhet["T2M"]["20040101"])
        result = build_comparison("dhaka", "sylhet", "T2M", "ALL", 2004, 2024)
        self.assertEqual(result["a"]["country"], "Bangladesh")
        self.assertEqual(result["b"]["country"], "Bangladesh")
        self.assertIn("fitted", result["difference"])

    def test_dhaka_and_jakarta_do_not_share_one_result(self):
        result = build_comparison("dhaka", "jakarta", "T2M", "ALL", 2004, 2024)
        self.assertNotEqual(result["a"]["trend"]["significant"], result["b"]["trend"]["significant"])
        self.assertIn("ci_low_per_decade", result["a"]["slope"])
        self.assertIn("missing_marked", result["a"]["gaps"])
        text = comparison_csv(result)
        self.assertIn("p_value", text)
        self.assertIn("NASA POWER", text)
        self.assertIn("Dhaka", text)
        self.assertIn("Jakarta", text)


if __name__ == "__main__":
    unittest.main()
