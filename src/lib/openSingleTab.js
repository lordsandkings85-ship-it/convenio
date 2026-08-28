// Centralized tab manager to force single-tab reuse for WhatsApp Web & Email
const openTabs = {};

/**
 * Opens or reuses an existing tab using direct WindowProxy location assignment.
 * This bypasses browser COOP target name detachment issues on WhatsApp Web & Gmail.
 * 
 * @param {string} key - Tab category ('WHATSAPP' or 'EMAIL')
 * @param {string} url - Target URL to open
 */
export function openOrFocusTab(key, url) {
  try {
    const existingWin = openTabs[key];
    if (existingWin && !existingWin.closed) {
      existingWin.location.href = url;
      existingWin.focus();
      return existingWin;
    }
  } catch (e) {
    console.warn(`[openOrFocusTab] Error reusing tab for ${key}:`, e);
  }

  const targetName = key === 'WHATSAPP' ? 'convino_whatsapp_tab' : 'convino_email_tab';
  const newWin = window.open(url, targetName);
  if (newWin) {
    openTabs[key] = newWin;
    try {
      newWin.focus();
    } catch (e) {}
  }
  return newWin;
}

/**
 * Smart WhatsApp launcher:
 * 1. Checks if WhatsApp Desktop App (whatsapp://) is installed by attempting native protocol launch.
 * 2. If WhatsApp Desktop is installed, Windows opens it (0 browser tabs used).
 * 3. If WhatsApp Desktop is not installed (no window blur within 1.2s), automatically falls back to WhatsApp Web.
 * 
 * @param {string} phone - Target phone number
 * @param {string} text - Unencoded message text
 */
export function triggerWhatsAppMessage(phone, text) {
  if (!phone) return;

  const cleanPhone = phone.replace(/\D/g, '');
  const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  // Clean corrupted/emoji characters that break protocol links
  const cleanContent = (text || '')
    .replace(/\uFFFD/g, '')
    .replace(/[\u25A0-\u25FF]/g, '')
    .replace(/[\u2600-\u27BF]/g, '')
    .replace(/[\uFE00-\uFE0F]/g, '')
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
    .replace(/[\u{2300}-\u{23FF}]/gu, '')
    .replace(/  +/g, ' ')
    .trim();

  const encodedText = encodeURIComponent(cleanContent);
  const nativeUrl = `whatsapp://send?phone=${phoneWithCountry}&text=${encodedText}`;
  const webUrl = `https://web.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodedText}`;

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) {
    window.location.href = nativeUrl;
    return;
  }

  let appOpened = false;
  
  const handleBlur = () => {
    appOpened = true;
    window.removeEventListener('blur', handleBlur);
  };
  
  window.addEventListener('blur', handleBlur);

  // Use hidden iframe to launch native protocol cleanly without changing page state
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);

  try {
    iframe.contentWindow.location.href = nativeUrl;
  } catch (e) {
    window.location.href = nativeUrl;
  }

  setTimeout(() => {
    try {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    } catch (e) {}
    window.removeEventListener('blur', handleBlur);

    // If the browser did not lose focus (desktop app not installed), fallback to WhatsApp Web
    if (!appOpened) {
      openOrFocusTab('WHATSAPP', webUrl);
    }
  }, 1200);
}
