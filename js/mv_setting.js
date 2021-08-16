const modelViewer = document.querySelector('#dimension-demo');
const progress = document.querySelector('#progress');
const bar = progress.querySelector('.bar');


// Status check
modelViewer.addEventListener('ar-status', (event) => {
    alert(event)
    console.log(event)
    if (event.detail.status === 'failed') {
        const error = document.querySelector("#error");
        error.classList.remove('hide');
        error.addEventListener('transitionend', (event) => {
            error.classList.add('hide');
        });
    }
});

// Loading bar
modelViewer.addEventListener('progress', (event) => {
    console.log(event.detail)
    const {
        totalProgress
    } = event.detail;
    progress.classList.toggle('show', totalProgress < 1);
    $(".bar").css('transform', `scaleX(${totalProgress})`)
});

// 
const tapDistance = 2;
let panning = false;
let panX, panY;
let startX, startY;
let lastX, lastY;
let metersPerPixel;

const startPan = () => {
    const orbit = modelViewer.getCameraOrbit();
    const {
        theta,
        phi,
        radius
    } = orbit;
    const psi = theta - modelViewer.turntableRotation;
    metersPerPixel = 0.75 * radius / modelViewer.getBoundingClientRect().height;
    panX = [-Math.cos(psi), 0, Math.sin(psi)];
    panY = [
        -Math.cos(phi) * Math.sin(psi),
        Math.sin(phi),
        -Math.cos(phi) * Math.cos(psi)
    ];
    modelViewer.interactionPrompt = 'none';
};

const movePan = (thisX, thisY) => {
    const dx = (thisX - lastX) * metersPerPixel;
    const dy = (thisY - lastY) * metersPerPixel;
    lastX = thisX;
    lastY = thisY;

    const target = modelViewer.getCameraTarget();
    target.x += dx * panX[0] + dy * panY[0];
    target.y += dx * panX[1] + dy * panY[1];
    target.z += dx * panX[2] + dy * panY[2];
    modelViewer.cameraTarget = `${target.x}m ${target.y}m ${target.z}m`;

    // This pauses turntable rotation
    modelViewer.dispatchEvent(new CustomEvent(
        'camera-change', {
            detail: {
                source: 'user-interaction'
            }
        }));
};

const recenter = (pointer) => {
    panning = false;
    if (Math.abs(pointer.clientX - startX) > tapDistance ||
        Math.abs(pointer.clientY - startY) > tapDistance)
        return;
    // const rect = modelViewer.getBoundingClientRect();
    // const x = event.clientX - rect.left;
    // const y = event.clientY - rect.top;
    // const hit = modelViewer.positionAndNormalFromPoint(x, y);
    // modelViewer.cameraTarget =
    //     hit == null ? 'auto auto auto' : hit.position.toString();
};

const onPointerUp = (event) => {
    const pointer = event.clientX ? event : event.changedTouches[0];
    if (Math.abs(pointer.clientX - startX) < tapDistance &&
        Math.abs(pointer.clientY - startY) < tapDistance) {
        recenter(pointer);
    }
    panning = false;
};

modelViewer.addEventListener('mousedown', (event) => {
    startX = event.clientX;
    startY = event.clientY;
    panning = event.button === 2 || event.ctrlKey || event.metaKey ||
        event.shiftKey;
    if (!panning)
        return;

    lastX = startX;
    lastY = startY;
    startPan();
    event.stopPropagation();
}, true);

modelViewer.addEventListener('touchstart', (event) => {
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
    panning = event.touches.length === 2;
    if (!panning)
        return;

    const {
        touches
    } = event;
    lastX = 0.5 * (touches[0].clientX + touches[1].clientX);
    lastY = 0.5 * (touches[0].clientY + touches[1].clientY);
    startPan();
}, true);

modelViewer.addEventListener('mousemove', (event) => {
    if (!panning)
        return;
    movePan(event.clientX, event.clientY);
    event.stopPropagation();
}, true);

modelViewer.addEventListener('touchmove', (event) => {
    if (!panning || event.touches.length !== 2)
        return;

    const {
        touches
    } = event;
    const thisX = 0.5 * (touches[0].clientX + touches[1].clientX);
    const thisY = 0.5 * (touches[0].clientY + touches[1].clientY);
    movePan(thisX, thisY);
}, true);

self.addEventListener('mouseup', (event) => {
    recenter(event);
}, true);

self.addEventListener('touchend', (event) => {
    recenter(event);
    if (event.touches.length === 0) {
        recenter(event.changedTouches[0]);
    }
}, true);