// Virunga Journeys — brand configuration.
// Swap the brand by editing this one file: name, contact, address, palette and URLs
// flow into every page, the legal pages, the footer and the JSON-LD.
module.exports = {
  brand: {
    name: 'Virunga Journeys',
    short: 'Virunga',            // used in the giant hero wordmark
    legalName: 'Virunga Journeys',
    email: 'virungajourneys@tourground.com',
  },
  // Canonical production URL (no trailing slash). The live Vercel URL is recorded below.
  siteUrl: 'https://virungajourneys.tourground.com',
  liveUrl: 'https://virungajourneys.tourground.com',
  address: {
    venue: 'Norrsken House Kigali',
    street: '1 KN 78 St',
    locality: 'Kigali',
    region: 'Kigali City',
    country: 'Rwanda',
    countryCode: 'RW',
    geo: { lat: -1.9466, lng: 30.0597 },
  },
  // Enquiry form endpoint (static-site form relay). The first submission sends an
  // activation email to brand.email; click it once and enquiries arrive by email.
  form: {
    action: 'https://formsubmit.co/virungajourneys@tourground.com',
    ajax: 'https://formsubmit.co/ajax/virungajourneys@tourground.com',
  },
  palette: {
    cream: '#E9ECE8',     // mist ground (page background)
    kaolin: '#F4F5F2',    // panel: alternate sections, form fields
    imigongo: '#12191D',  // ink: text, dark bands
    ochre: '#9E3B26',     // imigongo ochre-red: zigzag motif, focus ring
    clay: '#C29A5E',      // gold: italic accent on dark only
    ridge: '#1C2A2C',     // dark green-grey: mist band
    ridgeLight: '#6F8A5B',// ridge green (graphics only)
    volcano: '#5D676A',   // volcano grey: secondary text on light
    mist: '#DCE1DD',      // mist (graphics only)
    night: '#0D1317',     // footer
  },
  fonts: {
    display: "'Spectral', 'Iowan Old Style', Georgia, serif",
    text: "'Spectral', 'Iowan Old Style', Georgia, serif",
  },
  locales: [
    { code: 'en', label: 'EN', name: 'English', hreflang: 'en', ogLocale: 'en_GB', prefix: '' },
    { code: 'fr', label: 'FR', name: 'Français', hreflang: 'fr', ogLocale: 'fr_FR', prefix: '/fr' },
    { code: 'de', label: 'DE', name: 'Deutsch', hreflang: 'de', ogLocale: 'de_DE', prefix: '/de' },
    { code: 'es', label: 'ES', name: 'Español', hreflang: 'es', ogLocale: 'es_ES', prefix: '/es' },
  ],
};
