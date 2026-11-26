import { Hotel, TravelPackage } from './models';

const packageImages: Record<number, string> = {
  1: 'pacote-bonito.jpg',
  2: 'pacote-bariloche.jpg',
  3: 'pacote-lisboa.jpg',
  4: 'pacote-lencois.jpg',
  5: 'pacote-rio.jpg',
  6: 'pacote-foz.jpg',
};

const hotelImages: Record<number, string> = {
  1: 'hotel-monumental.jpg',
  2: 'hotel-paraiso.jpg',
  3: 'hotel-beira-mar.jpg',
  4: 'hotel-horizonte.jpg',
  5: 'hotel-5.jpg',
  6: 'hotel-6.jpg',
  7: 'hotel-7.jpg',
  8: 'hotel-8.jpg',
  9: 'hotel-9.jpg',
};

export function packageImageUrl(item: Pick<TravelPackage, 'id' | 'nome' | 'cidade'>): string | null {
  const image = packageImages[item.id];
  if (image) return `/assets/images/${image}`;

  const destination = `${item.nome} ${item.cidade || ''}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  if (destination.includes('foz')) return '/assets/images/pacote-foz.jpg';
  if (destination.includes('bonito')) return '/assets/images/pacote-bonito.jpg';
  if (destination.includes('rio')) return '/assets/images/pacote-rio.jpg';
  if (destination.includes('bariloche')) return '/assets/images/pacote-bariloche.jpg';
  if (destination.includes('lisboa')) return '/assets/images/pacote-lisboa.jpg';
  if (destination.includes('lencois')) return '/assets/images/pacote-lencois.jpg';
  return null;
}

export function hotelImageUrl(item: Pick<Hotel, 'id'>): string {
  return `/assets/images/${hotelImages[item.id] || hotelImages[1]}`;
}
