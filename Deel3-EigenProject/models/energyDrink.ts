export class EnergyDrink {
  constructor(
    public name: string | null,
    public brand: string | null,
    public numberOfCans: number | null,
    public volumeInLiter: number | null,
    public priceInEurPerLiter: number,
    public store: 'Colruyt' | 'Delhaize' | 'Albert Heijn',
    public url: string | null,
    public imageUrl: string | null,
    public promo?: string | null
  ) {}
}