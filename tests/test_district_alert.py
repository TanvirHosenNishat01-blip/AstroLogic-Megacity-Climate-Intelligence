import unittest
from datetime import date, datetime, timezone

from src.acquire.district_alert import (
    cyclone_block,
    fires_for,
    flood_block,
    flood_for_district,
    forecast_block,
    forecast_is_active,
    geometry_contains,
    imerg_block,
    interior_point,
    load_shapes,
    power_block,
)


class DistrictAlertTests(unittest.TestCase):
    def test_dhaka_point_is_inside_dhaka_only(self):
        shapes = load_shapes()
        self.assertEqual(len(shapes), 64)
        self.assertTrue(geometry_contains(shapes["Dhaka"], 90.4125, 23.8103))
        self.assertFalse(geometry_contains(shapes["Sylhet"], 90.4125, 23.8103))
        self.assertFalse(geometry_contains(shapes["Khulna"], 90.4125, 23.8103))
        self.assertTrue(geometry_contains(shapes["Chittagong"], 91.812, 22.356))
        self.assertTrue(geometry_contains(shapes["Sylhet"], 91.8687, 24.8949))

    def test_interior_point_stays_inside(self):
        shapes = load_shapes()
        for name in ("Dhaka", "Sylhet", "Khulna", "Chittagong"):
            point = interior_point(shapes[name])
            self.assertTrue(point["inside"])
            self.assertTrue(geometry_contains(shapes[name], point["lon"], point["lat"]))

    def test_fire_filter_keeps_only_the_square(self):
        square = {"type": "Polygon", "coordinates": [[[90, 23], [91, 23], [91, 24], [90, 24], [90, 23]]]}
        rows = [
            {"lat": 23.5, "lon": 90.5, "when": "2026-11-07T1200"},
            {"lat": 23.2, "lon": 89.9, "when": "2026-11-07T1100"},
            {"lat": 10, "lon": 10, "when": "2026-11-07T1000"},
        ]
        inside, near = fires_for(square, rows)
        self.assertEqual(len(inside), 1)
        self.assertEqual(inside[0]["lat"], 23.5)
        self.assertEqual(len(near), 1)

    def test_expired_forecast_is_not_active(self):
        row = {"step_end": "2026-11-01", "category": "Heavy"}
        self.assertFalse(forecast_is_active(row, date(2026, 11, 7)))
        block = forecast_block(row, "2026-11-07T00:00:00Z", date(2026, 11, 7))
        self.assertEqual(block["status"], "expired")
        self.assertFalse(block["active"])
        self.assertEqual(block["category"], "Heavy")

    def test_active_forecast_keeps_source_words(self):
        row = {
            "forecast_date": "2026-11-07",
            "step_start": "2026-11-07",
            "step_end": "2026-11-11",
            "val_min": "1.5",
            "val_avg": "bad",
            "val_max": "12",
            "category": "Very Heavy",
            "threshold": ">88",
            "unit": "mm",
            "color": "#990000",
        }
        block = forecast_block(row, "2026-11-07T00:00:00Z", date(2026, 11, 7))
        self.assertTrue(block["active"])
        self.assertEqual(block["category"], "Very Heavy")
        self.assertEqual(block["minimum"], 1.5)
        self.assertIsNone(block["average"])
        self.assertEqual(block["maximum"], 12)

    def test_missing_power_does_not_invent_a_number(self):
        block = power_block({"lat": 23.8, "lon": 90.4}, None, "down")
        self.assertEqual(block["status"], "unavailable")
        self.assertNotIn("rain_mm_day", block)

    def test_empty_forecast_is_not_safety(self):
        block = forecast_block(None, None, date(2026, 11, 7))
        self.assertEqual(block["status"], "no_relevant_data")
        self.assertFalse(block["active"])

    def test_flood_403_is_not_a_clear_river(self):
        class Response:
            status_code = 403
            text = "Access Denied: Invalid Security Header"

        block = flood_block(Response(), "2026-11-08T13:00:00Z", "2026-11-08")
        self.assertEqual(block["state"], "authentication_required")
        self.assertEqual(block["levels"], [])
        self.assertNotIn("reading", block)

    def test_flood_level_stays_inside_its_district(self):
        square = {"type": "Polygon", "coordinates": [[[90, 23], [91, 23], [91, 24], [90, 24], [90, 23]]]}
        class Response:
            status_code = 200
            text = ""

            def json(self):
                return [
                    {"station": "Inside", "lat": 23.5, "lon": 90.5, "waterlevel": 6.2, "dangerlevel": 6.0, "date": "2026-11-08"},
                    {"station": "Outside", "lat": 10, "lon": 10, "waterlevel": 9, "dangerlevel": 1, "date": "2026-11-08"},
                ]

        block = flood_for_district(flood_block(Response(), "2026-11-08T13:00:00Z", "2026-11-08"), square)
        self.assertEqual(block["reading"], "above_danger")
        self.assertEqual([row["station"] for row in block["levels"]], ["Inside"])

    def test_checked_bulletin_list_without_cyclone_is_not_unavailable(self):
        rows = [{
            "title": "BANGLADESH SEVERE WEATHER SITUATION UPDATE",
            "issued": "2026-10-28T12:00:00+06:00",
            "cyclone": False,
            "link": "https://instant.bmd.gov.bd/special_bulletin/202610281200",
        }]
        block = cyclone_block(rows, None, "2026-11-08T13:00:00Z", "Dhaka", datetime(2026, 11, 8, 14, tzinfo=timezone.utc))
        self.assertEqual(block["reading"], "none")
        self.assertEqual(block["status"], "no_relevant_data")
        self.assertIn("SEVERE WEATHER", block["detail"])

    def test_unread_bulletin_list_is_not_called_clear(self):
        block = cyclone_block(None, "timed out", None, "Dhaka")
        self.assertEqual(block["status"], "unavailable")
        self.assertNotIn("reading", block)

    def test_cyclone_title_names_only_that_district(self):
        rows = [{
            "title": "Cyclone warning for Khulna",
            "issued": "2026-11-08T10:00:00+06:00",
            "cyclone": True,
            "link": "https://instant.bmd.gov.bd/special_bulletin/202611081000",
        }]
        moment = datetime(2026, 11, 8, 14, tzinfo=timezone.utc)
        named = cyclone_block(rows, None, "2026-11-08T13:00:00Z", "Khulna", moment)
        other = cyclone_block(rows, None, "2026-11-08T13:00:00Z", "Dhaka", moment)
        self.assertEqual(named["reading"], "named")
        self.assertEqual(other["reading"], "other_district")

    def test_imerg_login_does_not_invent_millimetres(self):
        block = imerg_block({
            "granule": "3B-HHR-E.MS.MRG.3IMERG.20261108-S083000-E085959.0510.V07C.HDF5",
            "observed_start": "2026-11-08T08:30:00.000Z",
            "observed_end": "2026-11-08T08:59:59.000Z",
            "data_href": "https://data.gesdisc.earthdata.nasa.gov/data/example.HDF5",
            "gate_status": 302,
            "gate_location": "https://urs.earthdata.nasa.gov/oauth/authorize",
            "fetched_at": "2026-11-08T13:00:00Z",
        }, None)
        self.assertEqual(block["state"], "authentication_required")
        self.assertNotIn("rain_mm_hr", block)
        self.assertIn("EARTHDATA_TOKEN", block["detail"])
        self.assertIn("not NASA POWER", block["detail"])
