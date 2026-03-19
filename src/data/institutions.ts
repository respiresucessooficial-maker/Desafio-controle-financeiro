import type { CardNetwork } from '@/types';

export interface Institution {
  id: string;
  name: string;
  brand: string;
  code: string;
  domain: string;
  logo: string;
  customLogo?: string; // override when Clearbit/favicon sources are poor
  color: string;
  textColor: string;
  accentColor: string;
  network: CardNetwork;
}

const clearbit = (domain: string) => `https://logo.clearbit.com/${domain}?size=128`;

// SVG data URI — vector, always crisp, no network dependency
const svg = (content: string) =>
  `data:image/svg+xml,${encodeURIComponent(content)}`;

// Pre-built SVG logos for banks whose external sources are unreliable
export const SVG_LOGOS: Record<string, string> = {
  bb: svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="50" fill="#FCFD01"/>
    <text x="50" y="65" text-anchor="middle" fill="#0038A8" font-family="Arial Black,sans-serif" font-weight="900" font-size="42">bb</text>
  </svg>`),

  caixa: svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="50" fill="#00509F"/>
    <text x="50" y="54" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-weight="900" font-size="20" letter-spacing="-0.5">CAIXA</text>
    <text x="50" y="72" text-anchor="middle" fill="#FFA500" font-family="Arial,sans-serif" font-weight="700" font-size="11">ECONÔMICA</text>
  </svg>`),

  banrisul: svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="50" fill="#0056A4"/>
    <text x="50" y="68" text-anchor="middle" fill="white" font-family="Arial Black,sans-serif" font-weight="900" font-size="58">B</text>
  </svg>`),

  digio: svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="50" fill="#27144D"/>
    <text x="50" y="61" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-weight="700" font-size="26">digio</text>
  </svg>`),

  iti: svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="50" fill="#FF4D00"/>
    <text x="50" y="63" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-weight="900" font-size="36">iti</text>
  </svg>`),

  sofisa: svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="50" fill="#00ACEE"/>
    <text x="50" y="54" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-weight="900" font-size="18">Sofisa</text>
    <text x="50" y="70" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-weight="400" font-size="13">Direto</text>
  </svg>`),

  modal: svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="50" fill="#FF4B00"/>
    <text x="50" y="54" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-weight="900" font-size="18">Banco</text>
    <text x="50" y="71" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-weight="900" font-size="20">Modal</text>
  </svg>`),

  trigg: svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="50" fill="#FF3C5F"/>
    <text x="50" y="62" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-weight="900" font-size="28">Trigg</text>
  </svg>`),

  sicredi: svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="50" fill="#329A3B"/>
    <text x="50" y="54" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-weight="900" font-size="17">Sicredi</text>
    <line x1="20" y1="62" x2="80" y2="62" stroke="white" stroke-width="1.5" opacity="0.5"/>
    <text x="50" y="75" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-weight="400" font-size="11" opacity="0.85">cooperativa</text>
  </svg>`),

  alelo: svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="50" fill="#44B944"/>
    <text x="50" y="62" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-weight="900" font-size="30">Alelo</text>
  </svg>`),

  ticket: svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="50" fill="#ED1C24"/>
    <text x="50" y="62" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-weight="900" font-size="27">Ticket</text>
  </svg>`),
};

const inst = (
  id: string, name: string, brand: string, code: string, domain: string,
  color: string, textColor: string, accentColor: string,
  network: CardNetwork,
  customLogo?: string,
): Institution => ({ id, name, brand, code, domain, logo: clearbit(domain), customLogo, color, textColor, accentColor, network });

export const INSTITUTIONS: Institution[] = [
  // ── Grandes bancos ─────────────────────────────────────────────────────────
  inst('nubank',      'Nubank',           'Nu',        '260', 'nubank.com.br',        'from-[#820AD1] to-[#4A0080]', 'text-white',         '#820AD1',  'mastercard'),
  inst('itau',        'Itaú',             'Itaú',      '341', 'itau.com.br',          'from-[#EC7000] to-[#1C3F6E]', 'text-white',         '#EC7000',  'visa-master'),
  inst('bradesco',    'Bradesco',          'Bradesco',  '237', 'bradesco.com.br',      'from-[#CC092F] to-[#8A0020]', 'text-white',         '#CC092F',  'visa-elo'),
  inst('bb',          'Banco do Brasil',   'BB',        '001', 'bancodobrasil.com.br', 'from-[#FCFD01] to-[#D4D800]', 'text-[#0038A8]',     '#FCFD01',  'visa-elo',  SVG_LOGOS.bb),
  inst('caixa',       'Caixa',             'CEF',       '104', 'caixaeconomicafederal.gov.br', 'from-[#00509F] to-[#003778]', 'text-white',   '#00509F',  'visa',      SVG_LOGOS.caixa),
  inst('santander',   'Santander',         'Santander', '033', 'santander.com.br',    'from-[#EC0000] to-[#9E0000]', 'text-white',         '#EC0000',  'visa-master'),
  inst('inter',       'Inter',             'Inter',     '077', 'inter.co',             'from-[#FF7A00] to-[#C85500]', 'text-white',         '#FF7A00',  'mastercard'),
  inst('btg',         'BTG Pactual',       'BTG',       '208', 'btgpactual.com',       'from-[#001529] to-[#000814]', 'text-white',         '#001529',  'mastercard'),
  inst('safra',       'Safra',             'Safra',     '422', 'safra.com.br',         'from-[#A48D52] to-[#7A6530]', 'text-white',         '#A48D52',  'mastercard'),
  inst('c6',          'C6 Bank',           'C6',        '336', 'c6bank.com.br',        'from-[#121212] to-[#2C2C2C]', 'text-slate-300',     '#121212',  'mastercard'),
  inst('original',    'Banco Original',    'Original',  '212', 'original.com.br',      'from-[#10C16C] to-[#0A8A4A]', 'text-white',         '#10C16C',  'visa-master'),
  inst('banrisul',    'Banrisul',          'Banrisul',  '041', 'banrisul.com.br',      'from-[#0056A4] to-[#003878]', 'text-white',         '#0056A4',  'mastercard', SVG_LOGOS.banrisul),
  // ── Fintechs & digitais ────────────────────────────────────────────────────
  inst('neon',        'Neon',              'Neon',      '536', 'neon.com.br',          'from-[#00E5FF] to-[#0099BB]', 'text-slate-900',     '#00E5FF',  'visa'),
  inst('picpay',      'PicPay',            'PicPay',    '380', 'picpay.com',           'from-[#21C25E] to-[#158040]', 'text-white',         '#21C25E',  'mastercard'),
  inst('pagbank',     'PagBank',           'PagBank',   '290', 'pagbank.com.br',       'from-[#F0B229] to-[#C08010]', 'text-white',         '#F0B229',  'visa-master'),
  inst('mercadopago', 'Mercado Pago',      'MP',        '323', 'mercadopago.com.br',  'from-[#009EE3] to-[#006FAC]', 'text-white',         '#009EE3',  'visa'),
  inst('bs2',         'BS2',               'BS2',       '218', 'bs2.com',              'from-[#1A46F0] to-[#0F2DB0]', 'text-white',         '#1A46F0',  'mastercard'),
  inst('agibank',     'Agibank',           'Agi',       '121', 'agibank.com.br',       'from-[#0077FF] to-[#0050CC]', 'text-white',         '#0077FF',  'mastercard'),
  inst('digio',       'Digio',             'Digio',     '335', 'digio.com.br',         'from-[#27144D] to-[#15082B]', 'text-white',         '#27144D',  'visa',       SVG_LOGOS.digio),
  inst('will',        'Will Bank',         'Will',      '368', 'willbank.com.br',      'from-[#F5F200] to-[#CCCA00]', 'text-slate-900',     '#F5F200',  'mastercard'),
  inst('xp',          'XP Investimentos',  'XP',        '348', 'xpi.com.br',           'from-[#000000] to-[#1A1A1A]', 'text-white',         '#000000',  'visa'),
  inst('nuinvest',    'Nu Invest',         'Nu',        '140', 'nuinvest.com.br',      'from-[#820AD1] to-[#4A0080]', 'text-white',         '#820AD1',  'mastercard'),
  inst('iti',         'iti',               'iti',       '341', 'iti.com.br',           'from-[#FF4D00] to-[#C03000]', 'text-white',         '#FF4D00',  'mastercard', SVG_LOGOS.iti),
  inst('meliuz',      'Méliuz',            'Méliuz',    '084', 'meliuz.com',           'from-[#FF6600] to-[#CC4400]', 'text-white',         '#FF6600',  'mastercard'),
  inst('bv',          'BV',                'BV',        '655', 'bv.com.br',            'from-[#003399] to-[#001F66]', 'text-white',         '#003399',  'visa-master'),
  inst('pan',         'Banco Pan',         'Pan',       '623', 'bancopan.com.br',      'from-[#00C1FF] to-[#0090CC]', 'text-slate-900',     '#00C1FF',  'mastercard'),
  inst('bmg',         'Banco BMG',         'BMG',       '318', 'bancobmg.com.br',      'from-[#E30613] to-[#990008]', 'text-white',         '#E30613',  'mastercard'),
  inst('sofisa',      'Sofisa Direto',     'Sofisa',    '637', 'sofisadireto.com.br',  'from-[#00ACEE] to-[#0077B8]', 'text-white',         '#00ACEE',  'visa',       SVG_LOGOS.sofisa),
  inst('modal',       'Banco Modal',       'Modal',     '746', 'bancomodal.com.br',    'from-[#FF4B00] to-[#C03000]', 'text-white',         '#FF4B00',  'mastercard', SVG_LOGOS.modal),
  inst('trigg',       'Trigg',             'Trigg',     '466', 'trigg.finance',        'from-[#FF3C5F] to-[#C0002E]', 'text-white',         '#FF3C5F',  'mastercard', SVG_LOGOS.trigg),
  inst('efi',         'EFI Bank',          'EFI',       '364', 'sejaefi.com.br',       'from-[#00B894] to-[#007A62]', 'text-white',         '#00B894',  'visa-master'),
  inst('stone',       'Stone',             'Stone',     '197', 'stone.co',             'from-[#00CC88] to-[#009960]', 'text-white',         '#00CC88',  'visa-master'),
  inst('next',        'Next',              'Next',      '237', 'next.me',              'from-[#00FF5F] to-[#00CC4A]', 'text-slate-900',     '#00FF5F',  'mastercard'),
  inst('cora',        'Cora',              'Cora',      '403', 'cora.com.br',          'from-[#FF4438] to-[#CC1A10]', 'text-white',         '#FF4438',  'mastercard'),
  inst('avenue',      'Avenue',            'Avenue',    '000', 'avenue.us',            'from-[#000000] to-[#1A1A1A]', 'text-white',         '#000000',  'mastercard'),
  // ── Cooperativas ───────────────────────────────────────────────────────────
  inst('sicoob',      'Sicoob',            'Sicoob',    '756', 'sicoob.com.br',        'from-[#003641] to-[#001A20]', 'text-white',         '#003641',  'visa'),
  inst('sicredi',     'Sicredi',           'Sicredi',   '748', 'sicredi.com.br',       'from-[#329A3B] to-[#1E6B26]', 'text-white',         '#329A3B',  'visa',       SVG_LOGOS.sicredi),
  inst('cresol',      'Cresol',            'Cresol',    '133', 'cresol.com.br',        'from-[#009B3A] to-[#006820]', 'text-white',         '#009B3A',  'visa'),
  inst('unicred',     'Unicred',           'Unicred',   '136', 'unicred.com.br',       'from-[#003087] to-[#001A4D]', 'text-white',         '#003087',  'visa'),
  // ── Benefícios ─────────────────────────────────────────────────────────────
  inst('alelo',       'Alelo',             'Alelo',     '000', 'alelo.com.br',         'from-[#44B944] to-[#2E8A2E]', 'text-white',         '#44B944',  'elo',        SVG_LOGOS.alelo),
  inst('vr',          'VR',                'VR',        '000', 'vr.com.br',            'from-[#00A651] to-[#006B33]', 'text-white',         '#00A651',  'mastercard'),
  inst('ticket',      'Ticket',            'Ticket',    '000', 'ticket.com.br',        'from-[#ED1C24] to-[#A80F15]', 'text-white',         '#ED1C24',  'mastercard', SVG_LOGOS.ticket),
  inst('flash',       'Flash',             'Flash',     '000', 'flashapp.com.br',      'from-[#FF4D8D] to-[#CC1F60]', 'text-white',         '#FF4D8D',  'mastercard'),
  inst('sodexo',      'Sodexo / Pluxee',   'Pluxee',   '000', 'pluxee.com',           'from-[#003184] to-[#001B4A]', 'text-white',         '#003184',  'mastercard'),
  inst('swile',       'Swile',             'Swile',     '000', 'swile.co',             'from-[#4C0ADE] to-[#2A0098]', 'text-white',         '#4C0ADE',  'mastercard'),
  inst('wiipo',       'Wiipo',             'Wiipo',     '000', 'wiipo.com',            'from-[#00C4B4] to-[#008A7E]', 'text-white',         '#00C4B4',  'mastercard'),
  // ── Público / especiais ────────────────────────────────────────────────────
  inst('bnb',         'Banco do Nordeste', 'BNB',       '004', 'bnb.gov.br',           'from-[#005A9C] to-[#003D6E]', 'text-white',         '#005A9C',  'visa'),
  inst('basa',        'Banco da Amazônia', 'BASA',      '003', 'bancoamazonia.com.br', 'from-[#006835] to-[#004020]', 'text-white',         '#006835',  'visa'),
];
