let video = document.querySelector("video");
let recordBtnCont = document.querySelector(".record-btn-cont");
let recordBtn = document.querySelector(".record-btn");
let captureBtnCont = document.querySelector(".capture-btn-cont");
let captureBtn = document.querySelector(".capture-btn");
let transparentColor = "transparent";

let statusIndicator = document.querySelector(".status-indicator");
let permissionStatus = document.querySelector(".permission-status");
let audioToggle = document.querySelector("#audio-toggle");
let screenModeToggle = document.querySelector("#screen-mode-toggle");
let galleryList = document.querySelector("#gallery-list");

let recordFlag = false; // by default recording is off

let recorder; // stores undefined values default
let chunks = []; // media data is stored in chunks
let currentStream = null;

// constraints is an object which tells what media we want to capture
let constraints = {
    audio: true,
    video: true,
};

function setStatus(isRecording) {
    if (!statusIndicator) return;
    statusIndicator.textContent = isRecording ? "Recording" : "Idle";
    statusIndicator.classList.toggle("status-recording", isRecording);
    statusIndicator.classList.toggle("status-idle", !isRecording);
}

function setPermissionMessage(message, isError = false) {
    if (!permissionStatus) return;
    permissionStatus.textContent = message;
    permissionStatus.style.color = isError ? "#fecaca" : "#9ca3af";
}

async function initStream() {
    try {
        if (currentStream) {
            currentStream.getTracks().forEach((t) => t.stop());
        }

        const useScreen = screenModeToggle?.checked;
        const wantsAudio = audioToggle?.checked;

        if (useScreen && navigator.mediaDevices.getDisplayMedia) {
            constraints = {
                video: true,
                audio: wantsAudio,
            };
            currentStream = await navigator.mediaDevices.getDisplayMedia(constraints);
            setPermissionMessage("Screen sharing active");
        } else {
            constraints = {
                audio: wantsAudio,
                video: true,
            };
            currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            setPermissionMessage("Camera preview ready");
        }

        video.srcObject = currentStream;

        recorder = new MediaRecorder(currentStream);
        recorder.addEventListener("start", () => {
            chunks = [];
            setStatus(true);
        });
        recorder.addEventListener("dataavailable", (e) => {
            chunks.push(e.data);
        });
        recorder.addEventListener("stop", () => {
            // convert the media chunks data to video
            let blob = new Blob(chunks, { type: "video/mp4" });
            let videoURL = URL.createObjectURL(blob);

            // add to gallery
            addToGallery({
                url: videoURL,
                type: "recording",
            });

            // also auto-download like before
            let a = document.createElement("a");
            a.href = videoURL;
            a.download = "video.mp4";
            a.click();

            setStatus(false);
        });
    } catch (err) {
        console.error(err);
        setPermissionMessage("Permission denied or no media devices found", true);
    }
}

if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    initStream();
} else {
    setPermissionMessage("Media devices API not supported in this browser", true);
}

recordBtnCont.addEventListener("click", () => {
    if (!recorder) return;

    recordFlag = !recordFlag;
    if (recordFlag) {
        recorder.start();
        recordBtn.classList.add("scale-record");
        startTimer();
    } else {
        recorder.stop();
        recordBtn.classList.remove("scale-record");
        stopTimer();
    }
});

//video is acutally captured as chunks, but what these chunks will have?
//each chunk will be having a frame, image is acutally a frame

captureBtnCont.addEventListener("click",(e) => {
    captureBtn.classList.add("scale-capture");//adding animation
    let canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    let tool = canvas.getContext("2d");
    tool.drawImage(video,0,0,canvas.width,canvas.height);
    //filter apply
    tool.fillStyle = transparentColor;
    tool.fillRect(0,0,canvas.width,canvas.height);

    let imageURL = canvas.toDataURL("image/jpeg"); 

    // add snapshot to gallery
    addToGallery({
        url: imageURL,
        type: "snapshot",
    });

    // keep existing auto-download behavior
    let a = document.createElement("a");
    a.href = imageURL;
    a.download = "image.jpg";
    a.click();

    //remove animation 
    setTimeout(() => {
        captureBtn.classList.remove("scale-capture");
    },500);
    
});

