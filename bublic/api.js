const fetch = require('node-fetch');

async function factdate() {
    const url = 'https://numbersapi.p.rapidapi.com/6/21/date?fragment=true&json=true';
    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': '1eaf3dd056mshcfb2c869ce12a2cp14c9dbjsn172e7c93eb75',
            'X-RapidAPI-Host': 'numbersapi.p.rapidapi.com'
        }
    };

    try {
        const response = await fetch(url, options);
        const result = await response.text();
        console.log(result);
    } catch (error) {
        console.error(error);
    }
}

factdate();
