import {
  SlideDefinition,
  WorksheetQuestion,
  RATIONAL_CONVERSION_DICTIONARY,
  VP_THREE_TESTS,
} from '../data/seminarData';
import { AnswerDoc, BrandThemeConfig } from '../types';
import { DEFAULT_BRAND_THEME } from '../brandTheme';

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function triggerIframePrint(htmlContent: string) {
  const existingFrame = document.getElementById('partnerup-print-iframe') as HTMLIFrameElement | null;
  if (existingFrame && existingFrame.parentNode) {
    existingFrame.parentNode.removeChild(existingFrame);
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'partnerup-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(htmlContent);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.warn('Print fallback triggered:', err);
      window.print();
    }
  }, 350);
}

/**
 * 1. CETAK / SIMPAN PDF SELURUH SLIDE MATERI (A4 LANDSCAPE)
 */
export function printSlideDeckHandout(params: {
  slides: SlideDefinition[];
  seminarTitle: string;
  organizerName: string;
  brandTheme?: BrandThemeConfig;
}) {
  const { slides, seminarTitle, organizerName, brandTheme } = params;
  const theme = brandTheme || DEFAULT_BRAND_THEME;

  const slidesHtml = slides
    .map((slide, idx) => {
      const cardsHtml =
        slide.cards && slide.cards.length > 0
          ? `<div class="cards-grid cards-count-${slide.cards.length}">
              ${slide.cards
                .map(
                  (c) => `
                <div class="card card-${c.accent || 'white'}">
                  <div class="card-title">${escapeHtml(c.title)}</div>
                  <div class="card-body">${escapeHtml(c.body).replace(/\n/g, '<br/>')}</div>
                </div>`
                )
                .join('')}
            </div>`
          : '';

      const comparisonHtml = slide.comparison
        ? `<div class="comparison-grid">
            <div class="comp-box comp-left">
              <div class="comp-title">${escapeHtml(slide.comparison.leftTitle)}</div>
              <div class="comp-body">${escapeHtml(slide.comparison.leftBody).replace(/\n/g, '<br/>')}</div>
            </div>
            <div class="comp-box comp-right">
              <div class="comp-title">${escapeHtml(slide.comparison.rightTitle)}</div>
              <div class="comp-body">${escapeHtml(slide.comparison.rightBody).replace(/\n/g, '<br/>')}</div>
            </div>
          </div>`
        : '';

      const bannerHtml = slide.bottomBanner
        ? `<div class="bottom-banner">${escapeHtml(slide.bottomBanner)}</div>`
        : '';

      const promptHtml =
        slide.promptLines && slide.promptLines.length > 0
          ? `<div class="prompt-box">
              <div class="prompt-label">LATIHAN PESERTA:</div>
              ${slide.promptLines.map((line) => `<div class="prompt-line">• ${escapeHtml(line)}</div>`).join('')}
            </div>`
          : '';

      const imageHtml = slide.imageUrl
        ? `<div class="slide-image-box">
            <img src="${escapeHtml(slide.imageUrl)}" alt="${escapeHtml(slide.imageCaption || slide.title)}" />
            ${slide.imageCaption ? `<div class="slide-image-caption">${escapeHtml(slide.imageCaption)}</div>` : ''}
          </div>`
        : '';

      const isCoverOrClosing = slide.type === 'cover' || slide.type === 'closing';

      return `
        <section class="slide-page ${isCoverOrClosing ? 'slide-dark' : 'slide-light'}">
          <header class="slide-header">
            <div>
              <div class="slide-badge">${escapeHtml(slide.badge)}</div>
              <h2 class="slide-title">${escapeHtml(slide.title)}</h2>
              ${slide.subtitle ? `<p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p>` : ''}
            </div>
            <div class="slide-num">Slide ${idx + 1} / ${slides.length}</div>
          </header>

          <div class="slide-body">
            ${imageHtml}
            ${cardsHtml}
            ${comparisonHtml}
            ${bannerHtml}
            ${promptHtml}
          </div>

          <footer class="slide-footer">
            <span>${escapeHtml(seminarTitle)} · ${escapeHtml(organizerName)}</span>
            <span>Halaman ${idx + 1} dari ${slides.length}</span>
          </footer>
        </section>
      `;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Materi Slide - ${escapeHtml(seminarTitle)}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: ${theme.primaryColor};
      background: #ffffff;
    }
    .slide-page {
      width: 100%;
      min-height: 185mm;
      border: 2px solid ${theme.primaryColor};
      border-radius: 14px;
      padding: 16px 22px;
      margin-bottom: 14px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
      break-after: page;
      background: ${theme.bgColor};
    }
    .slide-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .slide-dark {
      background: ${theme.primaryColor};
      color: #ffffff;
    }
    .slide-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      border-bottom: 2px solid rgba(0,0,0,0.1);
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .slide-dark .slide-header {
      border-bottom-color: rgba(255,255,255,0.2);
    }
    .slide-badge {
      display: inline-block;
      background: ${theme.accentColor};
      color: #ffffff;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 3px 10px;
      border-radius: 999px;
      margin-bottom: 5px;
    }
    .slide-title {
      margin: 0;
      font-size: 22px;
      font-weight: 800;
      line-height: 1.25;
    }
    .slide-subtitle {
      margin: 4px 0 0 0;
      font-size: 13px;
      opacity: 0.85;
    }
    .slide-num {
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
      opacity: 0.75;
    }
    .slide-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 10px;
    }
    .slide-image-box {
      width: 100%;
      max-height: 60mm;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid rgba(0, 0, 0, 0.15);
      margin-bottom: 6px;
      background: #ffffff;
      display: flex;
      flex-direction: column;
    }
    .slide-image-box img {
      width: 100%;
      max-height: 52mm;
      object-fit: cover;
    }
    .slide-image-caption {
      font-size: 8pt;
      padding: 3px 8px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      color: #334155;
      font-weight: 600;
    }
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    .cards-count-3 {
      grid-template-columns: repeat(3, 1fr);
    }
    .card {
      background: #ffffff;
      color: ${theme.primaryColor};
      border: 1.5px solid rgba(31,58,95,0.2);
      border-radius: 10px;
      padding: 10px 12px;
    }
    .card-navy {
      background: ${theme.primaryColor};
      color: #ffffff;
    }
    .card-teal {
      background: #E3F5F2;
      color: ${theme.primaryColor};
      border-color: ${theme.secondaryColor};
    }
    .card-orange {
      background: #FFF7EC;
      color: ${theme.primaryColor};
      border-color: ${theme.accentColor};
    }
    .card-title {
      font-size: 13px;
      font-weight: 800;
      margin-bottom: 4px;
      color: inherit;
    }
    .card-body {
      font-size: 11.5px;
      line-height: 1.42;
      opacity: 0.92;
    }
    .comparison-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .comp-box {
      border-radius: 10px;
      padding: 10px 12px;
      background: #ffffff;
      color: ${theme.primaryColor};
      border: 1.5px solid rgba(31,58,95,0.2);
    }
    .comp-right {
      border: 2px solid ${theme.secondaryColor};
      background: #E3F5F2;
    }
    .comp-title {
      font-size: 12px;
      font-weight: 800;
      margin-bottom: 4px;
    }
    .comp-body {
      font-size: 11.5px;
      line-height: 1.4;
    }
    .bottom-banner {
      background: ${theme.primaryColor};
      color: #ffffff;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      text-align: center;
    }
    .prompt-box {
      background: #ffffff;
      color: ${theme.primaryColor};
      border: 2px solid ${theme.accentColor};
      border-radius: 10px;
      padding: 9px 12px;
      font-size: 11.5px;
    }
    .prompt-label {
      font-weight: 800;
      color: ${theme.accentColor};
      margin-bottom: 3px;
      font-size: 10.5px;
    }
    .slide-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10.5px;
      font-weight: 600;
      padding-top: 8px;
      margin-top: 10px;
      border-top: 1px solid rgba(0,0,0,0.12);
      opacity: 0.8;
    }
    .slide-dark .slide-footer {
      border-top-color: rgba(255,255,255,0.2);
    }
  </style>
