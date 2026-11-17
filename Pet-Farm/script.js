
    var TARGET_CAL = 2000;
    var allLogs = {};
    try {
        var saved = localStorage.getItem('dino7Days');
        if (saved) allLogs = JSON.parse(saved);
    } catch (e) {
        allLogs = {};
    }

    function getMonthName(m) {
        var months = 'ม.ค.,ก.พ.,มี.ค.,เม.ย.,พ.ค.,มิ.ย.,ก.ค.,ส.ค.,ก.ย.,ต.ค.,พ.ย.,ธ.ค.'.split(',');
        return months.slice(m, m + 1).pop();
    }

    function getLast7Days() {
        var days = [];
        for (var i = 6; i >= 0; i--) {
            var d = new Date();
            d.setDate(d.getDate() - i);
            var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
            var label = (i === 0) ? 'วันนี้' : d.getDate() + ' ' + getMonthName(d.getMonth());
            days.push({ key: key, label: label });
        }
        return days;
    }

    var last7Days = getLast7Days();
    var todayKey = last7Days.slice(-1).pop().key;

    function getDayLogs(k) {
        if (!allLogs[k]) allLogs[k] = [];
        return allLogs[k];
    }

    function switchTab(type) {
        var foodSec = document.getElementById('section-food');
        var workoutSec = document.getElementById('section-workout');
        var tabFood = document.getElementById('tab-food');
        var tabWorkout = document.getElementById('tab-workout');

        if (type === 'food') {
            foodSec.style.display = 'block';
            workoutSec.style.display = 'none';
            tabFood.className = 'tab-btn active-food';
            tabWorkout.className = 'tab-btn';
        } else {
            foodSec.style.display = 'none';
            workoutSec.style.display = 'block';
            tabFood.className = 'tab-btn';
            tabWorkout.className = 'tab-btn active-workout';
        }
    }

    var searchTimer = null;

    function handleSearch(query) {
        var dropdown = document.getElementById('search-dropdown');
        var text = query.trim().toLowerCase();
        if (text.length === 0) { dropdown.style.display = 'none'; return; }

        var localMatches = localThaiFoods.filter(function(item) {
            return item.name.toLowerCase().indexOf(text) !== -1;
        });
        renderDropdown(localMatches, [], true);

        clearTimeout(searchTimer);
        searchTimer = setTimeout(function() {
            fetchOnlineFood(text, localMatches);
        }, 500);
    }

    function fetchOnlineFood(query, localMatches) {
        var url = 'https://world.openfoodfacts.org/cgi/search.pl?search_terms=' + encodeURIComponent(query) + '&search_simple=1&action=process&json=1&page_size=5';


        fetch(url)
            .then(function(res) { return res.json(); })
            .then(function(data) {
                var apiMatches = [];
                if (data && data.products) {
                    data.products.forEach(function(p) {
                        var pName = p.product_name_th || p.product_name;
                        var kcal = p.nutriments ? (p.nutriments['energy-kcal_serving'] || p.nutriments['energy-kcal_100g']) : null;
                        if (pName && kcal && kcal > 0) {
                            apiMatches.push({ name: pName.substring(0, 30), cal: Math.round(kcal) });
                        }
                    });
                }
                renderDropdown(localMatches, apiMatches, false);
            })
            .catch(function() { renderDropdown(localMatches, [], false); });
    }

    function renderDropdown(localList, apiList, isLoading) {
        var dropdown = document.getElementById('search-dropdown');
        var html = '';
        localList.forEach(function(item) {
            html += '<div class="search-item" onclick="selectFood(\'' + item.name.replace(/'/g, "\\'") + '\', ' + item.cal + ')">' +
                    '<span>' + item.name + ' <span class="badge-source src-thai">เมนูไทย</span></span><strong>' + item.cal + ' kcal</strong></div>';
        });
        apiList.forEach(function(apiItem) {
            html += '<div class="search-item" onclick="selectFood(\'' + apiItem.name.replace(/'/g, "\\'") + '\', ' + apiItem.cal + ')">' +
                    '<span>' + apiItem.name + ' <span class="badge-source src-api">ออนไลน์</span></span><strong>' + apiItem.cal + ' kcal</strong></div>';
        });
        if (isLoading) html += '<div class="search-loading">🔍 กำลังค้นหาเพิ่มเติม...</div>';
        else if (localList.length === 0 && apiList.length === 0) html += '<div class="search-loading">ไม่พบในระบบ พิมพ์แคลอรี่เองได้เลย</div>';

        dropdown.innerHTML = html;
        dropdown.style.display = 'block';
    }

    function selectFood(name, cal) {
        document.getElementById('food-name').value = name;
        document.getElementById('food-cal').value = cal;
        document.getElementById('search-dropdown').style.display = 'none';
    }

    var selectedMet = 0;

    function handleWorkoutSearch(query) {
        var dropdown = document.getElementById('workout-dropdown');
        var text = query.trim().toLowerCase();
        selectedMet = 0;
        if (text.length === 0) { dropdown.style.display = 'none'; return; }

        var matches = workoutDB.filter(function(item) {
            return item.name.toLowerCase().indexOf(text) !== -1;
        });

        var mins = parseInt(document.getElementById('workout-mins').value) || 30;
        var html = '';
        matches.forEach(function(item) {
            var estCal = Math.round(item.met * 60 * (mins / 60));
            html += '<div class="search-item" onclick="selectWorkout(\'' + item.name + '\', ' + item.met + ')">' +
                    '<span>' + item.name + ' <span class="badge-source src-api">MET ' + item.met + '</span></span>' +
                    '<strong>~' + estCal + ' kcal/' + mins + 'น.</strong></div>';
        });
        if (matches.length === 0) html = '<div class="search-loading">ไม่พบกิจกรรมนี้ พิมพ์แคลอรี่เองได้เลย</div>';

        dropdown.innerHTML = html;
        dropdown.style.display = 'block';
    }

    function selectWorkout(name, met) {
        selectedMet = met;
        var mins = parseInt(document.getElementById('workout-mins').value) || 30;
        var cal = Math.round(met * 60 * (mins / 60));
        document.getElementById('workout-name').value = name + ' (' + mins + ' นาที)';
        document.getElementById('workout-cal').value = cal;
        document.getElementById('workout-dropdown').style.display = 'none';
    }

    function recalcWorkout() {
        if (selectedMet > 0) {
            var mins = parseInt(document.getElementById('workout-mins').value) || 0;
            var cal = Math.round(selectedMet * 60 * (mins / 60));
            document.getElementById('workout-cal').value = cal;
            var baseName = document.getElementById('workout-name').value.split(' (').shift();
            document.getElementById('workout-name').value = baseName + ' (' + mins + ' นาที)';
        }
    }

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-wrapper')) {
            var fDrop = document.getElementById('search-dropdown');
            var wDrop = document.getElementById('workout-dropdown');
            if (fDrop) fDrop.style.display = 'none';
            if (wDrop) wDrop.style.display = 'none';
        }
    });

    function updateUI() {
        var logs = getDayLogs(todayKey);
        var inCal = 0;
        var outCal = 0;

        logs.forEach(function(item) {
            if (item.type === 'food') inCal += item.cal;
            else outCal += item.cal;
        });

        var netCal = Math.max(0, inCal - outCal);
        document.getElementById('in-cal').innerText = inCal.toLocaleString();
        document.getElementById('out-cal').innerText = outCal.toLocaleString();
        document.getElementById('net-cal').innerText = netCal.toLocaleString();

        var percentage = Math.min((netCal / TARGET_CAL) * 100, 100);
        var progressBar = document.getElementById('progress-bar');
        progressBar.style.width = percentage + '%';

                var body = document.getElementById('dino-body');
        var belly = document.getElementById('dino-belly');
        var bodyShine = document.getElementById('dino-body-shine');
        var bellyShine = document.getElementById('dino-belly-shine');
        var leftArm = document.getElementById('left-arm');
        var rightArm = document.getElementById('right-arm');
        var eyesNormal = document.getElementById('eyes-normal');
        var eyesHungry = document.getElementById('eyes-hungry');
        var sweat = document.getElementById('sweat-drop');
        var statusText = document.getElementById('status-text');

        if (netCal < 500) {
            body.setAttribute('rx', '30');
            belly.setAttribute('rx', '16');
            bodyShine.setAttribute('rx', '30');
            bellyShine.setAttribute('rx', '16');
            leftArm.setAttribute('transform', 'translate(13, 0)');
            rightArm.setAttribute('transform', 'translate(-13, 0)');
            eyesNormal.style.display = 'none';
            eyesHungry.style.display = 'block';
            sweat.setAttribute('opacity', '1');
            progressBar.style.backgroundColor = '#f4a261';
            statusText.innerText = '🥺 ผอมโซหมดแรงแล้ว... ป้อนหน่อย';
            statusText.style.color = '#d9822b';
        } else if (netCal <= 800) {
            body.setAttribute('rx', '37');
            belly.setAttribute('rx', '21');
            bodyShine.setAttribute('rx', '37');
            bellyShine.setAttribute('rx', '21');
            leftArm.setAttribute('transform', 'translate(6, 0)');
            rightArm.setAttribute('transform', 'translate(-6, 0)');
            eyesNormal.style.display = 'block';
            eyesHungry.style.display = 'none';
            sweat.setAttribute('opacity', '0');
            progressBar.style.backgroundColor = '#4ecdc4';
            statusText.innerText = '🙂 ตัวเริ่มมีแรงขึ้นมาหน่อยแล้ว!';
            statusText.style.color = '#1d786c';
        } else if (netCal <= 1500) {
            body.setAttribute('rx', '44');
            belly.setAttribute('rx', '26');
            bodyShine.setAttribute('rx', '44');
            bellyShine.setAttribute('rx', '26');
            leftArm.setAttribute('transform', 'translate(0, 0)');
            rightArm.setAttribute('transform', 'translate(0, 0)');
            eyesNormal.style.display = 'block';
            eyesHungry.style.display = 'none';
            sweat.setAttribute('opacity', '0');
            progressBar.style.backgroundColor = '#2a9d8f';
            statusText.innerText = '😄 หุ่นเฟิร์มกำลังดี น้องแฮปปี้สุดๆ!';
            statusText.style.color = '#1d786c';
        } else if (netCal <= 2200) {
            body.setAttribute('rx', '52');
            belly.setAttribute('rx', '33');
            bodyShine.setAttribute('rx', '52');
            bellyShine.setAttribute('rx', '33');
            leftArm.setAttribute('transform', 'translate(-8, 0)');
            rightArm.setAttribute('transform', 'translate(8, 0)');
            eyesNormal.style.display = 'block';
            eyesHungry.style.display = 'none';
            sweat.setAttribute('opacity', '0');
            progressBar.style.backgroundColor = '#f4a261';
            statusText.innerText = '😋 หุ่นเริ่มอวบมีพุงนิดๆ แล้วนะ!';
            statusText.style.color = '#d9822b';
        } else {
            var extra = Math.min((netCal - 2200) / 45, 22);
            body.setAttribute('rx', 56 + extra);
            belly.setAttribute('rx', 37 + extra);
            bodyShine.setAttribute('rx', 56 + extra);
            bellyShine.setAttribute('rx', 37 + extra);
            leftArm.setAttribute('transform', 'translate(' + (-12 - extra) + ', 0)');
            rightArm.setAttribute('transform', 'translate(' + (12 + extra) + ', 0)');
            eyesNormal.style.display = 'block';
            eyesHungry.style.display = 'none';
            sweat.setAttribute('opacity', '1');
            progressBar.style.backgroundColor = '#e76f51';
            statusText.innerText = '🐷 พุงกางเดินไม่ไหวแล้ว พาไปวิ่งที!';
            statusText.style.color = '#d62828';
        }

        var listEl = document.getElementById('log-list');
        var html = '';
        logs.forEach(function(item, j) {
            var isFood = item.type === 'food';
            var sign = isFood ? '+' : '-';
            var colorClass = isFood ? 'cal-plus' : 'cal-minus';
            var icon = isFood ? '🍽️' : '🔥';

            html += '<div class="log-item"><span>' + icon + ' ' + item.name + '</span>' +
                    '<div><span class="' + colorClass + '">' + sign + item.cal + '</span> kcal' +
                    '<button type="button" class="del-btn" onclick="deleteLog(' + j + ')">✕</button></div></div>';
        });
        listEl.innerHTML = html;

        try { localStorage.setItem('dino7Days', JSON.stringify(allLogs)); } catch (e) {}
        renderChart();
    }


    function renderChart() {
        var chartEl = document.getElementById('chart-bars');
        if (!chartEl) return;
        var html = '';
        var maxScale = 2800;

        last7Days.forEach(function(day) {
            var dayLogs = getDayLogs(day.key);
            var dIn = 0, dOut = 0;
            dayLogs.forEach(function(x) {
                if (x.type === 'food') dIn += x.cal;
                else dOut += x.cal;
            });
            var net = Math.max(0, dIn - dOut);
            var heightPct = Math.min(Math.round((net / maxScale) * 100), 100);
            var barColor = '#f4a261';
            if (net >= 800 && net <= 2200) barColor = '#2a9d8f';
            else if (net > 2200) barColor = '#e76f51';

            html += '<div class="bar-col"><div class="bar-val">' + (net > 0 ? net : '') + '</div>' +
                    '<div class="bar-fill" style="height: ' + Math.max(heightPct, 4) + '%; background-color: ' + barColor + ';"></div>' +
                    '<div class="bar-label">' + day.label + '</div></div>';
        });
        chartEl.innerHTML = html;
    }

    function addLog(type) {
        var nameInput = document.getElementById(type === 'food' ? 'food-name' : 'workout-name');
        var calInput = document.getElementById(type === 'food' ? 'food-cal' : 'workout-cal');
        var name = nameInput.value.trim();
        var cal = parseInt(calInput.value);

        if (!name || isNaN(cal) || cal <= 0) {
            alert('กรุณากรอกชื่อรายการและจำนวนแคลอรี่ให้ถูกต้องครับ');
            return;
        }
        getDayLogs(todayKey).push({ type: type, name: name, cal: cal });
        nameInput.value = '';
        calInput.value = '';
        triggerAnim(type);
        updateUI();
    }

    function quickAdd(type, name, cal) {
        getDayLogs(todayKey).push({ type: type, name: name, cal: cal });
        triggerAnim(type);
        updateUI();
    }

    function deleteLog(index) {
        getDayLogs(todayKey).splice(index, 1);
        updateUI();
    }

    function resetDay() {
        if (confirm('ต้องการล้างข้อมูลของวันนี้ทั้งหมดใช่ไหม?')) {
            allLogs[todayKey] = [];
            updateUI();
        }
    }

    var currentChar = localStorage.getItem('selectedPet') || 'elephant';

    function changeChar(type) {
        currentChar = type;
        try { localStorage.setItem('selectedPet', type); } catch (e) {}

        var chars = 'elephant,pig,hippo,giraffe,dino'.split(',');
        chars.forEach(function(c) {
            var btn = document.getElementById('btn-' + c);
            if (btn) btn.className = (c === type) ? 'char-btn active' : 'char-btn';
            var head = document.getElementById('head-' + c);
            if (head) head.style.display = (c === type) ? 'block' : 'none';
            var face = document.getElementById('face-' + c);
            if (face) face.style.display = (c === type) ? 'block' : 'none';
        });

        document.getElementById('spots-giraffe').style.display = (type === 'giraffe') ? 'block' : 'none';
        document.getElementById('dino-tail').style.display = (type === 'dino') ? 'none' : 'block';

        var bodyCol = '#b8c4cc', bellyCol = '#dce4e8', bgCol = 'linear-gradient(180deg, #eef4f7 0%, #dae5eb 100%)';

        if (type === 'pig') {
            bodyCol = '#ffb3c6'; bellyCol = '#ffe5ec'; bgCol = 'linear-gradient(180deg, #fff0f3 0%, #ffccd5 100%)';
        } else if (type === 'hippo') {
            bodyCol = '#a594b5'; bellyCol = '#d8cce3'; bgCol = 'linear-gradient(180deg, #f3eff5 0%, #e2dce6 100%)';
        } else if (type === 'giraffe') {
            bodyCol = '#ffd166'; bellyCol = '#fff3d1'; bgCol = 'linear-gradient(180deg, #fff9e6 0%, #ffefb8 100%)';
        } else if (type === 'dino') {
            bodyCol = '#52c48e'; bellyCol = '#d8f3dc'; bgCol = 'linear-gradient(180deg, #e0f5eb 0%, #c7eedc 100%)';
        }

        document.getElementById('dino-body').setAttribute('fill', bodyCol);
        document.getElementById('dino-belly').setAttribute('fill', bellyCol);
        document.getElementById('head-base').setAttribute('fill', bodyCol);
        document.getElementById('head-tuft').setAttribute('fill', bodyCol);
        document.getElementById('stage-bg').style.background = bgCol;

        var parts = document.querySelectorAll('.body-part');
        parts.forEach(function(p) {
            p.setAttribute('fill', bodyCol);
        });
    }

    function triggerAnim(type) {
        var rig = document.getElementById('pet-rig');
        if (!rig) return;
        rig.classList.remove('anim-eat', 'anim-workout');
        void rig.offsetWidth;
        rig.classList.add(type === 'food' ? 'anim-eat' : 'anim-workout');
    }

    changeChar(currentChar);
    updateUI();

