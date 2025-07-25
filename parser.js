const { OpenAI } = require('openai')
// require('dotenv').config() // If you use .env for your API key

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

 async function parser(currentLedgersNames, lastYearLedgersNames) {
    const prompt = `
    You are a helpful assistant skilled in data matching.

    You are given two lists:
    - currentLedgersNames: Ledger names for the current year.
    - lastYearLedgersNames: Ledger names for the previous year.

    Your task is to find and map closely matching ledger names between the two lists, even if the names are not exactly the same but are very similar (use fuzzy logic for matching).

    - For each ledger in currentLedgersNames, try to find the most similar name in lastYearLedgersNames. 
    - If a match is found (names are very similar or likely to be the same, even with spelling or word order differences), add them to a matched array as {currentYear: <currentName>, lastYear: <lastYearName>}.
    - Any ledgers from either list that are not matched should be placed into the notMatched section:
    - lastYearLedgers: unmatched ledgers from last year
    - currentYearLedgers: unmatched ledgers from current year

    Return the result strictly in this JSON format:
    {
    "matched": [
        {"currentYear": "<ledgerName>", "lastYear": "<ledgerName>"},
        ...
    ],
    "notMatched": {
        "lastYearLedgers": ["<ledgerName>", ...],
        "currentYearLedgers": ["<ledgerName>", ...]
    }
    }

    Here is the data:

    currentLedgersNames: ${JSON.stringify(currentLedgersNames)}
    lastYearLedgersNames: ${JSON.stringify(lastYearLedgersNames)}

    Return only the result JSON and nothing else.
    `

    console.log('prompt------>', prompt)


    const response = await openai.chat.completions.create({
        model: 'gpt-4.1', // or gpt-4 if you don't have access to gpt-4o
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        // max_tokens: 2048,
    })

  const output = response.choices[0].message.content
  return JSON.parse(output)
}


module.exports = {
    parser
}