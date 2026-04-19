/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

export function CodeSectionGenerator(sections: any[]): any[] {
  if (!sections || !Array.isArray(sections)) return [];

  return sections.map((sec) => {
    // 1. Ambil nama, hapus spasi
    const name = sec.name || 'SEC';
    const cleanName = name.replace(/\s+/g, '');

    // 2. Ambil 3 huruf pertama, kapital, dan padEnd jika kurang dari 3
    const label = cleanName.substring(0, 3).toUpperCase().padEnd(3, 'X');

    // 3. Return objek section yang sudah ditambah properti 'code'
    return {
      ...sec,
      label
    };
  });
}