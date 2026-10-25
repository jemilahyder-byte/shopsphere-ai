import ProductList from "./components/ProductList";
import RecentlyViewed from "./components/RecentlyViewed";
import CategoryRecommendations from "./components/CategoryRecommendations";
import PriceRecommendations from "./components/PriceRecommendations";
import WishlistRecommendations from "./components/WishlistRecommendations";
import CartRecommendations from "./components/CartRecommendations";
import FrequentlyBoughtTogether from "./components/FrequentlyBoughtTogether";
import TrendingRecommendations from "./components/TrendingRecommendations";
import PersonalizedRecommendations from "./components/PersonalizedRecommendations";

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-4xl font-bold">
        ShopSphere AI
      </h1>

      <p className="mt-3">
        Personalized Shopping, Powered by Intelligence
      </p>

      <RecentlyViewed />
      <CategoryRecommendations />
      <PriceRecommendations />
      <WishlistRecommendations />
      <CartRecommendations />
      <FrequentlyBoughtTogether />
      <TrendingRecommendations />
      <PersonalizedRecommendations />
      <ProductList />
    </main>
  );
}