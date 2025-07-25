# Sandeep ai-experiments

Here we can are taking two input list and matching the most close string and return 

```sh
curl --location 'http://localhost:3000/ledger_parser' \
--header 'Content-Type: application/json' \
--data '{
    "currentLedgersNames": [
        "Prem Bhansali-24%",
        "Suman Bhansali-52%",
        "PNB C C ACCOUNT"
    ],
    "lastYearLedgersNames": [
        "PREMKUMAR BHANSALI-24%",
        "SUMANDEVI P.BHANSALI 52%/",
        "31-3-2023 Craditors"
    ]
}'
```

Input:
```json
{
    "currentLedgersNames": [
        "Prem Bhansali-24%",
        "Suman Bhansali-52%",
        "PNB C C ACCOUNT"
    ],
    "lastYearLedgersNames": [
        "PREMKUMAR BHANSALI-24%",
        "SUMANDEVI P.BHANSALI 52%/",
        "31-3-2023 Craditors"
    ]
}
```

Output: 
```json
{
    "matched": [
        {
            "currentYear": "Prem Bhansali-24%",
            "lastYear": "PREMKUMAR BHANSALI-24%"
        },
        {
            "currentYear": "Suman Bhansali-52%",
            "lastYear": "SUMANDEVI P.BHANSALI 52%/"
        }
    ],
    "notMatched": {
        "lastYearLedgers": [
            "31-3-2023 Craditors"
        ],
        "currentYearLedgers": [
            "PNB C C ACCOUNT"
        ]
    }
}
```