</head>
<body>
  ${slidesHtml}
</body>
</html>`;

  triggerIframePrint(html);
}

/**
 * 2. CETAK / SIMPAN BUKU SAKU PDF PESERTA (MATERI + JAWABAN PRIBADI + BIO IG & WA)
 */
export function printParticipantWorkbookHandout(params: {
  seminarTitle: string;
  organizerName: string;
  businessName: string;
  questions: WorksheetQuestion[];
  slides: SlideDefinition[];
  myAnswers: AnswerDoc[];
  finalVpSentence: string;
  generatedInstagramBio: string;
  generatedWhatsappGreeting: string;
  generatedPackagingSticker: string;
  brandTheme?: BrandThemeConfig;
}) {
  const {
    seminarTitle,
    organizerName,
    businessName,
    questions,
    slides,
    myAnswers,
    finalVpSentence,
    generatedInstagramBio,
    generatedWhatsappGreeting,
    generatedPackagingSticker,
    brandTheme,
  } = params;

  const theme = brandTheme || DEFAULT_BRAND_THEME;
  const umkmTitle = businessName.trim() || 'Usaha UMKM Saya';
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const questionsHtml = questions
    .map((q, idx) => {
      const ans = myAnswers.find((a) => a.q === idx);
      return `
        <div class="q-item">
          <div class="q-meta">Bagian ${idx + 1} · ${escapeHtml(q.sectionTitle)}</div>
          <div class="q-title">${escapeHtml(q.questionText)}</div>
          <div class="q-answer">
            ${
              ans
                ? `<strong>Jawaban Saya:</strong> ${escapeHtml(ans.text)}${
                    ans.subText ? `<br/><span class="q-sub">Keterangan: ${escapeHtml(ans.subText)}</span>` : ''
                  }`
                : `<span class="q-empty">Belum diisi saat sesi berlangsung (Contoh: "${escapeHtml(q.exampleAnswer)}")</span>`
            }
          </div>
        </div>
      `;
    })
    .join('');

  const dictionaryHtml = RATIONAL_CONVERSION_DICTIONARY.map(
    (d) => `
      <tr>
        <td class="bad-word">❌ ${escapeHtml(d.vagueWord)}</td>
        <td class="good-word">✅ ${escapeHtml(d.concreteProof)}</td>
      </tr>
    `
  ).join('');

  const slideDigestHtml = slides
    .filter((s) => s.type !== 'cover')
    .map(
      (s, i) => `
      <div class="digest-card">
        <div class="digest-title">${i + 1}. ${escapeHtml(s.title)} <span class="digest-badge">(${escapeHtml(s.badge)})</span></div>
        ${
          s.cards && s.cards.length > 0
            ? `<ul class="digest-list">
                ${s.cards
                  .map(
                    (c) =>
                      `<li><strong>${escapeHtml(c.title)}:</strong> ${escapeHtml(c.body).replace(/\n/g, ' ')}</li>`
                  )
                  .join('')}
              </ul>`
            : ''
        }
        ${s.bottomBanner ? `<div class="digest-banner">💡 ${escapeHtml(s.bottomBanner)}</div>` : ''}
      </div>
    `
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Buku Saku & Lembar Kerja - ${escapeHtml(umkmTitle)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: ${theme.primaryColor};
      line-height: 1.45;
      font-size: 12px;
    }
    .header-banner {
      background: ${theme.primaryColor};
      color: #ffffff;
      padding: 18px 20px;
      border-radius: 12px;
      margin-bottom: 16px;
    }
    .header-tag {
      color: ${theme.accentColor};
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .header-title {
      margin: 4px 0;
      font-size: 20px;
      font-weight: 800;
    }
    .header-meta {
      font-size: 11px;
      opacity: 0.85;
    }
    .vp-highlight {
      background: ${theme.bgColor};
      border: 2px solid ${theme.accentColor};
      border-radius: 12px;
      padding: 14px 16px;
      margin-bottom: 16px;
    }
    .vp-label {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      color: ${theme.accentColor};
      margin-bottom: 4px;
    }
    .vp-sentence {
      font-size: 15px;
      font-weight: 800;
      margin: 0;
    }
    .kit-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 16px;
    }
    .kit-box {
      border: 1.5px solid rgba(31,58,95,0.2);
      border-radius: 10px;
      padding: 10px 12px;
      background: #ffffff;
    }
    .kit-box-title {
      font-size: 11px;
      font-weight: 800;
      color: ${theme.secondaryColor};
      margin-bottom: 6px;
      text-transform: uppercase;
    }
    .kit-pre {
      white-space: pre-wrap;
      font-family: inherit;
      font-size: 11px;
      margin: 0;
      background: ${theme.bgColor};
      padding: 8px;
      border-radius: 6px;
    }
    .section-heading {
      font-size: 14px;
      font-weight: 800;
      border-bottom: 2px solid ${theme.primaryColor};
      padding-bottom: 4px;
      margin: 18px 0 10px 0;
    }
    .q-item {
      border: 1px solid rgba(31,58,95,0.2);
      border-radius: 8px;
      padding: 9px 12px;
      margin-bottom: 8px;
      page-break-inside: avoid;
    }
    .q-meta {
      font-size: 10px;
      font-weight: 700;
      color: ${theme.accentColor};
      text-transform: uppercase;
    }
    .q-title {
      font-size: 12px;
      font-weight: 700;
      margin: 2px 0 5px 0;
    }
    .q-answer {
      background: #E3F5F2;
      padding: 7px 10px;
      border-radius: 6px;
      font-size: 11.5px;
    }
    .q-empty {
      color: #666;
      font-style: italic;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 11px;
    }
    th, td {
      border: 1px solid rgba(31,58,95,0.2);
      padding: 6px 8px;
      text-align: left;
    }
    th {
      background: ${theme.primaryColor};
      color: #ffffff;
    }
    .bad-word {
      color: #b91c1c;
      font-weight: 600;
    }
    .good-word {
      color: #0f766e;
      font-weight: 700;
    }
    .digest-card {
      border: 1px solid rgba(31,58,95,0.18);
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 8px;
      page-break-inside: avoid;
    }
    .digest-title {
      font-weight: 800;
      font-size: 12px;
      margin-bottom: 4px;
    }
    .digest-badge {
      font-weight: 600;
      font-size: 10.5px;
      color: ${theme.accentColor};
    }
    .digest-list {
      margin: 4px 0;
      padding-left: 16px;
      font-size: 11px;
    }
    .digest-banner {
      margin-top: 4px;
      font-size: 11px;
      font-weight: 700;
      color: ${theme.secondaryColor};
    }
  </style>
</head>
<body>
  <div class="header-banner">
    <div class="header-tag">${escapeHtml(organizerName)} · BUKU SAKU & RENCANA AKSI PESERTA</div>
    <h1 class="header-title">${escapeHtml(seminarTitle)}</h1>
    <div class="header-meta">Nama Usaha: <strong>${escapeHtml(umkmTitle)}</strong> · Tanggal: ${escapeHtml(dateStr)}</div>
  </div>

  <div class="vp-highlight">
    <div class="vp-label">Kalimat Value Proposition Utama (${escapeHtml(umkmTitle)})</div>
    <p class="vp-sentence">"${escapeHtml(finalVpSentence)}"</p>
  </div>

  <div class="kit-grid">
    <div class="kit-box">
      <div class="kit-box-title">1. Bio Instagram / Shopee / TikTok</div>
      <pre class="kit-pre">${escapeHtml(generatedInstagramBio)}</pre>
    </div>
    <div class="kit-box">
      <div class="kit-box-title">2. Salam Otomatis WhatsApp Business</div>
      <pre class="kit-pre">${escapeHtml(generatedWhatsappGreeting)}</pre>
    </div>
  </div>

  <div class="kit-box" style="margin-bottom: 14px;">
    <div class="kit-box-title">3. Tagline Stiker Kemasan / Banner Lapak</div>
    <pre class="kit-pre">${escapeHtml(generatedPackagingSticker)}</pre>
  </div>

  <h2 class="section-heading">A. Rekap Jawaban Lembar Kerja Saya (Bagian 1–${questions.length})</h2>
  ${questionsHtml}

  <h2 class="section-heading">B. Kamus Konversi: Ubah Kata Sifat Umum Jadi Bukti Angka</h2>
  <table>
    <thead>
      <tr>
        <th>Hindari Klaim Umum Ini</th>
        <th>Ganti Dengan Bukti Spesifik / Angka Ini</th>
      </tr>
    </thead>
    <tbody>
      ${dictionaryHtml}
    </tbody>
  </table>

  <h2 class="section-heading">C. Intisari Materi Seminar (${slides.length} Slide)</h2>
  ${slideDigestHtml}
</body>
</html>`;

  triggerIframePrint(html);
}

