export class EnergyDrink {
  constructor(
    public name: string | null,
    public brand: string | null,
    public numberOfCans: number | null,
    public volumeInLiter: number | null,
    public priceInEurPerLiter: number,
    public store: string | null,
    public url: string | null,
    public imageUrl: string | null,
    public promo?: string | null
  ) {}
}