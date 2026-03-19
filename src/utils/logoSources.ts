import type { Institution } from '@/data/institutions';

/**
 * Returns the ordered list of logo URLs to try for a given institution.
 * Falls back through: customLogo → Clearbit → Apple Touch Icon → Google Favicon CDN.
 */
export function getInstitutionLogoSources(inst: Institution): string[] {
  return [
    ...(inst.customLogo ? [inst.customLogo] : []),
    inst.logo,
    `https://${inst.domain}/apple-touch-icon.png`,
    `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${inst.domain}&size=256`,
  ];
}
