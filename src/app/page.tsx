import Hero from "@/components/home/Hero";
import TrustStrip from "@/components/home/TrustStrip";
import Categories from "@/components/home/Categories";
import BestSellers from "@/components/home/BestSellers";
import Brands from "@/components/home/Brands";
import TradeBand from "@/components/home/TradeBand";
import { getHomeCategories, getBestSellers, getHeroProduct } from "@/lib/home-data";

export default async function HomePage() {
  const [categories, bestSellers, heroProduct] = await Promise.all([
    getHomeCategories(),
    getBestSellers(),
    getHeroProduct(),
  ]);

  return (
    <>
      <Hero product={heroProduct} />
      <TrustStrip />
      <Categories categories={categories} />
      <BestSellers products={bestSellers} />
      <Brands />
      <TradeBand />
    </>
  );
}
