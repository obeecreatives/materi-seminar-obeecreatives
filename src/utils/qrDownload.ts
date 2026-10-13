/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Utilitas untuk mengunduh QR Code sebagai file gambar PNG beresolusi tinggi.
 * Mendukung 2 mode:
 * 1. 'card' : Poster / kartu siap sebar ke grup WA / slide / cetak (lengkap dengan judul acara & link)
 * 2. 'pure' : QR code murni beresolusi tinggi (square) dengan margin putih bersih
 */

export interface QrDownloadOptions {
  url: string;
  seminarTitle?: string;
  organizerName?: string;
  filename?: string;
  mode?: 'card' | 'pure';
}

export async function downloadQrCode(
  svgElementOrContainer: SVGElement | HTMLElement | null,
  options: QrDownloadOptions
): Promise<void> {
  const {
    url,
    seminarTitle = 'Seminar Interaktif UMKM',
    organizerName = 'PartnerUp | Obeecreatives',
    filename,
    mode = 'card',
  } = options;

  let svgElement: SVGElement | null = null;
  if (svgElementOrContainer instanceof SVGElement) {
    svgElement = svgElementOrContainer;
  } else if (svgElementOrContainer instanceof HTMLElement) {
    svgElement = svgElementOrContainer.querySelector('svg');
  }

  if (!svgElement) {
    // Cari fallback SVG terdekat dengan joinUrl
    const allSvgs = document.querySelectorAll('svg');
    for (const s of allSvgs) {
      if (s.innerHTML.includes('path') || s.getAttribute('viewBox')) {
        svgElement = s;
        break;
      }
    }
  }

  if (!svgElement) {
    console.warn('QR SVG element not found, falling back to opening URL');
    window.open(url, '_blank');
    return;
  }

  // Serialisasi SVG ke image
  const svgString = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const blobUrl = URL.createObjectURL(svgBlob);

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (e) => reject(e);
    img.src = blobUrl;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    URL.revokeObjectURL(blobUrl);
    return;
  }

  const safeEventName = seminarTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);

  if (mode === 'pure') {
    // Mode Murni: Square 900x900 px dengan quiet-zone putih
    const size = 900;
    const padding = 70;
    canvas.width = size;
    canvas.height = size;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);

    const qrSize = size - padding * 2;
    ctx.drawImage(img, padding, padding, qrSize, qrSize);

    triggerCanvasDownload(
      canvas,
      filename || `qr-code-peserta-${safeEventName || 'partnerup'}.png`
    );
  } else {
    // Mode Card: Flyer / Kartu Siap Share 960x1200 px
    const width = 960;
    const height = 1240;
    canvas.width = width;
    canvas.height = height;

    // Background Card
    ctx.fillStyle = '#FFF7EC';
    ctx.fillRect(0, 0, width, height);

    // Border Frame Elegan
    ctx.strokeStyle = '#1F3A5F';
    ctx.lineWidth = 10;
    ctx.strokeRect(16, 16, width - 32, height - 32);

    // Header Badge Pill
    ctx.fillStyle = '#F28C28';
    fillRoundedRect(ctx, 48, 48, width - 96, 54, 16);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(organizerName.toUpperCase(), width / 2, 75);

    // Judul Utama
    ctx.fillStyle = '#1F3A5F';
    ctx.font = 'bold 44px "Outfit", "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Scan HP untuk Menjawab', width / 2, 160);

    // Subjudul / Nama Seminar (Word wrapped)
    ctx.fillStyle = '#1F3A5F';
    ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
    wrapText(ctx, seminarTitle, width / 2, 220, width - 140, 32);

    // Petunjuk Singkat
    ctx.fillStyle = '#2A9D8F';
    ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('✦ Langsung Buka Tanpa Perlu Install Aplikasi ✦', width / 2, 300);

    // Kotak Putih Tempat QR
    const qrBoxSize = 560;
    const qrBoxX = (width - qrBoxSize) / 2;
    const qrBoxY = 340;

    // Bayangan Kotak QR
    ctx.fillStyle = 'rgba(31, 58, 95, 0.08)';
    fillRoundedRect(ctx, qrBoxX - 4, qrBoxY + 4, qrBoxSize + 8, qrBoxSize + 8, 28);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    fillRoundedRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 28);
    ctx.fill();

    ctx.strokeStyle = 'rgba(31, 58, 95, 0.15)';
    ctx.lineWidth = 3;
    fillRoundedRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 28);
    ctx.stroke();

    // Gambar QR di Tengah Kotak Putih
    const qrPadding = 36;
    ctx.drawImage(
      img,
      qrBoxX + qrPadding,
      qrBoxY + qrPadding,
      qrBoxSize - qrPadding * 2,
      qrBoxSize - qrPadding * 2
    );

    // Kotak Tautan URL Browser
    const urlBoxY = 930;
    const urlBoxHeight = 110;
    ctx.fillStyle = '#FFFFFF';
    fillRoundedRect(ctx, 64, urlBoxY, width - 128, urlBoxHeight, 18);
    ctx.fill();
    ctx.strokeStyle = '#F28C28';
    ctx.lineWidth = 2.5;
    fillRoundedRect(ctx, 64, urlBoxY, width - 128, urlBoxHeight, 18);
    ctx.stroke();

    ctx.fillStyle = '#1F3A5F';
    ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Atau ketik tautan ini di browser HP:', width / 2, urlBoxY + 36);

    ctx.fillStyle = '#1F3A5F';
    ctx.font = 'bold 23px "IBM Plex Mono", monospace';
    const displayUrl = url.length > 55 ? url.slice(0, 52) + '...' : url;
    ctx.fillText(displayUrl, width / 2, urlBoxY + 76);

    // Footer Info
    ctx.fillStyle = 'rgba(31, 58, 95, 0.7)';
    ctx.font = '500 17px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      'PartnerUp Live — Platform Seminar Interaktif UMKM',
      width / 2,
      height - 60
    );

    triggerCanvasDownload(
      canvas,
      filename || `kartu-qr-peserta-${safeEventName || 'partnerup'}.png`
    );
  }

  URL.revokeObjectURL(blobUrl);
}

function fillRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let curY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, curY);
}

function triggerCanvasDownload(canvas: HTMLCanvasElement, filename: string) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 500);
  }, 'image/png');
}
