// ==========================================
// Tool-specific JavaScript: Anki Media Packager
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    window.SQL = null;
    let matchedData = [];

    const statusEl = document.getElementById('status');
    const matchBtn = document.getElementById('matchBtn');
    const generateBtn = document.getElementById('generateBtn');
    const resultsSection = document.getElementById('resultsSection');
    const matchTableBody = document.getElementById('matchTableBody');

    function setStatus(message, type) {
        statusEl.className = 'status-' + type;
        statusEl.textContent = message;
    }

    function getBaseName(filename) {
        const lastDot = filename.lastIndexOf('.');
        return lastDot !== -1 ? filename.substring(0, lastDot) : filename;
    }

    function getExtension(filename) {
        const lastDot = filename.lastIndexOf('.');
        return lastDot !== -1 ? filename.substring(lastDot) : '';
    }

    // 1. Initialize WASM
    if (typeof initSqlJs !== 'undefined') {
        initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}` })
        .then(sql => {
            window.SQL = sql;
            matchBtn.disabled = false;
            matchBtn.textContent = 'Match Files';
        }).catch(err => {
            console.error('WASM Init Error:', err);
            setStatus('Error: Failed to initialize SQLite engine.', 'error');
        });
    }

    // 2. Match Files
    if (matchBtn) {
        matchBtn.addEventListener('click', async () => {
            const csvFile = document.getElementById('csvFile').files[0];
            const imgFiles = document.getElementById('imgFiles').files;
            const audioFiles = document.getElementById('audioFiles').files;

            if (!csvFile) {
                setStatus('Error: Please choose a CSV file.', 'error');
                return;
            }

            setStatus('Matching files...', 'info');
            matchedData = [];
            matchTableBody.innerHTML = '';
            resultsSection.style.display = 'none';

            try {
                const imgMap = new Map();
                const duplicateImgs = new Set();
                Array.from(imgFiles).forEach(file => {
                    const baseName = getBaseName(file.name).toLowerCase();
                    if (imgMap.has(baseName)) {
                        duplicateImgs.add(baseName);
                    } else {
                        imgMap.set(baseName, file);
                    }
                });

                const audioMap = new Map();
                const duplicateAudios = new Set();
                Array.from(audioFiles).forEach(file => {
                    const baseName = getBaseName(file.name).toLowerCase();
                    if (audioMap.has(baseName)) {
                        duplicateAudios.add(baseName);
                    } else {
                        audioMap.set(baseName, file);
                    }
                });

                const csvText = await csvFile.text();
                const parsed = Papa.parse(csvText, { skipEmptyLines: true });
                
                if (!parsed.data || parsed.data.length === 0) {
                    throw new Error('No data found in the CSV file.');
                }

                let hasDuplicate = false;

                parsed.data.forEach(row => {
                    const front = row[0] ? row[0].trim() : '';
                    const back = row[1] ? row[1].trim() : '';
                    
                    if (!front) return;

                    const searchKey = front.toLowerCase();
                    const isImgDup = duplicateImgs.has(searchKey);
                    const isAudioDup = duplicateAudios.has(searchKey);

                    if (isImgDup || isAudioDup) {
                        hasDuplicate = true;
                        matchedData.push({
                            front: front,
                            back: back,
                            status: 'Duplicate',
                            imgDup: isImgDup,
                            audioDup: isAudioDup
                        });
                    } else {
                        const matchedImg = imgMap.get(searchKey) || null;
                        const matchedAudio = audioMap.get(searchKey) || null;

                        matchedData.push({
                            front: front,
                            back: back,
                            imgFile: matchedImg,
                            audioFile: matchedAudio,
                            status: (matchedImg && matchedAudio) ? 'Matched' : 
                                    (matchedImg || matchedAudio) ? 'Partial' : 'Missing'
                        });
                    }
                });

                if (matchedData.length === 0) {
                    throw new Error('No valid rows found to process.');
                }

                matchedData.forEach(data => {
                    const tr = document.createElement('tr');
                    
                    let statusText = data.status;
                    let statusClass = '';
                    
                    if (statusText === 'Matched') statusClass = 'badge-matched';
                    else if (statusText === 'Partial') statusClass = 'badge-partial';
                    else if (statusText === 'Missing') statusClass = 'badge-missing';
                    else if (statusText === 'Duplicate') statusClass = 'badge-duplicate';

                    let imgCol = data.imgFile ? data.imgFile.name : '—';
                    let audioCol = data.audioFile ? data.audioFile.name : '—';

                    if (data.status === 'Duplicate') {
                        if (data.imgDup) imgCol = 'Multiple files found';
                        if (data.audioDup) audioCol = 'Multiple files found';
                    }

                    const frontCell = tr.insertCell();
                    frontCell.textContent = data.front;
                    const imageCell = tr.insertCell();
                    imageCell.textContent = imgCol;
                    const audioCell = tr.insertCell();
                    audioCell.textContent = audioCol;
                    const statusCell = tr.insertCell();
                    const statusBadge = document.createElement('span');
                    statusBadge.className = `badge ${statusClass}`;
                    statusBadge.textContent = statusText;
                    statusCell.appendChild(statusBadge);
                    matchTableBody.appendChild(tr);
                });

                resultsSection.style.display = 'block';

                if (hasDuplicate) {
                    generateBtn.disabled = true;
                    setStatus('Duplicate files detected. Please remove duplicates with the same base name and try again.', 'error');
                } else {
                    generateBtn.disabled = false;
                    setStatus('Files matched successfully. Review the results below.', 'success');
                }

            } catch (err) {
                console.error('Matching Error:', err);
                setStatus(`Error: ${err.message}`, 'error');
            }
        });
    }

    // 3. Generate APKG
    if (generateBtn) {
        generateBtn.addEventListener('click', async () => {
            generateBtn.disabled = true;
            setStatus('Generating APKG... Please wait.', 'info');

            try {
                const model = new Model({
                    name: "Anki Media Packager Model",
                    id: "1689234829843",
                    flds: [ { name: "Front" }, { name: "Back" } ],
                    req: [ [0, "all", [0]] ],
                    tmpls: [
                        {
                            name: "Card 1",
                            qfmt: "{{Front}}",
                            afmt: "{{FrontSide}}<hr id=answer>{{Back}}"
                        }
                    ]
                });

                const deck = new Deck(9876543210, "Media Packager Deck");
                
                let mediaFilesToZip = []; 
                let mediaMapJson = {};    
                let mediaCounter = 0;

                matchedData.forEach((data, index) => {
                    if (data.status === 'Duplicate') return;

                    let cardFront = data.front;
                    
                    if (data.imgFile) {
                        const ext = getExtension(data.imgFile.name);
                        const internalImgName = `img_${index}${ext}`;
                        cardFront += `<br><br><img src='${internalImgName}' />`;
                        
                        mediaFilesToZip.push({
                            file: data.imgFile,
                            mediaIndex: mediaCounter.toString()
                        });
                        mediaMapJson[mediaCounter.toString()] = internalImgName;
                        mediaCounter++;
                    }

                    if (data.audioFile) {
                        const ext = getExtension(data.audioFile.name);
                        const internalAudioName = `aud_${index}${ext}`;
                        cardFront += `<br>[sound:${internalAudioName}]`;
                        
                        mediaFilesToZip.push({
                            file: data.audioFile,
                            mediaIndex: mediaCounter.toString()
                        });
                        mediaMapJson[mediaCounter.toString()] = internalAudioName;
                        mediaCounter++;
                    }

                    deck.addNote(model.note([cardFront, data.back]));
                });

                const pkg = new Package();
                pkg.addDeck(deck);

                const baseZipBlob = await new Promise((resolve, reject) => {
                    const originalSaveAs = window.saveAs;
                    window.saveAs = function(blob, filename) {
                        window.saveAs = originalSaveAs; 
                        resolve(blob);
                    };
                    try {
                        pkg.writeToFile('temp.apkg');
                    } catch (e) {
                        window.saveAs = originalSaveAs; 
                        reject(e);
                    }
                });

                const zip = await JSZip.loadAsync(baseZipBlob);

                const arrayBufferPromises = mediaFilesToZip.map(async (mediaItem) => {
                    const buffer = await mediaItem.file.arrayBuffer();
                    zip.file(mediaItem.mediaIndex, buffer, { binary: true });
                });

                await Promise.all(arrayBufferPromises);
                zip.file("media", JSON.stringify(mediaMapJson));

                const finalApkgBlob = await zip.generateAsync({
                    type: "blob",
                    mimeType: "application/octet-stream"
                });

                window.saveAs(finalApkgBlob, "My_Deck.apkg");
                setStatus('Success! The APKG file has been downloaded.', 'success');

            } catch (err) {
                console.error('Generation Error:', err);
                setStatus(`Error during generation: ${err.message}`, 'error');
            } finally {
                generateBtn.disabled = false;
            }
        });
    }
});
