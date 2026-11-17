exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    try {
        const body = JSON.parse(event.body);
        const url = 'https://googleapis.com' + encodeURIComponent(body.apiKey);
        const payload = {
            contents: [{
                parts: [
                    { text: 'วิเคราะห์อาหารในรูปนี้ ตอบเป็น JSON เท่านั้นในรูปแบบ {"name": "ชื่ออาหารภาษาไทยสั้นๆ", "cal": ตัวเลขแคลอรี่โดยประมาณ} ห้ามมีข้อความอื่นหรือ markdown' },
                    { inline_data: { mime_type: 'image/jpeg', data: body.image } }
                ]
            }]
        };
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        };
    } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ error: { message: err.message } }) };
    }
};
