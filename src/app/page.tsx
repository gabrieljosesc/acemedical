import Hero from "@/components/home/Hero";
import TrustStrip from "@/components/home/TrustStrip";
import Categories from "@/components/home/Categories";
import BestSellers from "@/components/home/BestSellers";
import Brands from "@/components/home/Brands";
import TradeBand from "@/components/home/TradeBand";
import { getHomeCategories, getBestSellers, getHeroProducts } from "@/lib/home-data";

export default async function HomePage() {
  const [categories, bestSellers, heroProducts] = await Promise.all([
    getHomeCategories(),
    getBestSellers(),
    getHeroProducts(),
  ]);

  return (
    <>
      <Hero products={heroProducts} />
      <TrustStrip />
      <Categories categories={categories} />
      <BestSellers products={bestSellers} />
      <Brands />
      <TradeBand />
    </>
  );
}
