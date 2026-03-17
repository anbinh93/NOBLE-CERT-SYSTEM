const fetch = require('node-fetch'); // Next.js has polyfill but this is standalone node

async function test() {
    console.log("Testing connection to Backend...");
    const url = "http://127.0.0.1:5000/api/public/courses";
    try {
        const res = await fetch(url);
        console.log(`Status: ${res.status}`);
        if (res.ok) {
            const json = await res.json();
            console.log("Data count:", json.length);
            console.log("First item:", json[0]?.name);
        } else {
            console.log("Error body:", await res.text());
        }
    } catch (e) {
        console.error("Fetch Failed:", e.message);
    }
}

test();
