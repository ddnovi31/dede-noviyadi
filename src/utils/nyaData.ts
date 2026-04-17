
export interface NYA_NYAFData {
  size: number;
  khaTanah: number;
  khaUdara: number;
}

export const NYA_NYAF_DATA: Record<string, NYA_NYAFData> = {
  '1.5': { size: 1.5, khaTanah: 15, khaUdara: 24 },
  '2.5': { size: 2.5, khaTanah: 19, khaUdara: 32 },
  '4': { size: 4, khaTanah: 25, khaUdara: 43 },
  '6': { size: 6, khaTanah: 33, khaUdara: 54 },
  '10': { size: 10, khaTanah: 45, khaUdara: 73 },
  '16': { size: 16, khaTanah: 61, khaUdara: 98 },
  '25': { size: 25, khaTanah: 83, khaUdara: 129 },
  '35': { size: 35, khaTanah: 103, khaUdara: 158 },
  '50': { size: 50, khaTanah: 132, khaUdara: 197 },
  '70': { size: 70, khaTanah: 162, khaUdara: 245 },
  '95': { size: 95, khaTanah: 207, khaUdara: 290 },
  '120': { size: 120, khaTanah: 235, khaUdara: 345 },
  '150': { size: 150, khaTanah: 0, khaUdara: 390 },
  '185': { size: 185, khaTanah: 0, khaUdara: 445 },
  '240': { size: 240, khaTanah: 0, khaUdara: 525 },
  '300': { size: 300, khaTanah: 0, khaUdara: 605 },
  '400': { size: 400, khaTanah: 0, khaUdara: 725 },
};
