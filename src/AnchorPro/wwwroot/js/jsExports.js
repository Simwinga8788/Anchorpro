window.downloadFile = (fileName, contentType, base64) => {
    const link = document.createElement('a');
    link.download = fileName;
    link.href = `data:${contentType};base64,${base64}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

window.renderChart = (canvasId, config) => {
    const ctx = document.getElementById(canvasId);
    if (ctx) {
        if (window.charts && window.charts[canvasId]) {
            window.charts[canvasId].destroy();
        }

        if (!window.charts) window.charts = {};

        window.charts[canvasId] = new Chart(ctx, config);
    }
};