function setGeminiKey() {
    var currentKey = localStorage.getItem('geminiApiKey') || '';
    var newKey = prompt('กรุณาวาง Gemini API Key ของคุณ (สมัครฟรีได้ที่ Google AI Studio):', currentKey);
    if (newKey !== null) {
        localStorage.setItem('geminiApiKey', newKey.trim());
        alert('บันทึก API Key เรียบร้อยแล้วครับ!');
    }
}

function triggerFoodScan() {
    document.getElementById('food-img-input').click();
}


function scanFoodImage(input) {
    var file = input.files.item(0);
    if (!file) return;

    var rawKey = localStorage.getItem('geminiApiKey') || '';
    var apiKey = rawKey.replace(/[^a-zA-Z0-9_-]/g, '');


    var btnText = document.getElementById('scan-btn-text');
    btnText.innerText = '⏳ กำลังวิเคราะห์รูปอาหาร...';
    btnText.disabled = true;

    var reader = new FileReader();
    reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
            var canvas = document.createElement('canvas');
            var maxW = 400;
            var scale = (img.width > maxW) ? (maxW / img.width) : 1;
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            var compressedDataUrl = canvas.toDataURL('image/jpeg', 0.65);
            var base64Data = compressedDataUrl.split(',').pop();

            var url = '/.netlify/functions/scan';
            var payload = JSON.stringify({
                apiKey: apiKey,
                image: base64Data
            });



            var xhr = new XMLHttpRequest();
            xhr.open('POST', url, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.timeout = 20000;

            xhr.onload = function() {
                btnText.innerText = '📷 ถ่ายรูป / อัปโหลดสแกนอาหาร';
                btnText.disabled = false;
                input.value = '';

                try {
                    var data = JSON.parse(xhr.responseText);
                    if (data.error) {
                        alert('Google แจ้งเตือน: ' + data.error.message);
                        return;
                    }
                    var rawText = data.candidates.slice(0, 1).pop().content.parts.slice(0, 1).pop().text;
                    var cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
                    var result = JSON.parse(cleanJson);

                    document.getElementById('food-name').value = result.name;
                    document.getElementById('food-cal').value = result.cal;
                } catch (err) {
                    alert('อ่านข้อมูลไม่สำเร็จ: ' + xhr.responseText.substring(0, 100));
                }
            };

            xhr.onerror = function() {
                btnText.innerText = '📷 ถ่ายรูป / อัปโหลดสแกนอาหาร';
                btnText.disabled = false;
                input.value = '';
                alert('เชื่อมต่อเซิร์ฟเวอร์ Google ไม่ได้ กรุณาเช็กเน็ต หรือลองปิด Private Relay / VPN บน iPhone ครับ');
            };

            xhr.ontimeout = function() {
                btnText.innerText = '📷 ถ่ายรูป / อัปโหลดสแกนอาหาร';
                btnText.disabled = false;
                input.value = '';
                alert('หมดเวลาเชื่อมต่อ (Timeout) กรุณาลองใหม่อีกครั้งครับ');
            };

            xhr.send(payload);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}





