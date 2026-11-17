const https = require('https');

exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const body = JSON.parse(event.body);
        const myKey = (process.env.GEMINI_API_KEY || body.apiKey || '').trim();
        const base64Data = body.image;

        const payload = JSON.stringify({
            contents: [{
                parts: [
                    { text: 'วิเคราะห์อาหารในรูปนี้ ตอบเป็น JSON เท่านั้นในรูปแบบ {"name": "ชื่ออาหารภาษาไทยสั้นๆ", "cal": ตัวเลขแคลอรี่โดยประมาณ} ห้ามมีข้อความอื่นหรือ markdown' },
                    { inline_data: { mime_type: 'image/jpeg', data: base64Data } }
                ]
            }]
        });

        const options = {
            hostname: 'generativelanguage' + '.googleapis.com',
            path: '/v1beta/models/gemini-2.5-flash:generateContent?key=' + myKey,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const resultText = await new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(data));
            });
            req.on('error', reject);
            req.write(payload);
            req.end();
        });

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: resultText
        };
    } catch (err) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: { message: err.message } })
        };
    }
};
