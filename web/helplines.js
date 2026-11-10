const HELPLINES = [
  {
    "name": "Algeria",
    "police": [
      "1548"
    ],
    "ambulance": [
      "14"
    ],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Angola",
    "police": [
      "113"
    ],
    "ambulance": [
      "112",
      "116"
    ],
    "fire": [
      "115"
    ],
    "disaster": []
  },
  {
    "name": "Ascension Island",
    "police": [
      "999"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Benin",
    "police": [
      "117"
    ],
    "ambulance": [
      "112"
    ],
    "fire": [
      "118"
    ],
    "disaster": []
  },
  {
    "name": "Burundi",
    "police": [
      "117"
    ],
    "ambulance": [
      "112"
    ],
    "fire": [
      "118"
    ],
    "disaster": []
  },
  {
    "name": "Botswana",
    "police": [
      "999"
    ],
    "ambulance": [
      "997"
    ],
    "fire": [
      "998"
    ],
    "disaster": []
  },
  {
    "name": "Burkina Faso",
    "police": [
      "17"
    ],
    "ambulance": [
      "112"
    ],
    "fire": [
      "18"
    ],
    "disaster": []
  },
  {
    "name": "Cameroon",
    "police": [
      "112",
      "117"
    ],
    "ambulance": [
      "119"
    ],
    "fire": [
      "118"
    ],
    "disaster": []
  },
  {
    "name": "Cape Verde",
    "police": [
      "132"
    ],
    "ambulance": [
      "130"
    ],
    "fire": [
      "131"
    ],
    "disaster": []
  },
  {
    "name": "Central African Republic",
    "police": [
      "117"
    ],
    "ambulance": [
      "1220"
    ],
    "fire": [
      "118"
    ],
    "disaster": []
  },
  {
    "name": "Chad",
    "police": [
      "17"
    ],
    "ambulance": [
      "2251"
    ],
    "fire": [
      "18"
    ],
    "disaster": []
  },
  {
    "name": "Comoros",
    "police": [
      "17"
    ],
    "ambulance": [
      "773"
    ],
    "fire": [
      "18"
    ],
    "disaster": []
  },
  {
    "name": "Republic of Congo",
    "police": [
      "117"
    ],
    "ambulance": [],
    "fire": [
      "118"
    ],
    "disaster": []
  },
  {
    "name": "Democratic Republic of Congo",
    "police": [
      "112"
    ],
    "ambulance": [],
    "fire": [
      "118"
    ],
    "disaster": []
  },
  {
    "name": "Djibouti",
    "police": [
      "17"
    ],
    "ambulance": [
      "19"
    ],
    "fire": [
      "18"
    ],
    "disaster": []
  },
  {
    "name": "Egypt",
    "police": [
      "112",
      "122"
    ],
    "ambulance": [
      "123"
    ],
    "fire": [
      "180"
    ],
    "disaster": []
  },
  {
    "name": "Equatorial Guinea",
    "police": [
      "114"
    ],
    "ambulance": [
      "115"
    ],
    "fire": [
      "112"
    ],
    "disaster": []
  },
  {
    "name": "Eritrea",
    "police": [
      "113"
    ],
    "ambulance": [
      "114"
    ],
    "fire": [
      "116"
    ],
    "disaster": []
  },
  {
    "name": "Eswatini",
    "police": [
      "999"
    ],
    "ambulance": [
      "977"
    ],
    "fire": [
      "933"
    ],
    "disaster": []
  },
  {
    "name": "Ethiopia",
    "police": [
      "911",
      "991"
    ],
    "ambulance": [
      "907"
    ],
    "fire": [
      "939"
    ],
    "disaster": []
  },
  {
    "name": "Gabon",
    "police": [
      "1730"
    ],
    "ambulance": [
      "1300"
    ],
    "fire": [
      "18"
    ],
    "disaster": []
  },
  {
    "name": "Gambia",
    "police": [
      "117",
      "112"
    ],
    "ambulance": [
      "116"
    ],
    "fire": [
      "118"
    ],
    "disaster": []
  },
  {
    "name": "Ghana",
    "police": [
      "112",
      "191"
    ],
    "ambulance": [
      "193"
    ],
    "fire": [
      "192"
    ],
    "disaster": []
  },
  {
    "name": "Guinea",
    "police": [
      "117"
    ],
    "ambulance": [
      "18"
    ],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Guinea-Bissau",
    "police": [
      "112",
      "117"
    ],
    "ambulance": [
      "119"
    ],
    "fire": [
      "118"
    ],
    "disaster": []
  },
  {
    "name": "Côte d'Ivoire",
    "police": [
      "110",
      "111",
      "170"
    ],
    "ambulance": [
      "185"
    ],
    "fire": [
      "180"
    ],
    "disaster": []
  },
  {
    "name": "Liberia",
    "police": [
      "911"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Kenya",
    "police": [
      "112",
      "999",
      "911"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Libya",
    "police": [
      "1515"
    ],
    "ambulance": [
      "193"
    ],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Lesotho",
    "police": [
      "123"
    ],
    "ambulance": [
      "121"
    ],
    "fire": [
      "122"
    ],
    "disaster": []
  },
  {
    "name": "Madagascar",
    "police": [
      "117"
    ],
    "ambulance": [
      "124"
    ],
    "fire": [
      "118"
    ],
    "disaster": []
  },
  {
    "name": "Malawi",
    "police": [
      "997",
      "990"
    ],
    "ambulance": [
      "998"
    ],
    "fire": [
      "999"
    ],
    "disaster": []
  },
  {
    "name": "Mali",
    "police": [
      "17"
    ],
    "ambulance": [
      "15",
      "112"
    ],
    "fire": [
      "18",
      "112"
    ],
    "disaster": []
  },
  {
    "name": "Mauritania",
    "police": [
      "117"
    ],
    "ambulance": [
      "101"
    ],
    "fire": [
      "118"
    ],
    "disaster": []
  },
  {
    "name": "Mauritius",
    "police": [
      "112",
      "999"
    ],
    "ambulance": [
      "114"
    ],
    "fire": [
      "115",
      "995"
    ],
    "disaster": []
  },
  {
    "name": "Mayotte",
    "police": [
      "112",
      "17"
    ],
    "ambulance": [
      "15"
    ],
    "fire": [
      "18"
    ],
    "disaster": []
  },
  {
    "name": "Morocco",
    "police": [
      "19"
    ],
    "ambulance": [
      "15"
    ],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Mozambique",
    "police": [
      "119"
    ],
    "ambulance": [
      "117"
    ],
    "fire": [
      "198"
    ],
    "disaster": []
  },
  {
    "name": "Namibia",
    "police": [
      "10 111"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Niger",
    "police": [
      "17"
    ],
    "ambulance": [
      "15"
    ],
    "fire": [
      "18"
    ],
    "disaster": []
  },
  {
    "name": "Nigeria",
    "police": [
      "112"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Réunion",
    "police": [
      "112",
      "17"
    ],
    "ambulance": [
      "15"
    ],
    "fire": [
      "18"
    ],
    "disaster": []
  },
  {
    "name": "Rwanda",
    "police": [
      "112"
    ],
    "ambulance": [
      "912"
    ],
    "fire": [
      "112"
    ],
    "disaster": []
  },
  {
    "name": "Saint Helena",
    "police": [
      "999"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Sao Tome and Principe",
    "police": [
      "112"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Senegal",
    "police": [
      "17"
    ],
    "ambulance": [
      "18"
    ],
    "fire": [
      "1515"
    ],
    "disaster": []
  },
  {
    "name": "Seychelles",
    "police": [
      "112",
      "999",
      "133"
    ],
    "ambulance": [
      "151"
    ],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Sierra Leone",
    "police": [
      "019"
    ],
    "ambulance": [
      "999"
    ],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Somalia",
    "police": [
      "888"
    ],
    "ambulance": [
      "999"
    ],
    "fire": [
      "555"
    ],
    "disaster": []
  },
  {
    "name": "South Africa",
    "police": [
      "10 111"
    ],
    "ambulance": [
      "10 177"
    ],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Sudan",
    "police": [
      "999"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "South Sudan",
    "police": [
      "999"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Tanzania",
    "police": [
      "112",
      "999"
    ],
    "ambulance": [
      "114"
    ],
    "fire": [
      "115"
    ],
    "disaster": []
  },
  {
    "name": "Togo",
    "police": [
      "117"
    ],
    "ambulance": [
      "8200"
    ],
    "fire": [
      "118"
    ],
    "disaster": []
  },
  {
    "name": "Tristan da Cunha",
    "police": [
      "999"
    ],
    "ambulance": [
      "911"
    ],
    "fire": [
      "999"
    ],
    "disaster": []
  },
  {
    "name": "Tunisia",
    "police": [
      "197"
    ],
    "ambulance": [
      "190"
    ],
    "fire": [
      "198"
    ],
    "disaster": []
  },
  {
    "name": "Uganda",
    "police": [
      "112",
      "999"
    ],
    "ambulance": [
      "911"
    ],
    "fire": [
      "112",
      "999"
    ],
    "disaster": []
  },
  {
    "name": "Western Sahara",
    "police": [
      "150"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Zambia",
    "police": [
      "999",
      "911"
    ],
    "ambulance": [
      "992"
    ],
    "fire": [
      "993"
    ],
    "disaster": []
  },
  {
    "name": "Zimbabwe",
    "police": [
      "999",
      "995"
    ],
    "ambulance": [
      "994"
    ],
    "fire": [
      "993"
    ],
    "disaster": []
  },
  {
    "name": "Anguilla",
    "police": [
      "911"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Antigua and Barbuda",
    "police": [
      "911",
      "999"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Aruba",
    "police": [
      "911"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "The Bahamas",
    "police": [
      "911",
      "919"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Barbados",
    "police": [
      "211"
    ],
    "ambulance": [
      "511"
    ],
    "fire": [
      "311"
    ],
    "disaster": []
  },
  {
    "name": "Bermuda",
    "police": [
      "911"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "British Virgin Islands",
    "police": [
      "911",
      "999",
      "311"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Caribbean Netherlands",
    "police": [
      "911"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Cayman Islands",
    "police": [
      "911"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Cuba",
    "police": [
      "106"
    ],
    "ambulance": [
      "104"
    ],
    "fire": [
      "105"
    ],
    "disaster": []
  },
  {
    "name": "Curacao",
    "police": [
      "911"
    ],
    "ambulance": [
      "910",
      "912"
    ],
    "fire": [
      "911"
    ],
    "disaster": []
  },
  {
    "name": "Dominica",
    "police": [
      "999"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Dominican Republic",
    "police": [
      "911"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Grenada",
    "police": [
      "911"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Guadeloupe",
    "police": [
      "112",
      "17"
    ],
    "ambulance": [
      "15"
    ],
    "fire": [
      "18"
    ],
    "disaster": []
  },
  {
    "name": "Haiti",
    "police": [
      "114",
      "122"
    ],
    "ambulance": [
      "116"
    ],
    "fire": [
      "115"
    ],
    "disaster": []
  },
  {
    "name": "Jamaica",
    "police": [
      "119"
    ],
    "ambulance": [
      "110"
    ],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Martinique",
    "police": [
      "112",
      "17"
    ],
    "ambulance": [
      "15"
    ],
    "fire": [
      "18"
    ],
    "disaster": []
  },
  {
    "name": "Montserrat",
    "police": [
      "911",
      "999"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Puerto Rico",
    "police": [
      "911"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Saint Barthélemy",
    "police": [
      "17"
    ],
    "ambulance": [],
    "fire": [
      "18"
    ],
    "disaster": []
  },
  {
    "name": "Saint Kitts and Nevis",
    "police": [
      "911"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Saint Lucia",
    "police": [
      "911",
      "999"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Saint Martin",
    "police": [
      "17"
    ],
    "ambulance": [
      "15"
    ],
    "fire": [
      "18"
    ],
    "disaster": []
  },
  {
    "name": "Saint Vincent and the Grenadines",
    "police": [
      "999",
      "911",
      "112"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Sint Maarten",
    "police": [
      "911"
    ],
    "ambulance": [
      "912"
    ],
    "fire": [
      "919"
    ],
    "disaster": []
  },
  {
    "name": "Trinidad and Tobago",
    "police": [
      "999",
      "911"
    ],
    "ambulance": [
      "811"
    ],
    "fire": [
      "990"
    ],
    "disaster": []
  },
  {
    "name": "Turks and Caicos",
    "police": [
      "911"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "U.S. Virgin Islands",
    "police": [
      "911"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Belize",
    "police": [
      "911"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Clipperton Island",
    "police": [
      "112",
      "17"
    ],
    "ambulance": [
      "15"
    ],
    "fire": [
      "18"
    ],
    "disaster": []
  },
  {
    "name": "Costa Rica",
    "police": [
      "911"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "El Salvador",
    "police": [
      "911"
    ],
    "ambulance": [
      "132"
    ],
    "fire": [
      "913"
    ],
    "disaster": []
  },
  {
    "name": "Guatemala",
    "police": [
      "110"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Honduras",
    "police": [
      "911"
    ],
    "ambulance": [
      "195"
    ],
    "fire": [
      "198"
    ],
    "disaster": []
  },
  {
    "name": "Nicaragua",
    "police": [
      "118"
    ],
    "ambulance": [
      "128"
    ],
    "fire": [
      "115",
      "911"
    ],
    "disaster": []
  },
  {
    "name": "Panama",
    "police": [
      "911",
      "104"
    ],
    "ambulance": [],
    "fire": [
      "103"
    ],
    "disaster": []
  },
  {
    "name": "Canada",
    "police": [
      "911"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Mexico",
    "police": [
      "911"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Saint Pierre and Miquelon",
    "police": [
      "112",
      "17"
    ],
    "ambulance": [
      "15"
    ],
    "fire": [
      "18"
    ],
    "disaster": []
  },
  {
    "name": "United States",
    "police": [
      "911"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Argentina",
    "police": [
      "911",
      "101"
    ],
    "ambulance": [
      "107"
    ],
    "fire": [
      "100"
    ],
    "disaster": [
      "103"
    ]
  },
  {
    "name": "Bolivia",
    "police": [
      "911",
      "110"
    ],
    "ambulance": [
      "118"
    ],
    "fire": [
      "119"
    ],
    "disaster": [
      "114"
    ]
  },
  {
    "name": "Brazil",
    "police": [
      "190"
    ],
    "ambulance": [
      "192"
    ],
    "fire": [
      "193"
    ],
    "disaster": [
      "199"
    ]
  },
  {
    "name": "Chile",
    "police": [
      "133"
    ],
    "ambulance": [
      "131"
    ],
    "fire": [
      "132"
    ],
    "disaster": []
  },
  {
    "name": "Colombia",
    "police": [
      "112"
    ],
    "ambulance": [
      "125"
    ],
    "fire": [
      "119"
    ],
    "disaster": []
  },
  {
    "name": "Ecuador",
    "police": [
      "911",
      "101"
    ],
    "ambulance": [
      "131"
    ],
    "fire": [
      "102"
    ],
    "disaster": []
  },
  {
    "name": "Falkland Islands",
    "police": [
      "112",
      "999"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "French Guiana",
    "police": [
      "112",
      "17"
    ],
    "ambulance": [
      "15"
    ],
    "fire": [
      "18"
    ],
    "disaster": []
  },
  {
    "name": "Guyana",
    "police": [
      "911"
    ],
    "ambulance": [
      "913"
    ],
    "fire": [
      "912"
    ],
    "disaster": []
  },
  {
    "name": "Paraguay",
    "police": [
      "911",
      "912"
    ],
    "ambulance": [
      "141"
    ],
    "fire": [
      "132"
    ],
    "disaster": []
  },
  {
    "name": "Peru",
    "police": [
      "911",
      "105"
    ],
    "ambulance": [],
    "fire": [
      "116"
    ],
    "disaster": [
      "115"
    ]
  },
  {
    "name": "South Georgia and the South Sandwich Islands",
    "police": [
      "999"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Suriname",
    "police": [
      "115"
    ],
    "ambulance": [
      "113"
    ],
    "fire": [
      "110"
    ],
    "disaster": []
  },
  {
    "name": "Uruguay",
    "police": [
      "911",
      "109"
    ],
    "ambulance": [
      "105"
    ],
    "fire": [
      "104"
    ],
    "disaster": []
  },
  {
    "name": "Venezuela",
    "police": [
      "911",
      "171"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Abkhazia",
    "police": [
      "102"
    ],
    "ambulance": [
      "103"
    ],
    "fire": [
      "101"
    ],
    "disaster": []
  },
  {
    "name": "Afghanistan",
    "police": [
      "119"
    ],
    "ambulance": [
      "112"
    ],
    "fire": [
      "119"
    ],
    "disaster": []
  },
  {
    "name": "Bahrain",
    "police": [
      "999"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Bangladesh",
    "police": [
      "999"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Bhutan",
    "police": [
      "113"
    ],
    "ambulance": [
      "112"
    ],
    "fire": [
      "110"
    ],
    "disaster": []
  },
  {
    "name": "British Indian Ocean Territory",
    "police": [
      "112",
      "999"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Brunei",
    "police": [
      "993"
    ],
    "ambulance": [
      "991"
    ],
    "fire": [
      "995"
    ],
    "disaster": []
  },
  {
    "name": "Cambodia",
    "police": [
      "117"
    ],
    "ambulance": [
      "119"
    ],
    "fire": [
      "118"
    ],
    "disaster": []
  },
  {
    "name": "China",
    "police": [
      "110"
    ],
    "ambulance": [
      "120"
    ],
    "fire": [
      "119"
    ],
    "disaster": []
  },
  {
    "name": "Christmas Island",
    "police": [
      "000"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Cocos (Keeling) Islands",
    "police": [
      "000"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "East Timor",
    "police": [
      "112"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Hong Kong",
    "police": [
      "999"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "India",
    "police": [
      "112",
      "100"
    ],
    "ambulance": [
      "108"
    ],
    "fire": [
      "101"
    ],
    "disaster": [
      "104"
    ]
  },
  {
    "name": "Indonesia",
    "police": [
      "112",
      "110"
    ],
    "ambulance": [
      "118",
      "119"
    ],
    "fire": [
      "113",
      "1131"
    ],
    "disaster": [
      "129"
    ]
  },
  {
    "name": "Iran",
    "police": [
      "110"
    ],
    "ambulance": [
      "115"
    ],
    "fire": [
      "125"
    ],
    "disaster": []
  },
  {
    "name": "Iraq",
    "police": [
      "112",
      "911",
      "104"
    ],
    "ambulance": [
      "122"
    ],
    "fire": [
      "115"
    ],
    "disaster": []
  },
  {
    "name": "Israel",
    "police": [
      "100"
    ],
    "ambulance": [
      "101"
    ],
    "fire": [
      "102"
    ],
    "disaster": []
  },
  {
    "name": "Japan",
    "police": [
      "110"
    ],
    "ambulance": [
      "119"
    ],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Jordan",
    "police": [
      "911"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Kazakhstan",
    "police": [
      "112",
      "102"
    ],
    "ambulance": [
      "103"
    ],
    "fire": [
      "101"
    ],
    "disaster": []
  },
  {
    "name": "North Korea",
    "police": [],
    "ambulance": [],
    "fire": [
      "110",
      "8119"
    ],
    "disaster": []
  },
  {
    "name": "South Korea",
    "police": [
      "112"
    ],
    "ambulance": [
      "119"
    ],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Kuwait",
    "police": [
      "112"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Kyrgyzstan",
    "police": [
      "112"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Laos",
    "police": [
      "191"
    ],
    "ambulance": [
      "195"
    ],
    "fire": [
      "190"
    ],
    "disaster": []
  },
  {
    "name": "Lebanon",
    "police": [
      "999",
      "112",
      "160"
    ],
    "ambulance": [
      "140"
    ],
    "fire": [
      "175"
    ],
    "disaster": [
      "125"
    ]
  },
  {
    "name": "Macau",
    "police": [
      "999"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Malaysia",
    "police": [
      "999"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Maldives",
    "police": [
      "911",
      "119"
    ],
    "ambulance": [
      "100"
    ],
    "fire": [
      "118"
    ],
    "disaster": [
      "115"
    ]
  },
  {
    "name": "Mongolia",
    "police": [
      "105",
      "102"
    ],
    "ambulance": [
      "103"
    ],
    "fire": [
      "101"
    ],
    "disaster": []
  },
  {
    "name": "Myanmar",
    "police": [
      "999",
      "199"
    ],
    "ambulance": [
      "192"
    ],
    "fire": [
      "191"
    ],
    "disaster": []
  },
  {
    "name": "Nepal",
    "police": [
      "100"
    ],
    "ambulance": [
      "102"
    ],
    "fire": [
      "101"
    ],
    "disaster": []
  },
  {
    "name": "Oman",
    "police": [
      "9999"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Pakistan",
    "police": [
      "15"
    ],
    "ambulance": [
      "115",
      "1122"
    ],
    "fire": [
      "16"
    ],
    "disaster": []
  },
  {
    "name": "Palestine",
    "police": [
      "100"
    ],
    "ambulance": [
      "101"
    ],
    "fire": [
      "102"
    ],
    "disaster": []
  },
  {
    "name": "Philippines",
    "police": [
      "911"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Qatar",
    "police": [
      "999"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Saudi Arabia",
    "police": [
      "911",
      "999"
    ],
    "ambulance": [
      "997"
    ],
    "fire": [
      "998"
    ],
    "disaster": []
  },
  {
    "name": "Singapore",
    "police": [
      "999"
    ],
    "ambulance": [
      "995"
    ],
    "fire": [],
    "disaster": []
  },
  {
    "name": "South Ossetia",
    "police": [
      "102"
    ],
    "ambulance": [
      "103"
    ],
    "fire": [
      "101"
    ],
    "disaster": []
  },
  {
    "name": "Sri Lanka",
    "police": [
      "119"
    ],
    "ambulance": [
      "110"
    ],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Syria",
    "police": [
      "112"
    ],
    "ambulance": [
      "110"
    ],
    "fire": [
      "113"
    ],
    "disaster": []
  },
  {
    "name": "Taiwan",
    "police": [
      "110"
    ],
    "ambulance": [
      "119"
    ],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Tajikistan",
    "police": [
      "112",
      "102"
    ],
    "ambulance": [
      "103"
    ],
    "fire": [
      "101"
    ],
    "disaster": []
  },
  {
    "name": "Thailand",
    "police": [
      "191"
    ],
    "ambulance": [
      "1669"
    ],
    "fire": [
      "199"
    ],
    "disaster": []
  },
  {
    "name": "Turkey",
    "police": [
      "112",
      "911",
      "153"
    ],
    "ambulance": [
      "112",
      "911"
    ],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Turkmenistan",
    "police": [
      "02",
      "002"
    ],
    "ambulance": [
      "03",
      "003"
    ],
    "fire": [
      "01",
      "001"
    ],
    "disaster": []
  },
  {
    "name": "United Arab Emirates",
    "police": [
      "999"
    ],
    "ambulance": [
      "998"
    ],
    "fire": [
      "997"
    ],
    "disaster": []
  },
  {
    "name": "Uzbekistan",
    "police": [
      "102"
    ],
    "ambulance": [
      "103"
    ],
    "fire": [
      "101"
    ],
    "disaster": []
  },
  {
    "name": "Vietnam",
    "police": [
      "113"
    ],
    "ambulance": [
      "115"
    ],
    "fire": [
      "114"
    ],
    "disaster": []
  },
  {
    "name": "Yemen",
    "police": [
      "194"
    ],
    "ambulance": [
      "191"
    ],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Akrotiri and Dhekelia",
    "police": [
      "112",
      "999"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Åland Islands",
    "police": [
      "112"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Albania",
    "police": [
      "129"
    ],
    "ambulance": [
      "127"
    ],
    "fire": [
      "128"
    ],
    "disaster": []
  },
  {
    "name": "Andorra",
    "police": [
      "110"
    ],
    "ambulance": [
      "116"
    ],
    "fire": [
      "118"
    ],
    "disaster": []
  },
  {
    "name": "Armenia",
    "police": [
      "112",
      "911",
      "102"
    ],
    "ambulance": [
      "103"
    ],
    "fire": [
      "101"
    ],
    "disaster": []
  },
  {
    "name": "Austria",
    "police": [
      "112",
      "133"
    ],
    "ambulance": [
      "144"
    ],
    "fire": [
      "122"
    ],
    "disaster": []
  },
  {
    "name": "Azerbaijan",
    "police": [
      "112",
      "102"
    ],
    "ambulance": [
      "112",
      "103"
    ],
    "fire": [
      "112",
      "101"
    ],
    "disaster": []
  },
  {
    "name": "Belarus",
    "police": [
      "102"
    ],
    "ambulance": [
      "103"
    ],
    "fire": [
      "101"
    ],
    "disaster": []
  },
  {
    "name": "Belgium",
    "police": [
      "101",
      "112"
    ],
    "ambulance": [
      "112"
    ],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Bosnia and Herzegovina",
    "police": [
      "122"
    ],
    "ambulance": [
      "124"
    ],
    "fire": [
      "123"
    ],
    "disaster": [
      "121"
    ]
  },
  {
    "name": "Bulgaria",
    "police": [
      "112",
      "166"
    ],
    "ambulance": [
      "112",
      "150"
    ],
    "fire": [
      "112",
      "160"
    ],
    "disaster": []
  },
  {
    "name": "Croatia",
    "police": [
      "112",
      "192"
    ],
    "ambulance": [
      "112",
      "194"
    ],
    "fire": [
      "112",
      "193"
    ],
    "disaster": []
  },
  {
    "name": "Cyprus",
    "police": [
      "112",
      "199"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Czech Republic",
    "police": [
      "112",
      "158"
    ],
    "ambulance": [
      "112",
      "155"
    ],
    "fire": [
      "112",
      "150"
    ],
    "disaster": []
  },
  {
    "name": "Denmark",
    "police": [
      "112"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Estonia",
    "police": [
      "112"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Faroe Islands",
    "police": [
      "112"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Finland",
    "police": [
      "112"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "France",
    "police": [
      "17"
    ],
    "ambulance": [
      "112",
      "15"
    ],
    "fire": [
      "112",
      "18"
    ],
    "disaster": []
  },
  {
    "name": "Georgia",
    "police": [
      "112"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Germany",
    "police": [
      "110"
    ],
    "ambulance": [
      "112"
    ],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Gibraltar",
    "police": [
      "199",
      "112",
      "999"
    ],
    "ambulance": [
      "190",
      "112",
      "999"
    ],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Greece",
    "police": [
      "100",
      "112"
    ],
    "ambulance": [
      "166",
      "112"
    ],
    "fire": [
      "199",
      "112"
    ],
    "disaster": []
  },
  {
    "name": "Greenland",
    "police": [
      "112"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Guernsey",
    "police": [
      "112",
      "999"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Hungary",
    "police": [
      "112",
      "107"
    ],
    "ambulance": [
      "112",
      "104"
    ],
    "fire": [
      "112",
      "105"
    ],
    "disaster": []
  },
  {
    "name": "Iceland",
    "police": [
      "112"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Ireland",
    "police": [
      "112",
      "999"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Isle of Man",
    "police": [
      "112",
      "999"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Italy",
    "police": [
      "112"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Jersey",
    "police": [
      "112",
      "999"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Kosovo",
    "police": [
      "192"
    ],
    "ambulance": [
      "194"
    ],
    "fire": [
      "193"
    ],
    "disaster": []
  },
  {
    "name": "Latvia",
    "police": [
      "112",
      "110"
    ],
    "ambulance": [
      "113"
    ],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Lithuania",
    "police": [
      "112",
      "022"
    ],
    "ambulance": [
      "033"
    ],
    "fire": [
      "011"
    ],
    "disaster": []
  },
  {
    "name": "Liechtenstein",
    "police": [
      "117"
    ],
    "ambulance": [
      "144"
    ],
    "fire": [
      "118"
    ],
    "disaster": []
  },
  {
    "name": "Luxembourg",
    "police": [
      "112",
      "113"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Malta",
    "police": [
      "112"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Moldova",
    "police": [
      "112"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Monaco",
    "police": [
      "17"
    ],
    "ambulance": [
      "112",
      "18"
    ],
    "fire": [
      "112",
      "18"
    ],
    "disaster": []
  },
  {
    "name": "Montenegro",
    "police": [
      "122",
      "112"
    ],
    "ambulance": [
      "124",
      "112"
    ],
    "fire": [
      "123",
      "112"
    ],
    "disaster": []
  },
  {
    "name": "Netherlands",
    "police": [
      "112"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "North Macedonia",
    "police": [
      "192",
      "112"
    ],
    "ambulance": [
      "194",
      "112"
    ],
    "fire": [
      "193",
      "112"
    ],
    "disaster": []
  },
  {
    "name": "Northern Cyprus",
    "police": [
      "155"
    ],
    "ambulance": [
      "112"
    ],
    "fire": [
      "199"
    ],
    "disaster": [
      "101"
    ]
  },
  {
    "name": "Norway",
    "police": [
      "112"
    ],
    "ambulance": [
      "113"
    ],
    "fire": [
      "110"
    ],
    "disaster": []
  },
  {
    "name": "Poland",
    "police": [
      "997",
      "112"
    ],
    "ambulance": [
      "999",
      "112"
    ],
    "fire": [
      "998",
      "112"
    ],
    "disaster": []
  },
  {
    "name": "Portugal",
    "police": [
      "112"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Romania",
    "police": [
      "112"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Russia",
    "police": [
      "102",
      "112"
    ],
    "ambulance": [
      "103",
      "112"
    ],
    "fire": [
      "101",
      "112"
    ],
    "disaster": []
  },
  {
    "name": "San Marino",
    "police": [
      "112",
      "113"
    ],
    "ambulance": [
      "118"
    ],
    "fire": [
      "115"
    ],
    "disaster": []
  },
  {
    "name": "Serbia",
    "police": [
      "192",
      "112"
    ],
    "ambulance": [
      "194"
    ],
    "fire": [
      "193"
    ],
    "disaster": [
      "1985"
    ]
  },
  {
    "name": "Slovakia",
    "police": [
      "112",
      "158"
    ],
    "ambulance": [
      "112",
      "155"
    ],
    "fire": [
      "112",
      "150"
    ],
    "disaster": []
  },
  {
    "name": "Slovenia",
    "police": [
      "113"
    ],
    "ambulance": [
      "112"
    ],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Spain",
    "police": [
      "112"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": [
      "1006"
    ]
  },
  {
    "name": "Sweden",
    "police": [
      "112"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Switzerland",
    "police": [
      "117"
    ],
    "ambulance": [
      "144"
    ],
    "fire": [
      "118"
    ],
    "disaster": []
  },
  {
    "name": "Transnistria",
    "police": [
      "102"
    ],
    "ambulance": [
      "103"
    ],
    "fire": [
      "101"
    ],
    "disaster": []
  },
  {
    "name": "Ukraine",
    "police": [
      "102"
    ],
    "ambulance": [
      "103"
    ],
    "fire": [
      "101"
    ],
    "disaster": []
  },
  {
    "name": "United Kingdom",
    "police": [
      "999",
      "112"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Vatican City",
    "police": [
      "112"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "American Samoa",
    "police": [
      "911"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Australia",
    "police": [
      "000"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Cook Islands",
    "police": [
      "999"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Fiji",
    "police": [
      "911",
      "917"
    ],
    "ambulance": [],
    "fire": [
      "910"
    ],
    "disaster": []
  },
  {
    "name": "French Polynesia",
    "police": [
      "112",
      "17"
    ],
    "ambulance": [
      "15"
    ],
    "fire": [
      "18"
    ],
    "disaster": []
  },
  {
    "name": "Guam",
    "police": [
      "911"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Kiribati",
    "police": [
      "100",
      "999",
      "192"
    ],
    "ambulance": [
      "194",
      "195"
    ],
    "fire": [
      "193"
    ],
    "disaster": []
  },
  {
    "name": "Marshall Islands",
    "police": [
      "911"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Micronesia",
    "police": [
      "911"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Nauru",
    "police": [
      "110"
    ],
    "ambulance": [
      "111"
    ],
    "fire": [
      "112"
    ],
    "disaster": []
  },
  {
    "name": "New Caledonia",
    "police": [
      "112",
      "17"
    ],
    "ambulance": [
      "15"
    ],
    "fire": [
      "18"
    ],
    "disaster": []
  },
  {
    "name": "New Zealand",
    "police": [
      "111"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Northern Mariana Islands",
    "police": [
      "911"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Palau",
    "police": [
      "911"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  },
  {
    "name": "Papua New Guinea",
    "police": [
      "112"
    ],
    "ambulance": [
      "111"
    ],
    "fire": [
      "110"
    ],
    "disaster": []
  },
  {
    "name": "Samoa",
    "police": [
      "999",
      "995"
    ],
    "ambulance": [
      "996"
    ],
    "fire": [
      "994"
    ],
    "disaster": []
  },
  {
    "name": "Solomon Islands",
    "police": [
      "911",
      "999"
    ],
    "ambulance": [
      "111"
    ],
    "fire": [
      "988"
    ],
    "disaster": []
  },
  {
    "name": "Tonga",
    "police": [
      "911",
      "922"
    ],
    "ambulance": [
      "933"
    ],
    "fire": [
      "999"
    ],
    "disaster": []
  },
  {
    "name": "Tuvalu",
    "police": [
      "911"
    ],
    "ambulance": [
      "999"
    ],
    "fire": [
      "000"
    ],
    "disaster": []
  },
  {
    "name": "Vanuatu",
    "police": [
      "111"
    ],
    "ambulance": [
      "112"
    ],
    "fire": [
      "113"
    ],
    "disaster": []
  },
  {
    "name": "Wallis and Futuna",
    "police": [
      "15"
    ],
    "ambulance": [],
    "fire": [],
    "disaster": []
  }
];