/**
 * 3. UNDUH FILE TEKS (.TXT) LENGKAP (MATERI + JAWABAN PRIBADI)
 */
export function downloadParticipantTxtHandout(params: {
  seminarTitle: string;
  organizerName: string;
  businessName: string;
  questions: WorksheetQuestion[];
  slides: SlideDefinition[];
  myAnswers: AnswerDoc[];
  finalVpSentence: string;
  generatedInstagramBio: string;
  generatedWhatsappGreeting: string;
  generatedPackagingSticker: string;
}) {
  const {
    seminarTitle,
    organizerName,
    businessName,
    questions,
    slides,
    myAnswers,
    finalVpSentence,
    generatedInstagramBio,
    generatedWhatsappGreeting,
    generatedPackagingSticker,
  } = params;

  const umkmTitle = businessName.trim() || 'Usaha UMKM Saya';
  const lines: string[] = [
    '====================================================================',
    `BUKU SAKU MATERI & LEMBAR KERJA PESERTA`,
    `${seminarTitle.toUpperCase()}`,
    `Penyelenggara: ${organizerName}`,
    `Nama Usaha: ${umkmTitle}`,
    '====================================================================',
    '',
    '1. KALIMAT VALUE PROPOSITION UTAMA:',
    `"${finalVpSentence}"`,
    '',
    '--------------------------------------------------------------------',
    '2. FORMAT BIO INSTAGRAM / PROFIL TOKO:',
    generatedInstagramBio,
    '',
    '--------------------------------------------------------------------',
    '3. SALAM OTOMATIS WHATSAPP BUSINESS:',
    generatedWhatsappGreeting,
    '',
    '--------------------------------------------------------------------',
    '4. TAGLINE STIKER KEMASAN / BANNER LAPAK:',
    generatedPackagingSticker,
    '',
    '====================================================================',
    `REKAP JAWABAN LEMBAR KERJA SAYA (BAGIAN 1 - ${questions.length})`,
    '====================================================================',
  ];

  questions.forEach((q, idx) => {
    const myAns = myAnswers.find((a) => a.q === idx);
    lines.push(`\n[Bagian ${idx + 1}] ${q.sectionTitle}`);
    lines.push(`Pertanyaan : ${q.questionText}`);
    lines.push(`Jawaban    : ${myAns ? myAns.text : `(Belum diisi - Contoh: ${q.exampleAnswer})`}`);
    if (myAns?.subText) {
      lines.push(`Catatan    : ${myAns.subText}`);
    }
  });

  lines.push(
    '',
    '====================================================================',
    'KAMUS KONVERSI KATA SIFAT -> BUKTI ANGKA SPESIFIK',
    '===================================================================='
  );
  RATIONAL_CONVERSION_DICTIONARY.forEach((d) => {
    lines.push(`• Jangan tulis "${d.vagueWord}" -> Ganti dengan: "${d.concreteProof}"`);
  });

  lines.push(
    '',
    '====================================================================',
    '3 ALAT UJI KALIMAT VALUE PROPOSITION',
    '===================================================================='
  );
  VP_THREE_TESTS.forEach((t, i) => {
    lines.push(`${i + 1}. ${t.title}: ${t.question} (${t.passCriteria})`);
  });

  lines.push(
    '',
    '====================================================================',
    `RINGKASAN MATERI SLIDE SEMINAR (${slides.length} HALAMAN)`,
    '===================================================================='
  );
  slides.forEach((s, idx) => {
    lines.push(`\nSLIDE #${idx + 1}: ${s.title} [${s.badge}]`);
    if (s.subtitle) lines.push(`Subjudul: ${s.subtitle}`);
    (s.cards || []).forEach((c) => {
      lines.push(`  - ${c.title}: ${c.body.replace(/\n/g, ' ')}`);
    });
    if (s.bottomBanner) {
      lines.push(`  * Kesimpulan: ${s.bottomBanner}`);
    }
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = umkmTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'peserta';
  link.href = url;
  link.setAttribute('download', `buku-saku-materi-dan-jawaban-${safeName}.txt`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 4. BUAT TAUTAN KIRIM KE WHATSAPP PRIBADI / GRUP UMKM
 */
export function buildWhatsAppShareUrl(params: {
  seminarTitle: string;
  businessName: string;
  questions: WorksheetQuestion[];
  myAnswers: AnswerDoc[];
  finalVpSentence: string;
  generatedInstagramBio: string;
  generatedWhatsappGreeting: string;
}): string {
  const {
    seminarTitle,
    businessName,
    questions,
    myAnswers,
    finalVpSentence,
    generatedInstagramBio,
    generatedWhatsappGreeting,
  } = params;

  const umkmTitle = businessName.trim() || 'Usaha UMKM Saya';
  const answerLines = questions
    .map((q, idx) => {
      const a = myAnswers.find((ans) => ans.q === idx);
      return `${idx + 1}. *${q.sectionTitle}:* ${a ? a.text : '-'}`;
    })
    .join('\n');

  const message = [
    `📌 *RINGKASAN MATERI & RENCANA AKSI UMKM*`,
    `*${seminarTitle}*`,
    `Usaha: *${umkmTitle}*`,
    ``,
    `🎯 *Kalimat Value Proposition Utama:*`,
    `"${finalVpSentence}"`,
    ``,
    `📱 *Format Bio Instagram / Toko:*`,
    generatedInstagramBio,
    ``,
    `💬 *Salam Otomatis WhatsApp Business:*`,
    generatedWhatsappGreeting,
    ``,
    `📝 *Rekap Jawaban Lembar Kerja (1-${questions.length}):*`,
    answerLines,
    ``,
    `💡 *Rumus Inti Value Proposition:*`,
    `_[Nama Produk] untuk [Target Pembeli Spesifik] yang ingin [Perasaan Emosional], karena [Bukti Angka Rasional]._`,
  ].join('\n');

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/**
 * 5. CETAK / SIMPAN BUKU PANDUAN TEKNIS & MANUAL PENGGUNAAN LENGKAP (A4 PORTRAIT)
 */
export function printSystemDocumentationGuide(params?: {
  seminarTitle?: string;
  organizerName?: string;
  brandTheme?: BrandThemeConfig;
}) {
  const title = params?.seminarTitle || 'PartnerUp Live — Seminar Interaktif Suite';
  const organizer = params?.organizerName || 'PartnerUp | Obeecreatives';
  const theme = params?.brandTheme || DEFAULT_BRAND_THEME;

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Buku Panduan Teknis & Operasional — PartnerUp Live</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 14mm 16mm 14mm;
      @bottom-right {
        content: counter(page);
      }
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      color: #1F3A5F;
      background: #FFFFFF;
      font-size: 10pt;
      line-height: 1.55;
    }
    .page-break {
      page-break-before: always;
      break-before: page;
    }
    .avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Cover Styling */
    .cover {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 255mm;
      padding: 24mm 16mm;
      background: linear-gradient(145deg, #1F3A5F 0%, #152740 100%);
      color: #FFFFFF;
      border-radius: 12px;
      page-break-after: always;
    }
    .cover-badge {
      display: inline-block;
      align-self: flex-start;
      background: #F28C28;
      color: #FFFFFF;
      font-weight: 800;
      font-size: 8pt;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      padding: 6px 14px;
      border-radius: 6px;
    }
    .cover-title {
      font-size: 28pt;
      font-weight: 900;
      line-height: 1.2;
      margin: 16px 0 10px 0;
      letter-spacing: -0.5px;
      color: #FFFFFF;
    }
    .cover-subtitle {
      font-size: 13pt;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.85);
      line-height: 1.5;
      max-width: 90%;
    }
    .cover-meta {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      padding: 14px 18px;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      font-size: 8.5pt;
    }
    .cover-meta strong {
      display: block;
      color: #F28C28;
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 3px;
    }

    /* Section Headers */
    h1.chapter-title {
      font-size: 17pt;
      font-weight: 900;
      color: #1F3A5F;
      border-bottom: 2.5px solid #F28C28;
      padding-bottom: 6px;
      margin: 18px 0 12px 0;
      letter-spacing: -0.3px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    h2.sub-title {
      font-size: 12pt;
      font-weight: 800;
      color: #1F3A5F;
      margin: 14px 0 6px 0;
      padding-left: 8px;
      border-left: 3.5px solid #1F3A5F;
    }
    h3.sub-sub-title {
      font-size: 10pt;
      font-weight: 700;
      color: #1F3A5F;
      margin: 10px 0 4px 0;
    }

    /* Paragraphs and Lists */
    p {
      margin: 0 0 8px 0;
      text-align: justify;
    }
    ul, ol {
      margin: 0 0 10px 0;
      padding-left: 20px;
    }
    li {
      margin-bottom: 4px;
    }

    /* Cards & Boxes */
    .callout {
      background: #FFF7EC;
      border-left: 4px solid #F28C28;
      border-radius: 0 8px 8px 0;
      padding: 10px 14px;
      margin: 10px 0;
      font-size: 9pt;
    }
    .callout-title {
      font-weight: 800;
      color: #F28C28;
      margin-bottom: 4px;
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .callout-blue {
      background: #F0F5FA;
      border-left: 4px solid #1F3A5F;
    }
    .callout-blue .callout-title {
      color: #1F3A5F;
    }

    /* Tables */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0 14px 0;
      font-size: 8.5pt;
    }
    table.data-table th {
      background: #1F3A5F;
      color: #FFFFFF;
      padding: 7px 10px;
      text-align: left;
      font-weight: 700;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    table.data-table td {
      padding: 6px 10px;
      border-bottom: 1px solid #E2E8F0;
      vertical-align: top;
    }
    table.data-table tr:nth-child(even) td {
      background: #F8FAFC;
    }

    /* Step Grid */
    .step-card {
      border: 1px solid #CBD5E1;
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 8px;
      background: #FFFFFF;
    }
    .step-num {
      display: inline-block;
      background: #1F3A5F;
      color: #FFFFFF;
      font-weight: 800;
      font-size: 8pt;
      padding: 2px 8px;
      border-radius: 4px;
      margin-right: 6px;
    }
    .step-header {
      font-weight: 800;
      color: #1F3A5F;
      font-size: 9.5pt;
      margin-bottom: 4px;
    }

    /* Footer per page */
    .doc-footer {
      border-top: 1px solid #E2E8F0;
      margin-top: 18px;
      padding-top: 6px;
      display: flex;
      justify-content: space-between;
      font-size: 7.5pt;
      color: #64748B;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover">
    <div>
      <span class="cover-badge">Dokumentasi Resmi & Manual Pengoperasian</span>
      <div class="cover-title">PANDUAN SISTEM<br/>PARTNERUP LIVE</div>
      <div class="cover-subtitle">
        Panduan Menyeluruh: Latar Belakang, Arsitektur Sistem, Glosarium Teknis UI & Engine, 
        Tata Cara Pengoperasian 4-Titik, hingga Prosedur Duplikasi & Migrasi Kode.
      </div>
    </div>

    <div>
      <div class="cover-meta">
        <div>
          <strong>Aplikasi Web</strong>
          ${escapeHtml(title)}
        </div>
        <div>
          <strong>Lembaga / Penyelenggara</strong>
          ${escapeHtml(organizer)}
        </div>
        <div>
          <strong>Fondasi Teknologi</strong>
          React 19 + TypeScript + Google Cloud Firestore
        </div>
        <div>
          <strong>Status Distribusi</strong>
          Siap Produksi (Enterprise Live Suite)
        </div>
      </div>
      <p style="margin-top: 14px; font-size: 7.5pt; color: rgba(255,255,255,0.6); text-align: left;">
        Hak Cipta & Dokumen Operasional &copy; ${new Date().getFullYear()} PartnerUp | Obeecreatives. Dibuat untuk pemateri, fasilitator, operator teknis, dan pengembang.
      </p>
    </div>
  </div>

  <!-- DAFTAR ISI -->
  <div class="avoid-break" style="padding-top: 6px;">
    <h1 class="chapter-title">DAFTAR ISI PANDUAN SISTEM</h1>
    <table class="data-table" style="font-size: 9pt;">
      <thead>
        <tr>
          <th style="width: 20%;">Bab</th>
          <th style="width: 65%;">Topik Pembahasan</th>
          <th style="width: 15%;">Tipe Panduan</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>BAB 1</strong></td>
          <td><strong>Latar Belakang & Alasan Pengembangan:</strong> Permasalahan seminar konvensional, filosofi interaksi 4-titik, active recall, dan tujuan strategis.</td>
          <td>Konseptual</td>
        </tr>
        <tr>
          <td><strong>BAB 2</strong></td>
          <td><strong>Struktur Web Apps & Arsitektur Sistem:</strong> Diagram topologi real-time, 6 view utama, Google Cloud Firestore, dan model keamanan rules.</td>
          <td>Arsitektur</td>
        </tr>
        <tr>
          <td><strong>BAB 3</strong></td>
          <td><strong>Glosarium Istilah Teknis UI & Engine:</strong> Dynamic Kanban Card, Locked Footer, Cue Cards, Reactive onSnapshot, State Machine, Print Engine.</td>
          <td>Teknis</td>
        </tr>
        <tr>
          <td><strong>BAB 4</strong></td>
          <td><strong>Panduan Cara Pakai Lengkap (Role-by-Role):</strong> Pemateri, Operator Proyektor, Tim Moderasi, Peserta, hingga Kustomisasi Tema Brand.</td>
          <td>Operasional</td>
        </tr>
        <tr>
          <td><strong>BAB 5</strong></td>
          <td><strong>Panduan Duplikasi & Replikasi Web Apps:</strong> Duplikasi di akun yang sama, migrasi ke akun Google lain via GitHub, setup Firebase, dan multi-ruangan.</td>
          <td>Implementasi</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- BAB 1 -->
  <div class="avoid-break">
    <h1 class="chapter-title">BAB 1 — LATAR BELAKANG & ALASAN PENGEMBANGAN</h1>
    
    <h2 class="sub-title">1.1 Permasalahan Fundamental Seminar Konvensional</h2>
    <p>
      Seminar dan pelatihan bisnis pada umumnya menghadapi dilema <em>"Passive Audience Trap"</em>. Pemateri berbicara satu arah di atas panggung menggunakan slide presentasi statis (PowerPoint/PDF), sementara peserta di ruangan hanya duduk mendengarkan secara pasif. Berdasarkan penelitian retensi kognitif, rata-rata audiens melupakan lebih dari 75% materi dalam waktu 24 jam pertama jika tidak ada keterlibatan aktif langsung (active application).
    </p>
    <p>
      Tiga kendala utama yang selalu terjadi di lapangan adalah:
    </p>
    <ul>
      <li><strong>Kendala Lembar Kerja Fisik (Kertas Tercecer):</strong> Formulir cetak sulit dikurasi secara instan oleh pemateri saat seminar sedang berlangsung, tulisan tangan peserta seringkali tidak terbaca, dan hasil kerja peserta mudah hilang setelah acara selesai tanpa pernah dipraktikkan.</li>
      <li><strong>Presenter Buta Respon Panggung (*Stage Blindness*):</strong> Pemateri tidak memiliki indikator data langsung apakah materi dipahami atau audiens bingung. Seringkali sesi tanya jawab didominasi oleh 1-2 orang yang vokal sementara mayoritas peserta malu bertanya.</li>
      <li><strong>Friksi Teknologi (*App Download Friction*):</strong> Penggunaan platform interaktif eksternal seringkali mewajibkan audiens mengunduh aplikasi berukuran puluhan megabyte, mendaftar akun email/OTP yang rumit, atau memasukkan kode PIN ruang yang sering salah ketik, menghabiskan waktu seminar 10-15 menit berharga di awal acara.</li>
    </ul>

    <h2 class="sub-title">1.2 Solusi PartnerUp Live: Ekosistem 4-Titik Tanpa Instalasi</h2>
    <p>
      PartnerUp Live dikembangkan sebagai <strong>aplikasi web interaktif terpadu (Progressive Web Application)</strong> yang menghubungkan empat peran penting di ruangan secara nirkabel dan sinkron:
    </p>
    <div class="step-card">
      <div class="step-header"><span class="step-num">1</span> Layar Proyektor Panggung (Stage Projector Canvas)</div>
      <p style="margin: 0; font-size: 8.5pt;">Menampilkan slide presentasi 16:9, visualisasi kartu kanban jawaban peserta terbaik, grafik polling langsung, dan sorotan tanya jawab tanpa kabel HDMI panjang berantakan.</p>
    </div>
    <div class="step-card">
      <div class="step-header"><span class="step-num">2</span> Remote Smartphone Pemateri (Speaker Stage Clicker & Teleprompter)</div>
      <p style="margin: 0; font-size: 8.5pt;">Memberikan kendali penuh di tangan pemateri saat bergerak di panggung: pengatur slide, pengingat durasi waktu (timer), contekan analogi panggung rahasia (cue cards), dan saklar pemanggil interaksi.</p>
    </div>
    <div class="step-card">
      <div class="step-header"><span class="step-num">3</span> Smartphone Peserta (Participant Interactive Workspace)</div>
      <p style="margin: 0; font-size: 8.5pt;">Peserta cukup memindai satu kode QR. Langsung terbuka formulir lembar kerja terpandu 6 tahap, pemungutan suara polling, pengajuan pertanyaan berbobot, modul baca slide mandiri, serta ekspor dokumen PDF/Buku Saku pribadi.</p>
    </div>
    <div class="step-card">
      <div class="step-header"><span class="step-num">4</span> Meja Moderasi Co-Host (Live Curation Desk)</div>
      <p style="margin: 0; font-size: 8.5pt;">Tim panitia / co-host menyaring ratusan jawaban dan pertanyaan peserta, memberikan tanda bintang (*star*) pada jawaban terbaik sebelum diproyeksikan ke layar besar panggung.</p>
    </div>
  </div>

  <!-- BAB 2 -->
  <div class="page-break">
    <h1 class="chapter-title">BAB 2 — STRUKTUR WEB APPS & ARSITEKTUR SISTEM</h1>

    <h2 class="sub-title">2.1 Diagram Alur Komunikasi Real-Time Cloud</h2>
    <p>
      Sistem menggunakan model <strong>Event-Driven Distributed Synchronization</strong> berbasis Google Cloud Firestore. Setiap perubahan status (klik ganti slide, kirim jawaban, voting, atau ganti mode) dipancarkan seketika (&lt;100 milidetik) ke seluruh perangkat yang terhubung.
    </p>

    <div class="callout callout-blue">
      <div class="callout-title">TOPOLOGI ARSITEKTUR PERANGKAT LUNAK</div>
      <p style="margin: 0; font-family: monospace; font-size: 8pt; line-height: 1.4;">
        [REMOTE HP PEMATERI] ──┐<br/>
        [LAYAR PROYEKTOR]   ──┼──&gt; [FIREBASE CLOUD FIRESTORE] ──&gt; [DISTRIBUSI REAL-TIME via onSnapshot]<br/>
        [HP RATUSAN PESERTA]──┤        (session_state/active)           │<br/>
        [TIM CO-HOST MODERASI]─┘        (custom_content/active)          └──&gt; Render Instan di Seluruh Layar
      </p>
    </div>

    <h2 class="sub-title">2.2 Fondasi Teknologi (Technology Stack)</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th>Komponen</th>
          <th>Teknologi</th>
          <th>Peran & Keunggulan</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Frontend Core</strong></td>
          <td>React 19, TypeScript, Vite</td>
          <td>Komputasi cepat, tipe data aman (*strict type*), rendering ringan tanpa beban lag.</td>
        </tr>
        <tr>
          <td><strong>Antarmuka & Desain</strong></td>
          <td>Tailwind CSS, Lucide Icons</td>
          <td>Desain responsif mulai dari layar proyektor bioskop 4K hingga ponsel layar kecil 360px.</td>
        </tr>
        <tr>
          <td><strong>Basis Data & Sinkronisasi</strong></td>
          <td>Google Cloud Firestore</td>
          <td>Menyediakan WebSockets native (*onSnapshot listener*) untuk pembaruan instan tanpa reload browser.</td>
        </tr>
        <tr>
          <td><strong>Keamanan Data</strong></td>
          <td>Firestore Security Rules</td>
          <td>Memvalidasi skema data, mencegah injeksi teks jahat, serta membatasi hak akses antar role.</td>
        </tr>
        <tr>
          <td><strong>Mesin Cetak & PDF</strong></td>
          <td>Isolated Iframe Print Engine</td>
          <td>Mencetak dokumen A4 landscape & portrait presisi tinggi tanpa merusak DOM aplikasi.</td>
        </tr>
      </tbody>
    </table>

    <h2 class="sub-title">2.3 Koleksi Data Utama di Firestore</h2>
    <ul>
      <li><code>session_state/active</code>: Mengatur status utama (slide aktif, mode interaksi, laci drawer proyektor yang terbuka, dan saklar izin baca slide mandiri).</li>
      <li><code>custom_content/active</code>: Menyimpan judul seminar, identitas lembaga, daftar soal, susunan slide, opsi polling, dan tema warna organisasi (*Brand Theme*).</li>
      <li><code>answers/</code>: Menyimpan kiriman jawaban lembar kerja dari masing-masing peserta lengkap dengan nama usaha, status moderasi, dan tanda bintang pemateri.</li>
      <li><code>poll_votes/</code>: Menyimpan hasil pemungutan suara peserta secara anonim dan teragregasi.</li>
      <li><code>qna_questions/</code>: Menyimpan pertanyaan peserta dan akumulasi dukungan (*upvotes*).</li>
    </ul>

    <h2 class="sub-title">2.4 Pembagian 6 Antarmuka Pengguna (View Role)</h2>
    <p>
      Aplikasi terbagi menjadi 6 tampilan spesifik yang dapat dibuka melalui bilah navigasi atas:
    </p>
    <ol>
      <li><strong>Layar Proyektor (<code>projector</code>):</strong> Menampilkan kanban board panggung berukuran besar untuk sesi diskusi interaktif.</li>
      <li><strong>Materi Slide (<code>slides</code>):</strong> Menampilkan slide deck presentasi 16:9 lengkap dengan laci overlay (Jawaban, Polling, Q&A, QR).</li>
      <li><strong>Remote HP (<code>remote</code>):</strong> Antarmuka khusus di smartphone pemateri untuk mengontrol alur seminar dari atas panggung.</li>
      <li><strong>HP Peserta (<code>participant</code>):</strong> Lembar kerja interaktif yang diakses peserta melalui pemindaian QR code.</li>
      <li><strong>Moderasi (<code>moderation</code>):</strong> Dasbor kurasi jawaban dan pertanyaan bagi co-host atau tim panitia pendamping.</li>
      <li><strong>Editor Materi (<code>editor</code>):</strong> Pusat pengaturan no-code untuk mengubah judul, soal, slide, polling, dan warna tema brand.</li>
    </ol>
  </div>

  <!-- BAB 3 -->
  <div class="page-break">
    <h1 class="chapter-title">BAB 3 — GLOSARIUM LENGKAP ISTILAH TEKNIS (UI & ENGINE)</h1>

    <h2 class="sub-title">3.1 Istilah Teknis pada Antarmuka (User Interface)</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 30%;">Istilah Teknis</th>
          <th style="width: 70%;">Definisi & Penerapan Fungsional</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Dynamic Kanban Card Sizing</strong></td>
          <td>
            Algoritma tata letak adaptif pada kartu kanban di slide. Menghitung jumlah kartu secara dinamis: jika hanya ada 1 kartu dijadikan <em>Hero Banner</em> besar; jika 2 kartu dibagi 2 kolom seimbang; jika 3-4 kartu dibuat grid proporsional; dan jika 5-6 kartu dibuat grid kompak dengan ukuran huruf terukur. Menjamin keterbacaan tinggi bagi audiens lanjut usia maupun yang duduk di baris belakang.
          </td>
        </tr>
        <tr>
          <td><strong>Sticky Locked Viewport Footer</strong></td>
          <td>
            Arsitektur CSS <code>h-screen overflow-hidden</code> yang mengunci bilah navigasi bawah dan pelacak progres di dasar layar. Footer tidak akan pernah terdorong ke bawah atau hilang meski isi slide memiliki kartu yang banyak.
          </td>
        </tr>
        <tr>
          <td><strong>Presenter Stage Cue Cards (Contekan Panggung)</strong></td>
          <td>
            Panel rahasia pada Remote HP pemateri yang memuat poin bicara kunci (*Key Talking Points*), studi kasus analogi dunia nyata, pertanyaan pemicu audiens, dan batas durasi waktu aman per slide.
          </td>
        </tr>
        <tr>
          <td><strong>Slide Drawer Overlays</strong></td>
          <td>
            Laci geser semi-transparan yang dapat dimunculkan pemateri di atas layar slide proyektor tanpa keluar dari slide (Drawer: Jawaban Peserta, Polling Live, Tanya Jawab Q&A, dan QR Code Pendaftaran).
          </td>
        </tr>
        <tr>
          <td><strong>Zero-Certainty Proof Matrix</strong></td>
          <td>
            Metodologi kurikulum PartnerUp yang mengajarkan UMKM mengganti klaim abstrak (misal: "produk berkualitas") dengan 4 pilar bukti rasional tak terbantahkan (Bukti Angka/Waktu, Sertifikasi Resmi, Garansi Ganti Rugi, dan Testimoni Nyata).
          </td>
        </tr>
        <tr>
          <td><strong>IG Bio Hook Synthesizer</strong></td>
          <td>
            Mesin perakit profil Instagram bisnis 4 baris otomatis di HP peserta yang menyusun kalimat pancingan (Hook), solusi masalah, bukti rasional, dan ajakan bertindak (CTA) berdasarkan jawaban lembar kerja.
          </td>
        </tr>
        <tr>
          <td><strong>Role-Based Stealth Auth & Triple-Tap Trigger</strong></td>
          <td>
            Arsitektur antarmuka tanpa tombol mencolok. Tombol panel presenter disembunyikan sepenuhnya dari HP peserta agar tidak timbul rasa penasaran. Pemateri mengaktifkan panel via gestur ketuk 3x di header atau ikon gembok samar di footer, dilindungi verifikasi PIN keamanan modal.
          </td>
        </tr>
        <tr>
          <td><strong>Floating Presenter Switcher Pill</strong></td>
          <td>
            Tombol navigasi mengambang khusus yang hanya muncul di layar pemateri setelah PIN terbuka. Memungkinkan pemateri beralih instan antara mode simulasi HP peserta dan layar presenter tanpa harus mengetik ulang PIN.
          </td>
        </tr>
      </tbody>
    </table>

    <h2 class="sub-title">3.2 Istilah Teknis pada Mesin & Sistem (Engine)</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 30%;">Istilah Teknis</th>
          <th style="width: 70%;">Definisi & Mekanisme Kerja</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Reactive Cloud Firestore onSnapshot</strong></td>
          <td>
            Pola pendengar data reaktif dua arah. Komponen web mendengarkan dokumen cloud secara terus-menerus. Begitu terjadi mutasi data di satu titik, Firebase segera mengirimkan sinyal delta pembaruan ke seluruh subscriber tanpa perlu me-refresh halaman.
          </td>
        </tr>
        <tr>
          <td><strong>Distributed Clicker State Machine</strong></td>
          <td>
            Mesin status terdistribusi yang menyelaraskan posisi slide (<code>activeSlide</code>), mode tampilan (<code>activeMode</code>), dan laci terbuka (<code>activeSlideDrawer</code>) antara remote smartphone pemateri dan layar proyektor panggung.
          </td>
        </tr>
        <tr>
          <td><strong>PIN Session Guard & Storage Persistence</strong></td>
          <td>
            Sistem otentikasi lokal terisolasi yang mengamankan status sesi pemateri selama tab browser aktif (<code>sessionStorage</code>), serta menyimpan PIN kustom pengguna secara persisten di <code>localStorage</code> dengan proteksi fallback standar (default: <code>2026</code>).
          </td>
        </tr>
        <tr>
          <td><strong>Brand Theme Sanitizer & Dynamic CSS Variables</strong></td>
          <td>
            Mesin tema cerdas yang memvalidasi format warna heksadesimal sebelum diinjeksikan ke root DOM. Menjaga warna default PartnerUp | Obeecreatives tetap utuh jika terjadi masukan warna tidak valid, sekaligus menyinkronkan tema ke seluruh komponen cetak dokumen PDF.
          </td>
        </tr>
        <tr>
          <td><strong>Content Hydration & Fallback Schema</strong></td>
          <td>
            Logika ketahanan aplikasi yang membaca konfigurasi kustom di Firestore (<code>custom_content/active</code>), dan jika ada parameter yang kosong atau rusak, sistem secara mulus menggunakan data cadangan default bawaan (*default fallback*) tanpa mengalami crash.
          </td>
        </tr>
        <tr>
          <td><strong>Isolated Iframe Print Engine</strong></td>
          <td>
            Mesin pencetak dokumen PDF berbasis iframe tersembunyi yang menyusun kode HTML & CSS cetak secara steril tanpa merender tombol navigasi web, menghasilkan berkas PDF yang sangat rapi untuk dicetak atau disimpan.
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- BAB 4 -->
  <div class="page-break">
    <h1 class="chapter-title">BAB 4 — PANDUAN CARA PAKAI LANGKAH DEMI LANGKAH</h1>

    <h2 class="sub-title">4.1 Alur Pengoperasian Pemateri di Panggung (Speaker Guide)</h2>
    <div class="step-card">
      <div class="step-header"><span class="step-num">1</span> Hubungkan Laptop ke Proyektor</div>
      <p style="margin: 0; font-size: 8.5pt;">Buka web app di laptop panggung, pilih menu <strong>Materi Slide</strong>, lalu tekan tombol Fullscreen (F11 atau tombol layar penuh) agar slide tampil maksimal di proyektor.</p>
    </div>
    <div class="step-card">
      <div class="step-header"><span class="step-num">2</span> Buka Remote di Smartphone Anda</div>
      <p style="margin: 0; font-size: 8.5pt;">Di smartphone pemateri, buka URL aplikasi dan pilih menu <strong>Remote HP</strong>. Anda kini memegang kendali panggung: tombol panah untuk maju/mundur slide, countdown timer, dan contekan panggung di bawah tombol.</p>
    </div>
    <div class="step-card">
      <div class="step-header"><span class="step-num">3</span> Memanggil Interaksi di Panggung (Eksklusif Pemateri)</div>
      <p style="margin: 0; font-size: 8.5pt;">Saat masuk ke topik praktik, tekan tombol <strong>"Tampilkan Jawaban"</strong> atau <strong>"Polling"</strong> pada Remote HP / Slide Deck. Fitur ini dirancang khusus untuk pemateri (tidak muncul di HP peserta) agar hanya pemateri yang dapat mengatur kemunculan jawaban ke layar panggung. Pengaman Remote HP selalu dapat dibuka menggunakan Master PIN <code>2026</code>.</p>
    </div>
    <div class="step-card">
      <div class="step-header"><span class="step-num">4</span> Mengaktifkan Pembagian Slide ke HP Peserta</div>
      <p style="margin: 0; font-size: 8.5pt;">Jika ingin membiarkan peserta membaca materi secara mandiri di ponsel mereka, cukup geser saklar <strong>"Akses Slide HP Peserta: AKTIF"</strong> di Remote HP Anda.</p>
    </div>

    <h2 class="sub-title">4.2 Alur Pengoperasian Peserta Seminar (Participant Workflow)</h2>
    <div class="step-card">
      <div class="step-header"><span class="step-num">1</span> Scan QR Code Pendaftaran</div>
      <p style="margin: 0; font-size: 8.5pt;">Peserta memindai QR code di layar proyektor atau membuka link seminar. Layar ponsel langsung masuk ke <strong>HP Peserta</strong> tanpa perlu instalasi aplikasi apa pun.</p>
    </div>
    <div class="step-card">
      <div class="step-header"><span class="step-num">2</span> Mengisi Lembar Kerja Interaktif (6 Bagian)</div>
      <p style="margin: 0; font-size: 8.5pt;">Peserta mengetik nama usaha dan mengisi pertanyaan sesuai instruksi pemateri. Setiap jawaban langsung tersimpan di cloud secara aman.</p>
    </div>
    <div class="step-card">
      <div class="step-header"><span class="step-num">3</span> Menyimpan & Mengunduh Dokumen Hasil Praktik (PDF / WA)</div>
      <p style="margin: 0; font-size: 8.5pt;">Setelah selesai, peserta masuk ke tab <strong>"Bio IG & Materi"</strong>. Mereka dapat mengeklik <strong>"Simpan PDF Buku Saku & Jawaban"</strong> untuk mendapatkan dokumen A4 lengkap atau <strong>"Kirim Ringkasan ke WhatsApp"</strong>.</p>
    </div>

    <h2 class="sub-title">4.3 Alur Pengoperasian Tim Moderasi (Co-Host Desk)</h2>
    <p>
      Tim pendamping membuka menu <strong>Moderasi</strong> di laptop mereka. Setiap jawaban yang masuk dari peserta dapat ditinjau. Jika jawaban berkualitas tinggi dan menginspirasi, klik ikon <strong>Bintang (*Star*)</strong> agar langsung diprioritaskan tampil di layar proyektor panggung.
    </p>

    <h2 class="sub-title">4.4 Prosedur Keamanan Panel Pemateri & PIN Rahasia</h2>
    <div class="callout callout-blue">
      <div class="callout-title">SOP PENGAMANAN & AKSES RAHASIA PEMATERI</div>
      <p style="margin: 0; font-size: 8.5pt;">
        <strong>1. Disembunyikan Total:</strong> Tombol panel presenter dihilangkan dari layar peserta agar tidak dapat diakses atau diuji coba oleh audiens umum.<br/>
        <strong>2. Cara Membuka:</strong> Ketuk 3x judul seminar di header atas HP atau klik ikon gembok kecil di footer bawah.<br/>
        <strong>3. Verifikasi PIN:</strong> Masukkan PIN (bawaan: <code>2026</code>). Tersedia fitur ganti PIN kustom yang tersimpan di browser.<br/>
        <strong>4. Floating Switcher:</strong> Tombol <code>[🛡️ Panel Presenter]</code> mengambang akan aktif untuk berpindah peran seketika. Klik <code>[🔒 Kunci]</code> di kanan atas jika ingin mengunci kembali.
      </p>
    </div>

    <h2 class="sub-title">4.5 Kustomisasi Tema Warna Organisasi (Brand Theme Picker)</h2>
    <p>
      Penyelenggara seminar dapat masuk ke menu <strong>Editor Materi</strong> &rarr; tab <strong>Tema Warna Organisasi</strong> untuk menyesuaikan identitas visual:
    </p>
    <ul>
      <li><strong>5 Preset Siap Pakai:</strong> Default PartnerUp | Obeecreatives, Royal Blue BUMN, Emerald Syariah, Crimson Executive, Tech Indigo.</li>
      <li><strong>Pemilih Warna Hex Kustom:</strong> Ubah Warna Utama, Aksen, Sekunder, dan Background sesuai pedoman visual organisasi Anda.</li>
      <li><strong>Penyimpanan Persisten & Reset:</strong> Warna otomatis tersimpan di browser dan dapat dikembalikan ke tema default hanya dengan 1 kali klik.</li>
    </ul>

    <h2 class="sub-title">4.6 Standar Operasional 5 Opsi Pembagian Materi ke Peserta</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 25%;">Metode</th>
          <th style="width: 75%;">Mekanisme & Kegunaan</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>1. Slide Reader Mandiri</strong></td>
          <td>Peserta membuka tab "Baca Slide" di HP mereka setelah pemateri mengaktifkan saklar slide di remote HP. Peserta bebas membaca ulang slide tanpa mengganggu proyektor panggung.</td>
        </tr>
        <tr>
          <td><strong>2. Unduh PDF Buku Saku (A4)</strong></td>
          <td>Peserta mengunduh berkas PDF A4 portrait resmi berisi ringkasan nilai jual, kalimat penawaran, bio IG, salam WA, dan seluruh jawaban lembar kerja.</td>
        </tr>
        <tr>
          <td><strong>3. Kirim ke WhatsApp</strong></td>
          <td>Mengirimkan ringkasan hasil latihan ke nomor pribadi peserta atau ke grup WhatsApp tim melalui tautan otomatis.</td>
        </tr>
        <tr>
          <td><strong>4. Unduh Berkas Teks (.TXT)</strong></td>
          <td>Format teks ringan tanpa format grafis, cocok untuk peserta yang ingin menyalin teks ke catatan ponsel atau aplikasi pengolah kata.</td>
        </tr>
        <tr>
          <td><strong>5. Ekspor CSV (Panitia)</strong></td>
          <td>Panitia mengunduh seluruh data jawaban peserta dalam format tabel CSV untuk dianalisis di Microsoft Excel atau Google Sheets.</td>
        </tr>
      </tbody>
    </table>

    <h2 class="sub-title">4.7 Panduan Penggunaan Gambar & Media Foto pada Slide Materi (Non-Breaking)</h2>
    <p>
      Slide materi kini mendukung penambahan foto/gambar visual opsional untuk memperkaya presentasi tanpa merusak teks asli:
    </p>
    <ul>
      <li><strong>2 Cara Input Gambar:</strong> Upload langsung dari galeri HP/Laptop (otomatis dikompres web-ready &lt;180KB via Canvas) atau tempel link URL gambar web/cloud.</li>
      <li><strong>3 Pilihan Tata Letak:</strong> Samping Kanan (Split 50:50), Samping Kiri (Split 50:50), dan Banner Atas (Foto Lebar di Atas Poin).</li>
      <li><strong>Jaminan Non-Breaking:</strong> Bersifat opsional murni. Slide tanpa foto tetap 100% utuh layout teks aslinya, dan foto dapat dihapus kapan saja dengan tombol Hapus Foto.</li>
      <li><strong>Sinkronisasi Seluruh Peran:</strong> Foto otomatis tayang di Layar Proyektor, Layar Presenter Laptop, Remote HP Pemateri, Mode Baca Mandiri Peserta, dan Handout PDF A4.</li>
    </ul>

  <!-- BAB 5 -->
  <div class="page-break">
    <h1 class="chapter-title">BAB 5 — PANDUAN DUPLIKASI & REPLIKASI WEB APPS</h1>

    <h2 class="sub-title">5.1 Mengapa dan Kapan Duplikasi Diperlukan?</h2>
    <p>
      Duplikasi web apps ini sangat berguna dalam beberapa skenario penting:
    </p>
    <ul>
      <li><strong>Menjalankan 2 Seminar di Waktu Bersamaan:</strong> Jika Anda memiliki Ruang Kelas A dan Ruang Kelas B di jam yang sama, membuat 2 aplikasi terpisah memastikan pergerakan slide dan kiriman jawaban peserta tidak saling menabrak.</li>
      <li><strong>Materi Khusus untuk Klien Korporat / Organisasi Tertentu:</strong> Menyimpan tema dan materi khusus instansi (misal: BUMN, Kampus, Komunitas UMKM Tertentu) dalam repositori terpisah yang siap pakai.</li>
      <li><strong>Melanjutkan Pengembangan di Akun Google Lain:</strong> Memindahkan seluruh kode sumber ke akun Google Anda yang lain tanpa kehilangan fitur yang sudah ada.</li>
    </ul>

    <h2 class="sub-title">5.2 Metode A: Duplikasi Cepat di Akun Google yang Sama (Copy App)</h2>
    <div class="step-card">
      <div class="step-header"><span class="step-num">Langkah 1</span> Masuk ke Google AI Studio</div>
      <p style="margin: 0; font-size: 8.5pt;">Buka dashboard AI Studio Anda di akun yang sedang aktif, temukan aplikasi PartnerUp Live.</p>
    </div>
    <div class="step-card">
      <div class="step-header"><span class="step-num">Langkah 2</span> Pilih Menu Opsi dan Klik "Copy App" / "Duplicate"</div>
      <p style="margin: 0; font-size: 8.5pt;">Sistem AI Studio akan membuat salinan baru lengkap dengan database Firebase Firestore independen yang terisolasi dari aplikasi pertama.</p>
    </div>
    <div class="step-card">
      <div class="step-header"><span class="step-num">Langkah 3</span> Beri Nama Proyek Baru & Mulai Sesi Seminar</div>
      <p style="margin: 0; font-size: 8.5pt;">Aplikasi baru langsung siap dipakai dan dapat Anda modifikasi materinya melalui menu Editor Materi tanpa mempengaruhi seminar pertama.</p>
    </div>

    <h2 class="sub-title">5.3 Metode B: Duplikasi ke Akun Google Lain via GitHub (Full Transfer)</h2>
    <p>
      Jika Anda ingin memindahkan proyek ke <strong>akun Google berbeda</strong> dan melanjutkan pengembangan (*development*) di akun baru tersebut:
    </p>
    <div class="step-card">
      <div class="step-header"><span class="step-num">Langkah 1</span> Ekspor Kode ke Repositori GitHub</div>
      <p style="margin: 0; font-size: 8.5pt;">Di pojok kanan atas layar AI Studio akun pertama, klik menu <strong>Export to GitHub</strong>. Hubungkan ke akun GitHub Anda dan simpan seluruh kode repositori.</p>
    </div>
    <div class="step-card">
      <div class="step-header"><span class="step-num">Langkah 2</span> Buka Google AI Studio di Akun Google Kedua</div>
      <p style="margin: 0; font-size: 8.5pt;">Beralih ke browser dengan akun Google kedua Anda. Buka platform Google AI Studio, lalu pilih menu <strong>Import from GitHub</strong> dan masukkan link repositori yang baru Anda ekspor.</p>
    </div>
    <div class="step-card">
      <div class="step-header"><span class="step-num">Langkah 3</span> Setup Database Firebase di Akun Kedua</div>
      <p style="margin: 0; font-size: 8.5pt;">Ketik instruksi ke AI di akun baru: <em>"Tolong jalankan setup Firebase Firestore database dan deploy security rules untuk aplikasi ini"</em>. AI Studio akan secara otomatis mengaktifkan database baru untuk akun kedua Anda.</p>
    </div>

    <h2 class="sub-title">5.4 Tips Menjalankan Multi-Event Tanpa Duplikasi</h2>
    <div class="callout">
      <div class="callout-title">TIPS HEMAT: 1 APLIKASI UNTUK BANYAK EVENT BERBEDA</div>
      <p style="margin: 0; font-size: 8.5pt;">
        Jika seminar diadakan di <strong>hari atau jam yang berbeda</strong>, Anda tidak perlu menduplikasi aplikasi! Cukup gunakan fitur <strong>Ekspor JSON</strong> di menu Editor Materi untuk menyimpan backup topik A. Saat topik B dimulai, muat materi B. Setelah seminar selesai, unduh rekap data peserta dengan tombol <strong>Unduh Rekap CSV</strong> di header atas, lalu bersihkan data untuk sesi berikutnya.
      </p>
    </div>

    <!-- Sign-off & Document Control -->
    <div class="avoid-break" style="margin-top: 24px; padding-top: 12px; border-top: 1.5px solid #1F3A5F;">
      <table style="width: 100%; font-size: 8.5pt;">
        <tr>
          <td style="width: 50%;">
            <strong>Disusun Oleh:</strong><br/>
            Tim Rekayasa Perangkat Lunak PartnerUp Live<br/>
            Obeecreatives Interactive Experience Lab
          </td>
          <td style="width: 50%; text-align: right;">
            <strong>Status Dokumen:</strong><br/>
            Edisi Standar Operasional & Teknis (SOP)<br/>
            Terverifikasi Siap Produksi
          </td>
        </tr>
      </table>
    </div>

    <div class="doc-footer">
      <span>PartnerUp Live Suite &bull; Technical & Operational Architecture</span>
      <span>Halaman Akhir Panduan &bull; Format Standar A4</span>
    </div>
  </div>

</body>
</html>`;

  triggerIframePrint(html);
}