let timerID
let counter = 0; // represents total seconds   
let timer = document.querySelector(".timer");
function startTimer(){
    timer.style.display = "block";
    function displayTimer(){
        /*
            how to calculate time
            1) Initialize a variable that actually stores no. of seconds 
            2) When ever this function displayTimer is called then we need to incerement 
            the counter variable ,as each call of this function is considered as 1 sec 
            in regular time. Why? beacause we need to get the acutal time when this thing needs counted.
            How to count hours , minutes, & seconds ?
            counter = 3725
            we know 1 hr = 3600 sec
            to count 1hr using counter value, we use '/(divison operator)' btw counter and 3600 sec
            divison operator is used to perform floor division 
            3725 / 3600 => 1 
            remainder 3725 % 3600 => no. of minutes seconds, so  we need to convert back 
            to minutes, 1min = 60 sec
        */
       let totalSeconds = counter; 
       let hours = Number.parseInt(totalSeconds / 3600);
       totalSeconds = totalSeconds % 3600; 
       let minutes = Number.parseInt(totalSeconds / 60);
       totalSeconds = totalSeconds % 60;
       let seconds = totalSeconds;

        hours = (hours < 10) ? `0${hours}` : hours;
        minutes = (minutes < 10) ? `0${minutes}` : minutes;
        seconds = (seconds < 10) ? `0${seconds}` : seconds;

       timer.innerText = `${hours}:${minutes}:${seconds}`;

        counter++;
    }
    timerID = setInterval(displayTimer,1000);// we are calling displayTimer every 1 sec
}

function stopTimer(){
    clearInterval(timerID);
    timer.innerText = "00:00:00";
    timer.style.display = "none";
}

// filter functionality
let filter = document.querySelector(".filter-layer");

let allFilters = document.querySelectorAll(".filter");
allFilters.forEach((filterElem) => {
    filterElem.addEventListener("click",(e) => {
        // get style
        transparentColor = getComputedStyle(filterElem).getPropertyValue("background-color");
        if (filter) {
            filter.style.backgroundColor = transparentColor;
        }
    });
});

// gallery helper
function addToGallery({ url, type }) {
    if (!galleryList) return;

    const item = document.createElement("div");
    item.className = "gallery-item";

    const thumb = document.createElement("div");
    thumb.className = "gallery-thumb";

    if (type === "recording") {
        const v = document.createElement("video");
        v.src = url;
        v.controls = false;
        v.muted = true;
        v.playsInline = true;
        thumb.appendChild(v);
    } else {
        const img = document.createElement("img");
        img.src = url;
        img.alt = "Snapshot";
        thumb.appendChild(img);
    }

    const meta = document.createElement("div");
    meta.className = "gallery-meta";

    const badge = document.createElement("span");
    badge.className = "badge " + (type === "recording" ? "badge-recording" : "badge-snapshot");
    badge.textContent = type === "recording" ? "Recording" : "Snapshot";

    const time = document.createElement("span");
    time.textContent = new Date().toLocaleTimeString();

    meta.appendChild(badge);
    meta.appendChild(time);

    const actions = document.createElement("div");
    actions.className = "gallery-actions";

    const previewBtn = document.createElement("button");
    previewBtn.className = "btn-ghost";
    previewBtn.textContent = "Preview";
    previewBtn.addEventListener("click", () => {
        window.open(url, "_blank");
    });

    const downloadBtn = document.createElement("button");
    downloadBtn.className = "btn-ghost";
    downloadBtn.textContent = "Download";
    downloadBtn.addEventListener("click", () => {
        const a = document.createElement("a");
        a.href = url;
        a.download = type === "recording" ? "video.mp4" : "image.jpg";
        a.click();
    });

    actions.appendChild(previewBtn);
    actions.appendChild(downloadBtn);

    item.appendChild(thumb);
    item.appendChild(meta);
    item.appendChild(actions);

    galleryList.prepend(item);
}

// reinitialize stream when toggles change
if (screenModeToggle) {
    screenModeToggle.addEventListener("change", () => {
        initStream();
    });
}

if (audioToggle) {
    audioToggle.addEventListener("change", () => {
        initStream();
    });
}